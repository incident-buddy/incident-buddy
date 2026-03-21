# 2026-03-22 インシデントチャンネル ID の Firestore 永続化 開発活動報告

## サマリー
- 完了した機能: インシデント宣言時に作成した Slack チャンネルの ID を Firestore の `incidents` ドキュメントに保存する
- 所要フェーズ数: Phase 1〜6（レトロなし）

## 技術的決定事項

### incidentChannelId は optional にした

当初は必須フィールド（`incidentChannelId: string`）で設計したが、以下の理由で optional（`incidentChannelId?: string`）に変更した：

- **作成タイミングの非対称性**: `incidentService.create` でインシデントを作成した後、`createIncidentChannel` でチャンネルを作成し、`updateIncidentChannelId` で後から更新する 2 ステップ設計のため、作成直後は値が未設定になる
- **空文字（`""`）初期化を避けた**: 空文字の仮値は「未設定」と「空文字列」を区別できず意味的に不正確。optional の方が「まだ設定されていない」状態を正しく表現できる

### updateIncidentChannelId の実行タイミング

`updateIncidentChannelId` を `chat.postMessage` の**後**に配置した。

**理由**: `chat.postMessage` の前に Firestore 書き込みを挟むと、直前のテスト（`name_taken` リトライテスト）の非同期 Bolt 処理が遅延し、次テストの MSW ハンドラーに `chat.postMessage` が漏れ込む問題が発生した。`updateIncidentChannelId` を後に移動することで、元の `chat.postMessage` の発火タイミングが変わらず、テスト間の独立性が保たれた。

**影響**: E2E テストでは `postMessageCalled` の後に 50ms の待機を追加し、Firestore への非同期書き込み完了を待つ。

### 却下した代替案

- **チャンネル先・Incident 後の順序変更**: `createIncidentChannel` を先に呼び、その ID を `incidentService.create` に渡す方法。しかしこの順序変更が `name_taken` リトライテストの非同期処理タイミングを変え、テスト #3 への漏れ込みを引き起こした

## エージェント・チーム運営の観察

### 受け入れテスト担当エージェントの振る舞い

- 1 回目の QA 評価: 異常系テスト欠如を正確に指摘（`updateIncidentChannelId` 失敗時の伝播テストが不足）→ テスト追加により解消
- 2 回目の QA 評価: 参照ファイルが `actions.test.ts` のみだったため `incident-channel.test.ts` の既存テストを把握できず、「チャンネル作成失敗テストが未存在」と誤判定。エージェントへの情報提供（コンテキスト）の設計が評価精度に直結することが明確になった

### フィードバックループの健全性

- TypeScript の型エラー連鎖（`IncidentDoc` → `CreateIncidentInput` → `incident.service.ts` → テストフィクスチャ）が変更漏れを自動検出。型システムがガードレールとして機能した
- MSW + Vitest の E2E テスト環境が実際の非同期タイミング問題を可視化し、設計の問題点を早期発見できた

## 学んだこと

### 技術的洞察

- Vitest の `fileParallelism: false` はファイル間の並列実行を制御するが、Bolt の非同期ハンドラー処理（`ack()` 後の残処理）は制御されない。非同期処理の途中で同期ポイント（await）を設けたテストは、その後の処理が次テストのハンドラーに漏れ込む可能性がある
- `await new Promise(r => setTimeout(r, 50))` パターンはこのプロジェクト内の慣例。Firestore エミュレーターがローカルで高速なため有効だが、本番環境の遅延とは異なる前提

### プロセス改善の示唆

- QA エージェントに渡すファイルリストは機能に関連するテストファイルを網羅すべき。単一テストファイルだけを渡すと既存カバレッジを見落とす
- `incidentChannelId` の optional vs required の議論は早期に設計に反映すべき。実装中に型エラーが連鎖して修正コストが高くなった

## 次のアクション

- バックログ次項 D（インシデントチャンネルへのウェルカムメッセージ投稿）に着手可能。`incidentChannelId` が永続化されたことで、チャンネルへのメッセージ投稿の基盤が整った
