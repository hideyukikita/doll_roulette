/**
 * ストレージの取得（環境に応じてローカル or 将来 OCI 等）
 */
import { createLocalStorage } from "./local.js";
import type { IStorage } from "./types.js";

let instance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!instance) {
    const type = process.env.STORAGE_TYPE ?? "local";
    if (type === "local") {
      instance = createLocalStorage();
    } else {
      instance = createLocalStorage();
    }
  }
  return instance;
}

export type { IStorage } from "./types.js";
