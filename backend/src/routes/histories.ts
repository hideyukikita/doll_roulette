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
    res.status(500).json({ error: "履歴の取得に失敗しました" });
  }
});

/** DELETE /api/histories/:id - 当選履歴1件削除（その結果だけ削除し、その子はルーレットに復活） */
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await historiesService.deleteHistoryById(id);
    if (!result) {
      res.status(404).json({ error: "指定の履歴が見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "履歴の削除に失敗しました" });
  }
});

export default router;
