# Oracle Cloud 上でのベストな構成

かぞくたちルーレットを Oracle Cloud で運用するときの**推奨構成**です。せっかくクラウドに載せるなら、VM 容量を圧迫せず・永続性とセキュリティを押さえた形にします。

---

## 1. 推奨する構成一覧

| 項目 | ベストな選択 | 理由 |
|------|----------------|------|
| **画像の保存先** | **OCI Object Storage** | VM のディスクを消費しない。Always Free 20 GB。VM 再作成しても画像は残る。 |
| **DB の永続化** | **Block Volume をアタッチ**（推奨） | VM のブートボリュームだけだと再作成で DB が消える。Block Volume に postgres_data を置けば VM を差し替えても DB が残る。 |
| **HTTPS** | **Let's Encrypt（certbot）** | 通信と Cookie を保護。パブリック公開なら必須。 |
| **入室制限** | **APP_PASSWORD**（実装済み） | 家族以外を遮断。 |
| **CORS** | **ALLOWED_ORIGIN を本番 URL に設定** | 他サイトから API を叩かれないようにする。 |
| **アイドル対策** | **cron または UptimeRobot** | 7 日間無アクセスでのインスタンス回収を避ける。 |
| **バックアップ** | **Block Volume のバックアップ** または **pg_dump を Object Storage に退避** | 障害時に復旧しやすくする。 |

---

## 2. Object Storage を使う場合（画像）

- **ストレージ種別**: アプリの環境変数で **`STORAGE_TYPE=oci`** を指定すると、画像の保存・削除・取得が OCI Object Storage（S3 互換 API）経由になります。
- **必要な設定**（本番 .env など）:
  - `OCI_OS_NAMESPACE` … テナントの Object Storage ネームスペース（OCI コンソールの「オブジェクト・ストレージ」で確認）
  - `OCI_OS_BUCKET` … 画像用バケット名
  - `OCI_OS_REGION` … リージョン（例: `ap-tokyo-1`）
  - `OCI_OS_ACCESS_KEY_ID` … Customer Secret Key の Access Key
  - `OCI_OS_SECRET_ACCESS_KEY` … Customer Secret Key の Secret Key
- **バケットの作成**: OCI コンソールで「オブジェクト・ストレージ」→ バケット作成。**公開アクセスは「オブジェクト読取り」なし**のまま（画像はバックエンド経由で配信し、認証をかけるため）。
- **Customer Secret Key**: IAM → ユーザー → 「Customer secret keys」で Access Key / Secret Key のペアを発行し、上記の環境変数に設定。
- **挙動**: アップロード時は Object Storage に PUT、一覧・表示はバックエンドの `/uploads/...` 経由でストレージから取得して配信（認証付き）。

### Object Storage の設定手順（OCI コンソール）

1. **ネームスペースの確認**  
   コンソール → **オブジェクト・ストレージ** → **バケット**。画面上部または「バケットの作成」ダイアログ内に「ネームスペース」が表示されます。これを `OCI_OS_NAMESPACE` に設定します。

2. **バケットの作成**  
   **バケットの作成** → 名前（例: `doll-roulette-images`）を入力。ストレージクラスは「Standard」、**公開アクセスは「オブジェクト読取り」なし**（画像はバックエンド経由で配信するため）。作成後、バケット名を `OCI_OS_BUCKET` に設定します。

3. **Customer Secret Key の作成**  
   **プロファイル**（右上）→ **ユーザー設定** → 左の **Customer secret keys** → **Generate Secret Key**。表示名を入力して生成し、**Secret Key を一度だけ表示されるので必ずコピー**。Access Key は一覧に表示されるので、それぞれ `OCI_OS_ACCESS_KEY_ID` と `OCI_OS_SECRET_ACCESS_KEY` に設定します。

4. **IAM ポリシー**  
   そのユーザーが Object Storage のバケットに読み書きできるよう、コンパートメントにポリシーを追加します。例:  
   `Allow group 対象グループ to manage object-family in compartment 対象コンパートメント`  
   またはユーザー直付け:  
   `Allow user 対象ユーザー to manage object-family in compartment 対象コンパートメント`

5. **本番 .env**  
   VM 上で上記 5 つ（`STORAGE_TYPE=oci` と OCI_OS_*）を設定し、バックエンドを再起動。既存画像を Object Storage に移す場合は、別途スクリプトや手動で PUT する必要があります（初回移行時は VM の uploads のまま運用し、新規アップロード分だけ OCI に載せる運用も可能）。

---

## 3. Block Volume で DB を永続化する場合

- VM のブートボリュームだけに DB を置くと、**VM を削除・再作成すると DB が消えます**。
- **Block Volume** を 1 本作成し、VM にアタッチして `/mnt/block` などにマウント。その上に `postgres_data` 用ディレクトリを置き、Docker のボリュームをそこに向ける。
- 手順の詳細は [Oracle移設_環境構築と改変手順.md](./Oracle移設_環境構築と改変手順.md) の「ブロックボリュームの追加」を参照。
- Always Free では Block Volume 合計 200 GB まで無料。

---

## 4. その他の推奨

- **リージョン**: 日本からなら **東京（ap-tokyo-1）** がレイテンシ的に有利。キャパ不足時は大阪を検討。
- **タグ・コンパートメント**: リソースにタグを付けておくと、のちのコスト把握や整理がしやすい。
- **ログ**: Nginx のアクセスログとバックエンドのエラーログの出力先を決め、不審なアクセスや障害時に追いかけやすくする。

---

## 5. まとめ

- **画像** → **Object Storage**（`STORAGE_TYPE=oci`）で VM 容量を圧迫しない。
- **DB** → **Block Volume** にデータを置いて永続化。
- **HTTPS・パスワード・CORS・アイドル対策・バックアップ** を押さえれば、Oracle Cloud 上でのベストに近い構成になります。

Object Storage の具体的な設定手順（バケット作成・Customer Secret Key・環境変数）は、[Oracle移設_データ引継ぎとリファクタ移設手順.md](./Oracle移設_データ引継ぎとリファクタ移設手順.md) の「Object Storage を使う場合」または本ドキュメントの「2. Object Storage を使う場合」を参照してください。
