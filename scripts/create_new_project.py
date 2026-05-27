# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import asyncio, json, httpx

API_KEY    = "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL"
COS_GUID   = "36a727cf-7e35-458d-9a96-06e8640585bc" # Extracted from the inspect script
WML_GUID   = "b54b53f8-1d5d-4446-b2b4-95c7991859ad" # The active one
IAM_URL    = "https://iam.cloud.ibm.com/identity/token"
API_URL    = "https://api.dataplatform.cloud.ibm.com/v2/projects"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as c:
        # 1. Get token
        r = await c.post(
            IAM_URL,
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": API_KEY},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token = r.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Create Project
        payload = {
            "name": "pitMind_v2",
            "generator": "cpdaas-portal-projects",
            "scope": {
                "bss_account_id": "7fd1fb8e73fb4643a836eb410b477be0",
                "enforce_members": True
            },
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
                      "secret_access_key": "0779e9dc00e71463abefa35d9a52c1f311bdc19a909fa75c"
                    },
                    "editor": {
                      "api_key": "XmpM4GD8ncNiKW6x8ZGk5PO-cQUQPIp80XpPLqH60RLL",
                      "service_id": "iam-ServiceId-97d6d6b6-fe41-4c38-98c7-f6c3b53e75e8",
                      "access_key_id": "0bb1956fdd2c475586d6c57fb9366547",
                      "secret_access_key": "e845986d9f6a88e82ccd5d77d97938a95e3891b95f0e3ef3",
                      "resource_key_crn": "crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:36a727cf-7e35-458d-9a96-06e8640585bc:resource-key:0bb1956f-dd2c-4755-86d6-c57fb9366547"
                    },
                    "viewer": {
                      "api_key": "r9QirV5cgpGXavKYSr2Nyb0Xtmz8SKEABmQ8MtZNUdQF",
                      "service_id": "iam-ServiceId-18f1dcb1-1e75-49bc-8290-fad945f186c8",
                      "access_key_id": "b6aee37e517f438785827293dfb54241",
                      "secret_access_key": "c98f74697ecbefd5cc028e5bff8dd7a04d2bfaf7d1ed717a",
                      "resource_key_crn": "crn:v1:bluemix:public:cloud-object-storage:global:a/7fd1fb8e73fb4643a836eb410b477be0:36a727cf-7e35-458d-9a96-06e8640585bc:resource-key:b6aee37e-517f-4387-8582-7293dfb54241"
                    }
                  }
                }
            },
            "compute": [
                {
                    "name": "PitMind-WML-Engine",
                    "guid": WML_GUID,
                    "type": "machine_learning",
                    "crn": f"crn:v1:bluemix:public:pm-20:us-south:a/7fd1fb8e73fb4643a836eb410b477be0:{WML_GUID}::",
                    "credentials": {}
                }
            ]
        }
        
        print("Creating new project...")
        r2 = await c.post(API_URL, json=payload, headers=auth)
        if r2.status_code in (200, 201):
            project_id = r2.headers.get("location", "").split("/")[-1] or r2.json().get("location", "").split("/")[-1]
            if not project_id:
                # Sometime it's returned in the body as metadata.guid
                project_id = r2.json().get("metadata", {}).get("guid", "")
            
            print(f"[SUCCESS] New project created! Project ID: {project_id}")
            
            # Test text generation
            gen_url = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2024-05-01"
            gen_payload = {
                "input": "<|system|>\nYou are an F1 strategist.\n<|user|>\nHello\n<|assistant|>\n",
                "parameters": {"decoding_method": "greedy", "max_new_tokens": 10},
                "model_id": "ibm/granite-3-8b-instruct",
                "project_id": project_id
            }
            r3 = await c.post(gen_url, json=gen_payload, headers=auth)
            print(f"Generation test status: {r3.status_code}")
            if r3.status_code == 200:
                print("Generation response:")
                print(r3.json().get("results", [{}])[0].get("generated_text"))
                print("\nUPDATE YOUR BACKEND .env WITH WATSONX_PROJECT_ID =", project_id)
            else:
                print("Generation failed:", r3.text)
        else:
            print("[ERROR] Failed to create project:", r2.status_code, r2.text)

if __name__ == "__main__":
    asyncio.run(main())
