# Oracle Cloud 移設：データ引き継ぎ ＋ リファクタ構成 ＋ パブリック公開

既存のローカル PC で動かしていたデータを引き継ぎながら、**リファクタ済みのベストな構成**で Oracle Cloud に移設し、**パブリックに公開するためのセキュリティ**も考慮した手順です。

---

## 手順の全体像（やることの順番）

1. **ローカルでリファクタ後のコードが正常に動くか確認**（ルートの `doll_roulette/` で Docker 起動 → 一覧・ルーレット・画像・お出かけ日記が問題なく動くか）
2. **Oracle Cloud 移設**（この手順書の A 〜 F のとおりに実施）

**Object Storage について**: 移設時は **画像は VM のディスク（uploads）のまま**で問題ありません。OCI Object Storage はバケット作成・IAM・公開設定の確認がややこしいうえ、ローカルからは挙動を確認しづらいため、**まずは VM で移設して運用し、必要になったら後から Object Storage 対応を検討**する形で十分です。

### ローカル確認チェックリスト（移設前にここまでできていれば OK）

| 確認項目 | やり方 |
|----------|--------|
| リファクタ後コードで起動する | ルートで `docker compose up -d`。db / backend / frontend がすべて Up になること。 |
| かぞく一覧が表示される | ブラウザで `http://localhost:5173`（またはスマホなら `http://PCのIP:5173`）を開き、一覧が表示されること。APP_PASSWORD を設定している場合はパスワード入力後に表示。 |
| ルーレットが回る | ルーレットタブでスピンし、当選・履歴が問題ないこと。 |
| お出かけ日記が動く | 一覧・登録・画像表示ができること。 |
| 画像が表示される | かぞく・お出かけの画像が表示されること（既存データがある場合）。 |

ここまで問題なければ、手順書の **A. ローカル準備** から移設作業に進んで大丈夫です。

### 移設前に Pre（旧環境）でデータを確認したいとき — データが出ない理由と対処

**症状**: `pre/` で `docker compose -p doll_roulette up -d` してブラウザを開くと、かぞく一覧が空だったり「一覧の取得に失敗しました」と出る。

**原因**: pre のコードは **旧スキーマ**（`dolls.image_url` と `outings.image_url` がある）を前提にしています。一方、過去にルートで **マイグレーション（001_drop_legacy_image_urls.sql）** を実行していると、DB は **リファクタ後スキーマ**（これらのカラムなし）になっています。pre のバックエンドは `SELECT ... image_url ... FROM dolls` を実行するため、カラムが存在しないと SQL エラーになり、API が 500 を返してデータが表示されません。

**対処**: DB を **旧スキーマに戻す** 必要があります。`backup_before.sql`（マイグレーション前のダンプ）が手元にあれば、次の手順で復旧できます。

1. **pre とルートのコンテナを止める**
   ```bash
   cd pre && docker compose -p doll_roulette down && cd ..
   cd ルート && docker compose down && cd ..
   ```

2. **ルートで DB だけ起動**
   ```bash
   cd ルート
   docker compose up -d db
   # 数十秒待つ
   ```

3. **テーブルを削除してから backup_before.sql をリストア**（※ backup_before.sql がない場合は、この方法では復旧できません）
   ```bash
   docker compose exec -T db psql -U doll_roulette doll_roulette << 'EOF'
   DROP TABLE IF EXISTS histories, doll_images, outing_images, outing_dolls, outings, dolls CASCADE;
   EOF
   docker compose exec -T db psql -U doll_roulette doll_roulette < backup_before.sql
   ```

4. **pre で起動**
   ```bash
   cd pre
   docker compose -p doll_roulette up -d
   ```

5. **pre のバックエンドが pre のコードで動いているか確認**  
   以前ルートでビルドした backend イメージがそのまま使われている場合があります。そのときは pre からバックエンドを明示的にビルドしてから起動します。
   ```bash
   cd pre
   docker compose -p doll_roulette build --no-cache backend
   docker compose -p doll_roulette up -d
   ```

6. **PC で開く場合**  
   pre のフロントは `VITE_API_BASE_URL=http://192.168.0.222:3000` のままなので、**PC のブラウザで** `http://localhost:5173` を開くと API が localhost:3000 に飛ばず失敗することがあります。その場合は一時的に `pre/.env` の `VITE_API_BASE_URL=http://localhost:3000` に変更し、フロントを再起動（`docker compose -p doll_roulette up -d --force-recreate frontend`）してから `http://localhost:5173` で確認してください。

