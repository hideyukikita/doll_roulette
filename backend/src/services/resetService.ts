/**
 * リセット機能（全かぞくの is_selected を false に戻す）
 */
import { pool } from "../db/client.js";

export async function resetAllSelected(): Promise<number> {
  const result = await pool.query(
    `UPDATE dolls SET is_selected = false WHERE is_selected = true`
  );
  return result.rowCount ?? 0;
}
