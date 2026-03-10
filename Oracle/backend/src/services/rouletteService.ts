/**
 * ルーレット当選ロジック（リファクタ後: 画像は doll_images のみ参照）
 */
import type { PoolClient } from "pg";
import { pool } from "../db/client.js";
import type { Doll } from "../types/doll.js";

const SELECTED_WEIGHT = 0.008;
const UNSELECTED_WEIGHT = 1;

export interface SpinResult {
  doll: Doll;
  luckySecond?: boolean;
}

export interface SpinAllDoneResult {
  allDone: true;
}

export type SpinResponse = SpinResult | SpinAllDoneResult;

export async function spinRoulette(): Promise<SpinResponse> {
  const client = await pool.connect();
  try {
    const listResult = await client.query<Omit<Doll, "image_url" | "image_urls">>(
      "SELECT id, name, color, is_selected, created_at FROM dolls ORDER BY created_at ASC"
    );
    const dolls = listResult.rows;
    if (dolls.length === 0) {
      throw new Error("かぞくが1人も登録されていません");
    }

    const allSelected = dolls.every((d) => d.is_selected);
    if (allSelected) {
      return { allDone: true };
    }

    const weights = dolls.map((d) => (d.is_selected ? SELECTED_WEIGHT : UNSELECTED_WEIGHT));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let index = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        index = i;
        break;
      }
    }
    const selected = dolls[index];
    if (!selected) throw new Error("抽選に失敗しました");
    const wasAlreadySelected = selected.is_selected;

    const imageCandidates = await client.query<{ image_url: string }>(
      "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
      [selected.id]
    );
    const candidateUrls = imageCandidates.rows.map((r) => r.image_url).filter(Boolean);
    const chosenImageUrl =
      candidateUrls.length > 0
        ? candidateUrls[Math.floor(Math.random() * candidateUrls.length)]
        : null;

    await client.query("BEGIN");
    try {
      await client.query("UPDATE dolls SET is_selected = true WHERE id = $1", [selected.id]);
      await client.query(
        "INSERT INTO histories (doll_id, doll_image_url) VALUES ($1, $2)",
        [selected.id, chosenImageUrl]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }

    const dollWithUrls = await getDollByIdForRoulette(client, selected.id);
    return {
      doll: { ...dollWithUrls, image_url: chosenImageUrl },
      luckySecond: wasAlreadySelected,
    };
  } finally {
    client.release();
  }
}

async function getDollByIdForRoulette(
  client: PoolClient,
  id: string
): Promise<Doll> {
  const imgResult = await client.query<{ image_url: string }>(
    "SELECT image_url FROM doll_images WHERE doll_id = $1 ORDER BY sort_order, created_at",
    [id]
  );
  const image_urls = imgResult.rows.map((r) => r.image_url);
  const row = await client.query<Omit<Doll, "image_url" | "image_urls">>(
    "SELECT id, name, color, is_selected, created_at FROM dolls WHERE id = $1",
    [id]
  );
  const d = row.rows[0];
  if (!d) throw new Error("更新の取得に失敗しました");
  return { ...d, image_url: image_urls[0] ?? null, image_urls };
}
