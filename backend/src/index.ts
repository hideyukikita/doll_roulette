/**
 * ぬいぐるみルーレット バックエンド エントリ
 * Step 2: DB 接続 & ぬいぐるみ一覧・登録 API
 */
import app from "./app.js";

const PORT = Number(process.env.BACKEND_PORT) || 3000;
const HOST = process.env.BACKEND_HOST ?? "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});
