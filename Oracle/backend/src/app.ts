/**
 * Express アプリ設定（CORS・セキュリティ・ルート・ストレージ経由の画像配信）
 */
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { appConfig, storageConfig } from "./config/index.js";
import { getStorage } from "./storage/index.js";
import authRouter, { requireAuth } from "./routes/auth.js";
import dollsRouter from "./routes/dolls.js";
import rouletteRouter from "./routes/roulette.js";
import historiesRouter from "./routes/histories.js";
import resetRouter from "./routes/reset.js";
import outingsRouter from "./routes/outings.js";

const app = express();

// 本番: CORS を許可するオリジンに制限。開発: リフレクタ（origin: true）
// credentials: true で Cookie を送受信（パスワード認証用）
const corsOrigin =
  appConfig.nodeEnv === "production" && appConfig.allowedOrigin
    ? appConfig.allowedOrigin
    : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

// 本番: セキュリティヘッダー（X-Content-Type-Options 等）
if (appConfig.nodeEnv === "production") {
  app.use(helmet());
  // API のレート制限（1分あたり100リクエストまで）
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

app.use(express.json());

// 認証: /api/auth 以外の /api/* と /uploads は APP_PASSWORD が設定されていれば要認証
app.use("/api/auth", authRouter);
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path === "/health") return next();
  requireAuth(req, res, next);
});

// 画像配信（認証通過後のみ。ストレージ層経由でローカル or OCI から取得）
if (process.env.STORAGE_TYPE !== "oci" && !fs.existsSync(storageConfig.uploadsDir)) {
  fs.mkdirSync(storageConfig.uploadsDir, { recursive: true });
}
app.use("/uploads", requireAuth, async (req, res, next) => {
  const relativePath = req.path.startsWith("/") ? req.path.slice(1) : req.path;
  if (!relativePath) return next();
  try {
    const buffer = await getStorage().getBuffer(relativePath);
    if (!buffer) {
      res.status(404).send("Not Found");
      return;
    }
    const ext = path.extname(relativePath).toLowerCase();
    const mime: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp",
    };
    res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

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

// かぞくたち API（認証ミドルウェア通過後のみ）
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
