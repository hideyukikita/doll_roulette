/**
 * 当選履歴の取得・1 件削除（リファクタ後: 代表画像は doll_images の先頭から取得）
 */
import { pool } from "../db/client.js";
import type { HistoryRecord } from "../types/history.js";

export async function getHistories(limit = 50): Promise<HistoryRecord[]> {
  const result = await pool.query<HistoryRecord>(
    `SELECT h.id, h.doll_id, h.selected_at,
            d.name AS doll_name,
            d.color AS doll_color,
            COALESCE(h.doll_image_url,
              (SELECT di.image_url FROM doll_images di WHERE di.doll_id = h.doll_id ORDER BY di.sort_order, di.created_at LIMIT 1)
            ) AS doll_image_url
     FROM histories h
     JOIN dolls d ON h.doll_id = d.id
     ORDER BY h.selected_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

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
