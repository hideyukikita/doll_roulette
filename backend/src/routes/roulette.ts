/**
 * ルーレット API（回す・当選結果）
 */
import { Router, Request, Response } from "express";
import * as rouletteService from "../services/rouletteService.js";

const router = Router();

/** POST /api/roulette/spin - ルーレットを回す */
router.post("/spin", async (_req: Request, res: Response) => {
  try {
    const result = await rouletteService.spinRoulette();
    res.json(result);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "ルーレットに失敗しました";
    res.status(500).json({ error: message });
  }
});

export default router;
