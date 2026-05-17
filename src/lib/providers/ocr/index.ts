import { MockOCRProvider } from "./mock";
import { TencentOCRProvider } from "./tencent";
import type { OCRProvider } from "./types";

export function getOCRProvider(): OCRProvider {
  switch (process.env.OCR_PROVIDER) {
    case "tencent":
      return new TencentOCRProvider();
    case "mock":
    default:
      return new MockOCRProvider();
  }
}