**まとめ**: pre で「移設前のデータ」を確認したいだけなら、**DB を旧スキーマ（backup_before.sql）に戻す** → **pre で起動（必要なら backend を pre から再ビルド）** の順で対応すればデータは出ます。移設本番では、手順書どおり **リファクタ後スキーマ（backup_for_oracle.sql）＋ ルートのコード** で進めてください。

---

## 全体の流れ

| 段階 | どこで | 内容 |
|------|--------|------|
| **A. ローカル準備** | 手元の PC | リファクタ後スキーマへ移行・ダンプ取得・画像退避 |
| **B. Oracle 準備** | Oracle コンソール | VM 作成・セキュリティリスト・SSH 確認 |
| **C. VM セットアップ** | Oracle VM 上 | Docker・アプリ配置・本番 .env |
| **D. データ投入** | Oracle VM 上 | DB リストア・画像配置 |
| **E. アプリ・Nginx** | Oracle VM 上 | ビルド・起動・リバースプロキシ・HTTPS（任意） |
| **F. 公開後** | Oracle VM 上 | アイドル対策・動作確認 |

**使用するコード**: リファクタ済みの**ルート**（`doll_roulette/`）のコード。画像は `doll_images` / `outing_images` のみのスキーマ、ストレージ抽象層、本番用 CORS/セキュリティ対応済みを前提とします。

---

# A. ローカル準備（手元の PC）

**いま pre（旧コード）で動かしている場合**は、一度ルートのリファクタ後コードで DB を移行してからダンプを取ります。

## A-1. リファクタ後コードで DB を起動する

```bash
cd あなたのdoll_rouletteのルート（pre ではない）
# 既存の pre コンテナを止める
cd pre && docker compose -p doll_roulette down && cd ..

# ルートで DB だけ起動（既存ボリュームのデータを使う）
docker compose up -d db
# 数十秒待ってから次へ
```

## A-2. 必ずバックアップを取る

```bash
docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_before.sql
```

- 失敗時の復旧用です。**必ず実行**してください。

## A-3. リファクタ後スキーマへマイグレーション

現在の DB が**旧スキーマ**（`dolls.image_url` あり）の場合のみ実行します。すでにリファクタ後スキーマの場合はスキップして A-4 へ。

```bash
cat db/migrations/001_drop_legacy_image_urls.sql | docker compose exec -T db psql -U doll_roulette doll_roulette -f -
```

- エラーが出ずに完了することを確認します。

## A-4. Oracle 用ダンプの取得

```bash
docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_for_oracle.sql
```

- この `backup_for_oracle.sql` を Oracle VM に持っていきます。

## A-5. 画像の退避

```bash
# バックエンドを一度起動
docker compose up -d backend

# 画像をホストの oracle_uploads にコピー
mkdir -p oracle_uploads
docker cp doll_roulette_backend:/app/uploads/. oracle_uploads/
```

- `oracle_uploads/` フォルダごと Oracle VM に転送します。新規で始める場合はスキップ可。

## A-6. ルートを止めておく（任意）

```bash
docker compose down
```

- 以降は Oracle VM 側の作業に移ります。

---

# B. Oracle Cloud の準備

（アカウント作成済みであれば、VM とネットワークの準備のみ。）

## B-1. Compute インスタンス（VM）の作成

1. コンソール → **コンピュート** → **インスタンス** → **インスタンスの作成**
2. **名前**: 例 `doll-roulette`
3. **イメージ**: Ubuntu 22.04
4. **シェイプ**: **VM.Standard.A1.Flex**（Always Free）、OCPU **2**、メモリ **12 GB**
5. **パブリック IP**: 割り当てる
6. **SSH キー**: 既存の公開鍵をアップロード、または新規生成してダウンロード
7. 作成後、**パブリック IP** をメモ

## B-2. セキュリティリスト（ファイアウォール）

インスタンスのサブネット → **セキュリティリスト** → **イングレス・ルールの追加**:

| ソース CIDR | 宛先ポート | 説明 |
|-------------|------------|------|
| 0.0.0.0/0 | 22 | SSH |
| 0.0.0.0/0 | 80 | HTTP |
| 0.0.0.0/0 | 443 | HTTPS |

## B-3. SSH 接続確認

