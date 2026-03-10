# Oracle Cloud 移設：環境構築と改変手順

**前提**: リファクタ後のアプリを Oracle Cloud（Always Free）に載せる。**ルーレットの挙動は変更していません**（同じ機能のまま）。  
**データ**: 今のデータはリファクタ後へ引き継ぎ可能。手順は [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) の「3. データの引継ぎ」を参照。

---

## 1. 今のデータをリファクタ後へ引き継げるか

**はい、引き継げます。**

| データ | 方法 |
|--------|------|
| **DB** | 現在の DB で `db/migrations/001_drop_legacy_image_urls.sql` を 1 回実行すると、リファクタ後スキーマに移行できます。必ず事前に `pg_dump` でバックアップを取得してください。 |
| **画像** | 同じ Docker の `uploads_data` ボリュームをそのまま使えば、既存の画像ファイルは追加コピー不要で参照されます。 |

手順の詳細は [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) の「3.2 既存 DB からリファクタ後へ移行する場合」「3.3 画像の引継ぎ」を参照してください。

---

## 2. Oracle 用の改変（コード・設定）

リファクタ後のコードは **設定で本番向けに切り替える** 形にし、Oracle 専用のコード変更は最小限にします。

### 2.1 環境変数（本番用 .env の例）

Oracle 上の VM でだけ使う `.env` を用意します。**リポジトリには含めず**、サーバー上にのみ配置します。

```bash
# DB（Docker 内の PostgreSQL）
POSTGRES_USER=doll_roulette
POSTGRES_PASSWORD=強力なパスワードに変更
POSTGRES_DB=doll_roulette
DB_HOST=db
DB_PORT=5432

# バックエンド
NODE_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3000

# フロントエンド（本番の API の URL。VM のパブリック IP またはドメイン）
VITE_API_BASE_URL=https://あなたのドメインまたはIP

# 画像保存（任意。未設定時は backend 内の uploads）
# UPLOADS_DIR=/mnt/block/uploads
```

- `VITE_API_BASE_URL`: スマホ・PC からアクセスするときの API のベース URL。HTTPS 化する場合は Nginx のドメインまたは IP を指定。
- `UPLOADS_DIR`: ブロックボリュームをマウントしたパスにしたい場合だけ指定。

### 2.2 フロントのビルド

本番では Vite をビルドし、静的ファイルを Nginx で配信する運用を推奨します。

- ビルド時に `VITE_API_BASE_URL` を渡す。  
  ```bash
  VITE_API_BASE_URL=https://あなたのドメイン npm run build
  ```
- または `docker-compose` で本番用 `command` を `npm run build && npm run preview` に変える、もしくはビルド成果物を Nginx から配信する。

### 2.3 コード側で必要な変更（最小限）

- **既にリファクタ済み**: ストレージ層・config は環境変数で切り替わるため、**Oracle 用の特別なコード追加は不要**です。
- 本番では **CORS** を必要に応じて絞る場合、`backend/src/app.ts` で `NODE_ENV === 'production'` のときだけ `origin` を特定ドメインに制限する改変は任意で可能です。

### 2.4 改変のまとめ

| 項目 | 内容 |
|------|------|
| 環境変数 | 上記の本番用 `.env` を Oracle VM にだけ配置。 |
| フロント | `VITE_API_BASE_URL` を本番 URL に設定してビルド。 |
| 画像 | デフォルトのまま VM 内 `uploads` で可。永続化したい場合はブロックボリュームをマウントし `UPLOADS_DIR` でそのパスを指定。 |
| ルーレット | 変更なし（リファクタでも挙動は同じ）。 |

---

## 3. Oracle Cloud の環境構築手順

### 3.1 アカウントとリージョン

