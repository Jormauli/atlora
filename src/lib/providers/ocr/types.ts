export interface FileRef {
  id: string;
  path: string;
  mimeType: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProvider {
  extractText(file: FileRef): Promise<OCRResult>;
}
