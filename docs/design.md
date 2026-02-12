# かぞくたちルーレット開発計画書（WSL2/Docker構成）

## 1. プロジェクト概要
- **目的**: 飼っているかぞくたちを平等に選び、一緒に寝る子を楽しく決める。
- **ターゲット環境**: 
    - 開発・実行：Windows WSL2 (Ubuntu) + Docker Desktop
    - 利用端末：同じWi-Fi内のスマートフォン（PCのローカルIP経由）

## 2. 技術スタック
- **Frontend**: React (TypeScript) + Vite + Tailwind CSS
- **Backend**: Node.js (Express) + TypeScript
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose (3コンテナ構成)
- **Networking**: Viteの `--host` 設定およびWSL2ポート転送を考慮

## 3. 主要機能 (一次開発フェーズ)
### A. かぞくたち管理
- **登録機能**: 名前・色・画像（任意）を選択して登録。
- **一覧表示**: 登録済みのかぞくたちを確認、編集・削除・新しい子の追加。
### B. ルーレット機能
- **演出**: 選ばれていない子の中からランダムに回転・決定する楽しい演出。
- **ロジック (パターンB)**: 
    - 一度選ばれた子は `is_selected: true` となり、次回の対象から外れる(めちゃめちゃ確率低い状態に)。
    - 全員が選ばれたら「全員一周したよ！」と表示し、ルーレットを停止する。
- **UI表示**: 「残り○人 / 全○人」のカウンター表示、当選履歴（日時・画像付き）。当選時は登録画像を表示。
### C. 履歴・リセット
- **手動リセット**: リセットボタン押下で、全かぞくの `is_selected` を `false` に戻す。リセット時には間違い防止の確認。

## 4. データベース設計 (ER図案)
### dolls テーブル
- `id`: UUID (Primary Key)
- `name`: VARCHAR(255)
- `color`: VARCHAR(50)
- `image_url`: VARCHAR(255) (NULL可 / 二次開発の写真機能用)
- `is_selected`: BOOLEAN (Default: false)

- 「将来的に写真機能（画像URLの保存）を追加する予定なので、dolls テーブルの設計には拡張性を持たせておいてください」

### histories テーブル
- `id`: UUID (Primary Key)
- `doll_id`: UUID (Foreign Key)
- `doll_image_url`: VARCHAR(255) (NULL可) — 当選時に表示した画像URL（複数画像からランダムで選んだ1枚を保存）
- `selected_at`: TIMESTAMP (Default: now)


## 5. ロードマップ
- **Step 1**: WSL2/Docker環境構築 (docker-compose, Viteのhost設定)
- **Step 2**: DB接続設定 & API作成 (かぞくたち一覧・登録)
- **Step 3**: フロントエンド画面作成 (登録・一覧)
- **Step 4**: ルーレット演出 & 当選ロジック実装
- **Step 5**: 履歴・リセット機能実装

## 6. 将来の拡張ロードマップ
### 二次開発フェーズ（一部実装済み）
- **写真登録機能**: ✅ 実装済み。登録・編集時に画像アップロード（家族は複数枚・追加/削除）、当選時・履歴に表示。
- **お出かけ日記**: ✅ 実装済み。場所・日付・一緒に・写真（複数）・コメント。編集・削除・詳細で画像タップで全体表示。
- **ルーレット当選画像**: ✅ 登録画像からランダム1枚を表示し、そのURLを履歴に保存。
- **モバイル最適化**: スマホ用UI調整。API向き先は同一ホストで自動判定可能。
### 三次開発フェーズ
- **クラウドデプロイ**: Supabase / Render等への移行。
- **認証・複数リスト**: ログイン機能、用途別リスト作成。

## 7. WSL2/Ubuntu 実行時の注意点
- `vite.config.ts` で `server: { host: true }` を設定し、WSL2外部（スマホ）からの接続を許可する。
- `docker-compose.yml` でボリュームマウント時のパーミッションエラーを防ぐ設定を行う。

## 8. 実装上の重要ルール（トラブル防止）

### CORS (Cross-Origin Resource Sharing) の設定
- バックエンド（Express）を作成する際は、必ず `cors` パッケージを導入する。
- フロントエンド（Vite: 5173ポートなど）からのリクエストを許可する設定を最初から含めること。

### 環境変数 (.env) の管理
- プロジェクトルートの `.env` で一括管理し、Docker Compose 経由で各コンテナへ注入する方式を採用する。
- DB接続情報（POSTGRES_USER, PASSWORD, DB, HOST, PORT）を共通化し、フロントエンドからもバックエンドのURL（スマホ接続用IPを含む）を参照可能にする。

### ネットワーク接続（スマホ利用）
- バックエンドのAPIエンドポイントは `localhost` ではなく、WSL2のホストIPアドレス経由でも疎通できるように設定する。
