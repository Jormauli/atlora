import test from "node:test";
import assert from "node:assert/strict";
import { detectSupportedImageMimeType, getImageIngestionErrorMessage } from "./validation";

test("detectSupportedImageMimeType trusts supported image signatures", () => {
  assert.equal(detectSupportedImageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xdb])), "image/jpeg");
  assert.equal(
    detectSupportedImageMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png"
  );
  assert.equal(detectSupportedImageMimeType(Buffer.from("RIFFabcdWEBP", "ascii")), "image/webp");
});

test("detectSupportedImageMimeType rejects spoofed image bytes", () => {
  assert.equal(detectSupportedImageMimeType(Buffer.from("<script>alert(1)</script>")), null);
});

test("getImageIngestionErrorMessage hides provider errors outside development", () => {
  assert.equal(getImageIngestionErrorMessage(new Error("tencent secret failed"), "production"), "生成失败，请稍后重试。");
  assert.equal(
    getImageIngestionErrorMessage(new Error("tencent secret failed"), "development"),
    "tencent secret failed"
  );
});