1. [Oracle Cloud](https://www.oracle.com/jp/cloud/free/) でアカウント作成。
2. **ホームリージョン**（例: 東京）を選択。Always Free はこのリージョンのみなので、あとから変更できない点に注意。

### 3.2 Compute インスタンスの作成

1. メニュー **コンピュート** → **インスタンス** → **インスタンスの作成**。
2. **名前**: 例 `doll-roulette`。
3. **配置**: ホームリージョン、既存の VCN または「新規 VCN の作成」。
4. **イメージとシェイプ**:
   - イメージ: **Ubuntu 22.04**（または 24.04）。
   - シェイプ: **VM.Standard.A1.Flex**（Always Free）、OCPU **2**、メモリ **12 GB**。
5. **ネットワーキング**: パブリック IP を割り当てる。プライベートサブネットでも可（その場合は踏み台などが必要）。
6. **SSH キー**: 自分の公開鍵を登録するか、秘密鍵をダウンロードして保管。
7. **ブートボリューム**: デフォルト 50 GB のままで可。必要なら後からブロックボリュームを追加。
8. 作成後、**パブリック IP** をメモする。

### 3.3 セキュリティリスト（ファイアウォール）

インスタンスが属するサブネットの **セキュリティリスト** で、以下を **イングレス** に追加する。

| ソース | 宛先ポート | 説明 |
|--------|------------|------|
| 0.0.0.0/0 | 22 | SSH |
| 0.0.0.0/0 | 80 | HTTP（Nginx） |
| 0.0.0.0/0 | 443 | HTTPS（Nginx） |

※ 3000 / 5173 は Nginx 経由でアクセスするため、外部には開放しなくてよい（Nginx を同じ VM で動かす場合）。

### 3.4 SSH で VM に接続

```bash
ssh -i あなたの秘密鍵 ubuntu@パブリックIP
```

### 3.5 必要なソフトのインストール

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
```

ログアウトしてから再度 SSH し、`docker` グループが効いていることを確認する。

```bash
docker --version
docker compose version
```

### 3.6 ブロックボリュームの追加（任意・推奨）

DB と画像を VM のディスク以外に残したい場合:

1. OCI コンソールで **ストレージ** → **ブロックストレージ** → **ブロックボリューム** を作成（例: 50 GB）。
2. **アタッチ** で上記インスタンスにアタッチ。デバイス名（例: `/dev/oracleoci/oraclevdb`）をメモ。
3. VM 内でフォーマットとマウント（例: `/mnt/block`）。再起動後も永続化するよう `/etc/fstab` に記載。
4. 例:
   ```bash
   sudo mkfs.ext4 /dev/sdb
   sudo mkdir -p /mnt/block
   echo '/dev/sdb /mnt/block ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
   sudo mount -a
   sudo mkdir -p /mnt/block/postgres_data /mnt/block/uploads
   sudo chown -R 999:999 /mnt/block/postgres_data
   ```
5. `docker-compose` のボリュームを `/mnt/block/postgres_data` と `/mnt/block/uploads` に変更（後述の compose 例を参照）。

### 3.7 アプリのデプロイ

```bash
cd ~
git clone https://github.com/あなたのユーザー/doll_roulette.git
cd doll_roulette
```

または rsync で手元のリファクタ後コードをアップロードしてもよい。

### 3.8 本番用 .env の配置

```bash
cp .env.example .env
nano .env   # または vi。2.1 の内容で編集（POSTGRES_PASSWORD, VITE_API_BASE_URL 等）
```

`.env` はリポジトリにコミットしないこと。

### 3.9 既存データを引き継ぐ場合（現在の環境から）

**流れ**: 現在の環境で「マイグレーション実行 → ダンプ取得」まで行い、そのダンプと画像を Oracle に持っていきます。

1. **現在動いている環境（リファクタ前の DB）で**:
   ```bash
   # 必ずバックアップを取る
   docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_before.sql

   # リファクタ後スキーマへマイグレーション（dolls.image_url 等を *_images に移行）
   cat db/migrations/001_drop_legacy_image_urls.sql | docker compose exec -T db psql -U doll_roulette doll_roulette -f -

   # マイグレーション後の状態でダンプ（これを Oracle に持っていく）
   docker compose exec db pg_dump -U doll_roulette doll_roulette > backup_for_oracle.sql
   ```
2. **Oracle VM** に `backup_for_oracle.sql` を転送。既存の画像は `backend/uploads/`（または Docker の uploads ボリュームの中身）を `rsync` や `scp` で VM の適切な場所（例: `~/doll_roulette/uploads/`）にコピーする。
3. Oracle VM で **いったん DB だけ起動**:
   ```bash
   docker compose up -d db
   # 初回は 01_schema.sql が実行され空の新スキーマになる
   ```
4. **既存データをリストア**（テーブルをいったん削除してからダンプを流す）:
   ```bash
   # 初期化で作られたテーブルを削除（FK の順に）
   docker compose exec -T db psql -U doll_roulette doll_roulette << 'EOF'
   DROP TABLE IF EXISTS histories, doll_images, outing_images, outing_dolls, outings, dolls CASCADE;
   EOF

   # マイグレーション済みダンプをリストア
   docker compose exec -T db psql -U doll_roulette doll_roulette < backup_for_oracle.sql
   ```
5. **画像**: 転送した `uploads/` の中身を、Oracle 上でバックエンドが参照するディレクトリに置く。  
   - デフォルトの名前付きボリューム `uploads_data` を使う場合は、一度 `docker compose up -d backend` したあと、`docker compose exec backend sh -c 'ls /app/uploads'` で確認し、ホスト側から `docker cp` で転送したファイルをボリューム内にコピーする方法がある。  
   - ブロックボリュームを `/mnt/block/uploads` にマウントしてそこを `backend` の `/app/uploads` にマウントする場合は、転送した画像を `/mnt/block/uploads/` に配置すればよい（3.6 の override 例を参照）。

### 3.10 Docker Compose で起動

ブロックボリュームを使わない場合（VM のディスクのみ）:

```bash
docker compose up -d
```

ブロックボリュームを使う場合、`docker-compose.override.yml` を同じディレクトリに作成し、ボリュームのマウント先を上記 `/mnt/block/...` に変更する例:

```yaml
# docker-compose.override.yml（本番用・作成する場合）
services:
  db:
    volumes:
      - /mnt/block/postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
  backend:
    environment:
      UPLOADS_DIR: /app/uploads
    volumes:
      - /mnt/block/uploads:/app/uploads
```

この場合、`docker compose up -d` で override が自動で読み込まれる。

### 3.11 Nginx のリバースプロキシ（推奨）

80/443 で受け、バックエンド (3000) とフロント (ビルド済み静的ファイル) に振り分けます。

```bash
sudo apt install -y nginx
```

例: `/etc/nginx/sites-available/doll-roulette`

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

- フロントは事前に `VITE_API_BASE_URL=https://あなたのドメイン` で `npm run build` し、`frontend/dist` を上記 `root` に合わせる。
- 有効化: `sudo ln -s /etc/nginx/sites-available/doll-roulette /etc/nginx/sites-enabled/` → `sudo nginx -t` → `sudo systemctl reload nginx`。

HTTPS にする場合は Let's Encrypt（certbot）を利用する。

### 3.12 アイドル回収を避ける

7 日間の低稼働でインスタンスが回収されないよう、軽い定期アクセスを入れる。

- 例: 同じ VM の cron で `curl -s http://127.0.0.1:3000/api/health` を 1 日 1 回実行。
- または UptimeRobot などの外部監視で本番 URL に 5 分ごとアクセスする。

```bash
crontab -e
# 例: 毎日 8:00 にヘルスチェック
0 8 * * * curl -s http://127.0.0.1:3000/api/health > /dev/null
```

### 3.13 動作確認

- ブラウザで `http://パブリックIP`（または HTTPS の URL）を開く。
- かぞくの登録・ルーレット・お出かけ日記・履歴・リセットが問題なく動くか確認する。

---

## 4. 手順の流れ（まとめ）

| 順番 | 内容 |
|------|------|
| 1 | Oracle アカウント作成・ホームリージョン選択 |
| 2 | A1 Flex（2 OCPU・12 GB）の VM 作成、SSH 鍵・セキュリティリスト設定 |
| 3 | VM に SSH し、Docker / Docker Compose / git をインストール |
| 4 | （任意）ブロックボリュームの作成・アタッチ・マウント |
| 5 | リポジトリを clone（または rsync）、本番用 `.env` を配置 |
| 6 | 既存データを引き継ぐ場合はバックアップ・マイグレーション・uploads を転送してリストア |
| 7 | `docker compose up -d` で起動 |
| 8 | Nginx で 80/443 をリバースプロキシ、フロントはビルド済みを配信 |
| 9 | アイドル対策（cron または外部監視）を設定 |
| 10 | ルーレット含め動作確認 |

---

## 5. 関連ドキュメント

- [移設計画書_OracleCloudおよび代替案.md](./移設計画書_OracleCloudおよび代替案.md) … 無料枠の詳細・代替案
- [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) … データ引き継ぎの詳細
- [db-structure.md](./db-structure.md) … リファクタ後の DB 構成
