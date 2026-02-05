/**
 * 当選履歴 API（一覧・日時付き）
 */
import { Router, Request, Response } from "express";
import * as historiesService from "../services/historiesService.js";

const router = Router();

/** GET /api/histories - 当選履歴一覧（日付降順） */
router.get("/", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    const list = await historiesService.getHistories(limit);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "履歴の取得に失敗しました" });
  }
});

export default router;
