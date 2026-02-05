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
- **期待**: 「かぞくたちルーレット」「Step 1: Docker 環境構築完了後…」の画面が表示される

### 3.2 バックエンド API（ヘルスチェック）
- **URL**: http://localhost:3000/api/health
- **方法**: ブラウザで開く、または次のコマンドで確認

```bash
curl -s http://localhost:3000/api/health
```

- **期待**: `{"ok":true,"message":"かぞくたちルーレット API"}` が返る

### 3.3 データベース（Postgres）
- **接続例**（別ターミナルでコンテナ内から）:

```bash
docker compose exec db psql -U doll_roulette -d doll_roulette -c "\dt"
```

- **期待**: `dolls` と `histories` テーブルが一覧に出る

---

## 4. スマホから接続する場合（同一 Wi‑Fi）

### 4.1 ポート転送（portproxy）は必要

Docker は **WSL2 内**で動いているため、スマホから **Windows の IP（192.168.x.x）** でアクセスしても、そのままでは WSL2 の 3000/5173 には届きません。  
**Windows 側で「受け取った 3000/5173 を WSL2 に転送する」設定が必要**です。

**管理者として開いた PowerShell** で、次のスクリプトを実行してください。  
（WSL2 の IP は再起動で変わるため、**PC や WSL2 を再起動したあとはスクリプトをやり直す**と安全です。）

```powershell
# 前回の転送設定をリセット
netsh interface portproxy reset

# WSL2 の IP を取得
$wslIP = (wsl hostname -I).Trim().Split(" ")[0]

if (-not $wslIP) {
    Write-Host "Error: Could not find WSL2 IP." -ForegroundColor Red
    exit 1
}

Write-Host "WSL2 IP: $wslIP" -ForegroundColor Green

# 3000 と 5173 を WSL2 に転送
$ports = @("5173", "3000")
foreach ($port in $ports) {
    netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIP
    Write-Host "Port $port forwarded to $wslIP" -ForegroundColor Green
}

Write-Host "Success! You can now access from your mobile." -ForegroundColor Cyan
```

この転送を入れたうえで、次項の「Windows の IP（192.168.x.x）」とファイアウォール設定をすると、スマホからアクセスしやすくなります。

### 4.2 どの IP を使うか（重要）

- **172.26.x.x** は WSL2 の**内部用 IP** です。スマホからは通常たどり着けず「このサイトにはアクセスできません」になります。
- スマホから接続するときは、**Windows の PC の IP（多くの場合 192.168.x.x）** を使います。

**Windows で PC の IP を確認する例（PowerShell または コマンドプロンプト）:**
```bat
ipconfig
```
「ワイヤレス LAN アダプター」や「イーサネット アダプター」の **IPv4 アドレス**（例: 192.168.1.10）をメモします。

**スマホのブラウザで開く URL の例:**
- フロント: `http://192.168.1.10:5173`
- API: `http://192.168.1.10:3000` または `http://192.168.1.10:3000/api/health`

（192.168.1.10 の部分を、上で確認した IPv4 アドレスに置き換えてください。）

### 4.3 Windows ファイアウォールでポートを許可する

スマホから「このサイトにはアクセスできません」になる場合は、**Windows ファイアウォール**で 3000 と 5173 を許可する必要があることがあります。

1. **Windows の設定** → **プライバシーとセキュリティ** → **Windows セキュリティ** → **ファイアウォールとネットワーク保護** → **詳細設定**
2. **受信の規則** → **新しい規則** で「ポート」を選び、TCP の **3000** と **5173** を許可（ドメイン・プライベートにチェック）
3. または管理者の PowerShell で一度に許可する例:
   ```powershell
   New-NetFirewallRule -DisplayName "Doll Roulette 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Doll Roulette 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```

### 4.4 確認手順のまとめ

1. `ipconfig` で Windows の IPv4（192.168.x.x）を確認する。
2. PC のブラウザで `http://localhost:3000` と `http://localhost:5173` が開くことを確認する。
3. スマホを**同じ Wi‑Fi** に接続し、`http://<PCのIPv4>:3000` と `http://<PCのIPv4>:5173` で開く。
4. まだ開かない場合は、上記のファイアウォール設定を行う。

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
| PC で `http://172.26.x.x:3000` を開くと「Cannot GET /」 | ルート `/` 用の応答を追加済み。再ビルド後は `{"message":"かぞくたちルーレット API","health":"/api/health"}` が返る。API の確認は `http://...:3000/api/health` でも可。 |
| スマホで「このサイトにはアクセスできません」 | 172.26.x.x は WSL2 用のためスマホから届かない。**Windows の IP（ipconfig の IPv4、多くは 192.168.x.x）** でアクセスし、同一 Wi‑Fi かつ **Windows ファイアウォールで 3000 / 5173 を許可**する（上記「4. スマホから接続」を参照）。 |
