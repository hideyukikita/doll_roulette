# DB 構成

**リファクタ後**。PostgreSQL のテーブル定義・ER・初期化・マイグレーションをまとめます。

---

## 1. 概要

- **RDBMS**: PostgreSQL
- **拡張**: `uuid-ossp`（UUID 主キー用）
- **コンテナ**: Docker Compose の `db` サービス。起動時に `db/init/01_schema.sql` が実行される。
- **永続化**: ボリューム `postgres_data`
- **画像**: すべて `doll_images` / `outing_images` に集約（`dolls.image_url` / `outings.image_url` は廃止）

---

## 2. ER 図（概念）

```
dolls (かぞく)
  ├── doll_images (1:N)  画像（sort_order 先頭が代表）
  ├── histories (1:N)    当選履歴
  └── outing_dolls (N:M) お出かけに一緒に

outings (お出かけ日記)
  ├── outing_dolls (N:M)  dolls と多対多
  └── outing_images (1:N) 写真
```

---

## 3. テーブル定義（リファクタ後スキーマ）

### dolls（かぞく）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 主キー |
| name | VARCHAR(255) | NOT NULL | 名前 |
| color | VARCHAR(50) | NOT NULL | 色 |
| is_selected | BOOLEAN | NOT NULL DEFAULT false | 当選済みフラグ |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

### doll_images（かぞくの画像）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| doll_id | UUID | NOT NULL, FK→dolls(id) ON DELETE CASCADE | かぞくID |
| image_url | VARCHAR(512) | NOT NULL | 画像パス（例: /uploads/dolls/xxx/yyy.jpg） |
| sort_order | INT | NOT NULL DEFAULT 0 | 表示順（先頭が代表） |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

- **インデックス**: idx_doll_images_doll_id ON (doll_id)

### histories（当選履歴）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| doll_id | UUID | NOT NULL, FK→dolls(id) ON DELETE CASCADE | 当選したかぞくID |
| doll_image_url | VARCHAR(512) | DEFAULT NULL | 当選時に表示した画像パス |
| selected_at | TIMESTAMPTZ | DEFAULT now() | 当選日時 |

- **インデックス**: idx_histories_doll_id, idx_histories_selected_at ON (selected_at DESC)

### outings（お出かけ日記）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | UUID | PK | 主キー |
| place | VARCHAR(255) | NOT NULL | 場所 |
| outing_date | TIMESTAMPTZ | NOT NULL | お出かけ日 |
| comment | TEXT | - | コメント |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

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
| image_url | VARCHAR(512) | NOT NULL | 画像パス |
| sort_order | INT | NOT NULL DEFAULT 0 | 表示順 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 登録日時 |

- **インデックス**: idx_outing_images_outing_id ON (outing_id)

---

## 4. 初期化・マイグレーション

| ファイル | 用途 |
|----------|------|
| **db/init/01_schema.sql** | 新規構築時に実行。上記スキーマをそのまま作成。 |
| **db/migrations/001_drop_legacy_image_urls.sql** | 既存 DB 用。`dolls.image_url` → `doll_images`、`outings.image_url` → `outing_images` に移行してから該当カラムを削除。 |

- 新規構築: `01_schema.sql` のみ。
- 既存 DB をリファクタ後アプリで使う: バックアップ取得後、`001_drop_legacy_image_urls.sql` を実行。手順は [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) を参照。

---

## 5. 画像の保存（アプリ側）

- 保存先: バックエンドの `uploads`（ストレージ層経由）。パス規則: `dolls/{dollId}/{uuid}.{ext}`、`outings/{outingId}/{uuid}.{ext}`。
- DB には `/uploads/...` 形式のパスを保存。フロントは API のベース URL と組み合わせて表示。

---

## 6. 関連

- [リファクタリング_設計書.md](./リファクタリング_設計書.md) … スキーマ方針
- [リファクタリング_ディレクトリ構成とデータ引継ぎ.md](./リファクタリング_ディレクトリ構成とデータ引継ぎ.md) … データ引継ぎ手順
- [folder-structure.md](./folder-structure.md) … フォルダ構成
