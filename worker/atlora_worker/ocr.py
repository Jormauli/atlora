import base64
import os
import tempfile
from pathlib import Path

from PIL import Image
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.ocr.v20181119 import ocr_client, models


def recognize_screenshot(path):
    client = create_client()
    texts = []
    weighted_confidence = 0.0
    character_count = 0
    with Image.open(path) as image, tempfile.TemporaryDirectory(prefix="atlora-ocr-") as temporary:
        image = image.convert("RGB")
        for index, top in enumerate(range(0, image.height, 2800)):
            chunk = image.crop((0, top, image.width, min(top + 2800, image.height)))
            chunk_path = Path(temporary) / f"chunk-{index}.jpg"
            chunk.save(chunk_path, "JPEG", quality=78, optimize=True)
            response = recognize_chunk(client, chunk_path)
            for detection in response.TextDetections or []:
                text = (detection.DetectedText or "").strip()
                if not text:
                    continue
                texts.append(text)
                size = len(text)
                weighted_confidence += float(detection.Confidence or 0) * size
                character_count += size
    return {
        "text": "\n".join(texts),
        "confidence": (weighted_confidence / character_count / 100) if character_count else 0.0,
    }


def create_client():
    secret_id = required_env("TENCENT_OCR_SECRET_ID")
    secret_key = required_env("TENCENT_OCR_SECRET_KEY")
    http_profile = HttpProfile()
    http_profile.endpoint = "ocr.tencentcloudapi.com"
    profile = ClientProfile(httpProfile=http_profile)
    return ocr_client.OcrClient(credential.Credential(secret_id, secret_key), "ap-guangzhou", profile)


def recognize_chunk(client, chunk_path):
    request = models.GeneralBasicOCRRequest()
    request.ImageBase64 = base64.b64encode(chunk_path.read_bytes()).decode("ascii")
    return client.GeneralBasicOCR(request)


def required_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"missing required environment variable: {name}")
    return value
