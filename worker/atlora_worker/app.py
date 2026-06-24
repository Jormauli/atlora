import logging
from urllib.parse import urlparse

from flask import Flask, jsonify, request

from .callbacks import send_callback
from .extractor import extract_article

LOGGER = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    @app.get("/health")
    @app.get("/healthz")
    def health():
        return jsonify({"ok": True})

    @app.post("/tasks/extract")
    def extract():
        payload = request.get_json(silent=True) or {}
        ingestion_id = payload.get("ingestionId")
        url = payload.get("url")
        if not isinstance(ingestion_id, str) or not ingestion_id or not is_wechat_url(url):
            return jsonify({"error": "invalid task"}), 400
        process_task(ingestion_id, url)
        return jsonify({"ok": True})

    return app


def is_wechat_url(url):
    if not isinstance(url, str):
        return False
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname == "mp.weixin.qq.com"


def process_task(ingestion_id, url):
    try:
        send_callback(ingestion_id, "stage", {"stage": "opening_article"})
        extracted = extract_article(
            url,
            lambda stage: send_callback(ingestion_id, "stage", {"stage": stage}),
        )
        send_callback(ingestion_id, "extracted", extracted)
    except Exception as error:
        LOGGER.exception("wechat extraction failed ingestion_id=%s", ingestion_id)
        failure_code = str(error) if str(error).isupper() else "WECHAT_EXTRACTION_FAILED"
        send_callback(ingestion_id, "failed", {
            "failureCode": failure_code[:64],
            "message": "微信公众号正文读取失败，请稍后重试，或上传文章截图。",
            "retryable": True,
        })


app = create_app()
