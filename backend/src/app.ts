/**
 * Express アプリ設定（CORS・ルート・静的配信）
 */
import fs from "fs";
import express from "express";
import cors from "cors";
import { storageConfig } from "./config/storage.js";
import dollsRouter from "./routes/dolls.js";
import rouletteRouter from "./routes/roulette.js";
import historiesRouter from "./routes/histories.js";
import resetRouter from "./routes/reset.js";
import outingsRouter from "./routes/outings.js";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// 画像の静的配信（uploads ディレクトリを事前に作成）
if (!fs.existsSync(storageConfig.uploadsDir)) {
  fs.mkdirSync(storageConfig.uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(storageConfig.uploadsDir));

// ルートパス
app.get("/", (_req, res) => {
  res.json({
    message: "かぞくたちルーレット API",
    health: "/api/health",
    dolls: "/api/dolls",
    roulette: "/api/roulette/spin",
    histories: "/api/histories",
    reset: "/api/reset",
    outings: "/api/outings",
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
// リセット API（Step 5）
app.use("/api/reset", resetRouter);
// お出かけ日記 API
app.use("/api/outings", outingsRouter);

export default app;
