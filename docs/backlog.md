# バックログ

優先順位順。上から着手する。

---

## A: OpenTelemetry 計装 + ローカル Jaeger バックエンド

Node.js API に OTel SDK を導入し Traces・Metrics・Logs の3シグナルを計装する。ローカル開発では Jaeger でトレースを可視化できるようにし、本番バックエンド（Datadog 等）への接続は別アイテムとする。

### ユーザーストーリー
- As a 開発者, I want to ローカルで Jaeger UI を開いてトレースを確認したい, so that Slack イベント処理の中でどの操作がボトルネックか一目で分かる
- As a 開発者, I want to OTel 計装が OTLP エクスポーター経由で抽象化されている, so that 将来 Datadog 等に繋ぎ直すときにコード変更が不要

### なぜここか（優先度の根拠）
- 機能追加が続くほど後から計装するコストが上がる（変更箇所が増える）
- Jaeger によりローカルで即座に価値を確認できる（本番環境なしでも検証可能）

### 機能仕様

#### 正常系
- `api/src/telemetry.ts` を作成し `api/src/index.ts` の最初に import する
- Traces: Slack イベントハンドラー全体・Firestore クエリ・Slack API 呼び出しをスパンで計装
- Metrics: リクエスト数・エラー率・Firestore クエリレイテンシ・Slack API 呼び出し時間
- Logs: 既存の `console.log/error` を OTel 構造化ログに移行
- `docker/compose.yml` に `jaegertracing/all-in-one` を追加（OTLP: 4318, UI: 16686）
- `OTEL_EXPORTER_OTLP_ENDPOINT` 環境変数で送信先を切り替え可能（デフォルト: Jaeger）

#### 異常系・エッジケース
- OTel バックエンドへの送信失敗: ログのみで続行、API 本体は影響を受けない
- `OTEL_EXPORTER_OTLP_ENDPOINT` 未設定: stdout エクスポーターにフォールバック
- `NODE_ENV=test` のとき計装を無効化（テスト速度・flakiness 対策）

### 実装のポイント
- `api/src/telemetry.ts`: SDK 初期化（アーキテクチャルール: `features/` に OTel 型を混入させない）
- `api/src/index.ts`: `telemetry.ts` を先頭で import（auto-instrumentation の要件）
- `features/incident/incident.repository.ts`: Firestore 操作を `tracer.startActiveSpan()` で手動スパン化
- `slack/handlers/`: Slack API 呼び出しを手動スパン化（`features/` は関与しない）
- `docker/compose.yml`: Jaeger サービス追加
- ライブラリ: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/exporter-metrics-otlp-http`

### 受け入れ条件（仮）
- [ ] `docker compose up` 後、`http://localhost:16686` で Jaeger UI が開ける
- [ ] `/inc` コマンドを送信すると Jaeger UI にトレースが表示される
- [ ] Firestore の各 CRUD 操作にスパンが作成される（operation 名・コレクション名を attribute として含む）
- [ ] Slack API 呼び出しにスパンが作成される
- [ ] OTel バックエンドが落ちていても API が正常にレスポンスを返し続ける
- [ ] `NODE_ENV=test` のとき OTel SDK が初期化されない（既存テストが変わらず通過する）

### 除外事項（今回スコープ外）
- 本番バックエンド送信設定（Datadog / Grafana Cloud 等）
- カスタムビジネスメトリクス（宣言数・MTTR 等の KPI）
- Grafana / Datadog ダッシュボード構築
- LLM がメトリクスをクエリする基盤（MCP サーバー等）

---

## I: 重大度変更（`/inc severity <level>`）

対応中にインシデントの重大度が変わった場合、`/inc severity critical` で更新。Slack メッセージも更新（F）。timeline に記録。

**実装のポイント**:
- `incidentService.updateSeverity(incidentId, severity, userId, userName)` を実装
- severity の選択肢はモーダルと同じ Severity 型を再利用

---

## L: インシデントチャンネルのトピック自動設定

チャンネル作成後、`conversations.setTopic` でトピックに `[Critical] DB障害 - 対応中` をセット。チャンネル一覧から内容が分かる。解決時は `[Resolved] DB障害` に更新。

**実装のポイント**:
- `incident-channel.ts` に `setChannelTopic` を追加
- 解決時（A の実装後）にもトピック更新を呼ぶ

---

## G: タイムラインへのメモ追記（`/inc note`）

インシデントチャンネルで `/inc note <テキスト>` を実行すると timeline に `type: "note"` で記録される。ポストモーテムの材料になる。

**実装のポイント**:
- `incidentService.addNote(incidentId, note, userId, userName)` を実装
- timeline サブコレクションへの書き込みは B で実装済みのものを再利用

---

## H: 解決時のポストモーテムテンプレート自動生成

`/inc resolve` 時に、timeline の内容（対応者・メモ・所要時間）をもとにポストモーテムのドラフトをチャンネルに投稿する。

**実装のポイント**:
- G（メモ機能）が実装済みであることが前提
- timeline を時系列で取得し、テンプレートに埋め込む
- Slack の `blocks` で見やすく整形

---

## K: リアクションによるポストモーテムタイムライン収集

Markdownの設定ファイルに指定したリアクション（`:pushpin:` など）がついたインシデントチャンネル内の投稿を、ポストモーテム生成時のタイムラインに自動で取り込む。

**ユースケース**: 対応中に重要な発見・判断・コマンド実行結果などを流れで投稿し、後から `:pushpin:` を付けるだけで自動的にポストモーテムの材料として収集される。`/inc note` との違いは「後からピン留め」できる点。

**実装のポイント**:
- 設定ファイルに `postmortem.pinReaction: "pushpin"` のような項目を追加
- `reaction_added` イベントを Bolt でハンドリング → 対象メッセージのチャンネルがインシデントチャンネルかチェック（E の `incidentChannelId` を使う）→ timeline に `type: "pinned_message"` で記録
- H のポストモーテム生成時に `pinned_message` イベントも取り込む
- H が実装済みであることが前提