```bash
ssh -i あなたの秘密鍵 ubuntu@パブリックIP
```

ログインできたら `exit` して次へ。

---

# C. VM のセットアップ（Oracle VM に SSH した状態）

## C-1. システム更新と Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
```

一度 `exit` して再ログインし、`docker --version` で sudo なしで動くことを確認します。

## C-2. アプリのコードを VM に置く

**Git で clone する場合**:

```bash
cd ~
git clone https://github.com/あなたのユーザー名/doll_roulette.git
cd doll_roulette
```

**手元の PC から rsync で転送する場合**（手元で実行）:

```bash
rsync -avz --exclude node_modules --exclude .git --exclude pre あなたのdoll_rouletteのパス/ ubuntu@パブリックIP:~/doll_roulette/
```

- **ルートのリファクタ後コード**が `~/doll_roulette` に存在するようにします（`pre/` は含めなくてよい）。

## C-3. 本番用 .env の作成

VM 上で:

```bash
cd ~/doll_roulette
cp .env.example .env
nano .env
```

**本番用に必ず書き換える項目**:

```bash
# PostgreSQL（強力なパスワードに変更すること）
POSTGRES_USER=doll_roulette
POSTGRES_PASSWORD=ここに強力な本番用パスワード
POSTGRES_DB=doll_roulette
DB_HOST=db
DB_PORT=5432

# 本番
NODE_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3000

# パブリック公開用：実際にアクセスする URL（ドメイン or IP）
# 例: https://your-domain.com または http://パブリックIP
VITE_API_BASE_URL=https://あなたのドメインまたはパブリックIP

# 本番 CORS：フロントのオリジン（VITE_API_BASE_URL と揃える。末尾スラッシュなし）
ALLOWED_ORIGIN=https://あなたのドメインまたはパブリックIP
```

- `POSTGRES_PASSWORD` は推測されにくい長い文字列にしてください。
- `ALLOWED_ORIGIN` は本番のみ使用。未設定の場合は従来どおりリクエストの Origin をそのまま許可します。
- `VITE_API_BASE_URL` と `ALLOWED_ORIGIN` は、HTTPS 化する前は `http://パブリックIP`、HTTPS 化後は `https://ドメイン` に変更します。
- `.env` はリポジトリにコミットしないでください。

---

# D. データの投入（既存データを引き継ぐ場合）

**新規で始める場合は D 全体をスキップ**し、E へ進んでください。

## D-1. ダンプと画像を VM に転送

**手元の PC** で（パスと IP を自分の環境に合わせる）:

```bash
scp -i あなたの秘密鍵 backup_for_oracle.sql ubuntu@パブリックIP:~/doll_roulette/
scp -i あなたの秘密鍵 -r oracle_uploads ubuntu@パブリックIP:~/doll_roulette/
```

## D-2. VM で DB だけ先に起動

**VM に SSH した状態で**:

```bash
cd ~/doll_roulette
docker compose up -d db
```

数十秒待ち、`docker compose ps` で `db` が Up になっていることを確認します。

## D-3. 既存データのリストア

```bash
docker compose exec -T db psql -U doll_roulette doll_roulette << 'EOF'
DROP TABLE IF EXISTS histories, doll_images, outing_images, outing_dolls, outings, dolls CASCADE;
EOF
```

続けて:

```bash
docker compose exec -T db psql -U doll_roulette doll_roulette < backup_for_oracle.sql
```

エラーが出ずに終わることを確認します。

## D-4. 画像をバックエンドから参照できる場所に置く

```bash
docker compose up -d backend
docker cp oracle_uploads/. doll_roulette_backend:/app/uploads/
```

画像を引き継がない場合は D-4 をスキップしてください。

---

# E. アプリの起動と Nginx（パブリック公開）

## E-1. 全コンテナの起動

```bash
cd ~/doll_roulette
docker compose up -d
docker compose ps
```

`db` / `backend` / `frontend` がすべて Up であることを確認します。

## E-2. フロントを本番用にビルド

**VM 上でビルドする場合**:

```bash
# Node.js 20（初回のみ）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cd ~/doll_roulette/frontend
npm install
export $(grep -v '^#' ../.env | xargs) && npm run build
```

**手元の PC でビルドして転送する場合**（手元で）:

```bash
cd doll_roulette
VITE_API_BASE_URL=https://あなたのドメインまたはパブリックIP npm run build --prefix frontend
rsync -avz frontend/dist/ ubuntu@パブリックIP:~/doll_roulette/frontend/dist/
```

