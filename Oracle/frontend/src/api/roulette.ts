/**
 * ルーレット API クライアント（Step 4）
 */
import { apiFetch } from "./client.js";
import type { Doll } from "../types/doll.js";

export interface SpinResult {
  doll: Doll;
  /** 一度選ばれた子が再当選した場合 true */
  luckySecond?: boolean;
}

export interface SpinAllDoneResult {
  allDone: true;
}

export type SpinResponse = SpinResult | SpinAllDoneResult;

export async function spinRoulette(): Promise<SpinResponse> {
  const res = await apiFetch("/api/roulette/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "ルーレットに失敗しました");
  }
  return res.json() as Promise<SpinResponse>;
}
