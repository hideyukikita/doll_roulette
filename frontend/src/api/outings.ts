/**
 * お出かけ日記 API
 */
import { apiUrl } from "./client.js";

export interface OutingRecord {
  id: string;
  place: string;
  outing_date: string;
  comment: string | null;
  image_url: string | null;
  created_at: string;
  doll_ids: string[];
  image_urls: string[];
  dolls?: { id: string; name: string; color: string; image_url: string | null }[];
}

export async function getOutings(): Promise<OutingRecord[]> {
  const res = await fetch(apiUrl("/api/outings"), { cache: "no-store" });
  if (!res.ok) throw new Error("お出かけ日記の一覧取得に失敗しました");
  return res.json() as Promise<OutingRecord[]>;
}

export async function getOutingById(id: string): Promise<OutingRecord | null> {
  const res = await fetch(apiUrl(`/api/outings/${id}`), { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("お出かけ日記の取得に失敗しました");
  return res.json() as Promise<OutingRecord>;
}

export interface CreateOutingBody {
  place: string;
  outing_date: string;
  comment?: string;
  doll_ids: string[];
}

export async function createOuting(body: CreateOutingBody): Promise<OutingRecord> {
  const res = await fetch(apiUrl("/api/outings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const message = data?.error ?? (res.status === 404 ? "お出かけ日記のAPIが見つかりません。バックエンドを再ビルドしてください。" : `登録に失敗しました（${res.status}）`);
    throw new Error(message);
  }
  return res.json() as Promise<OutingRecord>;
}

export async function uploadOutingImage(id: string, file: File): Promise<OutingRecord> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(apiUrl(`/api/outings/${id}/image`), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "画像のアップロードに失敗しました");
  }
  return res.json() as Promise<OutingRecord>;
}

/** 複数画像をアップロード（最大50枚） */
export async function uploadOutingImages(id: string, files: File[]): Promise<OutingRecord> {
  if (files.length === 0) {
    const o = await getOutingById(id);
    if (o) return o as OutingRecord;
    throw new Error("お出かけ日記の取得に失敗しました");
  }
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const res = await fetch(apiUrl(`/api/outings/${id}/images`), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "画像のアップロードに失敗しました");
  }
  return res.json() as Promise<OutingRecord>;
}

export interface UpdateOutingBody {
  place: string;
  outing_date: string;
  comment?: string;
  doll_ids: string[];
}

export async function updateOuting(id: string, body: UpdateOutingBody): Promise<OutingRecord> {
  const res = await fetch(apiUrl(`/api/outings/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "更新に失敗しました");
  }
  return res.json() as Promise<OutingRecord>;
}

export async function deleteOuting(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/outings/${id}`), { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "削除に失敗しました");
  }
}

/** お出かけ日記の画像1枚削除（POST + JSON body で確実に届ける） */
export async function deleteOutingImage(outingId: string, imageUrl: string): Promise<OutingRecord> {
  const res = await fetch(apiUrl(`/api/outings/${outingId}/images/remove`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "画像の削除に失敗しました");
  }
  return res.json() as Promise<OutingRecord>;
}
