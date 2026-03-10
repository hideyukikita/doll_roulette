/**
 * ストレージの取得（環境に応じてローカル or OCI Object Storage）
 */
import { createLocalStorage } from "./local.js";
import { createOciStorage } from "./oci.js";
import type { IStorage } from "./types.js";

let instance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!instance) {
    const type = process.env.STORAGE_TYPE ?? "local";
    if (type === "oci") {
      instance = createOciStorage();
    } else {
      instance = createLocalStorage();
    }
  }
  return instance;
}

export type { IStorage } from "./types.js";
