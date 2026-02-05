/**
 * かぞくたち API ルート（一覧・登録・削除）
 */
import { Router, Request, Response } from "express";
import * as dollsService from "../services/dollsService.js";
import type { CreateDollBody } from "../types/doll.js";

const router = Router();

/** GET /api/dolls - 一覧 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const dolls = await dollsService.getDolls();
    res.json(dolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "一覧の取得に失敗しました" });
  }
});

/** POST /api/dolls - 登録（body: { name, color }） */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body as Partial<CreateDollBody>;
  const name = body?.name?.trim();
  const color = body?.color?.trim();
  if (!name || !color) {
    res.status(400).json({ error: "name と color は必須です" });
    return;
  }
  try {
    const doll = await dollsService.createDoll({ name, color });
    res.status(201).json(doll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "登録に失敗しました" });
  }
});

/** DELETE /api/dolls/:id - 削除 */
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await dollsService.deleteDoll(id);
    if (!deleted) {
      res.status(404).json({ error: "指定のかぞくが見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

export default router;
