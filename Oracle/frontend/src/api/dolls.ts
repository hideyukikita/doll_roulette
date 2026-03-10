/**
 * かぞくたち API クライアント（Step 2 バックエンドと対応）
 */
import { apiUrl, apiFetch } from "./client.js";
import type { Doll, CreateDollBody } from "../types/doll.js";

export async function getDolls(): Promise<Doll[]> {
  const res = await apiFetch("/api/dolls");
  if (!res.ok) throw new Error("一覧の取得に失敗しました");
  return res.json() as Promise<Doll[]>;
}

/** 複数画像をアップロード（最大50枚） */
export async function uploadDollImages(id: string, files: File[]): Promise<Doll> {
  if (files.length === 0) {
    const list = await getDolls();
    const d = list.find((x) => x.id === id);
    if (d) return d;
    throw new Error("かぞくの取得に失敗しました");
  }
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const res = await apiFetch(`/api/dolls/${id}/images`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "画像のアップロードに失敗しました");
  }
  return res.json() as Promise<Doll>;
}

/** かぞくの画像1枚削除（POST + JSON body で確実に届ける） */
export async function deleteDollImage(dollId: string, imageUrl: string): Promise<Doll> {
  const res = await apiFetch(`/api/dolls/${dollId}/images/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "画像の削除に失敗しました");
  }
  return res.json() as Promise<Doll>;
}

export async function createDoll(body: CreateDollBody): Promise<Doll> {
  const res = await apiFetch("/api/dolls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "登録に失敗しました");
  }
  return res.json() as Promise<Doll>;
}

export async function updateDoll(id: string, body: CreateDollBody): Promise<Doll> {
  const res = await apiFetch(`/api/dolls/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = data?.error ?? `更新に失敗しました（${res.status}）`;
    throw new Error(msg);
  }
  return res.json() as Promise<Doll>;
}

export async function uploadDollImage(id: string, file: File): Promise<Doll> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await apiFetch(`/api/dolls/${id}/image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = data?.error ?? `画像のアップロードに失敗しました（${res.status}）`;
    throw new Error(msg);
  }
  return res.json() as Promise<Doll>;
}

export async function deleteDoll(id: string): Promise<void> {
  const res = await apiFetch(`/api/dolls/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "削除に失敗しました");
  }
}
