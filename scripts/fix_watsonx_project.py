# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
PitMind - WatsonX Project Repair Script
1. Removes the stale/inactive WML compute resource from the project
2. Adds the new active PitMind-WML-Engine
Run: python scripts/fix_watsonx_project.py
"""
import asyncio
import json
import os

import httpx

# ── Credentials ────────────────────────────────────────────────────────────────
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY",    "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "06dc6d97-5710-4206-b656-dc953647ef58")
WATSONX_URL        = os.getenv("WATSONX_URL",        "https://us-south.ml.cloud.ibm.com")

# The NEW active WML instance you provisioned
NEW_WML_GUID = "b54b53f8-1d5d-4446-b2b4-95c7991859ad"
NEW_WML_NAME = "PitMind-WML-Engine"

# The STALE inactive WML instance currently on the project
STALE_WML_GUID = "42c4176c-e54d-4463-88b1-e88cc0e66ddc"

IAM_URL = "https://iam.cloud.ibm.com/identity/token"
PROJECTS_API = "https://api.dataplatform.cloud.ibm.com"

def ok(msg):  print(f"  [OK]   {msg}")
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
    if not token:
        fail("Could not get IAM token")
    ok(f"IAM token acquired ({len(token)} chars)")
    return token


async def get_project(client: httpx.AsyncClient, token: str) -> dict:
    r = await client.get(
        f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()


async def remove_compute(client: httpx.AsyncClient, token: str, compute_guid: str) -> bool:
    """Remove a compute resource from the project."""
    url = f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}/compute/{compute_guid}"
    r = await client.delete(url, headers={"Authorization": f"Bearer {token}"})
    print(f"  DELETE {url} -> {r.status_code}")
    if r.status_code in (200, 204):
        ok(f"Removed compute {compute_guid}")
        return True
    else:
        warn(f"Could not remove compute: {r.status_code} {r.text[:300]}")
        return False


async def add_compute(client: httpx.AsyncClient, token: str) -> bool:
    """Add the new WML instance to the project."""
    url = f"{PROJECTS_API}/v2/projects/{WATSONX_PROJECT_ID}/compute"
    payload = {
        "name": NEW_WML_NAME,
        "guid": NEW_WML_GUID,
        "type": "machine_learning",
        "label": "Watson Machine Learning",
    }
    r = await client.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    print(f"  POST {url} -> {r.status_code}")
    if r.status_code in (200, 201):
        ok(f"Added new WML compute: {NEW_WML_NAME} ({NEW_WML_GUID})")
        return True
    else:
        warn(f"Could not add compute: {r.status_code} {r.text[:400]}")
        return False


async def verify_generation(client: httpx.AsyncClient, token: str) -> bool:
    """Test text generation after repair."""
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
    print(f"  Generation test -> HTTP {r.status_code}")
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
    print("\n[PitMind] WatsonX Project Repair\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        section("Step 1: Get IAM Token")
        token = await get_token(client)

        section("Step 2: Read Current Project State")
        proj = await get_project(client, token)
        entity = proj.get("entity", {})
        compute_list = entity.get("compute", [])
        info(f"Current compute resources: {[(c.get('name'), c.get('guid')) for c in compute_list]}")

        section("Step 3: Remove Stale WML Instance")
        # Find the stale instance — try by known GUID or by inactive status
        removed = False
        for c in compute_list:
            c_guid = c.get("guid", "")
            c_name = c.get("name", "")
            if c_guid == STALE_WML_GUID or "inactive" in c_name.lower() or c_guid == STALE_WML_GUID:
                info(f"Found stale compute: {c_name} ({c_guid}) — removing...")
                removed = await remove_compute(client, token, c_guid)
                break
        
        if not removed:
            # Try removing by known GUID directly even if not in list
            info(f"Attempting direct removal of stale GUID {STALE_WML_GUID}...")
            removed = await remove_compute(client, token, STALE_WML_GUID)

        section("Step 4: Add New Active WML Instance")
        # Check if new WML is already added
        already_added = any(c.get("guid") == NEW_WML_GUID for c in compute_list)
        if already_added:
            ok(f"New WML {NEW_WML_GUID} already in project compute list")
            added = True
        else:
            added = await add_compute(client, token)

        section("Step 5: Verify Project State")
        proj2 = await get_project(client, token)
        compute2 = proj2.get("entity", {}).get("compute", [])
        info(f"Updated compute resources: {[(c.get('name'), c.get('guid')) for c in compute2]}")

        section("Step 6: Test Text Generation")
        gen_ok = await verify_generation(client, token)

        section("Result")
        if gen_ok:
            ok("WatsonX is FULLY OPERATIONAL. Update your Code Engine env vars and redeploy.")
            print("\n  Required Code Engine env vars:")
            print(f"  WATSONX_API_KEY    = FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL")
            print(f"  WATSONX_PROJECT_ID = {WATSONX_PROJECT_ID}")
            print(f"  WATSONX_URL        = {WATSONX_URL}")
            print(f"  WATSONX_MODEL_ID   = ibm/granite-3-8b-instruct")
        else:
            warn("Generation still failing. Check ibmcloud resource list and WML instance status.")
            print("\n  Next steps:")
            print("  1. Run: ibmcloud resource service-instance PitMind-WML-Engine")
            print("  2. Ensure its state is 'active' (not 'inactive' or 'provisioning')")
            print("  3. Re-run this script after confirming the instance is active")


if __name__ == "__main__":
    asyncio.run(main())
