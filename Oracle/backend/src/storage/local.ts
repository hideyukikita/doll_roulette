/**
 * ローカルディスクへの画像保存（uploads ディレクトリ）
 */
import fs from "fs";
import path from "path";
import type { IStorage } from "./types.js";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
const UPLOADS_PATH_PREFIX = "/uploads";

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function createLocalStorage(): IStorage {
  ensureDir(UPLOADS_DIR);

  return {
    async save(buffer: Buffer, relativePath: string): Promise<string> {
      const fullPath = path.join(UPLOADS_DIR, relativePath);
      const dir = path.dirname(fullPath);
      ensureDir(dir);
      fs.writeFileSync(fullPath, buffer);
      return `${UPLOADS_PATH_PREFIX}/${relativePath}`;
    },

    async delete(savedPathOrRelative: string): Promise<void> {
      const relative = savedPathOrRelative.startsWith(UPLOADS_PATH_PREFIX + "/")
        ? savedPathOrRelative.slice(UPLOADS_PATH_PREFIX.length + 1)
        : savedPathOrRelative;
      const fullPath = path.join(UPLOADS_DIR, relative);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    },

    getPublicPath(savedPath: string): string {
      return savedPath.startsWith("/") ? savedPath : `${UPLOADS_PATH_PREFIX}/${savedPath}`;
    },

    async getBuffer(relativePath: string): Promise<Buffer | null> {
      const normalized = relativePath.startsWith(UPLOADS_PATH_PREFIX + "/")
        ? relativePath.slice((UPLOADS_PATH_PREFIX + "/").length)
        : relativePath;
      const fullPath = path.join(UPLOADS_DIR, normalized);
      if (!fs.existsSync(fullPath)) return null;
      return fs.promises.readFile(fullPath);
    },
  };
}
