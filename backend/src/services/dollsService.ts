/**
 * かぞくたちのビジネスロジック（一覧・登録・削除）
 */
import { pool } from "../db/client.js";
import type { Doll, CreateDollBody } from "../types/doll.js";

/** 一覧取得（created_at 昇順）。image_urls は doll_images があればそちら、なければ [image_url] */
export async function getDolls(): Promise<Doll[]> {
  const result = await pool.query<Doll>(
    `SELECT id, name, color, image_url, is_selected, created_at
     FROM dolls
     ORDER BY created_at ASC`
  );
  const dolls = result.rows;
  const withUrls = await Promise.all(
    dolls.map(async (d) => {
      const imgResult = await pool.query<{ image_url: string }>(
        "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
        [d.id]
      ).catch(() => ({ rows: [] }));
      const image_urls = imgResult.rows.length > 0
        ? imgResult.rows.map((r) => r.image_url)
        : (d.image_url ? [d.image_url] : []);
      return { ...d, image_urls };
    })
  );
  return withUrls;
}

/** 1件取得（image_urls 付き） */
export async function getDollById(id: string): Promise<Doll | null> {
  const result = await pool.query<Doll>(
    `SELECT id, name, color, image_url, is_selected, created_at
     FROM dolls WHERE id = $1`,
    [id]
  );
  const d = result.rows[0];
  if (!d) return null;
  const imgResult = await pool.query<{ image_url: string }>(
    "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
    [id]
  ).catch(() => ({ rows: [] }));
  const image_urls = imgResult.rows.length > 0
    ? imgResult.rows.map((r) => r.image_url)
    : (d.image_url ? [d.image_url] : []);
  return { ...d, image_urls };
}

/** 登録（名前・色） */
export async function createDoll(body: CreateDollBody): Promise<Doll> {
  const result = await pool.query<Doll>(
    `INSERT INTO dolls (name, color)
     VALUES ($1, $2)
     RETURNING id, name, color, image_url, is_selected, created_at`,
    [body.name.trim(), body.color.trim()]
  );
  const row = result.rows[0];
  if (!row) throw new Error("登録に失敗しました");
  return row;
}

/** 画像URL更新 */
export async function updateDollImage(id: string, imageUrl: string): Promise<Doll | null> {
  const result = await pool.query<Doll>(
    `UPDATE dolls SET image_url = $1 WHERE id = $2
     RETURNING id, name, color, image_url, is_selected, created_at`,
    [imageUrl, id]
  );
  return result.rows[0] ?? null;
}

/** 更新（名前・色） */
export async function updateDoll(id: string, body: CreateDollBody): Promise<Doll | null> {
  const result = await pool.query<Doll>(
    `UPDATE dolls SET name = $1, color = $2
     WHERE id = $3
     RETURNING id, name, color, image_url, is_selected, created_at`,
    [body.name.trim(), body.color.trim(), id]
  );
  return result.rows[0] ?? null;
}

/** 削除 */
export async function deleteDoll(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM dolls WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

/** 複数画像を追加（doll_images に挿入） */
export async function addDollImages(dollId: string, imageUrls: { url: string; sortOrder: number }[]): Promise<void> {
  if (imageUrls.length === 0) return;
  console.log("[dollsService.addDollImages] dollId=%s count=%s", dollId, imageUrls.length);
  for (let i = 0; i < imageUrls.length; i++) {
    const { url, sortOrder } = imageUrls[i];
    try {
      await pool.query(
        "INSERT INTO doll_images (doll_id, image_url, sort_order) VALUES ($1, $2, $3)",
        [dollId, url, sortOrder]
      );
    } catch (err) {
      console.error("[dollsService.addDollImages] INSERT error:", err);
      console.error("[dollsService.addDollImages] stack:", err instanceof Error ? err.stack : "");
      throw err;
    }
  }
}

/** 1枚削除（doll_images から削除。なければ dolls.image_url を null に＝従来の1枚のみのケース） */
export async function deleteDollImage(dollId: string, imageUrl: string): Promise<boolean> {
  console.log("[dollsService.deleteDollImage] dollId=%s imageUrl=%s", dollId, imageUrl);
  try {
    const result = await pool.query(
      "DELETE FROM doll_images WHERE doll_id = $1 AND image_url = $2",
      [dollId, imageUrl]
    );
    const n = result.rowCount ?? 0;
    console.log("[dollsService.deleteDollImage] doll_images rowCount=%s", n);
    if (n > 0) return true;
    const row = await pool.query<{ image_url: string | null }>(
      "SELECT image_url FROM dolls WHERE id = $1",
      [dollId]
    );
    const currentUrl = row.rows[0]?.image_url ?? null;
    console.log("[dollsService.deleteDollImage] dolls.image_url=%s", currentUrl);
    if (currentUrl === imageUrl) {
      await pool.query("UPDATE dolls SET image_url = NULL WHERE id = $1", [dollId]);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[dollsService.deleteDollImage] error:", err);
    console.error("[dollsService.deleteDollImage] stack:", err instanceof Error ? err.stack : "");
    throw err;
  }
}
