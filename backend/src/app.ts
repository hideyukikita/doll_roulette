/**
 * Express アプリ設定（CORS・ルート）
 */
import express from "express";
import cors from "cors";
import dollsRouter from "./routes/dolls.js";
import rouletteRouter from "./routes/roulette.js";
import historiesRouter from "./routes/histories.js";

const app = express();

// フロントエンド（Vite: 5173）およびスマホからのアクセスを許可（design.md セクション8）
app.use(
  cors({
    origin: true,
  })
);
app.use(express.json());

// ルートパス
app.get("/", (_req, res) => {
  res.json({
    message: "かぞくたちルーレット API",
    health: "/api/health",
    dolls: "/api/dolls",
    roulette: "/api/roulette/spin",
    histories: "/api/histories",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "かぞくたちルーレット API" });
});

// かぞくたち API（Step 2）
app.use("/api/dolls", dollsRouter);
// ルーレット API（Step 4）
app.use("/api/roulette", rouletteRouter);
// 当選履歴 API（Step 4）
app.use("/api/histories", historiesRouter);

export default app;
