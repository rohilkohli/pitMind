# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Inspect current project storage schema and WML instance details
so we can replicate the correct payload for project creation.
"""
import asyncio, json, httpx

API_KEY    = "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL"
PROJECT_ID = "06dc6d97-5710-4206-b656-dc953647ef58"
COS_GUID   = "7c22f3ea-5fbd-45a5-b302-f8bf630f19e8"
WML_GUID   = "b54b53f8-1d5d-4446-b2b4-95c7991859ad"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as c:
        tok = (await c.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": API_KEY},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )).json()["access_token"]
        auth = {"Authorization": f"Bearer {tok}"}

        # 1. Full existing project entity
        r = await c.get(f"https://api.dataplatform.cloud.ibm.com/v2/projects/{PROJECT_ID}", headers=auth)
        proj = r.json()
        print("\n=== EXISTING PROJECT (entity) ===")
        print(json.dumps(proj.get("entity", {}), indent=2))

        # 2. COS keys 
        r2 = await c.get(
            f"https://resource-controller.cloud.ibm.com/v2/resource_keys?source_crn=crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:{COS_GUID}::",
            headers=auth
        )
        keys = r2.json().get("resources", [])
        print(f"\n=== COS RESOURCE KEYS ({len(keys)} found) ===")
        for k in keys[:2]:
            print(json.dumps({
                "id": k.get("id"),
                "name": k.get("name"),
                "guid": k.get("guid"),
                "crn": k.get("crn"),
                "credentials_keys": list(k.get("credentials", {}).keys()),
            }, indent=2))

        # 3. WML resource key
        r3 = await c.get(
            f"https://resource-controller.cloud.ibm.com/v2/resource_keys?source_crn=crn:v1:bluemix:public:pm-20:us-south:a/7fd1fb8e73fb4643a836eb410b477be0:{WML_GUID}::",
            headers=auth
        )
        wml_keys = r3.json().get("resources", [])
        print(f"\n=== WML RESOURCE KEYS ({len(wml_keys)} found) ===")
        for k in wml_keys[:2]:
            print(json.dumps({
                "id": k.get("id"),
                "name": k.get("name"),
                "guid": k.get("guid"),
                "crn": k.get("crn"),
            }, indent=2))

asyncio.run(main())
