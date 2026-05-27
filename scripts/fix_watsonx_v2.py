# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
PitMind - WatsonX Project Repair v2
Uses PATCH on the project entity to swap the compute resource.
Also tries the IBM Resource Controller API to reactivate the inactive WML.
Run: python scripts/fix_watsonx_v2.py
"""
import asyncio
import json
import os
import httpx

WATSONX_API_KEY    = "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL"
WATSONX_PROJECT_ID = "06dc6d97-5710-4206-b656-dc953647ef58"
WATSONX_URL        = "https://us-south.ml.cloud.ibm.com"

# Stale WML attached to project
STALE_WML_GUID     = "42c4176c-e54d-4463-88b1-e88cc0e66ddc"
# New active WML you provisioned
NEW_WML_GUID       = "b54b53f8-1d5d-4446-b2b4-95c7991859ad"
NEW_WML_NAME       = "PitMind-WML-Engine"

IAM_URL      = "https://iam.cloud.ibm.com/identity/token"
PROJECTS_API = "https://api.dataplatform.cloud.ibm.com"
RC_API       = "https://resource-controller.cloud.ibm.com"

def ok(msg):  print(f"  [OK]   {msg}")
def fail(msg): print(f"  [FAIL] {msg}")
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
    ok(f"IAM token acquired")
    return token


async def check_wml_instance(client: httpx.AsyncClient, token: str, guid: str) -> dict:
    """Check WML instance status via IBM Resource Controller API."""
    url = f"{RC_API}/v2/resource_instances/{guid}"
    r = await client.get(url, headers={"Authorization": f"Bearer {token}"})
    info(f"Resource Controller check for {guid}: HTTP {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        state = data.get("state", "unknown")
        name  = data.get("name", "unknown")
        crn   = data.get("crn", "")
        info(f"  Name: {name}, State: {state}")
        info(f"  CRN:  {crn}")
        return data
    else:
        warn(f"Could not get instance: {r.text[:300]}")
        return {}


async def try_patch_project_compute(client: httpx.AsyncClient, token: str) -> bool:
    """
    Try PATCH on the project to replace compute array with the new WML.
    Uses the Watson Studio Projects API PATCH endpoint.
    """
    url = f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}"
    # The PATCH body replaces the compute list
    payload = [
        {
            "op": "replace",
            "path": "/entity/compute",
            "value": [
                {
                    "guid": NEW_WML_GUID,
                    "name": NEW_WML_NAME,
                    "type": "machine_learning",
                    "label": "Watson Machine Learning",
                    "crn": f"crn:v1:bluemix:public:pm-20:us-south:a/e21b2f5de9014f53b04e3b4a0b5da80b:{NEW_WML_GUID}::",
                }
            ],
        }
    ]
    r = await client.patch(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    info(f"PATCH project compute -> HTTP {r.status_code}")
    if r.status_code in (200, 204):
        ok("Project compute PATCHED successfully")
        return True
    else:
        warn(f"PATCH failed: {r.text[:400]}")
        return False


async def try_update_project_members(client: httpx.AsyncClient, token: str) -> bool:
    """
    Some IBM APIs use a different path to update compute on a project.
    Try the /v2/projects/{id} PUT endpoint with full entity replacement.
    """
    # First get current project state
    r = await client.get(
        f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code != 200:
        warn(f"Could not get project for PUT: {r.status_code}")
        return False
    
    proj = r.json()
    entity = proj.get("entity", {})
    
    # Swap out compute
    entity["compute"] = [
        {
            "guid": NEW_WML_GUID,
            "name": NEW_WML_NAME,
            "type": "machine_learning",
            "label": "Watson Machine Learning",
        }
    ]
    
    put_r = await client.put(
        f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}",
        json={"entity": entity},
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    info(f"PUT project -> HTTP {put_r.status_code}")
    if put_r.status_code in (200, 204):
        ok("Project updated via PUT")
        return True
    else:
        warn(f"PUT failed: {put_r.text[:400]}")
        return False


async def verify_generation(client: httpx.AsyncClient, token: str) -> bool:
    url = f"{WATSONX_URL.rstrip('/')}/ml/v1/text/generation?version=2024-05-01"
    payload = {
        "input": "<|system|>\nYou are a concise F1 strategist.\n<|user|>\nBest tyre for hot track in one sentence?\n<|assistant|>\n",
        "parameters": {"decoding_method": "greedy", "max_new_tokens": 60, "min_new_tokens": 1},
        "model_id": "ibm/granite-3-8b-instruct",
        "project_id": WATSONX_PROJECT_ID,
    }
    r = await client.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    info(f"Generation test -> HTTP {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        results = data.get("results", [])
        if results and "generated_text" in results[0]:
            text = results[0]["generated_text"].strip()
            ok(f"GENERATION WORKS: \"{text[:120]}\"")
            return True
    warn(f"Generation failed: {r.text[:400]}")
    return False


async def main():
    print("\n[PitMind] WatsonX Project Repair v2\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        section("Step 1: Get IAM Token")
        token = await get_token(client)

        section("Step 2: Check Both WML Instance States")
        info("--- Stale WML (attached to project, inactive) ---")
        stale = await check_wml_instance(client, token, STALE_WML_GUID)
        info("--- New WML (PitMind-WML-Engine) ---")
        new_wml = await check_wml_instance(client, token, NEW_WML_GUID)
        
        new_state = new_wml.get("state", "unknown")
        new_crn   = new_wml.get("crn", "")
        
        if new_state != "active":
            warn(f"New WML instance is '{new_state}' — it must be 'active' before proceeding")
            warn("Try: ibmcloud resource service-instance-update PitMind-WML-Engine --service-plan-id <plan-id>")
        else:
            ok(f"New WML instance is active. CRN: {new_crn}")

        section("Step 3: Try PATCH Project Compute (JSON Patch)")
        patched = await try_patch_project_compute(client, token)

        if not patched:
            section("Step 3b: Try PUT Project Entity Replacement")
            await try_update_project_members(client, token)

        section("Step 4: Test Generation with New Compute")
        gen_ok = await verify_generation(client, token)

        section("Final Summary")
        if gen_ok:
            ok("WatsonX is FULLY OPERATIONAL!")
            print("\n  Your Code Engine backend needs these env vars:")
            print(f"  WATSONX_API_KEY    = FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL")
            print(f"  WATSONX_PROJECT_ID = {WATSONX_PROJECT_ID}")
            print(f"  WATSONX_URL        = {WATSONX_URL}")
            print(f"  WATSONX_MODEL_ID   = ibm/granite-3-8b-instruct")
        else:
            print()
            warn("Generation still failing. The stale WML instance is still being used by the project.")
            print()
            print("  ROOT CAUSE: The WatsonX project has a hard reference to the INACTIVE WML instance")
            print(f"  Inactive GUID: {STALE_WML_GUID}")
            print(f"  Active GUID:   {NEW_WML_GUID}")
            print()
            print("  MANUAL FIXES (pick one):")
            print()
            print("  Option A — Reactivate the stale instance:")
            print(f"    ibmcloud resource service-instance {STALE_WML_GUID}")
            print(f"    (Check if the plan supports reactivation via IBM Cloud Console)")
            print()
            print("  Option B — Use the IBM Cloud Console Watson Studio UI:")
            print("    1. Go to cloud.ibm.com -> Resource list -> AI/Machine Learning")
            print(f"    2. Click 'Watson Machine Learning' instance named 'watsonx.ai Runtime-ok'")
            print("    3. If it shows 'Inactive', click 'Restore service' or delete + recreate")
            print(f"    4. Then associate it with project ID {WATSONX_PROJECT_ID} in watsonx.ai UI")
            print()
            print("  Option C — Create a new WatsonX project entirely:")
            print("    python scripts/create_new_project.py  (run next script)")


if __name__ == "__main__":
    asyncio.run(main())
