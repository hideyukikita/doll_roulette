/**
 * ルーレット当選ロジック（design: 未選択は高確率、一度選ばれた子はめちゃめちゃ低確率）
 */
import { pool } from "../db/client.js";
import type { Doll } from "../types/doll.js";

/** 一度選ばれた子の重み（100〜200回に1回程度） */
const SELECTED_WEIGHT = 0.008;
/** 未選択の子の重み */
const UNSELECTED_WEIGHT = 1;

export interface SpinResult {
  doll: Doll;
  /** 一度選ばれた子が再当選した場合 true */
  luckySecond?: boolean;
}

export interface SpinAllDoneResult {
  allDone: true;
}

export type SpinResponse = SpinResult | SpinAllDoneResult;

/**
 * ルーレットを回す。重み付きランダムで1体選び、is_selected=true にして履歴に追加。
 * 全員選ばれていれば { allDone: true } を返す。
 */
export async function spinRoulette(): Promise<SpinResponse> {
  const client = await pool.connect();
  try {
    const listResult = await client.query<Doll>(
      `SELECT id, name, color, image_url, is_selected, created_at FROM dolls ORDER BY created_at ASC`
    );
    const dolls = listResult.rows;
    if (dolls.length === 0) {
      throw new Error("かぞくが1人も登録されていません");
    }

    const allSelected = dolls.every((d) => d.is_selected);
    if (allSelected) {
      return { allDone: true };
    }

    // 重み付き抽選: 未選択=1, 選択済み=0.01
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

    await client.query("BEGIN");
    try {
      await client.query(
        `UPDATE dolls SET is_selected = true WHERE id = $1`,
        [selected.id]
      );
      await client.query(
        `INSERT INTO histories (doll_id) VALUES ($1)`,
        [selected.id]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }

    const updated = await client.query<Doll>(
      `SELECT id, name, color, image_url, is_selected, created_at FROM dolls WHERE id = $1`,
      [selected.id]
    );
    const doll = updated.rows[0];
    if (!doll) throw new Error("更新の取得に失敗しました");
    return { doll, luckySecond: wasAlreadySelected };
  } finally {
    client.release();
  }
}
