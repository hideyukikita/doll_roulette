/**
 * 設定の集約（DB・ストレージ・アプリ）
 */
export { dbConfig } from "./db.js";
export { storageConfig } from "./storage.js";

export const appConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.BACKEND_PORT) || 3000,
  host: process.env.BACKEND_HOST ?? "0.0.0.0",
} as const;
