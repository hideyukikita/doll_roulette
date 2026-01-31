/**
 * Express アプリ設定（CORS・ルート）
 */
import express from "express";
import cors from "cors";
import dollsRouter from "./routes/dolls.js";

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
    message: "ぬいぐるみルーレット API",
    health: "/api/health",
    dolls: "/api/dolls",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "ぬいぐるみルーレット API" });
});

// ぬいぐるみ API（Step 2）
app.use("/api/dolls", dollsRouter);

export default app;
