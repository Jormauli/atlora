import hashlib
import hmac
import json
import os
import time

import requests


def build_signature(secret, method, pathname, timestamp, ingestion_id, body):
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    canonical = "\n".join([method.upper(), pathname, str(timestamp), ingestion_id, digest])
    return hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()


def send_callback(ingestion_id, action, payload):
    base_url = required_env("ATLORA_CALLBACK_BASE_URL").rstrip("/")
    secret = required_env("WORKER_CALLBACK_SECRET")
    pathname = f"/api/internal/ingestions/{ingestion_id}/{action}"
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    timestamp = int(time.time())
    response = requests.post(
        f"{base_url}{pathname}",
        data=body.encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-atlora-timestamp": str(timestamp),
            "x-atlora-signature": build_signature(secret, "POST", pathname, timestamp, ingestion_id, body),
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def required_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"missing required environment variable: {name}")
    return value
