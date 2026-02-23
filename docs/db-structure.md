# DB 構成

**完成版**。PostgreSQL のテーブル定義・ER・インデックス・初期化スクリプトをまとめます。

---

## 1. 概要

- **RDBMS**: PostgreSQL
- **拡張**: `uuid-ossp`（UUID 主キー用）
- **コンテナ**: Docker Compose の `db` サービス。起動時に `db/init/*.sql` が `/docker-entrypoint-initdb.d` で実行される。
- **永続化**: ボリューム `postgres_data`

---

## 2. ER 図（概念）

```
dolls (かぞく)
  ├── doll_images (1:N)  サブ画像
  ├── histories (1:N)     当選履歴
  └── outing_dolls (N:M)  お出かけに一緒に

outings (お出かけ日記)
  ├── outing_dolls (N:M)  dolls と多対多
  └── outing_images (1:N) 写真
```

- **dolls**: 代表画像は `dolls.image_url`、追加画像は **doll_images**。
- **histories**: 1件＝1回の当選。`doll_image_url` は当選時に表示した画像URL（代表 or サブの1枚）。
- **outings**: **outing_dolls** で「一緒に行った家族」を多対多。写真は **outing_images**。

---

## 3. テーブル定義

### dolls（かぞく）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 主キー |
| name | VARCHAR(255) | NOT NULL | 名前 |
| color | VARCHAR(50) | NOT NULL | 色 |
| image_url | VARCHAR(255) | DEFAULT NULL | 代表画像URL |
| is_selected | BOOLEAN | NOT NULL DEFAULT false | 当選済みフラグ |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

### doll_images（かぞくのサブ画像）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| doll_id | UUID | NOT NULL, FK→dolls(id) ON DELETE CASCADE | かぞくID |
| image_url | VARCHAR(255) | NOT NULL | 画像URL |
| sort_order | INT | NOT NULL DEFAULT 0 | 表示順 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

- **インデックス**: idx_doll_images_doll_id ON (doll_id)

### histories（当選履歴）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| doll_id | UUID | NOT NULL, FK→dolls(id) ON DELETE CASCADE | 当選したかぞくID |
| doll_image_url | VARCHAR(255) | DEFAULT NULL | 当選時に表示した画像URL |
| selected_at | TIMESTAMPTZ | DEFAULT now() | 当選日時 |

- **インデックス**: idx_histories_doll_id, idx_histories_selected_at ON (selected_at DESC)

### outings（お出かけ日記）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| place | VARCHAR(255) | NOT NULL | 場所 |
| outing_date | TIMESTAMPTZ | NOT NULL | お出かけ日 |
| comment | TEXT | - | コメント |
| image_url | VARCHAR(255) | DEFAULT NULL | レガシー |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

- **インデックス**: idx_outings_outing_date ON (outing_date DESC)

### outing_dolls（お出かけ × かぞく 多対多）

| カラム | 型 | 制約 |
|--------|-----|------|
| outing_id | UUID | NOT NULL, FK→outings(id) ON DELETE CASCADE |
| doll_id | UUID | NOT NULL, FK→dolls(id) ON DELETE CASCADE |

- **主キー**: (outing_id, doll_id)

### outing_images（お出かけの写真）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| outing_id | UUID | NOT NULL, FK→outings(id) ON DELETE CASCADE | お出かけID |
| image_url | VARCHAR(255) | NOT NULL | 画像URL |
| sort_order | INT | NOT NULL DEFAULT 0 | 表示順 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

- **インデックス**: idx_outing_images_outing_id ON (outing_id)

---

## 4. 初期化スクリプト（db/init/）

| ファイル | 用途 | 内容 |
|----------|------|------|
| 01_schema.sql | 新規構築 | 全テーブル・インデックス・histories.doll_image_url 含む |
| 02_outings.sql | 既存DB用 | outings, outing_dolls のみ |
| 03_outing_images.sql | 既存DB用 | outing_images のみ |
| 04_doll_images.sql | 既存DB用 | doll_images のみ |
| 05_histories_image_url.sql | 既存DB用 | histories に doll_image_url 追加 |

新規構築時は 01_schema.sql のみ実行。既存DBへ追加する場合は 02〜05 を必要に応じて実行。

---

## 5. 画像の保存

- 保存先: バックエンドの /uploads（Docker: uploads_data ボリューム）
- DB にはパス文字列（例: /uploads/dolls/xxxx.jpg）を保存。フロントは apiUrl(path) でフルURLを組み立て。
- 形式: JPEG / PNG / GIF / WebP

---

## 6. 関連

- フォルダ構成: [folder-structure.md](folder-structure.md)
- 機能・API: [STATUS.md](STATUS.md)
- 詳細設計: [詳細設計書.md](詳細設計書.md)
