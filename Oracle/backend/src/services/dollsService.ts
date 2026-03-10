/**
 * かぞくのビジネスロジック（一覧・登録・更新・削除・画像）
 * リファクタ後: 画像は doll_images のみ。代表 = sort_order 最小の 1 件。
 */
import { pool } from "../db/client.js";
import type { Doll, CreateDollBody } from "../types/doll.js";

/** 一覧取得（created_at 昇順）。image_urls は doll_images を sort_order 順 */
export async function getDolls(): Promise<Doll[]> {
  const result = await pool.query<Omit<Doll, "image_url" | "image_urls">>(
    `SELECT id, name, color, is_selected, created_at FROM dolls ORDER BY created_at ASC`
  );
  const dolls = result.rows;
  const withUrls = await Promise.all(
    dolls.map(async (d) => {
      const imgResult = await pool.query<{ image_url: string }>(
        "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
        [d.id]
      );
      const image_urls = imgResult.rows.map((r) => r.image_url);
      const image_url = image_urls[0] ?? null;
      return { ...d, image_url, image_urls };
    })
  );
  return withUrls;
}

/** 1 件取得（image_urls 付き） */
export async function getDollById(id: string): Promise<Doll | null> {
  const result = await pool.query<Omit<Doll, "image_url" | "image_urls">>(
    "SELECT id, name, color, is_selected, created_at FROM dolls WHERE id = $1",
    [id]
  );
  const d = result.rows[0];
  if (!d) return null;
  const imgResult = await pool.query<{ image_url: string }>(
    "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
    [id]
  );
  const image_urls = imgResult.rows.map((r) => r.image_url);
  const image_url = image_urls[0] ?? null;
  return { ...d, image_url, image_urls };
}

/** 登録（名前・色） */
export async function createDoll(body: CreateDollBody): Promise<Doll> {
  const result = await pool.query<Omit<Doll, "image_url" | "image_urls">>(
    `INSERT INTO dolls (name, color) VALUES ($1, $2)
     RETURNING id, name, color, is_selected, created_at`,
    [body.name.trim(), body.color.trim()]
  );
  const row = result.rows[0];
  if (!row) throw new Error("登録に失敗しました");
  return { ...row, image_url: null, image_urls: [] };
}

/** 代表画像の設定（sort_order=0 の行を更新、なければ挿入） */
export async function setDollRepresentativeImage(id: string, imageUrl: string): Promise<Doll | null> {
  const row = await pool.query(
    "UPDATE doll_images SET image_url = $1 WHERE doll_id = $2 AND sort_order = 0 RETURNING id",
    [imageUrl, id]
  );
  if ((row.rowCount ?? 0) > 0) {
    return getDollById(id);
  }
  await pool.query(
    "INSERT INTO doll_images (doll_id, image_url, sort_order) VALUES ($1, $2, 0)",
    [id, imageUrl]
  );
  return getDollById(id);
}

/** 更新（名前・色） */
export async function updateDoll(id: string, body: CreateDollBody): Promise<Doll | null> {
  const result = await pool.query<Omit<Doll, "image_url" | "image_urls">>(
    `UPDATE dolls SET name = $1, color = $2 WHERE id = $3
     RETURNING id, name, color, is_selected, created_at`,
    [body.name.trim(), body.color.trim(), id]
  );
  const row = result.rows[0];
  if (!row) return null;
  const imgResult = await pool.query<{ image_url: string }>(
    "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
    [id]
  );
  const image_urls = imgResult.rows.map((r) => r.image_url);
  return { ...row, image_url: image_urls[0] ?? null, image_urls };
}

/** 削除 */
export async function deleteDoll(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM dolls WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

/** 複数画像を追加（doll_images に挿入） */
export async function addDollImages(
  dollId: string,
  imageUrls: { url: string; sortOrder: number }[]
): Promise<void> {
  if (imageUrls.length === 0) return;
  for (const { url, sortOrder } of imageUrls) {
    await pool.query(
      "INSERT INTO doll_images (doll_id, image_url, sort_order) VALUES ($1, $2, $3)",
      [dollId, url, sortOrder]
    );
  }
}

/** 画像 1 枚削除（doll_images から。パスで一致） */
export async function deleteDollImage(dollId: string, imageUrl: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM doll_images WHERE doll_id = $1 AND image_url = $2",
    [dollId, imageUrl]
  );
  return (result.rowCount ?? 0) > 0;
}
