/**
 * かぞくたちのビジネスロジック（一覧・登録・削除）
 */
import { pool } from "../db/client.js";
import type { Doll, CreateDollBody } from "../types/doll.js";

/** 一覧取得（created_at 昇順） */
export async function getDolls(): Promise<Doll[]> {
  const result = await pool.query<Doll>(
    `SELECT id, name, color, image_url, is_selected, created_at
     FROM dolls
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/** 1件取得 */
export async function getDollById(id: string): Promise<Doll | null> {
  const result = await pool.query<Doll>(
    `SELECT id, name, color, image_url, is_selected, created_at
     FROM dolls WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
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

/** 削除 */
export async function deleteDoll(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM dolls WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
