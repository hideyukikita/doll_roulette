# かぞくたちルーレット 機能一覧

**完成版**。最終更新: 2026年1月

---

## 1. 実装済み機能

### インフラ・環境
- Docker Compose（db / backend / frontend 3コンテナ）
- PostgreSQL（dolls, histories, outings, outing_dolls, outing_images, doll_images テーブル）
- Vite `host: true`（スマホ接続用）
- ボリューム: postgres_data, frontend_node_modules, uploads_data
- **スマホ接続**: フロントの API 向き先は、`VITE_API_BASE_URL` 未設定かつ localhost 以外から開いた場合は「同じホスト:3000」を自動使用（日をまたいでも IP が変わってもその日の接続先で動く）

### 家族管理（DollsPage）
- **登録**: 名前・色・画像（任意・複数可）で登録（POST `/api/dolls` → POST `/api/dolls/:id/image` または POST `/api/dolls/:id/images`）
- **一覧**: 登録済みのかぞくたちを表示。**サムネイルは代表画像（doll.image_url）優先**（なければ image_urls[0]）。サブ画像の追加・削除では一覧の画像は変わらない。画像更新後はキャッシュバスターで再表示
- **詳細**: 一覧の行をタップすると手前にオーバーレイで詳細を表示。名前・色・**代表画像**（1枚）・**サブ画像**（複数）を表示し、ここから編集・削除。**代表画像・サブ画像をタップすると画像全体を表示**（お出かけ日記と同様）
- **編集**: 詳細内で名前・色・画像を変更。**代表画像**の差し替え（POST `/api/dolls/:id/image`）・削除、**サブ画像**の追加（POST `/api/dolls/:id/images`）・削除（POST `/api/dolls/:id/images/remove`、JSON body）が可能
- **削除**: 詳細内の削除ボタンから DELETE `/api/dolls/:id`（確認ダイアログあり）
- **色選択肢**: 茶色・白・ピンク・グレー・青・緑・黄・黒・オレンジ・えんじ・水色・ミント・紫・赤・その他

### 画像アップロード（家族）
- **代表1枚**: POST `/api/dolls/:id/image`（multipart/form-data）
- **複数枚追加**: POST `/api/dolls/:id/images`（multipart/form-data、`images` フィールド、枚数制限は 100 枚・家庭内運用のためファイルサイズ制限なし）
- **1枚削除**: POST `/api/dolls/:id/images/remove`（JSON body: `{ "image_url": "/uploads/..." }`）
- **形式**: JPEG / PNG / GIF / WebP
- **保存**: `/uploads` に保存、`/uploads` で静的配信。Docker: uploads_data ボリュームで永続化

### お出かけ日記（OutingsPage）
- **登録**: 場所・日付のみ・どの家族と（複数可）・写真（複数可・最大100枚）・コメント。POST `/api/outings` → 必要なら POST `/api/outings/:id/images`
- **一覧・詳細**: 一覧で概要表示、**行をタップすると手前にオーバーレイで詳細を表示**（家族一覧と同様）。詳細で「一緒に」を写真の上に表示（名前はテーマカラー反映）、複数画像はグリッド表示。背景クリックまたは「閉じる」でオーバーレイを閉じる
- **編集**: 場所・日付・一緒に・コメントを PUT `/api/outings/:id` で更新。写真は**追加**（POST `/api/outings/:id/images`）・**削除**（POST `/api/outings/:id/images/remove`、JSON body）。**写真削除時は「この画像を削除しますか？」で確認**
- **削除**: DELETE `/api/outings/:id`（確認ダイアログあり）
- **画像全体表示**: 詳細画面で写真をタップするとモーダルで画像全体を表示、背景クリックまたは×で閉じる
- **一覧の画像**: 更新後にキャッシュバスターで再表示

### ルーレット（RoulettePage）
- **円盤ルーレット**: 扇形セグメントが回転し、当選者が12時の針の位置に来て停止
- **当選ロジック**: 未選択=重み1、選択済み=重み0.008（約100〜200回に1回）
- **当選表示**: 回転停止後、結果を3秒表示。**代表画像（dolls.image_url）・サブ画像（doll_images）を合わせた中からランダムで1枚**を表示
- **当選時の画像の保存**: その回に表示した画像URLを `histories.doll_image_url` に保存し、履歴でも同じ画像を表示
- **再描画**: 3秒後、当選者を除いた円盤に再描画
- **二回目当選**: `luckySecond: true` で「二回目！」と派手な演出
- **最後の一人**: 1人用は円形セグメント＋3時のラベル。結果を3秒表示してから「全員一周」に切り替え
- **残り/全カウント**: 「残り○人 / 全○人」表示
- **ボタン文言**: 回転中・結果表示中のランダムメッセージ。結果表示中はボタン無効

