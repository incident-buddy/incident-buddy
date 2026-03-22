# 2026-03-22 インシデントのクローズ 開発活動報告

## サマリー

- **完了した機能**: インシデントのクローズ（ウェルカムメッセージ内の「インシデントを解決する」ボタン）
- **所要フェーズ**: 7 フェーズ（テックリードレビュー 3 回、受け入れテスト PASS、レトロ完了）
- **テスト**: 全 111 件 pass（既存テストの維持 + 新規 8 件 E2E 追加）

## 技術的決定事項

### 採用したアプローチ

**`AddTimelineEventInput` 型の新設**
`TimelineEventDoc`（`occurredAt: Timestamp`）をそのまま service 層に渡すとアーキテクチャ違反になるため、`db/types.ts` に `occurredAt: Date` を持つ入力専用型を定義した。repository 内部で `Timestamp.fromDate()` に変換することで、service 層の Timestamp 依存を完全に排除した。

**`zod` による `private_metadata` の型安全化**
Slack のモーダル `private_metadata` は `JSON.parse` で取り出す `any` 値。`as` 型アサーション禁止ルールのもと、ユーザーが `zod` をインストールして解決した。`z.object({ incidentId: z.string(), incidentChannelId: z.string() }).safeParse()` で型安全かつ検証済みのデータを取得できる。

**`resolvedAt` の生成を service 層に集約**
従来の `incidentRepository.resolve()` は `FieldValue.serverTimestamp()` を使っていたが、この方式では `resolve()` 直後の `findById()` で `resolvedAt` が `null` になるリスクがある（サーバーサイドタイムスタンプはラウンドトリップ後に確定）。`service.resolve()` で `new Date()` を生成して repository に渡す方式に変更した。

**`AlreadyResolvedError` を `incident.model.ts` に配置**
ビジネスルール（「解決済みインシデントは再解決不可」）の表現として、model 層にカスタムエラークラスを定義した。handler では `instanceof` チェックで判別して ephemeral 通知を返す。

**"失敗してもログのみ継続" 処理のパターン**
ウェルカムメッセージ更新・`#incidents` 更新・チャンネル通知の 3 処理は、Firestore 更新の成否に関わらず継続する仕様。各処理を内部 `try-catch` で自己完結させたインライン処理として実装した（関数分離は将来の refactor タスクとして残す）。

### 却下した代替案

- **`FieldValue.serverTimestamp()` の継続使用**: `resolve()` 後の即時 `findById()` で `resolvedAt` が取得できないリスクから却下
- **`io-ts` / 独自型ガード関数による `private_metadata` 検証**: `zod` が導入済みとなったため、より宣言的な方法を採用
- **`refreshIncidentSlackMessage` を "失敗継続" に変更**: 既存の `assign_role_*` ハンドラーが外部 `try-catch` で使用しているため、既存コードへの影響を避けてインライン処理を選択

## エージェント・チーム運営の観察

### テックリードレビューの 3 回サイクル
バックログに詳細な仕様が記載されていたにもかかわらず、計画書の精度が実装に必要な詳細レベルに達するまで 3 回のサイクルが必要だった。特に「既存コードの実装状態」を計画書に含めていなかったことが原因で、テックリードが計画書と既存コードの齟齬を毎回発見した。

**改善策**: テックリードへの計画提出前に、変更対象ファイルの現状を Explorer エージェントで調査し、計画書に含める。

### BA エージェントのコンテキスト欠落
BA エージェントはバックログの確認モーダル仕様を記載漏れした。エージェント間でコンテキストが完全に引き継がれていない点が課題。オーケストレーターが各エージェントの出力を検証してから次フェーズに渡す責務を明確化する必要がある。

### `zod` の導入タイミング
計画フェーズの最後（3 回目のレビュー）まで `zod` の有無が未確認だった。ユーザーが途中でインストールして解決したが、計画フェーズの最初に「型安全化ツールの有無」を確認する手順があれば防げた。

## 学んだこと

### 既存バグの発見はシフトレフトの成果
テックリードレビューのアーキテクチャ適合チェックが、既存コードの `Timestamp` 依存バグを発見した。これは純粋な新機能実装では発見が遅れていた可能性がある。テックリードが「アーキテクチャルール違反の具体的なパターンを確認する」という役割を持つことで、既存負債の発見機会になる。

### Firestore の `serverTimestamp()` の落とし穴
`FieldValue.serverTimestamp()` はサーバーサイドで生成されるため、書き込み後の即時 `get()` では `null` が返る。日時を次の処理で使う場合は、クライアントサイドで `new Date()` を生成して使うべき。精度よりも一貫性を優先する設計判断。

### presenter の責務の重要性
経過時間計算（`formatElapsedTime`）を presenter に集約したことで、handler での重複実装を防いだ。QA エージェントが重複を発見して修正できたのは、受け入れテスト後の Refactor ステップが機能した例。

## 次のアクション（残課題）

1. `incident.presenter.test.ts` に `resolved` 状態のウェルカムメッセージのユニットテストを追加（バックログには含まれていないが技術的負債）
2. `incident.service.test.ts` に `incidentService.resolve()` のユニットテストを追加
3. `actions.ts` の "失敗時ログのみ継続" 処理を `tryXxx()` 関数として切り出す（現状インライン処理）
4. `feature-dev.md` にテックリードレビュー前の「Explorer エージェントによる既存コード調査」手順を追加
