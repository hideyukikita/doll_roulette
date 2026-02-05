/**
 * 当選履歴の取得（日付降順）
 */
import { pool } from "../db/client.js";
import type { HistoryRecord } from "../types/history.js";

export async function getHistories(limit = 50): Promise<HistoryRecord[]> {
  const result = await pool.query<HistoryRecord>(
    `SELECT h.id, h.doll_id, h.selected_at, d.name AS doll_name, d.color AS doll_color, d.image_url AS doll_image_url
     FROM histories h
     JOIN dolls d ON h.doll_id = d.id
     ORDER BY h.selected_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
