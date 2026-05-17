import { readFile } from "fs/promises";
import * as tencentcloud from "tencentcloud-sdk-nodejs";
import type { OCRProvider, OCRResult, FileRef } from "./types";

export class TencentOCRProvider implements OCRProvider {
  async extractText(file: FileRef): Promise<OCRResult> {
    const secretId = process.env.TENCENT_OCR_SECRET_ID;
    const secretKey = process.env.TENCENT_OCR_SECRET_KEY;
    if (!secretId || !secretKey) throw new Error("Tencent OCR credentials are missing");

    const { ocr } = tencentcloud;
    const client = new ocr.v20181119.Client({
      credential: { secretId, secretKey },
      region: process.env.TENCENT_OCR_REGION ?? "ap-guangzhou",
      profile: {
        httpProfile: {
          endpoint: "ocr.tencentcloudapi.com"
        }
      }
    });
    const imageBase64 = (await readFile(file.path)).toString("base64");
    const response = await client.GeneralBasicOCR({ ImageBase64: imageBase64 });
    const detections = response.TextDetections ?? [];
    const text = detections.map((item) => item.DetectedText).filter(Boolean).join("\n");
    if (!text) throw new Error("Tencent OCR returned empty text");
    const confidenceValues = detections.map((item) => item.Confidence ?? 0).filter((value) => value > 0);
    const confidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length / 100
      : 0;
    return { text, confidence };
  }
}
