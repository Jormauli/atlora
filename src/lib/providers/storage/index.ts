import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}
