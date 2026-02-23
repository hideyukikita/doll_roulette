# フォルダ・ディレクトリ構成

**完成版**。実装に基づく現在の構成です。

---

## ルート構成

```
doll_roulette/
├── docker-compose.yml          # 3コンテナ（db, backend, frontend）定義
├── .env.example                # 環境変数テンプレ（DB接続・VITE_API_BASE_URL 等）
├── .gitignore
│
├── frontend/                   # React + Vite + Tailwind（コンテナ実行）
├── backend/                    # Node.js + Express + TypeScript
├── db/                         # DB 初期化用 SQL
├── scripts/                    # 運用スクリプト（WSL2 ポート転送等）
└── docs/                       # 設計・仕様ドキュメント
```

---

## frontend/

| パス | 説明 |
|------|------|
| `package.json` | 依存関係・スクリプト |
| `vite.config.ts` | Vite 設定（`server: { host: true }` でスマホ接続対応） |
| `tsconfig.json` | TypeScript 設定 |
| `tailwind.config.js` | Tailwind CSS 設定 |
| `index.html` | エントリ HTML |
| `public/` | 静的ファイル |
| **src/** | ソースコード |
| `src/main.tsx` | エントリ |
| `src/App.tsx` | ルートコンポーネント・ルーティング |
| `src/index.css` | グローバルスタイル |
| **src/api/** | API クライアント（backend 呼び出し） |
| `src/api/client.ts` | ベースURL・apiUrl() |
| `src/api/dolls.ts` | 家族 CRUD・画像アップロード・削除 |
| `src/api/outings.ts` | お出かけ日記 CRUD・画像 |
| `src/api/histories.ts` | 当選履歴取得・削除 |
| `src/api/roulette.ts` | ルーレット spin |
| `src/api/reset.ts` | リセット |
| **src/pages/** | 画面単位 |
| `src/pages/DollsPage.tsx` | かぞく一覧・登録・詳細オーバーレイ・編集・削除 |
| `src/pages/OutingsPage.tsx` | お出かけ日記 一覧・登録・詳細オーバーレイ・編集・削除 |
| `src/pages/RoulettePage.tsx` | ルーレット・当選表示・当選履歴・リセット |
| **src/components/** | 共通UI |
| `src/components/RouletteWheel.tsx` | 円盤ルーレットコンポーネント |
| **src/types/** | 型定義 |
| `src/types/doll.ts` | Doll 型 |
| **src/utils/** | ユーティリティ |
| `src/utils/colors.ts` | 色名→スタイル（円盤・ラベル用） |

---

## backend/

| パス | 説明 |
|------|------|
| `package.json` | 依存関係・スクリプト |
| `tsconfig.json` | TypeScript 設定 |
| `Dockerfile` | コンテナビルド |
| **src/** | ソースコード |
| `src/index.ts` | エントリ・HTTP サーバ起動 |
| `src/app.ts` | Express アプリ（CORS・ルート・静的配信 `/uploads`） |
| **src/config/** | 設定 |
| `src/config/db.ts` | DB 接続パラメータ |
| **src/db/** | DB 接続 |
| `src/db/client.ts` | PostgreSQL クライアント（pg.Pool） |
| **src/routes/** | API ルート |
| `src/routes/dolls.ts` | /api/dolls（CRUD・画像アップロード・remove） |
| `src/routes/outings.ts` | /api/outings（CRUD・画像・remove） |
| `src/routes/histories.ts` | /api/histories（取得・削除） |
| `src/routes/roulette.ts` | /api/roulette/spin |
| `src/routes/reset.ts` | /api/reset |
| **src/services/** | ビジネスロジック |
| `src/services/dollsService.ts` | 家族の取得・登録・更新・削除・画像 |
| `src/services/outingsService.ts` | お出かけの CRUD・画像 |
| `src/services/historiesService.ts` | 履歴取得・削除 |
| `src/services/rouletteService.ts` | 抽選ロジック（重み・当選画像選択） |
| `src/services/resetService.ts` | 全員 is_selected リセット・履歴削除 |
| **src/types/** | 型定義 |
| `src/types/doll.ts` | Doll 等 |
| `src/types/outing.ts` | Outing 等 |
| `src/types/history.ts` | History 等 |

---

## db/

| パス | 説明 |
|------|------|
| **init/** | 初期化 SQL（PostgreSQL コンテナの `/docker-entrypoint-initdb.d` で実行） |
| `init/01_schema.sql` | メインスキーマ（dolls, histories, outings, outing_dolls, outing_images, doll_images） |
| `init/02_outings.sql` | 既存DB用：outings 系のみ |
| `init/03_outing_images.sql` | 既存DB用：outing_images |
| `init/04_doll_images.sql` | 既存DB用：doll_images |
| `init/05_histories_image_url.sql` | 既存DB用：histories.doll_image_url 追加 |

※ 新規構築時は `01_schema.sql` のみで全テーブル作成。02〜05 は既存 DB への追加用。

---

## docs/

| ファイル | 説明 |
|----------|------|
| design.md | 仕様・技術スタック・開発履歴・将来拡張 |
| folder-structure.md | 本ドキュメント（フォルダ構成） |
| db-structure.md | DB 構成（テーブル定義・ER・初期化） |
| STATUS.md | 機能一覧・API 一覧・起動方法 |
| 基本設計書.md | 基本設計（概要・スコープ・機能概要・非機能） |
| 詳細設計書.md | 詳細設計（モジュール・DB・API・画面・処理） |
| roulette-wheel-spec.md | ルーレット円盤の仕様 |
| 修正依頼-対応メモ.md | 修正履歴メモ（任意） |

---

## 関連

- **DB のテーブル定義・ER・インデックス** → [db-structure.md](db-structure.md)
- **機能・API 一覧** → [STATUS.md](STATUS.md)
