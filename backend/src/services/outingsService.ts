/**
 * お出かけ日記の取得・登録
 */
import { pool } from "../db/client.js";
import type { Outing, OutingWithDolls } from "../types/outing.js";

export interface CreateOutingBody {
  place: string;
  outing_date: string;
  comment?: string | null;
  doll_ids: string[];
}

/** 一覧取得（日付降順・概要用） */
export async function getOutings(limit = 50): Promise<OutingWithDolls[]> {
  const result = await pool.query<
    Outing & { doll_ids: string[] }
  >(
    `SELECT o.id, o.place, o.outing_date, o.comment, o.image_url, o.created_at,
            COALESCE(array_agg(DISTINCT od.doll_id) FILTER (WHERE od.doll_id IS NOT NULL), '{}') AS doll_ids
     FROM outings o
     LEFT JOIN outing_dolls od ON o.id = od.outing_id
     GROUP BY o.id
     ORDER BY o.outing_date DESC
     LIMIT $1`,
    [limit]
  );
  const rows = result.rows as (Outing & { doll_ids: string[] })[];
  const withImages: OutingWithDolls[] = [];
  for (const row of rows) {
    const images = await pool.query<{ image_url: string }>(
      "SELECT image_url FROM outing_images WHERE outing_id = $1 ORDER BY sort_order, created_at",
      [row.id]
    ).catch(() => ({ rows: [] }));
    const image_urls = images.rows.map((r) => r.image_url);
    if (image_urls.length === 0 && row.image_url) image_urls.push(row.image_url);
    withImages.push({ ...row, image_urls });
  }
  return withImages;
}

/** 1件取得（詳細用・dolls 情報付き） */
export async function getOutingById(id: string): Promise<OutingWithDolls | null> {
  const row = await pool.query<Outing>(
    "SELECT id, place, outing_date, comment, image_url, created_at FROM outings WHERE id = $1",
    [id]
  );
  if (row.rows.length === 0) return null;
  const outing = row.rows[0];
  const [dollsResult, imagesResult] = await Promise.all([
    pool.query<{ id: string; name: string; color: string; image_url: string | null }>(
      `SELECT d.id, d.name, d.color, d.image_url
       FROM outing_dolls od
       JOIN dolls d ON d.id = od.doll_id
       WHERE od.outing_id = $1
       ORDER BY d.name`,
      [id]
    ),
    pool.query<{ image_url: string }>(
      "SELECT image_url FROM outing_images WHERE outing_id = $1 ORDER BY sort_order, created_at",
      [id]
    ).catch(() => ({ rows: [] })),
  ]);
  let image_urls = imagesResult.rows.map((r) => r.image_url);
  if (image_urls.length === 0 && outing.image_url) image_urls = [outing.image_url];
  return {
    ...outing,
    doll_ids: dollsResult.rows.map((d) => d.id),
    image_urls,
    dolls: dollsResult.rows,
  } as OutingWithDolls;
}

/** 登録 */
export async function createOuting(body: CreateOutingBody, imageUrl?: string | null): Promise<Outing> {
  const client = await pool.connect();
  try {
    const result = await client.query<Outing>(
      `INSERT INTO outings (place, outing_date, comment, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, place, outing_date, comment, image_url, created_at`,
      [body.place.trim(), body.outing_date, body.comment?.trim() || null, imageUrl ?? null]
    );
    const outing = result.rows[0];
    if (!outing) throw new Error("登録に失敗しました");
    for (const dollId of body.doll_ids || []) {
      await client.query(
        "INSERT INTO outing_dolls (outing_id, doll_id) VALUES ($1, $2)",
        [outing.id, dollId]
      );
    }
    return outing;
  } finally {
    client.release();
  }
}

/** 画像URL更新（1枚用・後方互換） */
export async function updateOutingImage(id: string, imageUrl: string): Promise<Outing | null> {
  const result = await pool.query<Outing>(
    `UPDATE outings SET image_url = $1 WHERE id = $2
     RETURNING id, place, outing_date, comment, image_url, created_at`,
    [imageUrl, id]
  );
  return result.rows[0] ?? null;
}

/** 複数画像を追加（outing_images に挿入） */
export async function addOutingImages(outingId: string, imageUrls: { url: string; sortOrder: number }[]): Promise<void> {
  if (imageUrls.length === 0) return;
  console.log("[outingsService.addOutingImages] outingId=%s count=%s", outingId, imageUrls.length);
  const client = await pool.connect();
  try {
    for (let i = 0; i < imageUrls.length; i++) {
      const { url, sortOrder } = imageUrls[i];
      await client.query(
        "INSERT INTO outing_images (outing_id, image_url, sort_order) VALUES ($1, $2, $3)",
        [outingId, url, sortOrder]
      );
    }
  } catch (err) {
    console.error("[outingsService.addOutingImages] error:", err);
    console.error("[outingsService.addOutingImages] stack:", err instanceof Error ? err.stack : "");
    throw err;
  } finally {
    client.release();
  }
}

/** 1枚削除（outing_images から削除。なければ outings.image_url を null に＝1枚だけのレガシー対応） */
export async function deleteOutingImage(outingId: string, imageUrl: string): Promise<boolean> {
  console.log("[outingsService.deleteOutingImage] outingId=%s imageUrl=%s", outingId, imageUrl);
  try {
    const result = await pool.query(
      "DELETE FROM outing_images WHERE outing_id = $1 AND image_url = $2",
      [outingId, imageUrl]
    );
    const n = result.rowCount ?? 0;
    console.log("[outingsService.deleteOutingImage] outing_images rowCount=%s", n);
    if (n > 0) return true;
    const row = await pool.query<{ image_url: string | null }>(
      "SELECT image_url FROM outings WHERE id = $1",
      [outingId]
    );
    const currentUrl = row.rows[0]?.image_url ?? null;
    console.log("[outingsService.deleteOutingImage] outings.image_url=%s", currentUrl);
    if (currentUrl === imageUrl) {
      await pool.query("UPDATE outings SET image_url = NULL WHERE id = $1", [outingId]);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[outingsService.deleteOutingImage] error:", err);
    console.error("[outingsService.deleteOutingImage] stack:", err instanceof Error ? err.stack : "");
    throw err;
  }
}

export interface UpdateOutingBody {
  place: string;
  outing_date: string;
  comment?: string | null;
  doll_ids: string[];
}

/** 更新（場所・日付・コメント・一緒に行った家族。画像は変更しない） */
export async function updateOuting(id: string, body: UpdateOutingBody): Promise<Outing | null> {
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT id FROM outings WHERE id = $1", [id]);
    if (existing.rows.length === 0) return null;
    await client.query(
      "UPDATE outings SET place = $1, outing_date = $2, comment = $3 WHERE id = $4",
      [body.place.trim(), body.outing_date, body.comment?.trim() || null, id]
    );
    await client.query("DELETE FROM outing_dolls WHERE outing_id = $1", [id]);
    for (const dollId of body.doll_ids || []) {
      await client.query(
        "INSERT INTO outing_dolls (outing_id, doll_id) VALUES ($1, $2)",
        [id, dollId]
      );
    }
    const result = await client.query<Outing>(
      "SELECT id, place, outing_date, comment, image_url, created_at FROM outings WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/** 削除（関連する outing_dolls, outing_images は CASCADE で削除） */
export async function deleteOuting(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM outings WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
