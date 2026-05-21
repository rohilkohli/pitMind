# PitMind IBM Cloud VSI Deployment Orchestration Script
# This script runs locally on Windows and automates the creation of VPC resources, VSI, and deploys PitMind.

param (
    [string]$ApiKey = "",
    [string]$Region = "us-south",
    [string]$Zone = "us-south-1",
    [string]$VpcName = "pitmind-vpc",
    [string]$SubnetName = "pitmind-subnet",
    [string]$InstanceName = "pitmind-vsi",
    [string]$KeyName = "pitmind-key"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Harmonious UI colors
function Write-Info ($msg) { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn ($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err ($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# 1. Locate IBM Cloud CLI
$IbmCloudCli = "C:\Program Files\IBM\Cloud\bin\ibmcloud.exe"
if (-not (Test-Path $IbmCloudCli)) {
    Write-Warn "IBM Cloud CLI not found at standard path. Downloading and installing..."
    Invoke-Expression (New-Object Net.WebClient).DownloadString('https://clis.cloud.ibm.com/install/powershell')
    if (-not (Test-Path $IbmCloudCli)) {
        Write-Err "Failed to install IBM Cloud CLI automatically. Please install it manually from https://cloud.ibm.com/docs/cli"
        exit 1
    }
}
Write-Info "IBM Cloud CLI located at $IbmCloudCli"

# 2. Login & Authentication
$EnvFile = Join-Path $Root ".env"
$EnvApiKey = ""
if (Test-Path $EnvFile) {
    $EnvContent = Get-Content $EnvFile
    foreach ($Line in $EnvContent) {
        if ($Line -match "^WATSONX_API_KEY=(.+)") {
            $EnvApiKey = $Matches[1].Trim()
        }
    }
}

if ([string]::IsNullOrEmpty($ApiKey)) {
    $ApiKey = $EnvApiKey
}

$Authenticated = $false
# Check if already logged in and targeting correct region
Write-Info "Checking if already logged in to IBM Cloud..."
$CheckTarget = & $IbmCloudCli target 2>&1
if ($LASTEXITCODE -eq 0 -and $CheckTarget -match "User:") {
    Write-Info "Already logged in to IBM Cloud."
    if ($CheckTarget -match "Region:\s+$Region") {
        Write-Info "Already targeting region $Region."
        $Authenticated = $true
    } else {
        Write-Warn "Target region is different. Changing region to $Region..."
        & $IbmCloudCli target -r $Region
        if ($LASTEXITCODE -eq 0) {
            $Authenticated = $true
        }
    }
}

while (-not $Authenticated) {
    if ([string]::IsNullOrEmpty($ApiKey)) {
        Write-Warn "No IBM Cloud API key provided."
        $ApiKey = Read-Host "Please enter your IBM Cloud API Key"
        $ApiKey = $ApiKey.Trim()
    }

    Write-Info "Attempting to log in to IBM Cloud..."
    $LoginResult = & $IbmCloudCli login --apikey $ApiKey -r $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        $Authenticated = $true
        Write-Info "Logged in successfully to IBM Cloud ($Region)!"
    } else {
        Write-Err "Authentication failed. Error: $LoginResult"
        $ApiKey = "" # Reset to force prompt
    }
}

# 3. Target resource group
Write-Info "Targeting resource group..."
& $IbmCloudCli target -g Default
if ($LASTEXITCODE -ne 0) {
    # Fallback to first available resource group if 'Default' doesn't exist
    Write-Warn "'Default' resource group target failed. Attempting automatic target..."
    & $IbmCloudCli target --cf
}

# 4. Check/Install VPC Infrastructure Plugin
Write-Info "Checking VPC infrastructure plugin..."
$Plugins = & $IbmCloudCli plugin list
if ($Plugins -notmatch "vpc-infrastructure") {
    Write-Info "Installing vpc-infrastructure plugin..."
    & $IbmCloudCli plugin install vpc-infrastructure -f
}

# 5. Setup SSH Key
$SshKeyPath = Join-Path $PSScriptRoot "id_rsa_pitmind"
$SshKeyPubPath = "$SshKeyPath.pub"
if (-not (Test-Path $SshKeyPath)) {
    Write-Info "Generating a new SSH key pair for deployment..."
    $GenCmd = "ssh-keygen -t rsa -b 4096 -f `"$SshKeyPath`" -N `"`" -q"
    cmd /c $GenCmd
    
    Write-Info "Securing file permissions for SSH key..."
    & icacls $SshKeyPath /inheritance:r | Out-Null
    & icacls $SshKeyPath /grant:r "$($env:USERNAME):F" | Out-Null
    & icacls $SshKeyPath /remove "BUILTIN\Administrators" | Out-Null
    & icacls $SshKeyPath /remove "NT AUTHORITY\SYSTEM" | Out-Null
}

Write-Info "Checking if SSH key '$KeyName' is registered in IBM Cloud..."
$CloudKeys = & $IbmCloudCli is keys 2>&1
$KeyRegistered = $false
if ($CloudKeys -match $KeyName) {
    Write-Info "SSH key '$KeyName' is already registered."
    $KeyRegistered = $true
} else {
    Write-Info "Registering SSH key '$KeyName' with IBM Cloud..."
    $PublicKeyContent = Get-Content $SshKeyPubPath -Raw
    # Write public key content temporarily without newlines
    $CleanedPub = $PublicKeyContent.Trim()
    & $IbmCloudCli is key-create $KeyName $CleanedPub
    if ($LASTEXITCODE -eq 0) {
        $KeyRegistered = $true
        Write-Info "SSH key '$KeyName' successfully registered."
    } else {
        Write-Err "Failed to register SSH key. You may need to create it manually in the IBM Cloud Console."
        exit 1
    }
}

# 6. Configure VPC Networking
Write-Info "Checking VPC '$VpcName'..."
$VpcList = & $IbmCloudCli is vpcs 2>&1
if ($VpcList -match $VpcName) {
    Write-Info "VPC '$VpcName' already exists."
} else {
    Write-Info "Creating VPC '$VpcName'..."
    & $IbmCloudCli is vpc-create $VpcName
}

# Subnet
Write-Info "Checking Subnet '$SubnetName'..."
$SubnetList = & $IbmCloudCli is subnets 2>&1
if ($SubnetList -match $SubnetName) {
    Write-Info "Subnet '$SubnetName' already exists."
} else {
    Write-Info "Creating Subnet '$SubnetName'..."
    # We need the VPC ID
    $VpcId = ""
    $Vpcs = & $IbmCloudCli is vpcs --json | ConvertFrom-Json
    foreach ($v in $Vpcs) {
        if ($v.name -eq $VpcName) { $VpcId = $v.id; break }
    }
    & $IbmCloudCli is subnet-create $SubnetName $VpcId --zone $Zone --ipv4-address-count 256
}

# Public Gateway (so VSI can access public net to install docker/git)
$GatewayName = "$VpcName-gateway"
Write-Info "Checking Public Gateway '$GatewayName'..."
$GatewayList = & $IbmCloudCli is public-gateways 2>&1
if ($GatewayList -match $GatewayName) {
    Write-Info "Public Gateway '$GatewayName' already exists."
} else {
    Write-Info "Creating Public Gateway '$GatewayName'..."
    $VpcId = ""
    $Vpcs = & $IbmCloudCli is vpcs --json | ConvertFrom-Json
    foreach ($v in $Vpcs) {
        if ($v.name -eq $VpcName) { $VpcId = $v.id; break }
    }
    & $IbmCloudCli is public-gateway-create $GatewayName $VpcId $Zone
    
    # Attach to subnet
    Write-Info "Attaching Public Gateway to Subnet..."
    $SubnetId = ""
    $Subnets = & $IbmCloudCli is subnets --json | ConvertFrom-Json
    foreach ($s in $Subnets) {
        if ($s.name -eq $SubnetName) { $SubnetId = $s.id; break }
    }
    & $IbmCloudCli is subnet-update $SubnetId --public-gateway $GatewayName
}

# Security Group Rules (Allow HTTP, HTTPS, API, WebSocket, SSH)
Write-Info "Configuring security group rules..."
$Vpcs = & $IbmCloudCli is vpcs --json | ConvertFrom-Json
$DefaultSgId = ""
foreach ($v in $Vpcs) {
    if ($v.name -eq $VpcName) {
        $DefaultSgId = $v.default_security_group.id
        break
    }
}

if (-not [string]::IsNullOrEmpty($DefaultSgId)) {
    # Fetch existing rules to avoid duplicates
    $Rules = & $IbmCloudCli is sg-rules $DefaultSgId --json | ConvertFrom-Json
    $HasSsh = $false; $HasHttp = $false; $HasHttps = $false; $HasApi = $false
    foreach ($r in $Rules) {
        if ($r.direction -eq "inbound" -and $r.protocol -eq "tcp") {
            if ($r.port_min -le 22 -and $r.port_max -ge 22) { $HasSsh = $true }
            if ($r.port_min -le 80 -and $r.port_max -ge 80) { $HasHttp = $true }
            if ($r.port_min -le 443 -and $r.port_max -ge 443) { $HasHttps = $true }
            if ($r.port_min -le 8000 -and $r.port_max -ge 8001) { $HasApi = $true }
        }
    }

    if (-not $HasSsh) {
        Write-Info "Adding security group rule for SSH (port 22)..."
        & $IbmCloudCli is sg-rulec $DefaultSgId inbound tcp --port-min 22 --port-max 22
    }
    if (-not $HasHttp) {
        Write-Info "Adding security group rule for HTTP (port 80)..."
        & $IbmCloudCli is sg-rulec $DefaultSgId inbound tcp --port-min 80 --port-max 80
        # Also allow 8080 just in case
        & $IbmCloudCli is sg-rulec $DefaultSgId inbound tcp --port-min 8080 --port-max 8080
    }
    if (-not $HasHttps) {
        Write-Info "Adding security group rule for HTTPS (port 443)..."
        & $IbmCloudCli is sg-rulec $DefaultSgId inbound tcp --port-min 443 --port-max 443
    }
    if (-not $HasApi) {
        Write-Info "Adding security group rule for API (ports 8000-8001)..."
        & $IbmCloudCli is sg-rulec $DefaultSgId inbound tcp --port-min 8000 --port-max 8001
    }
}

# 7. Provision Virtual Server Instance (VSI)
Write-Info "Checking Virtual Server Instance '$InstanceName'..."
$InstanceList = & $IbmCloudCli is instances 2>&1
$InstanceIp = ""
$InstanceId = ""

$InstanceExists = $false
if ($InstanceList -match $InstanceName) {
    Write-Info "Instance '$InstanceName' already exists."
    $InstanceExists = $true
} else {
    Write-Info "Creating VSI '$InstanceName' (Ubuntu 22.04 LTS, 2 vCPUs, 4GB RAM)..."
    
    # Retrieve Subnet, Key and Image IDs
    $SubnetId = ""
    $Subnets = & $IbmCloudCli is subnets --json | ConvertFrom-Json
    foreach ($s in $Subnets) {
        if ($s.name -eq $SubnetName) { $SubnetId = $s.id; break }
    }

    $KeyId = ""
    $Keys = & $IbmCloudCli is keys --json | ConvertFrom-Json
    foreach ($k in $Keys) {
        if ($k.name -eq $KeyName) { $KeyId = $k.id; break }
    }

    # Find Ubuntu 22.04 image ID
    $ImageId = ""
    $Images = & $IbmCloudCli is images --json | ConvertFrom-Json
    foreach ($img in $Images) {
        if ($img.name -match "ubuntu-22-04" -and $img.status -eq "available" -and $img.architecture -eq "amd64") {
            $ImageId = $img.id
            break
        }
    }
    
    if ([string]::IsNullOrEmpty($ImageId)) {
        # Fallback search if standard pattern fails
        foreach ($img in $Images) {
            if ($img.name -match "ubuntu" -and $img.status -eq "available") {
                $ImageId = $img.id
                break
            }
        }
    }

    Write-Info "Using Image ID: $ImageId"
    # Profile cx2-2x4 represents 2 vCPU, 4GB RAM
    & $IbmCloudCli is instance-create $InstanceName $VpcName $Zone cx2-2x4 $SubnetId --image $ImageId --keys $KeyId
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to create VSI instance."
        exit 1
    }
    $InstanceExists = $true
}

# Wait for instance to become active and get Nic ID or Vni ID
Write-Info "Waiting for VSI to enter 'running' state..."
$VsiActive = $false
$PrimaryNicId = ""
$VniId = ""
for ($i = 0; $i -lt 30; $i++) {
    $InstanceStatus = & $IbmCloudCli is instance $InstanceName --json | ConvertFrom-Json
    if ($InstanceStatus.status -eq "running") {
        $VsiActive = $true
        $InstanceId = $InstanceStatus.id
        if ($InstanceStatus.primary_network_attachment -and $InstanceStatus.primary_network_attachment.virtual_network_interface) {
            $VniId = $InstanceStatus.primary_network_attachment.virtual_network_interface.id
            Write-Info "Detected Virtual Network Interface (VNI): $VniId"
        } else {
            $PrimaryNicId = $InstanceStatus.network_interfaces[0].id
            Write-Info "Detected Network Interface (NIC): $PrimaryNicId"
        }
        Write-Info "VSI is running!"
        break
    }
    Write-Info "VSI status: $($InstanceStatus.status). Waiting 10s..."
    Start-Sleep -Seconds 10
}

if (-not $VsiActive) {
    Write-Err "VSI failed to enter 'running' state in a timely manner."
    exit 1
}

# 8. Associate Floating IP
Write-Info "Checking public IP (Floating IP)..."
$FloatingIps = & $IbmCloudCli is floating-ips --json | ConvertFrom-Json
$AssocIp = ""
foreach ($f in $FloatingIps) {
    if ($f.target -and ($f.target.id -eq $PrimaryNicId -or $f.target.id -eq $VniId)) {
        $AssocIp = $f.address
        Write-Info "Already associated with Floating IP: $AssocIp"
        break
    }
}

if ([string]::IsNullOrEmpty($AssocIp)) {
    $IpName = "$InstanceName-ip"
    
    # Check if a floating IP with this name already exists
    $ExistingIpId = ""
    foreach ($f in $FloatingIps) {
        if ($f.name -eq $IpName) {
            $ExistingIpId = $f.id
            break
        }
    }

    if (-not [string]::IsNullOrEmpty($ExistingIpId)) {
        if (-not [string]::IsNullOrEmpty($VniId)) {
            Write-Info "Updating existing Floating IP ($IpName) to bind to VNI ($VniId)..."
            $UpdateResult = & $IbmCloudCli is floating-ip-update $ExistingIpId --vni $VniId --json | ConvertFrom-Json
        } else {
            Write-Info "Updating existing Floating IP ($IpName) to bind to NIC ($PrimaryNicId)..."
            $UpdateResult = & $IbmCloudCli is floating-ip-update $ExistingIpId --nic $PrimaryNicId --json | ConvertFrom-Json
        }
        $AssocIp = $UpdateResult.address
    } else {
        if (-not [string]::IsNullOrEmpty($VniId)) {
            Write-Info "Reserving and associating a new Floating IP for VNI ($VniId)..."
            $ReserveResult = & $IbmCloudCli is floating-ip-reserve $IpName --vni $VniId --json | ConvertFrom-Json
        } else {
            Write-Info "Reserving and associating a new Floating IP for NIC ($PrimaryNicId)..."
            $ReserveResult = & $IbmCloudCli is floating-ip-reserve $IpName --nic $PrimaryNicId --json | ConvertFrom-Json
        }
        $AssocIp = $ReserveResult.address
    }
    Write-Info "Associated VSI with public IP: $AssocIp"
}

$InstanceIp = $AssocIp

# Wait a moment for SSH port to open on the VSI
Write-Info "Waiting 20 seconds for SSH server on VSI to initialize..."
Start-Sleep -Seconds 20

# 9. Prepare local files for transfer
Write-Info "Packaging application code..."
$ZipFile = Join-Path $PSScriptRoot "pitmind.zip"
if (Test-Path $ZipFile) { Remove-Item $ZipFile }

# We will create a temporary folder, copy the target files, edit the .env for production, zip it, and clean up.
$TempDeployDir = Join-Path $PSScriptRoot "temp_deploy"
if (Test-Path $TempDeployDir) { Remove-Item -Recurse -Force $TempDeployDir }
New-Item -ItemType Directory -Path $TempDeployDir | Out-Null

# Copy source directories (excluding envs, venvs, node_modules)
Write-Info "Copying files to temporary staging area using Robocopy..."
& robocopy "$Root" "$TempDeployDir" /E /XD .git node_modules .venv* venv* .pytest_cache __pycache__ temp_deploy /XF id_rsa_pitmind* pitmind.zip /R:1 /W:1 /NDL /NFL /NJH /NJS | Out-Null
$global:LASTEXITCODE = 0

# Construct production .env
$ProdEnvFile = Join-Path $TempDeployDir ".env"

# Ensure local .env has passwords (generate if not exists to persist across runs)
$HasPgPass = $false
$HasRedisPass = $false
if (Test-Path $EnvFile) {
    $EnvContent = Get-Content $EnvFile
    foreach ($Line in $EnvContent) {
        if ($Line -match "^POSTGRES_PASSWORD=(.+)") { $HasPgPass = $true }
        if ($Line -match "^REDIS_PASSWORD=(.+)") { $HasRedisPass = $true }
    }
}
if (-not $HasPgPass) {
    $GenPgPass = [Guid]::NewGuid().ToString("N").Substring(0, 16)
    Write-Info "Generating secure POSTGRES_PASSWORD..."
    Add-Content $EnvFile "`nPOSTGRES_PASSWORD=$GenPgPass"
}
if (-not $HasRedisPass) {
    $GenRedisPass = [Guid]::NewGuid().ToString("N").Substring(0, 16)
    Write-Info "Generating secure REDIS_PASSWORD..."
    Add-Content $EnvFile "`nREDIS_PASSWORD=$GenRedisPass"
}

$EnvContent = Get-Content $EnvFile
$NewEnvContent = @()
foreach ($Line in $EnvContent) {
    if ($Line -match "^ENVIRONMENT=") {
        $NewEnvContent += "ENVIRONMENT=production"
    } elseif ($Line -match "^BACKEND_CORS_ORIGINS=") {
        # Allow connections from localhost, the VSI public IP, and the secure nip.io origin
        $NewEnvContent += "BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://${InstanceIp},http://${InstanceIp}:8080,https://${InstanceIp}.nip.io"
    } elseif ($Line -match "^WATSONX_API_KEY=") {
        $NewEnvContent += "WATSONX_API_KEY=$ApiKey"
    } elseif ($Line -match "^VITE_API_BASE_URL=") {
        # Set to empty so Nginx reverse proxy /api works automatically
        $NewEnvContent += "VITE_API_BASE_URL="
    } else {
        $NewEnvContent += $Line
    }
}
# Write the new .env file
$NewEnvContent | Set-Content $ProdEnvFile

# Compress the deployment package
Compress-Archive -Path "$TempDeployDir\*" -DestinationPath $ZipFile -Force
Remove-Item -Recurse -Force $TempDeployDir

# 10. Copy and deploy to VSI
$SshKeyArg = "-i `"$SshKeyPath`" -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAcceptedAlgorithms=rsa-sha2-256,rsa-sha2-512"

Write-Info "Testing SSH connection to VSI at $InstanceIp..."
$SshReady = $false
for ($i = 0; $i -lt 20; $i++) {
    $TestCmd = "ssh $SshKeyArg -o ConnectTimeout=5 ubuntu@${InstanceIp} exit"
    Write-Info "Connection check attempt $($i+1)/20..."
    Invoke-Expression $TestCmd
    if ($LASTEXITCODE -eq 0) {
        $SshReady = $true
        Write-Info "SSH connection established successfully!"
        break
    }
    Write-Warn "VSI SSH port not ready or public key not initialized yet. Waiting 10 seconds..."
    Start-Sleep -Seconds 10
}

if (-not $SshReady) {
    Write-Err "Failed to connect to VSI via SSH after 20 attempts. Aborting."
    exit 1
}

Write-Info "Uploading deployment package to VSI at $InstanceIp..."
$ScpCmd = "scp $SshKeyArg `"$ZipFile`" ubuntu@${InstanceIp}:~/pitmind.zip"
Invoke-Expression $ScpCmd

# Clean up local zip file
Remove-Item $ZipFile

Write-Info "Executing remote deployment script..."
$SshDeployCmd = @"
ssh $SshKeyArg ubuntu@${InstanceIp} "
  sudo apt-get update && sudo apt-get install -y unzip
  mkdir -p ~/pitMind
  unzip -o ~/pitmind.zip -d ~/pitMind/
  rm ~/pitmind.zip
  chmod +x ~/pitMind/scripts/deploy_vsi.sh
  cd ~/pitMind && ./scripts/deploy_vsi.sh
"
"@

# Run the SSH deployment commands
Invoke-Expression $SshDeployCmd

Write-Info "================================================================="
Write-Host "DEPLOYNENT COMPLETED SUCCESSFULY!" -ForegroundColor Green
Write-Host "PitMind is now running on IBM Cloud VSI." -ForegroundColor Green
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Web Frontend: http://${InstanceIp}" -ForegroundColor Cyan
Write-Host "  Backend API:  http://${InstanceIp}/health" -ForegroundColor Cyan
Write-Host "  API Docs:     http://${InstanceIp}/docs" -ForegroundColor Cyan
Write-Host "================================================================="
