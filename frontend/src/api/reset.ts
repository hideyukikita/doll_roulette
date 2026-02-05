/**
 * リセット API クライアント（Step 5）
 */
import { apiUrl } from "./client.js";

export interface ResetResponse {
  ok: boolean;
  resetCount: number;
}

export async function resetAllSelected(): Promise<ResetResponse> {
  const res = await fetch(apiUrl("/api/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "リセットに失敗しました");
  }
  return res.json() as Promise<ResetResponse>;
}
