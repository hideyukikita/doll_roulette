/**
 * リセット機能（全かぞくの is_selected を false に戻す + 当選履歴をクリア）
 */
import { pool } from "../db/client.js";

export async function resetAllSelected(): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM histories");
    const result = await client.query(`UPDATE dolls SET is_selected = false`);
    await client.query("COMMIT");
    return result.rowCount ?? 0;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
