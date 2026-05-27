# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
PitMind - WatsonX Diagnostic Script
Tests IAM token retrieval and WatsonX text generation API.
Run: python scripts/test_watsonx.py
"""
import asyncio
import json
import os
import sys

import httpx

# ── Credentials ───────────────────────────────────────────────────────────────
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY",    "FCPrH74g3ZcRaYYg3qIQEyx78eyLWzDt_UTW-NlGX4QL")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "06dc6d97-5710-4206-b656-dc953647ef58")
WATSONX_URL        = os.getenv("WATSONX_URL",        "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL_ID   = os.getenv("WATSONX_MODEL_ID",   "ibm/granite-3-8b-instruct")

IAM_URL = "https://iam.cloud.ibm.com/identity/token"

# ── Helpers ───────────────────────────────────────────────────────────────────
def ok(msg):  print(f"  [OK]   {msg}")
def fail(msg): print(f"  [FAIL] {msg}"); sys.exit(1)
def warn(msg): print(f"  [WARN] {msg}")
def section(title): print(f"\n{'='*60}\n  {title}\n{'='*60}")

# ── Tests ──────────────────────────────────────────────────────────────────────
async def test_iam_token(client: httpx.AsyncClient) -> str:
    section("1. IAM Token Exchange")
    print(f"  API Key prefix : {WATSONX_API_KEY[:12]}…")
    try:
        r = await client.post(
            IAM_URL,
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": WATSONX_API_KEY},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        print(f"  HTTP status    : {r.status_code}")
        body = r.json()
        if r.status_code != 200:
            fail(f"IAM error: {body}")
        token = body.get("access_token", "")
        if not token:
            fail(f"No access_token in response: {body}")
        ok(f"IAM token received ({len(token)} chars), type={body.get('token_type')}")
        return token
    except Exception as e:
        fail(f"IAM request failed: {e}")


async def test_project_access(client: httpx.AsyncClient, token: str):
    section("2. WatsonX Project Access")
    print(f"  Project ID     : {WATSONX_PROJECT_ID}")
    url = f"https://api.dataplatform.cloud.ibm.com/v2/projects/{WATSONX_PROJECT_ID}"
    try:
        r = await client.get(url, headers={"Authorization": f"Bearer {token}"})
        print(f"  HTTP status    : {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            name = data.get("entity", {}).get("name", "unknown")
            ok(f"Project found: '{name}'")
            # Check storage and compute
            entity = data.get("entity", {})
            storage = entity.get("storage", {})
            compute = entity.get("compute", [])
            if storage:
                ok(f"Storage configured: {storage.get('type', 'unknown')} guid={storage.get('guid','?')}")
            else:
                warn("No storage configured on project")
            if compute:
                ok(f"Compute resources: {[c.get('name') for c in compute]}")
            else:
                warn("No compute (WML) resources attached to project")
            return entity
        else:
            warn(f"Project access failed: {r.status_code} — {r.text[:300]}")
            return {}
    except Exception as e:
        warn(f"Project access check failed: {e}")
        return {}


async def test_wml_generation(client: httpx.AsyncClient, token: str):
    section("3. WatsonX Text Generation API")
    print(f"  Model          : {WATSONX_MODEL_ID}")
    print(f"  URL base       : {WATSONX_URL}")
    url = f"{WATSONX_URL.rstrip('/')}/ml/v1/text/generation?version=2024-05-01"
    payload = {
        "input": "<|system|>\nYou are a concise F1 strategist.\n<|user|>\nIn one sentence, what tyre is best for a hot track?\n<|assistant|>\n",
        "parameters": {"decoding_method": "greedy", "max_new_tokens": 80, "min_new_tokens": 1},
        "model_id": WATSONX_MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
    }
    try:
        r = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        print(f"  HTTP status    : {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            results = data.get("results", [])
            if results and "generated_text" in results[0]:
                text = results[0]["generated_text"].strip()
                ok(f"Generation succeeded!")
                print(f"\n  Model output   : «{text}»\n")
            else:
                warn(f"Unexpected response structure: {json.dumps(data, indent=2)}")
        else:
            body_text = r.text
            print(f"  Error body     : {body_text[:600]}")
            # Parse IBM-style error
            try:
                err = r.json()
                code = err.get("status_code") or err.get("code")
                msg  = err.get("message") or err.get("errors", [{}])[0].get("message", "")
                fail(f"WatsonX API error {code}: {msg}")
            except Exception:
                fail(f"WatsonX HTTP {r.status_code}: {body_text[:400]}")
    except Exception as e:
        fail(f"Generation request failed: {e}")


async def test_available_models(client: httpx.AsyncClient, token: str):
    section("4. Available Foundation Models")
    url = f"{WATSONX_URL.rstrip('/')}/ml/v1/foundation_model_specs?version=2024-05-01&limit=5"
    try:
        r = await client.get(url, headers={"Authorization": f"Bearer {token}"})
        if r.status_code == 200:
            data = r.json()
            models = [m.get("model_id") for m in data.get("resources", [])]
            ok(f"Sample available models: {models[:5]}")
            # Check if our model is available
            all_models_url = f"{WATSONX_URL.rstrip('/')}/ml/v1/foundation_model_specs?version=2024-05-01&limit=200"
            r2 = await client.get(all_models_url, headers={"Authorization": f"Bearer {token}"})
            if r2.status_code == 200:
                all_data = r2.json()
                all_ids = [m.get("model_id") for m in all_data.get("resources", [])]
                if WATSONX_MODEL_ID in all_ids:
                    ok(f"Configured model '{WATSONX_MODEL_ID}' IS available")
                else:
                    warn(f"Configured model '{WATSONX_MODEL_ID}' NOT in available models list")
                    print(f"  Available Granite models: {[m for m in all_ids if 'granite' in m.lower()]}")
        else:
            warn(f"Could not list models: {r.status_code}")
    except Exception as e:
        warn(f"Model listing failed: {e}")


async def main():
    print("\n[PitMind] WatsonX Diagnostics\n")
    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await test_iam_token(client)
        await test_project_access(client, token)
        await test_available_models(client, token)
        await test_wml_generation(client, token)

    section("Summary")
    print("  If all checks passed, WatsonX is operational.")
    print("  Ensure the Code Engine backend env vars match these credentials.\n")

if __name__ == "__main__":
    asyncio.run(main())
