/**
 * DB 接続設定（design.md セクション8: 環境変数で一括管理）
 */
export const dbConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.POSTGRES_USER ?? "doll_roulette",
  password: process.env.POSTGRES_PASSWORD ?? "",
  database: process.env.POSTGRES_DB ?? "doll_roulette",
} as const;
