# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
PitMind - Create New WatsonX Project Script
The existing project has a hard-reference to a removed WML instance and
IBM's Projects API does not support updating compute members via REST.
This script creates a new project with the correct WML instance and
verifies text generation works.

Run: python scripts/create_new_watsonx_project.py
After success: update WATSONX_PROJECT_ID in Code Engine env vars.
"""
import asyncio
import json
import os
import httpx

WATSONX_API_KEY    = "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL"
WATSONX_URL        = "https://us-south.ml.cloud.ibm.com"

# Active WML instance (PitMind-WML-Engine)
WML_GUID = "b54b53f8-1d5d-4446-b2b4-95c7991859ad"
WML_CRN  = "crn:v1:bluemix:public:pm-20:us-south:a/7fd1fb8e73fb4643a836eb410b477be0:b54b53f8-1d5d-4446-b2b4-95c7991859ad::"
WML_NAME = "PitMind-WML-Engine"

# Cloud Object Storage (PitMind-COS)
COS_GUID = "7c22f3ea-5fbd-45a5-b302-f8bf630f19e8"

# New project settings
NEW_PROJECT_NAME = "pitMind-v2"

IAM_URL      = "https://iam.cloud.ibm.com/identity/token"
PROJECTS_API = "https://api.dataplatform.cloud.ibm.com"
RC_API       = "https://resource-controller.cloud.ibm.com"

def ok(msg):   print(f"  [OK]   {msg}")
def fail(msg): print(f"  [FAIL] {msg}"); sys.exit(1)
def warn(msg): print(f"  [WARN] {msg}")
def info(msg): print(f"  [INFO] {msg}")
def section(title): print(f"\n{'='*60}\n  {title}\n{'='*60}")


async def get_token(client: httpx.AsyncClient) -> str:
    r = await client.post(
        IAM_URL,
        data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": WATSONX_API_KEY},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    token = r.json().get("access_token", "")
    ok("IAM token acquired")
    return token


async def get_cos_details(client: httpx.AsyncClient, token: str) -> dict:
    """Get COS instance details from Resource Controller."""
    r = await client.get(
        f"{RC_API}/v2/resource_instances/{COS_GUID}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code == 200:
        data = r.json()
        info(f"COS instance: {data.get('name')} | state={data.get('state')} | crn={data.get('crn', '')[:60]}...")
        return data
    else:
        warn(f"Could not get COS details: {r.status_code} {r.text[:200]}")
        return {}


async def get_cos_credentials(client: httpx.AsyncClient, token: str) -> dict:
    """List COS resource keys (HMAC credentials) for the bucket endpoint."""
    r = await client.get(
        f"{RC_API}/v2/resource_keys?source_crn=crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:{COS_GUID}::",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code == 200:
        keys = r.json().get("resources", [])
        info(f"COS resource keys found: {len(keys)}")
        if keys:
            return keys[0]  # Use first available key
    warn("No COS resource keys found")
    return {}


async def create_project(client: httpx.AsyncClient, token: str) -> str:
    """Create a new WatsonX project with active WML compute."""
    url = f"{PROJECTS_API}/v2/projects"
    
    # Get COS details for storage config
    cos_data = await get_cos_details(client, token)
    cos_crn  = cos_data.get("crn", f"crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:{COS_GUID}::")
    cos_name = cos_data.get("name", "PitMind-COS")
    
    # IBM Cloud account ID (from IAM token)
    account_id = "7fd1fb8e73fb4643a836eb410b477be0"
    
    payload = {
        "name": NEW_PROJECT_NAME,
        "type": "wx",          # watsonx.ai project type
        "description": "PitMind F1 strategy AI - rebuilt project with active WML",
        "generator": "pythonscript",   # Required by IBM Projects API
        "scope": {                      # Required: account scope
            "bss_account_id": account_id,
        },
        "compute": [
            {
                "name": WML_NAME,
                "guid": WML_GUID,
                "type": "machine_learning",
                "label": "Watson Machine Learning",
                "crn": WML_CRN,
                "credentials": {},
            }
        ],
        "storage": {
            "type": "bmcos_object_storage",
            "guid": COS_GUID,
            "properties": {
                "bucket_name": "pitmind-donotdelete-pr-8eqrplvbat1mba",
                "bucket_region": "us-south",
                "endpoint_url": "https://s3.us-south.cloud-object-storage.appdomain.cloud",
                "credentials": {
                    "admin": {
                        "api_key": "x6Mh_DjUOoOQYzxN2E6DSbgQs6A6nXZr5VcyakgW7E2f",
                        "service_id": "iam-ServiceId-352bb575-9bc2-4dab-8b60-711ce590cc82",
                        "access_key_id": "175c1e49ddf54a258218b963fa68cd8a",
                        "secret_access_key": "0779e9dc00e71463abefa35d9a52c1f311bdc19a909fa75c",
                    },
                    "editor": {
                        "api_key": "XmpM4GD8ncNiKW6x8ZGk5PO-cQUQPIp80XpPLqH60RLL",
                        "service_id": "iam-ServiceId-97d6d6b6-fe41-4c38-98c7-f6c3b53e75e8",
                        "access_key_id": "0bb1956fdd2c475586d6c57fb9366547",
                        "secret_access_key": "e845986d9f6a88e82ccd5d77d97938a95e3891b95f0e3ef3",
                        "resource_key_crn": "crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:36a727cf-7e35-458d-9a96-06e8640585bc:resource-key:0bb1956f-dd2c-4755-86d6-c57fb9366547",
                    },
                    "viewer": {
                        "api_key": "r9QirV5cgpGXavKYSr2Nyb0Xtmz8SKEABmQ8MtZNUdQF",
                        "service_id": "iam-ServiceId-18f1dcb1-1e75-49bc-8290-fad945f186c8",
                        "access_key_id": "b6aee37e517f438785827293dfb54241",
                        "secret_access_key": "c98f74697ecbefd5cc028e5bff8dd7a04d2bfaf7d1ed717a",
                        "resource_key_crn": "crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:36a727cf-7e35-458d-9a96-06e8640585bc:resource-key:b6aee37e-517f-4387-8582-7293dfb54241",
                    },
                },
            },
        },
    }
    
    info(f"Creating project '{NEW_PROJECT_NAME}' with WML={WML_GUID}")
    r = await client.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    info(f"POST /v2/projects -> HTTP {r.status_code}")
    
    if r.status_code in (200, 201):
        data = r.json()
        project_id = data.get("location", "").split("/")[-1] or data.get("entity", {}).get("id", "")
        # Try multiple paths to find project ID
        if not project_id:
            project_id = (
                data.get("id") or 
                data.get("entity", {}).get("id") or
                data.get("metadata", {}).get("guid", "")
            )
        ok(f"Project created! ID: {project_id}")
        info(f"Full response: {json.dumps(data, indent=2)[:600]}")
        return project_id
    else:
        warn(f"Project creation failed: {r.status_code}")
        warn(f"Response: {r.text[:600]}")
        return ""


async def verify_generation(client: httpx.AsyncClient, token: str, project_id: str) -> bool:
    url = f"{WATSONX_URL.rstrip('/')}/ml/v1/text/generation?version=2024-05-01"
    payload = {
        "input": "<|system|>\nYou are a concise F1 strategist.\n<|user|>\nBest tyre compound for a hot track in one sentence?\n<|assistant|>\n",
        "parameters": {"decoding_method": "greedy", "max_new_tokens": 60, "min_new_tokens": 1},
        "model_id": "ibm/granite-3-8b-instruct",
        "project_id": project_id,
    }
    r = await client.post(
        url, json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    info(f"Generation test -> HTTP {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        results = data.get("results", [])
        if results and "generated_text" in results[0]:
            text = results[0]["generated_text"].strip()
            ok(f"GENERATION SUCCESS: \"{text[:120]}\"")
            return True
    warn(f"Generation failed: {r.text[:400]}")
    return False


async def list_projects(client: httpx.AsyncClient, token: str):
    """List all accessible projects for reference."""
    r = await client.get(
        f"{PROJECTS_API}/v2/projects?limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code == 200:
        projs = r.json().get("results", [])
        info(f"All accessible projects ({len(projs)}):")
        for p in projs:
            eid = p.get("metadata", {}).get("guid", p.get("id", "?"))
            ename = p.get("entity", {}).get("name", "?")
            compute = p.get("entity", {}).get("compute", [])
            c_guids = [c.get("guid","?") for c in compute]
            print(f"    - {ename} | id={eid} | compute={c_guids}")
    else:
        warn(f"Could not list projects: {r.status_code}")


async def main():
    print("\n[PitMind] Create New WatsonX Project\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        section("Step 1: Get IAM Token")
        token = await get_token(client)

        section("Step 2: List Existing Projects")
        await list_projects(client, token)

        section("Step 3: Create New Project with Active WML")
        new_project_id = await create_project(client, token)

        if not new_project_id:
            section("FAILED")
            fail("Could not create new project — see error above")

        section("Step 4: Verify Text Generation")
        gen_ok = await verify_generation(client, token, new_project_id)

        section("Result")
        if gen_ok:
            ok("WatsonX is FULLY OPERATIONAL with new project!")
            print()
            print("  *** UPDATE YOUR CODE ENGINE ENV VARS ***")
            print()
            print(f"  WATSONX_PROJECT_ID = {new_project_id}")
            print(f"  WATSONX_API_KEY    = FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL")
            print(f"  WATSONX_URL        = {WATSONX_URL}")
            print(f"  WATSONX_MODEL_ID   = ibm/granite-3-8b-instruct")
            print()
            print("  Run: ibmcloud ce application update --name pitmind-backend \\")
            print(f"         --env WATSONX_PROJECT_ID={new_project_id} \\")
            print(f"         --env WATSONX_API_KEY=FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL \\")
            print(f"         --env WATSONX_URL={WATSONX_URL} \\")
            print(f"         --env WATSONX_MODEL_ID=ibm/granite-3-8b-instruct")
        else:
            warn("Generation still failing after new project creation")
            print(f"\n  New project ID was: {new_project_id}")
            print("  The WML instance may need a few minutes to fully activate within the project.")
            print("  Wait 2 minutes and re-run: python scripts/test_watsonx.py")


if __name__ == "__main__":
    asyncio.run(main())
