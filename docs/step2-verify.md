# Step 2 動作確認（DB 接続 & ぬいぐるみ API）

## 概要
- バックエンドが PostgreSQL に接続し、ぬいぐるみの**一覧・登録・削除** API を提供します。
- フロントエンド画面は Step 3 で作成します。

---

## 1. 起動

```bash
docker compose up --build -d
```

バックエンドは DB の起動完了後に開始されます。  
初回ビルドで `pg` が入るため、backend のビルドに少し時間がかかります。

---

## 2. API 動作確認

### 2.1 一覧取得（GET /api/dolls）

```bash
curl -s http://localhost:3000/api/dolls
```

- **期待**: `[]`（初期は空配列）

### 2.2 登録（POST /api/dolls）

```bash
curl -s -X POST http://localhost:3000/api/dolls \
  -H "Content-Type: application/json" \
  -d '{"name":"くまさん","color":"茶色"}'
```

- **期待**: 201 と登録された 1 件の JSON（id, name, color, image_url, is_selected, created_at）

### 2.3 一覧取得（再確認）

```bash
curl -s http://localhost:3000/api/dolls
```

- **期待**: 1 件の配列

### 2.4 削除（DELETE /api/dolls/:id）

登録レスポンスの `id` をコピーし、`<ID>` を置き換えて実行:

```bash
curl -s -X DELETE http://localhost:3000/api/dolls/<ID>
```

- **期待**: 204 No Content。再度 GET /api/dolls で `[]` になること。

---

## 3. エラー時の確認

| 現象 | 確認 |
|------|------|
| 500 / 接続エラー | DB が起動しているか `docker compose ps` で確認。backend を再起動: `docker compose restart backend` |
| 400 name と color は必須 | POST の body に `name` と `color`（文字列）が含まれているか確認 |
| 404 指定のぬいぐるみが見つかりません | DELETE の ID が正しいか、既に削除済みでないか確認 |

---

## 4. 次のステップ

Step 3 でフロントエンドに「登録・一覧」画面を実装します。