### 当選履歴
- **一覧**: 当選者を一覧表示（その時に出た画像・登録色付き）。**行をタップすると手前にオーバーレイで詳細を表示**
- **詳細**: 名前（色付き）・当選日時・当選画像を表示。**画像をタップすると画像全体を表示**。削除・閉じるボタン
- **API**: GET `/api/histories`（doll_name, doll_color, **当選時に表示した画像** doll_image_url。未保存の古い履歴は dolls.image_url で表示）
- 当選履歴1件削除: DELETE `/api/histories/:id`（詳細内から削除。その子はルーレットに復活）

### リセット
- **API**: POST `/api/reset`
- `is_selected` を false に戻す + 当選履歴を DELETE。確認ダイアログあり

### 色・UI
- **色の視認性**: 白・黄など明るい色は、円盤用に `segmentFill` で調整（`utils/colors.ts`）
- **配色**: 全体的に柔らかいトーン（stone／violet／rose／amber）

---

## 2. データベース（主要テーブル）

- **dolls**: id, name, color, image_url, is_selected, created_at
- **doll_images**: id, doll_id, image_url, sort_order, created_at（家族の複数画像）
- **histories**: id, doll_id, **doll_image_url**（当選時に表示した画像）, selected_at
- **outings**: id, place, outing_date, comment, image_url, created_at
- **outing_dolls**: outing_id, doll_id
- **outing_images**: id, outing_id, image_url, sort_order, created_at

既存DBで追加対応する場合:
- 家族の複数画像: `db/init/04_doll_images.sql` を1回実行（01_schema に含まれる場合は不要）
- 当選時に表示した画像を履歴に残す: `db/init/05_histories_image_url.sql` を1回実行

---

## 3. API 一覧（画像・お出かけ関連）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/dolls | 一覧（image_urls 付き） |
| POST | /api/dolls | 登録 |
| PUT | /api/dolls/:id | 更新（名前・色） |
| POST | /api/dolls/:id/image | 代表画像1枚アップロード |
| POST | /api/dolls/:id/images | 複数画像アップロード |
| POST | /api/dolls/:id/images/remove | 画像1枚削除（body: { image_url }） |
| DELETE | /api/dolls/:id | 削除 |
| GET | /api/outings | 一覧 |
| GET | /api/outings/:id | 詳細 |
| POST | /api/outings | 登録 |
| PUT | /api/outings/:id | 更新 |
| POST | /api/outings/:id/images | 複数画像アップロード |
| POST | /api/outings/:id/images/remove | 画像1枚削除（body: { image_url }） |
| DELETE | /api/outings/:id | 日記ごと削除 |
| POST | /api/roulette/spin | ルーレットを回す（当選画像はランダム1枚・履歴に保存） |
| GET | /api/histories | 当選履歴（当選時の画像付き） |
| DELETE | /api/histories/:id | 履歴1件削除 |
| POST | /api/reset | リセット |

---

## 4. ファイル構成（主要）

```
backend/src/
  routes/    dolls, roulette, histories, reset, outings（画像アップロード・remove 含む）
  services/  dollsService, rouletteService, historiesService, resetService, outingsService
  db/        client.ts

frontend/src/
  pages/     DollsPage, RoulettePage, OutingsPage
  components/ RouletteWheel
  api/       dolls, roulette, histories, reset, outings, client
  utils/     colors.ts

db/init/
  01_schema.sql   # dolls, histories, outings, outing_dolls, outing_images, doll_images, histories.doll_image_url
  02_outings.sql  # 既存DB用（outings のみ）
  03_outing_images.sql
  04_doll_images.sql   # 既存DB用（doll_images のみ）
  05_histories_image_url.sql  # 既存DB用（histories.doll_image_url 追加）
```

---

## 5. 起動とアクセス

1. `docker compose up -d`
2. フロント: http://localhost:5173
3. API: http://localhost:3000 （ヘルス: `/api/health`）
4. スマホから使う場合は README.md の「スマホからの接続方法」を参照
