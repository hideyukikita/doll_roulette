# かぞくたちルーレット 現状サマリ

最終確認: 2025年

---

## 1. 実装済み（動作する想定）

### インフラ・環境
- Docker Compose（db / backend / frontend 3コンテナ）
- PostgreSQL（dolls, histories テーブル）
- Vite `host: true`（スマホ接続用）
- portproxy 用 PowerShell スクリプト（docs/step1-verify.md）

### かぞく一覧・登録・削除
- **DollsPage**: 名前・色で登録、一覧表示、削除
- **API**: GET/POST/DELETE `/api/dolls`
- 色は登録時の選択をそのまま使用

### ルーレット
- **円形ルーレット盤**（SVG、扇形セグメント、色付き）
- **回転演出**（3秒、CSS transition）
- **当選ロジック**: 未選択=重み1、選択済み=重み0.008（約100〜200回に1回）
- **二度当選**: `luckySecond: true` で「ラッキー！二度目だね！」表示
- **円盤表示**: `wheelDolls = dolls.filter(d => !d.is_selected)` で未選択のみ表示

### 当選履歴
- **API**: GET `/api/histories`
- 日時付きで一覧表示

### リセット
- **API**: POST `/api/reset`（`UPDATE dolls SET is_selected = false`）
- 確認ダイアログあり

### 針
- HTML/CSS のオーバーレイ（三角形＋赤丸、`z-20`）
- ルーレット上部に配置

---

## 2. 既知の不具合・要確認

### バックエンド（要修正）
| 箇所 | 内容 |
|------|------|
| `rouletteService.ts` L81 | `wasAlreadySelected` が未定義のまま参照されている。`const wasAlreadySelected = selected.is_selected;` を追加する必要あり。 |

### フロントエンド
| 箇所 | 内容 |
|------|------|
| 円盤の再描画 | 3秒後に `getDolls()` で再取得して `setDolls`。`key={wheelDolls.map(d=>d.id).join(",")}` で再マウントする想定だが、以前は削除されていた。 |
| 針の表示 | HTML オーバーレイで実装済み。親の `position: relative` やサイズによっては位置がずれる可能性あり。 |
| 針と当選位置の一致 | 以前「針が指す子と結果が違う」報告あり。角度計算を修正したが、未検証。 |

### リセット
| 箇所 | 内容 |
|------|------|
| リセット失敗 | `UPDATE dolls SET is_selected = false` に変更済み。失敗する場合は CORS・ネットワーク・DB 接続を確認。 |

---

## 3. ファイル構成（主要）

```
backend/src/
  routes/    dolls, roulette, histories, reset
  services/  dollsService, rouletteService, historiesService, resetService
  db/        client.ts
  config/    db.ts

frontend/src/
  pages/     DollsPage, RoulettePage
  components/ RouletteWheel
  api/       dolls, roulette, histories, reset, client
```

---

## 4. 動作確認の流れ

1. `docker compose up -d`
2. http://localhost:5173 でフロント
3. http://localhost:3000/api/health で API
4. かぞく一覧で登録 → ルーレットで回す → 当選履歴・リセットを確認

---

## 5. 修正が必要な箇所（優先）

1. **rouletteService.ts**: `wasAlreadySelected` の定義を追加（二度当選が動かない原因の可能性）
2. **リセット**: ブラウザの開発者ツール（Network）で POST /api/reset のレスポンス・エラーを確認
3. **円盤の再描画**: `RouletteWheel` に `key` を付与して、`wheelDolls` 変更時に再マウントするか確認
