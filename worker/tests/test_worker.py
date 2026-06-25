import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from atlora_worker.app import create_app
from atlora_worker.callbacks import build_signature, send_callback
from atlora_worker.extractor import looks_like_article, parse_markdown


class ExtractorTests(unittest.TestCase):
    def test_parses_markdown_and_rejects_challenge_pages(self):
        parsed = parse_markdown("---\ntitle: Meta\n---\n# 正文标题\n\n" + "这是一段可靠正文。" * 30)
        self.assertEqual(parsed["title"], "正文标题")
        self.assertTrue(looks_like_article(parsed["text"]))
        self.assertFalse(looks_like_article("环境异常，请完成验证" * 20))

    def test_signature_matches_the_node_canonical_contract(self):
        body = '{"stage":"opening_article"}'
        signature = build_signature(
            "secret", "POST", "/api/internal/ingestions/ing-1/stage", 1700000000, "ing-1", body
        )
        self.assertEqual(signature, "c892de446f64e1092ded8c4a913a843e167fe85764fa12756e897e7516292301")

    @patch("atlora_worker.callbacks.requests.post")
    def test_callback_can_bypass_vercel_preview_protection(self, post):
        os.environ["WORKER_CALLBACK_SECRET"] = "secret"
        os.environ["ATLORA_CALLBACK_BASE_URL"] = "https://preview.example"
        os.environ["VERCEL_AUTOMATION_BYPASS_SECRET"] = "bypass-secret"
        post.return_value.json.return_value = {"ok": True}

        send_callback("ing-1", "stage", {"stage": "opening_article"})

        headers = post.call_args.kwargs["headers"]
        self.assertEqual(headers["x-vercel-protection-bypass"], "bypass-secret")
        os.environ.pop("VERCEL_AUTOMATION_BYPASS_SECRET", None)


class AppTests(unittest.TestCase):
    def setUp(self):
        os.environ["WORKER_CALLBACK_SECRET"] = "test-secret"
        os.environ["ATLORA_CALLBACK_BASE_URL"] = "https://preview.example"

    @patch("atlora_worker.app.process_task")
    def test_accepts_a_valid_wechat_task(self, process_task):
        app = create_app()
        response = app.test_client().post(
            "/tasks/extract",
            data=json.dumps({"ingestionId": "ing-1", "url": "https://mp.weixin.qq.com/s/demo"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        process_task.assert_called_once()

    def test_health_endpoint_uses_non_reserved_path(self):
        app = create_app()
        response = app.test_client().get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"ok": True})

    @patch("atlora_worker.app.process_task")
    def test_rejects_non_wechat_urls(self, process_task):
        app = create_app()
        response = app.test_client().post(
            "/tasks/extract",
            json={"ingestionId": "ing-1", "url": "https://example.com/private"},
        )
        self.assertEqual(response.status_code, 400)
        process_task.assert_not_called()


if __name__ == "__main__":
    unittest.main()
