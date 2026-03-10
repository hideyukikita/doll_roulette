/**
 * ストレージ・アップロード用の設定
 */
import path from "path";

export const storageConfig = {
  /** アップロード先ルート（ローカル時） */
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
  /** 許可する画像 MIME タイプ */
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"] as const,
  /** 許可する拡張子 */
  allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"] as const,
} as const;
