# かぞくたちルーレット 実装状況

最終更新: 2025年

---

## 1. 実装済み機能

### インフラ・環境
- Docker Compose（db / backend / frontend 3コンテナ）
- PostgreSQL（dolls, histories テーブル）
- Vite `host: true`（スマホ接続用）
- ボリューム: postgres_data, frontend_node_modules, uploads_data

### 家族管理（DollsPage）
- **登録**: 名前・色・画像（任意）で登録（POST `/api/dolls` → POST `/api/dolls/:id/image`）
- **一覧**: 登録済みのかぞくたちを表示（サムネイル付き）
- **編集**: 名前・色・画像の変更（PUT `/api/dolls/:id` + 画像アップロード）
- **削除**: 削除（DELETE `/api/dolls/:id`）
- **色選択肢**: 茶色・白・ピンク・グレー・青・緑・黄・黒・その他

### 画像アップロード
- **API**: POST `/api/dolls/:id/image`（multipart/form-data, 5MB 以下）
- **形式**: JPEG / PNG / GIF / WebP
- **保存**: `/uploads` に保存、`/uploads` で静的配信
- **Docker**: uploads_data ボリュームで永続化

### ルーレット（RoulettePage）
- **文字ルーレット**: 名前が高速で切り替わる演出（約2.5秒）
- **当選ロジック**: 未選択=重み1、選択済み=重み0.008（約100〜200回に1回）
- **当選表示**: 登録時の色と画像で当選者を表示（画像 96×96px）
- **二回目当選**: `luckySecond: true` で「二回目！」と派手な演出
- **最後の一人**: 結果を3秒表示してから「全員一周」に切り替え
- **残り/全カウント**: 「残り○人 / 全○人」表示

### 当選履歴
- **API**: GET `/api/histories`（doll_name, doll_color, doll_image_url 含む）
- その回の当選者のみ表示（リセットでクリア）
- 登録色・画像で表示

### リセット
- **API**: POST `/api/reset`
- `is_selected` を false に戻す + 当選履歴を DELETE
- 確認ダイアログあり

### 色の視認性
- 白・黄など明るい色は、背景や濃い色で調整（`utils/colors.ts`）

---

## 2. ファイル構成（主要）

```
backend/src/
  routes/    dolls（画像アップロード含む）, roulette, histories, reset
  services/  dollsService, rouletteService, historiesService, resetService
  db/        client.ts

frontend/src/
  pages/     DollsPage, RoulettePage
  api/       dolls, roulette, histories, reset, client
  utils/     colors.ts

scripts/
  Connect-WSL.ps1   # WSL2 用ポート転送
```

---

## 3. 動作確認の流れ

1. `docker compose up -d`
2. http://localhost:5173 でフロント
3. http://localhost:3000/api/health で API
4. かぞく一覧で登録（画像付き）→ 編集・削除を確認
5. ルーレットで回す → 当選表示（画像付き）・当選履歴・リセットを確認
6. スマホから接続する場合は README.md の「スマホからの接続方法」を参照
