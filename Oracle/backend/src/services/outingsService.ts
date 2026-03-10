/**
 * お出かけ日記のビジネスロジック（リファクタ後: 画像は outing_images のみ）
 */
import { pool } from "../db/client.js";
import type { Outing, OutingWithDolls } from "../types/outing.js";

export interface CreateOutingBody {
  place: string;
  outing_date: string;
  comment?: string | null;
  doll_ids: string[];
}

/** 一覧取得（日付降順）。image_urls は outing_images のみ */
export async function getOutings(limit = 50): Promise<OutingWithDolls[]> {
  const result = await pool.query<
    Omit<Outing, "image_url"> & { doll_ids: string[] }
  >(
    `SELECT o.id, o.place, o.outing_date, o.comment, o.created_at,
            COALESCE(array_agg(DISTINCT od.doll_id) FILTER (WHERE od.doll_id IS NOT NULL), '{}') AS doll_ids
     FROM outings o
     LEFT JOIN outing_dolls od ON o.id = od.outing_id
     GROUP BY o.id
     ORDER BY o.outing_date DESC
     LIMIT $1`,
    [limit]
  );
  const rows = result.rows;
  const withImages: OutingWithDolls[] = [];
  for (const row of rows) {
    const images = await pool.query<{ image_url: string }>(
      "SELECT image_url FROM outing_images WHERE outing_id = $1 ORDER BY sort_order, created_at",
      [row.id]
    );
    const image_urls = images.rows.map((r) => r.image_url);
    withImages.push({ ...row, image_url: null, image_urls });
  }
  return withImages;
}

/** 1 件取得（詳細・dolls 付き） */
export async function getOutingById(id: string): Promise<OutingWithDolls | null> {
  const row = await pool.query<Omit<Outing, "image_url">>(
    "SELECT id, place, outing_date, comment, created_at FROM outings WHERE id = $1",
    [id]
  );
  if (row.rows.length === 0) return null;
  const outing = row.rows[0];
  const [dollsResult, imagesResult] = await Promise.all([
    pool.query<{ id: string; name: string; color: string; image_url: string | null }>(
      `SELECT d.id, d.name, d.color,
              (SELECT di.image_url FROM doll_images di WHERE di.doll_id = d.id ORDER BY di.sort_order, di.created_at LIMIT 1) AS image_url
       FROM outing_dolls od
       JOIN dolls d ON d.id = od.doll_id
       WHERE od.outing_id = $1 ORDER BY d.name`,
      [id]
    ),
    pool.query<{ image_url: string }>(
      "SELECT image_url FROM outing_images WHERE outing_id = $1 ORDER BY sort_order, created_at",
      [id]
    ),
  ]);
  const image_urls = imagesResult.rows.map((r) => r.image_url);
  return {
    ...outing,
    image_url: null,
    doll_ids: dollsResult.rows.map((d) => d.id),
    image_urls,
    dolls: dollsResult.rows,
  } as OutingWithDolls;
}

/** 登録（画像は別途 addOutingImages で追加） */
export async function createOuting(body: CreateOutingBody): Promise<Outing> {
  const client = await pool.connect();
  try {
    const result = await client.query<Outing>(
      `INSERT INTO outings (place, outing_date, comment)
       VALUES ($1, $2, $3)
       RETURNING id, place, outing_date, comment, created_at`,
      [body.place.trim(), body.outing_date, body.comment?.trim() || null]
    );
    const outing = result.rows[0];
    if (!outing) throw new Error("登録に失敗しました");
    for (const dollId of body.doll_ids || []) {
      await client.query(
        "INSERT INTO outing_dolls (outing_id, doll_id) VALUES ($1, $2)",
        [outing.id, dollId]
      );
    }
    return outing as Outing & { image_url?: string | null };
  } finally {
    client.release();
  }
}

/** 複数画像を追加 */
export async function addOutingImages(
  outingId: string,
  imageUrls: { url: string; sortOrder: number }[]
): Promise<void> {
  if (imageUrls.length === 0) return;
  for (const { url, sortOrder } of imageUrls) {
    await pool.query(
      "INSERT INTO outing_images (outing_id, image_url, sort_order) VALUES ($1, $2, $3)",
      [outingId, url, sortOrder]
    );
  }
}

/** 画像 1 枚削除 */
export async function deleteOutingImage(outingId: string, imageUrl: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM outing_images WHERE outing_id = $1 AND image_url = $2",
    [outingId, imageUrl]
  );
  return (result.rowCount ?? 0) > 0;
}

export interface UpdateOutingBody {
  place: string;
  outing_date: string;
  comment?: string | null;
  doll_ids: string[];
}

/** 更新（場所・日付・コメント・一緒に行った家族） */
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
    const result = await client.query<Omit<Outing, "image_url">>(
      "SELECT id, place, outing_date, comment, created_at FROM outings WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    return row ? { ...row, image_url: null } : null;
  } finally {
    client.release();
  }
}

/** 削除 */
export async function deleteOuting(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM outings WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
