# Step 1 動作確認手順（Docker 環境構築）

## 前提
- Windows WSL2 (Ubuntu) + Docker Desktop が起動していること
- プロジェクトルート（`doll_roulette/`）で作業すること

---

## 1. 環境変数の準備

### Docker Compose で全体を動かす場合（推奨）
ルートの `.env` を用意する。

```bash
cp .env.example .env
# 必要に応じて .env を編集（特に POSTGRES_PASSWORD）
```

### バックエンドをホストで単体実行する場合
```bash
cp backend/.env.example backend/.env
# DB_HOST=localhost のまま、Postgres がローカルで動いている前提
```

### フロントエンドをホストで単体実行する場合
```bash
cp frontend/.env.example frontend/.env
# VITE_API_BASE_URL をバックエンドの URL に合わせる
```

---

## 2. Docker Compose で起動

```bash
docker compose up --build
```

初回は backend / frontend のビルドと DB の初期化で時間がかかります。  
以下のように表示されれば起動完了です。

- `doll_roulette_db` … `database system is ready to accept connections`
- `doll_roulette_backend` … `Backend listening on http://0.0.0.0:3000`
- `doll_roulette_frontend` … `Local: http://localhost:5173/`（または `http://0.0.0.0:5173/`）

---

## 3. 動作確認

### 3.1 フロントエンド（ブラウザ）
- **URL**: http://localhost:5173
- **期待**: 「ぬいぐるみルーレット」「Step 1: Docker 環境構築完了後…」の画面が表示される

### 3.2 バックエンド API（ヘルスチェック）
- **URL**: http://localhost:3000/api/health
- **方法**: ブラウザで開く、または次のコマンドで確認

```bash
curl -s http://localhost:3000/api/health
```

- **期待**: `{"ok":true,"message":"ぬいぐるみルーレット API"}` が返る

### 3.3 データベース（Postgres）
- **接続例**（別ターミナルでコンテナ内から）:

```bash
docker compose exec db psql -U doll_roulette -d doll_roulette -c "\dt"
```

- **期待**: `dolls` と `histories` テーブルが一覧に出る

---

## 4. スマホから接続する場合（同一 Wi‑Fi）

1. PC（WSL2）の IP を確認する:
   ```bash
   hostname -I | awk '{print $1}'
   ```
2. スマホのブラウザで:
   - フロント: `http://<上記IP>:5173`
   - API: `http://<上記IP>:3000/api/health`
3. フロントから API を呼ぶ場合は、`VITE_API_BASE_URL` を `http://<PCのIP>:3000` にし、コンテナを再起動するか、フロントをホストで `npm run dev` して確認する。

---

## 5. 停止

```bash
docker compose down
```

データを消して最初からやり直す場合:

```bash
docker compose down -v
```

---

## トラブルシュート

| 現象 | 確認・対処 |
|------|------------|
| `POSTGRES_PASSWORD を .env に設定してください` | ルートに `.env` を作り、`POSTGRES_PASSWORD=...` を書く |
| フロントで API に繋がらない | ブラウザから叩く URL なので、`VITE_API_BASE_URL` は PC の IP または `localhost`。CORS は backend で許可済み。 |
| ポート 5173 / 3000 が使えない | 他プロセスが使用していないか確認。`docker compose down` 後にもう一度 `up`。 |
| WSL2 でボリュームのパーミッションエラー | `frontend_node_modules` などの匿名ボリュームで `node_modules` を保持する構成にしてある。まだ出る場合はプロジェクトを WSL のホーム配下に置く。 |
