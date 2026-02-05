/**
 * 当選履歴 API クライアント（Step 4）
 */
import { apiUrl } from "./client.js";

export interface HistoryRecord {
  id: string;
  doll_id: string;
  selected_at: string;
  doll_name: string;
  doll_color?: string;
}

export async function getHistories(limit?: number): Promise<HistoryRecord[]> {
  const url = limit != null ? `${apiUrl("/api/histories")}?limit=${limit}` : apiUrl("/api/histories");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("履歴の取得に失敗しました");
  return res.json() as Promise<HistoryRecord[]>;
}
