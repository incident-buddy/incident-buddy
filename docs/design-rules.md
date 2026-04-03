# Design Rules

このファイルは `/feature-dev` ワークフローのテックリードレビューで指摘された事項を蓄積するドキュメントです。
新機能の実装方針を検討する際は、ここに記載されたルールを参照してください。

<!-- 新しいルールは該当セクションの末尾に追加する -->

## アーキテクチャ

- [2026-03-22 incident-close] `addTimelineEvent()` の引数は `Date` 型で受け取り、repository 内で `Timestamp.fromDate(event.occurredAt)` に変換する。service 層で `Timestamp.now()` を使わない。
- [2026-03-22 incident-close] `resolve()` など Firestore に日時を書き込むメソッドは `FieldValue.serverTimestamp()` ではなく、service 層で `new Date()` を生成して repository に渡し、repository 内で `Timestamp.fromDate(resolvedAt)` に変換する。`serverTimestamp()` はラウンドトリップ後でないと取得できないため、`resolve()` 直後の `findById()` で値が null になるリスクがある。
- [2026-03-22 incident-close] `slack/handlers/` から `repository` を直接呼び出す既存コード（`incidentRepository.updateIncidentChannelId` 等）は技術的負債として認識する。新機能では必ず `service` 経由とする。

## アーキテクチャ（追加）

- [2026-04-04 inc-list] Firestore クエリには必ず `.limit()` を付ける。アプリ側で `slice()` する実装は、全件取得後に切り捨てるためコスト・メモリ効率が悪い。クエリ制限はリポジトリ層の責務。
- [2026-04-04 inc-list] スラッシュコマンドのエラーハンドリングは `respond()` で ephemeral エラーを返す。`postError()` でチャンネルに投稿すると、コマンド実行者以外にも見える場合があり UX が不整合になる。

## テスト

- [2026-03-22 incident-close] `presenter.test.ts` には `resolved` 状態の表示ケース（解決者名・経過時間・ボタン非表示）のユニットテストを追加すること。E2E でカバーされていても presenter の振る舞いは直接テストが望ましい。
- [2026-03-22 incident-close] `service.test.ts` には主要なメソッド（`resolve()` など）のユニットテストを追加すること。モック前提のユニットテストは E2E よりも高速にフィードバックを得られる。

## テスト（追加）

- [2026-04-04 inc-list] 「現在時刻」に依存する presenter 関数はテスタブルな純粋関数にするため `now: Date` を引数で受け取る。呼び出し元（handler）が `new Date()` を生成して渡す。

## エラーハンドリング

- [2026-03-22 incident-close] "失敗してもログのみ継続" 処理は handler 内でインライン `try-catch` を書かず、自己完結した内部 `try-catch` を持つ関数（`tryXxx()` 命名）として切り出す。これにより仕様が関数シグネチャに表れ、呼び出し元がシンプルになる。
- [2026-03-22 error-handling-pattern] 失敗時の責務に応じて関数シグネチャを使い分ける。「失敗しても無視してよい」処理は `tryXxx()` 命名・返り型 `void`（内部で `try-catch` を完結させ例外を伝播させない）。「失敗時に呼び出し元がハンドリングを必要とする」処理は関数固有の `Result` 型（`{ ok: true; data: T } | { ok: false; error: unknown }` 等）を返す。どちらも handler 内にインライン `try-catch` を書かない点は共通。
- [2026-03-22 incident-close] `view_submission` ハンドラーでは `await ack()` を先頭で呼ぶ（Slack の 3 秒制限対応）。`AlreadyResolvedError` などの業務エラーは `ack()` 後に `chat.postMessage` で通知する（モーダル内のインラインエラーは表示不可）。

## 型設計

- [2026-03-22 incident-close] `JSON.parse` の結果を型安全に扱うには `zod` を使う（`z.object(...).safeParse(JSON.parse(raw))`）。`as` 型アサーションは禁止。`zod` は本プロジェクトの標準依存として利用すること。
- [2026-03-22 incident-close] Firestore ドキュメント型（`*Doc`）に新フィールドを追加する際は、既存ドキュメントとの後方互換性を考慮し、`toDomain()` で `doc.newField ?? null` のフォールバックを設ける。
- [2026-03-22 incident-close] `CreateIncidentInput` 等の Omit 派生型にも新フィールドを除外するか否か検討が必要。デフォルト値が決まっているフィールド（`resolvedBy: null` 等）は Omit して repository の `create()` でデフォルト値を設定する。

## アーキテクチャ（OTel・計装）

- [2026-04-04 otel-jaeger] Slack ハンドラー（`app.view(...)` / `app.action(...)` のコールバック）はスパン生成コードを持たない。スパン化はラッパー関数（`incident-channel.ts` 等）内で完結させる。ハンドラーの責務は「`ack()` + service 呼び出し + Slack API 呼び出し」のみ。
- [2026-04-04 otel-jaeger] Metrics の記録場所はレイヤーに従う: リクエスト数・エラー率は service 層、Firestore クエリレイテンシは repository 層、Slack API 呼び出し時間はラッパー関数内。ハンドラーは計測コードを持たない。
- [2026-04-04 otel-jaeger] OTel SDK を初期化する `telemetry.ts` は `withSpan<T>(name, attrs, fn: () => Promise<T>): Promise<T>` のようなラッパー関数を export し、`features/` のコードは `@opentelemetry/api` を直接 import しない。これにより OTel の具体型（`Span` 等）が features 層に漏れることを防ぐ。
- [2026-04-04 otel-jaeger] OTel SDK の無効化条件は `process.env.VITEST` で判定する（このプロジェクトの慣習）。`NODE_ENV=test` は使わない。
- [2026-04-04 otel-jaeger] `@opentelemetry/auto-instrumentations-node` は採用しない。意図しない自動スパンによるノイズ・バンドルサイズの増加を避け、手動スパンか個別計装パッケージ（`@opentelemetry/instrumentation-http` 等）を選択的に使う。

## エラーハンドリング（OTel）

- [2026-04-04 otel-jaeger] OTel エクスポーターの送信失敗は `DiagConsoleLogger` と SDK 内部のエラー抑制機構で処理する。アプリコードは OTel 送信に try-catch を書かない。

## その他

- [2026-03-22 incident-close] 計画書作成前にテックリードエージェントに渡す「変更対象ファイルの現状」を Explorer エージェントで調査し、計画書に含める。これによりテックリードレビューのサイクル数を削減できる（今回は 3 回発生）。