- `frontend/dist` が VM 上に存在することを確認します。

## E-3. Nginx のインストールと設定

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/doll-roulette
```

以下を貼り付け、**`あなたのドメインまたはパブリックIP`** を実際の値に置き換えて保存します。

```nginx
server {
    listen 80;
    server_name あなたのドメインまたはパブリックIP;

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

## E-4. HTTPS 化（推奨・パブリック公開時）

ドメインを VM のパブリック IP に向けてある場合、Let's Encrypt で証明書を取得します。

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d あなたのドメイン
```

- 取得後、`.env` の `VITE_API_BASE_URL` と `ALLOWED_ORIGIN` を `https://あなたのドメイン` に変更し、フロントを再ビルドして Nginx をリロードします。

---

# F. 公開後の設定と確認

## F-1. アイドル回収を避ける

Oracle は約 7 日間ほとんど使われないとインスタンスが回収される場合があります。

```bash
crontab -e
```

次の 1 行を追加（毎日 8 時にヘルスチェック）:

```
0 8 * * * curl -s http://127.0.0.1:3000/api/health > /dev/null
```

- または [UptimeRobot](https://uptimerobot.com/) で本番 URL を 5 分ごとに監視しても構いません。

## F-2. 動作確認

1. ブラウザで **https://あなたのドメイン**（または http://パブリックIP）を開く。
2. かぞく一覧・ルーレット・お出かけ日記・当選履歴・リセットが問題なく動くか確認する。
3. スマホからも同じ URL でアクセスできるか確認する。

---

# リファクタ構成・セキュリティのポイント（参考）

| 項目 | 内容 |
|------|------|
| **DB** | 画像は `doll_images` / `outing_images` のみ。`dolls.image_url` / `outings.image_url` は廃止（[db-structure.md](./db-structure.md)）。 |
| **画像保存** | ストレージ抽象層（`backend/src/storage/`）経由。本番はローカル `uploads` のままでも可。将来 OCI Object Storage 等に差し替え可能。 |
| **本番セキュリティ** | CORS は `ALLOWED_ORIGIN` でオリジン制限。helmet で HTTP ヘッダー強化、express-rate-limit でレート制限（バックエンドで実装済み）。 |
| **秘密情報** | DB パスワード・本番 URL は `.env` のみ。リポジトリにコミットしない。 |

---

# 補足: 画像を Object Storage に載せて VM 容量を圧迫しないようにする

**現状**: 画像は **VM のディスク**（Docker の `uploads` ボリューム）に保存しています。**S3 も OCI Object Storage も使っていません**。

**Oracle Cloud の場合**:
- **OCI Object Storage** が **Always Free で 20 GB** 使えます（S3 互換 API）。
- 画像を Object Storage に保存するようにすると、VM のディスクを消費せず、容量の心配が減ります。
- アプリ側はすでにストレージ抽象層（`backend/src/storage/`）があるため、**将来** `STORAGE_TYPE=oci` 用の実装（OCI Object Storage にアップロードし、公開 URL を返す）を追加すれば、環境変数で切り替えるだけで Object Storage に載せられます。
- 現時点ではその実装は入っていないため、移設直後は従来どおり **VM の uploads** で運用**し、必要になったら「クラウド移設用リファクタ」として Object Storage 対応を追加する**形が現実的です。

**AWS（EC2）の場合**: S3 を使えば同じように VM 容量を圧迫しません。S3 は 12 ヶ月無料枠で 5 GB、以降は従量課金です。アプリに S3 用のストレージ実装を追加すれば同様に切り替え可能です。

---

# 関連ドキュメント

- [OracleCloud_ベスト構成.md](./OracleCloud_ベスト構成.md) … Object Storage・Block Volume・HTTPS など Oracle 上での推奨構成
- [Oracle移設_手順書.md](./Oracle移設_手順書.md) … フェーズ分けの簡易版
- [Oracle移設_環境構築と改変手順.md](./Oracle移設_環境構築と改変手順.md) … ブロックボリューム・HTTPS 詳細
- [db-structure.md](./db-structure.md) … リファクタ後の DB 構成
- [folder-structure.md](./folder-structure.md) … ディレクトリ構成
- [リファクタリング計画書.md](./リファクタリング計画書.md) … リファクタの考え方
