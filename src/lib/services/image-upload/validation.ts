export type SupportedImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export function detectSupportedImageMimeType(buffer: Buffer): SupportedImageMimeType | null {
  if (isJpeg(buffer)) return "image/jpeg";
  if (isPng(buffer)) return "image/png";
  if (isWebp(buffer)) return "image/webp";
  return null;
}

export function getImageIngestionErrorMessage(error: unknown, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === "development" && error instanceof Error) return error.message;
  return "生成失败，请稍后重试。";
}

function isJpeg(buffer: Buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isWebp(buffer: Buffer) {
  return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}
