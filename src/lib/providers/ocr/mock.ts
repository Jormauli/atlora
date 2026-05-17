import type { OCRProvider, OCRResult, FileRef } from "./types";

export class MockOCRProvider implements OCRProvider {
  async extractText(file: FileRef): Promise<OCRResult> {
    return {
      text: `这是一段来自图片 ${file.id} 的模拟 OCR 文本。它描述了一个值得整理的知识点。`,
      confidence: 0.96
    };
  }
}
