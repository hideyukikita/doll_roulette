# Oracle Cloud 移設 手順書

かぞくたちルーレットを Oracle Cloud（Always Free）に移設するための**順番どおりの手順**です。  
既存データを引き継ぐ場合と、新規で始める場合の両方に対応しています。

---

## この手順書の進め方

| フェーズ | 内容 | 既存データを引き継ぐ | 新規で始める |
|----------|------|----------------------|--------------|
| **フェーズ1** | 移設前の準備（現在のPCで） | ✅ 必須 | スキップ |
| **フェーズ2** | Oracle Cloud の準備 | ✅ | ✅ |
| **フェーズ3** | VM のセットアップ | ✅ | ✅ |
| **フェーズ4** | データの投入 | ✅ 必須 | スキップ |
| **フェーズ5** | アプリの起動と Nginx | ✅ | ✅ |
| **フェーズ6** | 最終設定と確認 | ✅ | ✅ |

**用意するもの**
- Oracle Cloud のアカウント（未作成の場合は [無料トライアル](https://www.oracle.com/jp/cloud/free/) で作成）
- SSH 鍵（パソコンにない場合は作成）
- 既存データを引き継ぐ場合：現在アプリが動いている環境（Docker Compose で起動している状態）

---

## サインアップで「トランザクションの処理中にエラー」が出るとき

Oracle のサインアップは**住所・氏名をすべて英語（ローマ字）で統一**すると通りやすくなります。クレジットカードの請求先は日本語でも、**登録フォームには同じ内容をローマ字で**入れます。

| 項目 | 入れ方の例 |
|------|------------|
| 名前 | ローマ字（例: Taro Yamada）。クレジットカードの名義と同じ表記。 |
| 住所 | 国は Japan。都道府県・市区町村・番地を**すべてローマ字**（例: 東京都渋谷区 → Tokyo, Shibuya-ku）。郵便番号は半角数字のみ。 |
| 電話番号 | **ハイフンなし**の数字だけ（例: 09012345678）。 |
| 市区町村 | **市または区まで**で十分（長く書きすぎない）。 |
| Customer Type | **Individual**（個人）を選択。 |

**このほかに試すとよいこと**
- **Chrome のシークレットモード**（または別ブラウザ）でやり直す。
- メールアドレスは**シンプルなもの**（Oracle や Cloud を含まない、特殊文字を避ける）。
- **プリペイドカードは不可**。通常のクレジットカードまたはデビットカードを使う。
- エラー後は**30分以上あけて**から再試行する（短い間隔で何度も試すとブロックされやすい）。
- それでも通らない場合は、画面上の**チャット／サポート**から Oracle に問い合わせる。

---

# フェーズ1：移設前の準備（現在の環境で行う）

**既存データを Oracle に引き継ぐ場合だけ**、今動かしている PC で以下を実行します。

## 1-1. 必ずバックアップを取る

```bash
cd あなたのdoll_rouletteのディレクトリ
docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_before.sql
```

- `backup_before.sql` ができていることを確認してください。失敗時の復旧用です。

## 1-2. リファクタ後スキーマへマイグレーション

```bash
cat db/migrations/001_drop_legacy_image_urls.sql | docker compose exec -T db psql -U doll_roulette doll_roulette -f -
```

- エラーが出ずに完了することを確認してください。

## 1-3. マイグレーション後のダンプを取得（これを Oracle に持っていく）

```bash
docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_for_oracle.sql
```

## 1-4. 画像フォルダの退避（任意だが推奨）

- Docker の `uploads` の中身をひとまとめにコピーしておきます。
- 例（ホストに書き出したい場合）:
  ```bash
  docker compose run --rm -v "$(pwd)/oracle_uploads:/out" backend sh -c "cp -r /app/uploads/. /out/ 2>/dev/null || true"
  ```
- または、`docker compose exec backend ls /app/uploads` で中身を確認し、必要なファイルを `docker cp` でホストにコピーしても構いません。
- **新規で始める場合は 1-1 ～ 1-4 はすべてスキップ**して、フェーズ2 へ進んでください。

---

# フェーズ2：Oracle Cloud の準備

## 2-1. アカウントとリージョン

1. [Oracle Cloud 無料トライアル](https://www.oracle.com/jp/cloud/free/) にアクセスし、アカウントを作成（未作成の場合）。
2. サインアップ時に **ホームリージョン** を選びます。**東京（ap-tokyo-1）** で問題ありません。日本からレイテンシが良く、Always Free も東京で利用できます。
3. ログインし、クラウドコンソールの画面を開きます。

> **補足（Web 確認済み）**: 東京は新規作成時にホームリージョンとして選択可能です。Always Free のコンピュートはホームリージョン内でのみ作成できるため、東京を選べば東京で VM を立てられます。まれに「out of host capacity」と出る場合は、時間をおいて再試行するか、同じ日本国内の **大阪（ap-osaka-1）** をホームリージョンにしたアカウントで試す選択肢もあります。

## 2-2. Compute インスタンス（VM）の作成

1. 左上メニュー → **コンピュート** → **インスタンス** → **インスタンスの作成**。
2. 以下を入力・選択します。

   | 項目 | 入力例 |
   |------|--------|
   | 名前 | `doll-roulette` |
   | 配置 | デフォルト（ホームリージョン） |
   | イメージ | **Ubuntu 22.04** |
   | シェイプ | **VM.Standard.A1.Flex**（Always Free） |
   | OCPU 数 | **2** |
   | メモリ (GB) | **12** |
   | プライマリ VNIC | パブリック IP を割り当てる ✅ |
   | SSH キー | 既存の鍵をアップロード または 新規生成してダウンロード |

3. **作成** をクリックし、インスタンスが「実行中」になるまで待ちます。
4. 作成されたインスタンスの **パブリック IP アドレス** をメモします（例: `123.45.67.89`）。

## 2-3. ファイアウォール（セキュリティリスト）の設定

1. 作成したインスタンスの **サブネット** のリンクをクリック。
2. サブネットの **セキュリティリスト** のリンクをクリック。
3. **イングレス・ルールの追加** で、次の 3 件を追加します。

   | ソース CIDR | 宛先ポート | 説明 |
   |-------------|------------|------|
   | 0.0.0.0/0 | 22 | SSH |
   | 0.0.0.0/0 | 80 | HTTP |
   | 0.0.0.0/0 | 443 | HTTPS |

4. **イングレス・ルールの追加** を保存します。

## 2-4. SSH で VM に接続できるか確認

手元の PC で（秘密鍵のパスと IP を自分の環境に合わせて実行）:

```bash
ssh -i あなたの秘密鍵のパス ubuntu@パブリックIP
```

- 例: `ssh -i ~/.ssh/mykey ubuntu@123.45.67.89`
- ログインできたら「フェーズ2 完了」です。`exit` で一度抜けておいても構いません。

---

# フェーズ3：VM のセットアップ

Oracle の VM に SSH で入った状態で、以下を順に実行します。

## 3-1. システムの更新と Docker のインストール

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
```

## 3-2. 一度ログアウトして再ログイン

```bash
exit
```

もう一度 SSH で入り直します。

```bash
ssh -i あなたの秘密鍵 ubuntu@パブリックIP
```

- 再ログイン後、`docker` を sudo なしで使えることを確認します。

```bash
docker --version
docker compose version
```

## 3-3. アプリのコードを VM に置く

**Git で clone する場合**（リポジトリを GitHub 等に置いている場合）:

```bash
cd ~
git clone https://github.com/あなたのユーザー名/doll_roulette.git
cd doll_roulette
```

**手元の PC から rsync で転送する場合**（手元で）:

```bash
rsync -avz --exclude node_modules --exclude .git あなたのdoll_rouletteのパス/ ubuntu@パブリックIP:~/doll_roulette/
```

転送後、VM で:

```bash
cd ~/doll_roulette
```

## 3-4. 本番用 .env を作成

```bash
cp .env.example .env
nano .env
```

以下を**自分の環境に合わせて**編集し、保存します（`Ctrl+O` → Enter → `Ctrl+X`）。

```bash
POSTGRES_USER=doll_roulette
POSTGRES_PASSWORD=ここに強力なパスワードを入れる
POSTGRES_DB=doll_roulette
DB_HOST=db
DB_PORT=5432

NODE_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3000

# 本番の URL（あとで Nginx を入れたら http://パブリックIP または https://ドメイン に変更可能）
VITE_API_BASE_URL=http://パブリックIP
```

- `VITE_API_BASE_URL` は、いったん `http://パブリックIP` で問題ありません（後で Nginx を入れたあと、必要なら変更します）。

---

# フェーズ4：データの投入（既存データを引き継ぐ場合のみ）

**新規で始める場合はこのフェーズ全体をスキップ**し、フェーズ5 へ進んでください。

## 4-1. ダンプと画像を VM に転送する

**手元の PC** で実行（パスと IP を自分の環境に合わせる）:

```bash
scp -i あなたの秘密鍵 backup_for_oracle.sql ubuntu@パブリックIP:~/doll_roulette/
```

画像を退避している場合（例: `oracle_uploads` フォルダ）:

```bash
scp -i あなたの秘密鍵 -r oracle_uploads ubuntu@パブリックIP:~/doll_roulette/
```

## 4-2. VM で DB だけ先に起動する

**VM に SSH した状態で**:

```bash
cd ~/doll_roulette
docker compose up -d db
```

- 数十秒待ち、`docker compose ps` で `db` が Up になっていることを確認します。

## 4-3. 既存データをリストアする

```bash
docker compose exec -T db psql -U doll_roulette doll_roulette << 'EOF'
DROP TABLE IF EXISTS histories, doll_images, outing_images, outing_dolls, outings, dolls CASCADE;
EOF
```

続けて:

```bash
docker compose exec -T db psql -U doll_roulette doll_roulette < backup_for_oracle.sql
```

- エラーが出ずに終わることを確認します。

## 4-4. 画像をアプリから参照できる場所に置く（画像を転送した場合）

VM に `oracle_uploads` を転送している場合、その中身をバックエンドの `/app/uploads` に入れます。

```bash
# 先に backend を起動しておく
docker compose up -d backend

# ホストの oracle_uploads の中身をコンテナの /app/uploads にコピー
docker cp oracle_uploads/. doll_roulette_backend:/app/uploads/
```

- 画像を引き継がない場合は 4-4 はスキップして構いません。

---

# フェーズ5：アプリの起動と Nginx

## 5-1. 全コンテナを起動する

```bash
cd ~/doll_roulette
docker compose up -d
```

```bash
docker compose ps
```

- `db` / `backend` / `frontend` がすべて Up になっていることを確認します。

## 5-2. フロントを本番用にビルドする

**方法A：VM 上でビルドする**（VM に Node.js を入れる場合）

```bash
# Node.js 20 をインストール（初回のみ）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cd ~/doll_roulette/frontend
npm install
export $(grep -v '^#' ../.env | xargs) && npm run build
```

**方法B：手元の PC でビルドして転送する**

手元の PC（doll_roulette のディレクトリ）で:

```bash
# .env の VITE_API_BASE_URL を http://パブリックIP にしたうえで
VITE_API_BASE_URL=http://パブリックIP npm run build
rsync -avz frontend/dist/ ubuntu@パブリックIP:~/doll_roulette/frontend/dist/
```

- いずれも `frontend/dist` にビルド成果物が VM 上に存在することを確認します。

## 5-3. Nginx をインストールして設定する

```bash
sudo apt install -y nginx
```

設定ファイルを作成します（**パブリックIP の部分を自分の VM の IP に書き換える**）:

```bash
sudo nano /etc/nginx/sites-available/doll-roulette
```

以下を貼り付けて保存します（`あなたのパブリックIP` を実際の IP に変更）:

```nginx
server {
    listen 80;
    server_name あなたのパブリックIP;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    location / {
        root /home/ubuntu/doll_roulette/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

有効化と反映:

```bash
sudo ln -sf /etc/nginx/sites-available/doll-roulette /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5-4. .env の VITE_API_BASE_URL を合わせる（任意）

Nginx 経由でアクセスするため、`.env` の `VITE_API_BASE_URL` を `http://パブリックIP` にしておけば、そのまま利用できます。ドメインや HTTPS をあとから入れる場合は、そのときに合わせて変更します。

---

# フェーズ6：最終設定と確認

## 6-1. アイドル回収を避ける設定（推奨）

Oracle は約 7 日間ほとんど使われないとインスタンスが回収される場合があります。軽いアクセスを定期実行します。

```bash
crontab -e
```

エディタが開いたら、次の 1 行を追加して保存します（毎日 8 時に API にアクセス）:

```
0 8 * * * curl -s http://127.0.0.1:3000/api/health > /dev/null
```

- または [UptimeRobot](https://uptimerobot.com/) などで `http://パブリックIP/api/health` を 5 分ごとに監視しても構いません。

## 6-2. 動作確認

1. ブラウザで **http://パブリックIP** を開く。
2. かぞく一覧・ルーレット・お出かけ日記・当選履歴・リセットが問題なく動くか確認する。
3. スマホからも同じ URL でアクセスできるか確認する。

ここまでできていれば **Oracle 移設は完了** です。

---

# よくあるトラブル

| 現象 | 確認すること |
|------|----------------|
| SSH できない | セキュリティリストで 22 番が開いているか、秘密鍵のパスとユーザ名 `ubuntu` が正しいか。 |
| ブラウザで開いてもつながらない | 80 番がセキュリティリストで開いているか、`docker compose ps` で 3 コンテナとも Up か、`sudo nginx -t` で Nginx の設定が正しいか。 |
| 画像が表示されない | 4-4 で画像を正しく配置したか、`/uploads/` が Nginx で 3000 番にプロキシされているか。 |
| API が 404 になる | `VITE_API_BASE_URL` が `http://パブリックIP` になっているか（末尾に `/` を付けない）。 |

---

# 関連ドキュメント

- [Oracle移設_環境構築と改変手順.md](./Oracle移設_環境構築と改変手順.md) … 改変の詳細・ブロックボリューム・HTTPS など
- [移設計画書_OracleCloudおよび代替案.md](./移設計画書_OracleCloudおよび代替案.md) … 無料枠の説明・代替サービス
- [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) … データ引き継ぎの詳細
