export interface UploadedFile {
  userId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}

export interface FileRef {
  id: string;
  path: string;
  mimeType: string;
}

export interface StorageProvider {
  saveTempFile(file: UploadedFile): Promise<FileRef>;
  deleteFile(fileId: string): Promise<void>;
  getFilePath(fileId: string): Promise<string>;
}
