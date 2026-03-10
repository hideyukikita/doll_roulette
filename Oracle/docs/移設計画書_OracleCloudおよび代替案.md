# かぞくたちルーレット クラウド移設計画書

**作成日**: 2026年2月  
**目的**: PC常時起動運用からクラウド（Oracle Cloud 無料枠を中心）への**移設のみ**を扱う。完全無料が厳しい場合の代替案・コスパ比較を含む。

**前提**: リファクタリングは実施済み。Oracle へ移設する際の**環境構築と改変の具体的な手順**は [Oracle移設_環境構築と改変手順.md](./Oracle移設_環境構築と改変手順.md) を参照。本計画書は無料枠・リソース・代替案の整理用。

---

## 1. Oracle Cloud は「ずっと無料」で使えるか

### 結論：**Always Free リソースは永続無料**

| 種別 | 内容 |
|------|------|
| **無料トライアル** | 30日間・300米ドル相当のクレジット。期限またはクレジット切れで終了。 |
| **Always Free** | **アカウントの有効期間中、期限なしで無料**。トライアル終了後も継続利用可能。 |

- 出典: [Oracle Cloud Free Tier 公式](https://docs.oracle.com/ja-jp/iaas/Content/FreeTier/freetier.htm)、[Always Free リソース一覧](https://docs.oracle.com/ja-jp/iaas/Content/FreeTier/resourceref.htm)（2025年8月更新）
- Always Free は**ホームリージョン**内でのみ利用可能。登録時に選んだリージョンを変更できないため、初期選択が重要。

### 注意点

- **アイドルインスタンスの回収**: 7日間、CPU・メモリ・ネットワークの利用率がすべて 20% 未満の場合、Always Free の VM は Oracle に回収される可能性あり（主に A1 Flex に適用）。
- **Ampere A1 の上限超過**: 無料枠（4 OCPU・24 GB 合計）を超えて A1 インスタンスを作っていると、トライアル終了から 30 日後に超過分は削除される（有料アップグレードしない場合）。

---

## 2. Oracle Cloud Always Free の主なリソース（本アプリで利用想定）

| リソース | Always Free 枠 | 備考 |
|----------|----------------|------|
| **Compute (AMD)** | VM.Standard.E2.1.Micro **最大2台** | 1 OCPU、1 GB メモリ。メモリが厳しい。 |
| **Compute (Arm)** | **4 OCPU・24 GB 合計**（月 3,000 OCPU 時間・18,000 GB 時間） | VM.Standard.A1.Flex。例: 1 台で 2 OCPU・12 GB など。 |
| **Block Volume** | **合計 200 GB** | ブートボリューム＋追加ボリュームの合計。バックアップ 5 個まで無料。 |
| **Object Storage** | **20 GB** | 画像保存の候補。S3 互換 API。 |
| **アウトバウンド転送** | **月 10 TB** | 通常の Web アプリ運用で不足しにくい。 |
| **Autonomous Database** | 2 インスタンス | 本アプリは PostgreSQL 想定のため、別途 VM 上で PostgreSQL を立てる運用が現実的。 |
| **MySQL HeatWave** | 1 システム（50 GB ストレージ等） | PostgreSQL ではないが、DB をマネージドにしたい場合の選択肢。 |

- E2.1.Micro は **1 GB メモリ** のため、Docker で 3 コンテナ（DB・backend・frontend）を 1 台に載せる場合は **Ampere A1（2 OCPU・12 GB など）を推奨**。
- 複数 AD があるリージョンでは、E2.1.Micro は **1 つの AD にのみ**作成可能。A1 は AD を選べる。

---

## 3. Oracle Cloud 無料枠の効率的な利用方法

### 3.1 インスタンス選定

- **本アプリ推奨**: **Ampere A1 Flex を 1 台**（例: 2 OCPU・12 GB）。Docker Compose で db / backend / frontend を同居させる場合に現実的。
- E2.1.Micro（1 GB）単体では PostgreSQL + Node + Vite は厳しい。使う場合は Ubuntu Minimal 化・不要サービス停止などでメモリを絞る必要あり（[参考: Qiita](https://qiita.com/ynott/items/4312cb34611d2e462779)）。

### 3.2 リソース管理

- **コンパートメント**: プロジェクト単位で分け、コスト（将来有料化した場合）の把握をしやすくする。
- **タグ**: リソースにコスト追跡タグを付与（OCI のコスト管理のベストプラクティス）。
- **Cloud Advisor**: 未使用ボリューム・アイドルリソースを定期的に確認し、Always Free 枠内で整理。

### 3.3 アイドル回収を避ける

- 7 日間の低稼働で回収されないよう、**軽い定期アクセス（cron や外部監視）** を検討。
- 開発・検証用でどうしてもアイドルになる場合は、重要なデータはバックアップし、回収後は再作成で対応。

### 3.4 ホームリージョン

- 登録時に選んだリージョンが Always Free の対象。**日本（東京等）** を選んでおくとレイテンシが良い。
- 「out of host capacity」が出た場合は、別 AD で再試行するか、時間をおいて再度作成。

### 3.5 ブロックボリューム 200 GB の使い方

- ブート 50 GB × 1 台で 50 GB 消費。残り 150 GB で追加ボリューム（DB データ・**uploads の永続化**）を検討。
- **移設のみ（リファクタなし）**の場合、画像は現状どおり VM 上のボリューム（`uploads_data`）に保存する。

---

## 4. 移設時の扱い（現状のアプリのまま）

リファクタリングは別計画のため、**移設時はコード・DB・ディレクトリ・画像保存を変えず**、次の点だけ整える。

| 項目 | 移設時の対応（変更最小） |
|------|---------------------------|
| **画像** | 現状どおり `/uploads`。Docker の `uploads_data` を **ブロックボリューム**（または VM の永続ディスク）にマウントして永続化。 |
| **DB** | 現状の PostgreSQL（Docker）を 1 VM 内で稼働。`db/init/01_schema.sql` で初回初期化。接続情報は環境変数のみ。 |
| **設定** | 本番用 `.env` はサーバー上のみに配置（または OCI メタデータ／Vault）。リポジトリには含めない。 |
| **フロント** | `VITE_API_BASE_URL` を本番の API の URL に設定（ビルド時または実行時）。 |

※ DB設計・ディレクトリ構成・画像を Object Storage に移すなどは **[リファクタリング計画書](./リファクタリング計画書.md)** で扱う。移設後に「クラウド移設用のリファクタリング」として実施する想定。

---

## 5. 完全無料が厳しい場合の代替案・コスパ比較

Always Free 以外にも、**無料枠があるサービス**や**低単価の VPS** を並べて比較する。

### 5.1 比較表（概要）

| サービス | 無料枠・低価格帯 | 本アプリとの相性 | 注意点 |
|----------|------------------|------------------|--------|
| **Oracle Cloud Always Free** | 上記の通り永続無料（Compute + Block + Object Storage） | ◎ 1 VM に Docker で全載せ（画像は VM ボリュームで可。Object Storage はリファクタ時） | アイドル回収・リージョン固定・キャパ「out of host capacity」 |
| **Railway** | $5/月クレジット、500 実行時間/月等（無料枠は縮小傾向） | ○ Node + Postgres 対応。デプロイが簡単 | 無料枠だけでは 24/7 は難しい。クレジット切れで停止 |
| **Render** | 750 時間/月無料、15 分アイドルでスリープ。Postgres は 90 日で消える | △ スリープでコールドスタート。DB は無料だと一時的 | 常時起動したい場合は有料。Postgres 無料は検証向け |
| **Fly.io** | 無料枠あり（共有 CPU VM 等）。約 $10.70/月〜の有料 | ○ Docker デプロイ可能。リージョン選択可 | 無料枠の範囲内で収める必要あり |
| **VPS（例: ConoHa, さくら, AWS Lightsail 等）** | 月額数百円〜（例: 512 MB〜1 GB） | ○ フルコントロール。現在の Docker 構成をそのまま使える | 完全無料ではない。管理は自己責任 |

### 5.2 コスパの考え方

- **完全無料で 24/7 を狙う**: **Oracle Cloud Always Free** が現実的。アイドル対策（軽い定期アクセス）をし、画像は現状どおり VM のボリュームで運用。移設後のリファクタで Object Storage に移すことも可能。
- **「できるだけ安く」でよい**: **低価格 VPS**（月額 200〜500 円程度）で 1 台に Docker 構成をそのまま載せるのが分かりやすい。Oracle の設定や回収リスクを避けたい場合に有利。
- **手軽さ優先**: **Railway** や **Render** は GitHub 連携でデプロイしやすいが、無料枠だけでは常時稼働は難しい。有料にすると月 $5〜10 程度になるため、VPS と比較して「手間を払うか・金を払うか」の選択になる。

### 5.3 推奨の整理

| 優先度 | 選択肢 | 条件 |
|--------|--------|------|
| 1 | **Oracle Cloud Always Free** | 完全無料で 24/7 運用したい。Ampere A1 を 1 台。画像は現状どおり VM のボリュームで可（Object Storage はリファクタ時）。 |
| 2 | **低価格 VPS** | 無料の制約（回収・キャパ）を避けたい。月数百円で現状の Docker 構成をほぼそのまま移行。 |
| 3 | **Railway / Render（有料）** | デプロイの手軽さを最優先。月 $5〜10 程度の予算あり。 |

---

## 6. 移設の進め方（Oracle Cloud を選ぶ場合のステップ）

**前提: 現状のアプリのまま。リファクタリングは行わない。**

1. **Oracle Cloud アカウント作成**  
   - ホームリージョンは **東京**（または利用したいリージョン）を選択。
2. **Always Free Compute の作成**  
   - VM.Standard.A1.Flex を 1 台（例: 2 OCPU・12 GB）、Ubuntu 22.04 等。  
   - 必要に応じてブロックボリュームを追加（200 GB 枠内）。**uploads 用**にボリュームをマウントする場合は、そのボリュームを Docker の `uploads_data` に割り当てる。
3. **ネットワーク設定**  
   - インスタンスにパブリック IP を付与、セキュリティリストで 22（SSH）, 80, 443, 3000, 5173 等を必要に応じて開放（本番は Nginx で 80/443 にまとめることを推奨）。
4. **アプリ側の準備（変更最小）**  
   - 環境変数で DB 接続情報を渡す（既存の `DB_HOST`, `POSTGRES_*` 等）。  
   - 画像は **現状どおり** バックエンドの `/uploads`（Docker ボリュームで永続化）。Object Storage への変更は行わない。
5. **サーバー上でのセットアップ**  
   - Docker / Docker Compose をインストール。  
   - リポジトリを clone またはデプロイし、`db/init/01_schema.sql` で DB 初期化。  
   - 本番用 `.env` はサーバー上でのみ配置（または OCI のメタデータ／Vault から取得）。  
   - `docker-compose.yml` の `uploads_data` を、追加したブロックボリュームのマウント先に変更するか、デフォルトのまま（VM ローカル）で運用。
6. **Nginx のリバースプロキシ（推奨）**  
   - 80/443 で受け、backend (3000) と frontend (5173 またはビルドした静的ファイル) に振り分け。  
   - HTTPS は Let's Encrypt 等で取得。
7. **アイドル対策**  
   - 外部の uptime 監視や cron で定期的に `/api/health` にアクセスする等、軽い負荷をかける。

---

## 7. 参照リンク

- [Oracle Cloud Free Tier](https://www.oracle.com/jp/cloud/free/)
- [Always Free リソース一覧（公式）](https://docs.oracle.com/ja-jp/iaas/Content/FreeTier/resourceref.htm)
- [Always Free の詳細（Compute / Block / Object Storage）](https://docs.oracle.com/ja-jp/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Free Tier よくある質問](https://www.oracle.com/jp/cloud/free/faq/)

---

## 8. ドキュメント更新履歴

| 日付 | 内容 |
|------|------|
| 2026年2月 | 初版作成。Oracle Cloud 永続無料の確認、効率的利用、代替案・コスパ比較を記載。 |
| 2026年2月 | クラウド移設とリファクタリングを分離。移設は「現状のアプリのまま」に限定。設計見直しはリファクタリング計画書へ分離。 |
