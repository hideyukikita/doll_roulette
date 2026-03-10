/**
 * 当選履歴 API クライアント（Step 4）
 */
import { apiFetch } from "./client.js";

export interface HistoryRecord {
  id: string;
  doll_id: string;
  selected_at: string;
  doll_name: string;
  doll_color?: string;
  doll_image_url?: string | null;
}

export async function getHistories(limit?: number): Promise<HistoryRecord[]> {
  const path = limit != null ? `/api/histories?limit=${limit}` : "/api/histories";
  const res = await apiFetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("履歴の取得に失敗しました");
  return res.json() as Promise<HistoryRecord[]>;
}

/** 当選履歴1件を削除（その結果だけ削除し、その子はルーレットに復活） */
export async function deleteHistory(id: string): Promise<void> {
  const res = await apiFetch(`/api/histories/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "履歴の削除に失敗しました");
  }
}
