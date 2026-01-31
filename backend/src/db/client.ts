/**
 * PostgreSQL 接続クライアント（Pool）
 */
import pg from "pg";
import { dbConfig } from "../config/db.js";

const { Pool } = pg;

export const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
});
