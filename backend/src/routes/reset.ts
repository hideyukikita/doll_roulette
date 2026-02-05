/**
 * リセット API（全かぞくの is_selected を false に戻す）
 */
import { Router, Request, Response } from "express";
import * as resetService from "../services/resetService.js";

const router = Router();

/** POST /api/reset - 全かぞくの選択状態をリセット */
router.post("/", async (_req: Request, res: Response) => {
  try {
    const count = await resetService.resetAllSelected();
    res.json({ ok: true, resetCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "リセットに失敗しました" });
  }
});

export default router;
