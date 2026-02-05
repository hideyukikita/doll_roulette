/**
 * ルーレット API クライアント（Step 4）
 */
import { apiUrl } from "./client.js";
import type { Doll } from "../types/doll.js";

export interface SpinResult {
  doll: Doll;
}

export interface SpinAllDoneResult {
  allDone: true;
}

export type SpinResponse = SpinResult | SpinAllDoneResult;

export async function spinRoulette(): Promise<SpinResponse> {
  const res = await fetch(apiUrl("/api/roulette/spin"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "ルーレットに失敗しました");
  }
  return res.json() as Promise<SpinResponse>;
}
