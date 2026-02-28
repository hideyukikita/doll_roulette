/**
 * 当選履歴の取得（日付降順）・1件削除（当選を取り消し、その子をルーレットに復活）
 */
import { pool } from "../db/client.js";
import type { HistoryRecord } from "../types/history.js";

export async function getHistories(limit = 50): Promise<HistoryRecord[]> {
  const result = await pool.query<HistoryRecord>(
    `SELECT h.id, h.doll_id, h.selected_at,
            d.name AS doll_name,
            d.color AS doll_color,
            COALESCE(h.doll_image_url, d.image_url) AS doll_image_url
     FROM histories h
     JOIN dolls d ON h.doll_id = d.id
     ORDER BY h.selected_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/** 当選履歴1件を削除し、その子の is_selected を false に戻す（ルーレットに復活） */
export async function deleteHistoryById(id: string): Promise<{ dollId: string } | null> {
  const client = await pool.connect();
  try {
    const row = await client.query<{ doll_id: string }>(
      "SELECT doll_id FROM histories WHERE id = $1",
      [id]
    );
    if (row.rows.length === 0) return null;
    const dollId = row.rows[0].doll_id;
    await client.query("BEGIN");
    await client.query("DELETE FROM histories WHERE id = $1", [id]);
    await client.query("UPDATE dolls SET is_selected = false WHERE id = $1", [dollId]);
    await client.query("COMMIT");
    return { dollId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
