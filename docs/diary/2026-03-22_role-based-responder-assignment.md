# 2026-03-22 ロールベースの対応者アサイン 開発活動報告

## サマリー
- 完了した機能: インシデントチャンネルのウェルカムメッセージにロールボタンを設置し、クリックで対応者をロール付きで登録できる機能
- 所要フェーズ数: 6フェーズ（レトロなし）、QA FAIL → 修正 → PASS の1サイクルあり

## 技術的決定事項

### 選択したアプローチとその理由

**`Responder` 型の追加（`responderIds: string[]` → `responders: Responder[]`）**
- `responderIds` はユーザーIDのみで、ロール情報を保持できなかった
- `{ roleId, userId, userName }` の構造体にすることで、ウェルカムメッセージへの担当者一覧表示とタイムライン記録に必要な情報を一元管理できる

**`welcomeMessageTs` フィールドの追加**
- `chat.update` でウェルカムメッセージを差し替えるには、投稿時の `ts` をFirestoreに保存しておく必要がある
- `slackMessageTs`（`#incidents` チャンネルのメッセージ）と対称に追加

**ロール設定の `incident-config` への統合（`## Roles` セクション）**
- 既存の `## Severities` / `## Services` / `## Notification Rules` と同じ Markdown パーサーパターンを踏襲
- `### {role-id}` 形式で定義し、ラベルは description の `。` 前のテキストから自動抽出

**`app.action(/^assign_role_/)` の正規表現ハンドラー**
- ロール数に関わらず1つのハンドラーで処理でき、設定変更に対してコードを変更不要
- `action_id` から `roleId` を `assign_role_` プレフィックスのstrip で取り出す

### 却下した代替案

- ロール定義を別ファイルに分離する案 → `incident-config` との結合度が上がり管理が煩雑になるため却下
- `responders` を Firestore サブコレクションにする案 → クエリが複雑になる割に利点が少なく、ドキュメント配列で十分なため却下

## アーキテクチャルール遵守

### QAゲートで発見・修正した違反

Phase 5b（受け入れテスト）で QA エージェントが `actions.ts` 内に `incidentRepository.findByChannelId()` の直接呼び出しを検出。

修正: `incidentService.findByChannelId()` を追加し、`assign_role_*` ハンドラーはすべて `incidentService` 経由でインシデントを参照するよう修正。

**修正前:**
```typescript
const incident = await incidentRepository.findByChannelId(channelId);
```

**修正後:**
```typescript
const incident = await incidentService.findByChannelId(channelId);
```

### 残存する既知の技術的債務

`create_incident` ハンドラーは `incidentRepository.updateIncidentChannelId()` / `updateSlackMessageTs()` / `updateWelcomeMessageTs()` を直接呼び出している。今回のスコープ外として残存。次の機能開発時（A: resolve など）にサービスレイヤーへの委譲を検討する。

## エージェント・チーム運営の観察

### Phase 5b（受け入れテスト担当エージェント）

- 1回目の評価で「FAIL - actions.ts 内の incidentRepository 直接参照」を的確に検出
- 修正後の2回目評価では「create_incident ハンドラーの既存違反はスコープ外」と適切に判断して PASS を出した
- 仕様書の受け入れ条件とコードの対応を丁寧に検証しており、フィードバックの質が高い

### フィードバックループの健全性

- E2Eテスト（Red）→ TDD実装（Green）→ 受け入れテスト（QA）→ 修正（PASS）の流れがスムーズに機能
- QA エージェントが「偽陽性チェック」として Firestore 実際値と Slack API コールの両方を検証していることを確認し、テスト品質を保証してくれた

## 学んだこと

### 技術的洞察

- `Object.fromEntries(URLSearchParams)` の型推論が TypeScript で `never` を返すケースがある。`params.get("key")` を直接使うほうが型安全
- Bolt の `app.action(/regex/)` は正規表現マッチを使うことで、動的なアクションIDに柔軟に対応できる
- MSW の `onUnhandledRequest: "warn"` モードにより、モックなしの API コールはテスト失敗にならずログのみ出力される — これにより「失敗時はログのみ継続」の仕様が自然に検証される

### プロセス改善の示唆

- 型定義の変更（`responderIds` → `responders`）が起点となり、連鎖的に既存テストの型エラーが浮かび上がった。型変更を先行させる TDD サイクルは設計の一貫性チェックとして有効
- QA エージェントにアーキテクチャルールを明示しておくことで、機能テストだけでなくアーキテクチャ整合性の検証も実施できる

## 次のアクション（あれば）

- `create_incident` ハンドラーの `incidentRepository` 直接参照（`updateIncidentChannelId`, `updateSlackMessageTs`, `updateWelcomeMessageTs`）を `incidentService` に委譲（技術的債務）
- バックログ A（インシデントのクローズ）の着手 — timeline サブコレクション書き込みは今回実装済みなので再利用可能
