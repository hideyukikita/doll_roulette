/**
 * 設定の集約（DB・ストレージ・アプリ）
 */
export { dbConfig } from "./db.js";
export { storageConfig } from "./storage.js";

export const appConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.BACKEND_PORT) || 3000,
  host: process.env.BACKEND_HOST ?? "0.0.0.0",
  /** 本番で CORS を許可するオリジン（未設定時は development と同様にリフレクタ） */
  allowedOrigin: process.env.ALLOWED_ORIGIN?.trim() || undefined,
} as const;
