/**
 * ぬいぐるみルーレット バックエンド エントリ
 * Step 1: Docker 環境構築用の最小構成。CORS を最初から有効化。
 */
import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;
const HOST = process.env.BACKEND_HOST ?? "0.0.0.0";

// フロントエンド（Vite: 5173）およびスマホからのアクセスを許可
app.use(
  cors({
    origin: true, // 開発時は任意オリジンを許可（本番ではオリジン指定を推奨）
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "ぬいぐるみルーレット API" });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});
