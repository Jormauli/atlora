import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";
import { prisma } from "@/lib/db/prisma";
import type { FileRef, StorageProvider, UploadedFile } from "./types";

const allowedExtensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

export class LocalStorageProvider implements StorageProvider {
  async saveTempFile(file: UploadedFile): Promise<FileRef> {
    const extension = allowedExtensions.get(file.mimeType);
    if (!extension) throw new Error("Unsupported image type");

    const dir = path.resolve(process.env.TEMP_UPLOAD_DIR ?? "./uploads/temp");
    await mkdir(dir, { recursive: true });
    const record = await prisma.file.create({
      data: {
        userId: file.userId,
        fileType: "image",
        objectKey: "",
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
        expireAt: new Date(Date.now() + Number(process.env.TEMP_FILE_TTL_HOURS ?? 24) * 60 * 60 * 1000)
      }
    });
    const objectKey = `${record.id}${extension}`;
    const fullPath = path.join(dir, objectKey);
    await writeFile(fullPath, file.buffer);
    await prisma.file.update({
      where: { id: record.id },
      data: { objectKey }
    });
    return { id: record.id, path: fullPath, mimeType: file.mimeType };
  }

  async deleteFile(fileId: string) {
    const file = await prisma.file.findUniqueOrThrow({ where: { id: fileId } });
    const fullPath = await this.getFilePath(fileId);
    await unlink(fullPath).catch(() => undefined);
    await prisma.file.update({
      where: { id: fileId },
      data: { status: "deleted", deletedAt: new Date() }
    });
  }

  async getFilePath(fileId: string) {
    const file = await prisma.file.findUniqueOrThrow({ where: { id: fileId } });
    return path.resolve(process.env.TEMP_UPLOAD_DIR ?? "./uploads/temp", file.objectKey);
  }
}
