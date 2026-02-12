# フォルダ構成案（design.md に基づく）

## 方針
- **3コンテナ構成**（frontend / backend / postgres）に対応したディレクトリ分離
- フロント・バック・インフラを明確に分け、ロードマップの Step 1〜5 と将来拡張に対応しやすい構成

---

## 推奨ルート構成

```
doll_roulette/
├── docker-compose.yml          # 3コンテナ（frontend, backend, db）定義
├── .env.example                # 環境変数テンプレ（DB接続など）
├── .gitignore
│
├── frontend/                   # React + Vite + Tailwind（コンテナ or 開発時はホスト実行）
│   ├── package.json
│   ├── vite.config.ts          # server: { host: true } を設定
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/                # API クライアント（backend 呼び出し）
│       ├── components/         # 共通UI（ボタン、カードなど）
│       ├── pages/              # 画面単位（一覧、登録、ルーレット、履歴など）
│       ├── hooks/              # カスタムフック（dolls取得、ルーレット状態など）
│       ├── types/              # 型定義（Doll, History など）
│       └── utils/
│
├── backend/                    # Node.js + Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.ts            # エントリ・Express 起動
│   │   ├── app.ts              # Express アプリ設定（CORS, ルート）
│   │   ├── config/             # DB接続設定など
│   │   ├── db/                 # 接続・マイグレーション関連
│   │   │   ├── client.ts       # PostgreSQL クライアント
│   │   │   └── migrations/     # SQL またはマイグレーションツール用
│   │   ├── routes/             # API ルート（dolls, histories, reset）
│   │   ├── controllers/       # 各ルートの処理
│   │   ├── services/          # ビジネスロジック（ルーレット抽選など）
│   │   ├── types/             # 型定義（DB エンティティ、API 型）
│   │   └── middleware/        # エラーハンドリングなど
│   └── (tests/)               # 必要に応じて
│
├── db/                         # DB 専用リソース（オプション：backend に含めても可）
│   ├── init/                   # 初期化SQL（dolls, histories 作成）
│   │   └── 01_schema.sql
│   └── (migrations/)           # または backend 側に集約
│
└── docs/                       # 設計・メモ
    ├── design.md
    ├── folder-structure.md     # 本ドキュメント
    └── (api.md など)
```

---

## ディレクトリの役割（要点）

| パス | 役割 |
|------|------|
| `frontend/` | React SPA。かぞくたち一覧・登録・ルーレット・履歴・リセットのUI。`api/` で backend を呼ぶ。 |
| `backend/src/routes/` | 例: `/api/dolls`, `/api/dolls/:id`, `/api/outings`, `/api/histories`, `/api/roulette`, `/api/reset` など。 |
| `backend/src/services/` | ルーレットの「未選択から1体選ぶ」「全員選択済みなら終了」などのロジック。 |
| `backend/src/db/` | PostgreSQL 接続と、dolls / histories のスキーマ管理。 |
| `db/init/` | Docker で postgres 起動時に流す初期スキーマ（dolls, histories テーブル）。 |
| `docs/` | design.md や本フォルダ案、将来的に API 仕様書など。 |

---

## 将来拡張を見据えた配置

- **写真機能**: ✅ 実装済み。家族は `POST /api/dolls/:id/image`（代表1枚）・`POST /api/dolls/:id/images`（複数）・`POST /api/dolls/:id/images/remove`（1枚削除）。お出かけ日記は `POST /api/outings/:id/images`・`POST /api/outings/:id/images/remove`。`/uploads` で静的配信、`uploads_data` ボリューム。
- **認証・複数リスト（三次）**: `backend/src/` に `auth/`, `users/` などを追加しつつ、既存の `routes/` を拡張する形で対応可能。
- **クラウドデプロイ**: `docker-compose.yml` はそのまま活かしつつ、`backend/Dockerfile` や環境変数で本番用設定を分離。

---

## 補足

- **db/** は「コンテナ用の初期化だけ」にし、マイグレーションは `backend/src/db/migrations/` にまとめる運用でも問題ありません。
- フロントを Docker で動かす場合は `frontend/Dockerfile` と `docker-compose` の frontend サービスを追加。開発時は `npm run dev` をホストで実行し、backend と DB だけ Docker でも可。

この構成案をベースに、Step 1 の Docker 環境構築から順に進められます。
