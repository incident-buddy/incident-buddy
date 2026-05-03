# インシデント宣言フロー — ギャップ分析

生成日: 2026-05-03

---

## サマリー

- **部分実装あり:** ドメインモデル・Firestore リポジトリ・設定パーサーは実装済みだが、ハンドラー・サービス層・Slack API 実装はほぼ未着手。
- **主要 gap 2 点:** `incidentService`（アプリケーションサービス層）と Slack API クライアント実装が存在せず、インシデント宣言フロー全体が未稼働。
- **ドメインモデルに型制約の不整合:** `Incident.slackMessageTs` が必須 `string` だが、メッセージ投稿後に設定されるため初期 `store` 時に型エラーが発生する。変更が必要。
- **設定ファイルのフォールバックが未実装:** `index.ts` が `requireEnv("INCIDENT_CONFIG_PATH")` でクラッシュするため、要件 9.3〜9.5 のデフォルト動作が実現できない。
- **タイムライン永続化は別 spec 依存:** 要件 7 のサービス層責務は本 spec でカバーするが、`TimelineRepository` の設計は別 spec で定義される（**制約**）。
- **既存コードにコンパイルエラーあり（ブロッキング）:** `infrastructure/incident/incident.repository.ts` が存在しない `@src/lib/telemetry.js` をインポート。実際のディレクトリ名は `lib/telematry/`（タイポ）。`pnpm -F api typecheck` がエラー終了するため、実装着手前に必須修正。

---

## 要件-資産マッピング

### 要件 1: `/inc` コマンドによるモーダル表示

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 1.1 モーダル表示（view ID: `create_incident`） | `slack-handler.ts` にルーティング構造あり | スタブのみ。`throw Errors.notFound` で実質未実装 | **Missing** |
| 1.2 severity 選択肢をモーダルに設定 | `config.model.ts` の `SeverityDef[]`、`loadConfig` | モーダルビルダー未実装 | **Missing** |
| 1.3 service 選択肢をモーダルに設定 | `config.model.ts` の `ServiceDef[]` | モーダルビルダー未実装 | **Missing** |
| 1.4 デフォルト severity フォールバック | 型・定数なし | デフォルト値の定義場所未定 | **Missing** |
| 1.5〜1.9 各フィールドの型・必須・最大長 | Bolt モーダル API で表現可能 | モーダルビルダー未実装 | **Missing** |
| 1.10 `config` サブコマンド | `CommandMap` に `config` エントリあるが `throw` | 別 spec 管理。スタブのまま継続 | **Constraint** |
| 1.11 `list` サブコマンド | `CommandMap` に `list` エントリ自体が存在しない | 別 spec 管理。ルーティング追加のみ必要 | **Missing** |

### 要件 2: インシデント宣言（モーダル送信）

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 2.1 即時 `ack()` | `app.view` に `ack()` あり | ✅ 実装済み |  |
| 2.2 `Incident` ドキュメント生成 | `Incident` 型・`CreateIncidentParams` 定義済み、`generateId()` あり | `incidentService` が存在しない | **Missing** |
| 2.3 Firestore 保存 | `incidentRepository.store` 実装済み | `incidentService` 経由の呼び出しが未実装 | **Missing** |
| 2.4 `Date` → `Timestamp` 変換 | `lib/firestore/index.ts` の `toTimestamps` 実装済み | `store` 内で使用済み ✅ |  |

### 要件 3: 宣言チャンネルへの通知投稿

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 3.1 通知メッセージ投稿 | `SlackClient.postMessage` インターフェースあり | 実装なし。`PostMessageInput` の型が `{}` スタブ | **Missing** |
| 3.2 メッセージ内容（title・severity・service・宣言者） | — | メッセージビルダー未実装 | **Missing** |
| 3.3 `slackMessageTs` を incidentRepository 経由で保存 | `incidentRepository.store` あり | `Incident.slackMessageTs` が必須 `string` → 初期 store 時に型エラー | **Missing** / **Unknown** |

**⚠️ 型制約の不整合:** `Incident.slackMessageTs: string`（必須）は、メッセージ投稿後に判明する値。初回 `store` 時には未定のため、`slackMessageTs?: string` へ変更が必要。

### 要件 4: インシデント対応チャンネルの自動作成

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 4.1 チャンネル作成 API 呼び出し | `SlackClient.createChannel` インターフェースあり | 実装なし。`CreateChannelInput` が `{}` スタブ | **Missing** |
| 4.2 チャンネル名 `inc-{yyyy-MM-dd-HH-mm}` | — | 日時フォーマット関数未実装 | **Missing** |
| 4.3 `incidentChannelId` 保存 | `Incident.incidentChannelId?: string` 定義済み ✅ | `store` 再呼び出しロジック未実装 | **Missing** |
| 4.4 チャンネルトピック設定 | `SlackClient.setTopic` インターフェースあり | 実装なし。`SetTopicInput` が `{}` スタブ | **Missing** |
| 4.5〜4.7 ウェルカムメッセージ・ロールボタン・ts 保存 | `Incident.welcomeMessageTs?: string` 定義済み ✅ | ウェルカムメッセージビルダー未実装、ロール定義は `config` から取得可能 | **Missing** |

### 要件 5: 通知ルールに基づくメンション送信

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 5.1〜5.5 通知ルール評価ロジック | `NotificationRule`・`SeverityCondition` 型定義済み、severity インデックス比較の構造は型から推察可能 | ルール評価関数未実装 | **Missing** |
| 5.6 メンションメッセージ送信 | `SlackClient.postMessage` インターフェースあり | 実装なし | **Missing** |
| 5.7 マッチなし時は送信しない | — | 評価関数の結果分岐として対応可能 | **Missing** |

### 要件 6: 宣言チャンネルのトピック設定

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 6.1〜6.3 チャンネルトピック設定 | `SlackClient.setTopic` インターフェースあり | 実装なし | **Missing** |

### 要件 7: タイムライン記録

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 7.1〜7.3 `created` イベント記録 | `TimelineEventType` 型定義済み | `TimelineRepository` 未定義（別 spec 依存）。サービス層の責務定義のみ本 spec スコープ | **Constraint** |

### 要件 8: エラーハンドリング

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 8.1〜8.5 エラー時チャンネル投稿 | `AppError` 型・`Errors.*` ファクトリ定義済み ✅ | `slack-handler.ts` に try/catch なし。エラー投稿ロジック未実装 | **Missing** |

### 要件 9: 設定ファイルの読み込み

| 受け入れ条件 | 既存資産 | 状態 | タグ |
|-------------|---------|------|------|
| 9.1〜9.2 設定読み込み・使用 | `loadConfig`・`parseConfig` 実装済み ✅ | `index.ts` での呼び出し方は現在 `requireEnv` で必須扱い | **Missing** |
| 9.3 未設定時デフォルト使用 | `optionalEnv` あり | `index.ts` が `requireEnv("INCIDENT_CONFIG_PATH")` でクラッシュ | **Missing** |
| 9.4〜9.5 ファイルなし・パース失敗時のデフォルト | `ConfigLoadResult` 型は定義済みだが `loadConfig` が未使用 | `loadConfig` がエラーをそのままスロー。フォールバックロジック未実装 | **Missing** |

---

## 既存コードベースの追加所見

### 再利用可能な資産
- `common/id.ts` — `generateId()` (ULID)
- `common/errors.ts` — `AppError` discriminated-union + `Errors.*` ファクトリ
- `lib/firestore/index.ts` — `toTimestamps` / `fromTimestamps`
- `lib/config/index.ts` — `loadConfig` / `parseConfig`（テストあり）
- `domain/config/config.model.ts` — `IncidentConfig`・`SeverityDef`・`NotificationRule`・`RoleDef` 型
- `domain/incident/incident.model.ts` — `Incident`・`CreateIncidentParams` 型
- `infrastructure/incident/incident.repository.ts` — `incidentRepository.store` / `resolve`
- `test/msw-handlers.ts` — `views.open`・`chat.postMessage`・`conversations.create` モックあり（テスト実装の足掛かり）

### 既存コードの不整合・注意点

| 箇所 | 問題 |
|------|------|
| `lib/telematry/` ディレクトリ名 | **ブロッキング:** スペルミス（`telematry` vs `telemetry`）。`infrastructure/incident/incident.repository.ts` が `@src/lib/telemetry.js` をインポートしており `tsc --noEmit` がエラー。実装着手前に修正必須 |
| `lib/slack/index.ts` | `CreateChannelInput`・`PostMessageInput`・`SetTopicInput`・`InviteMemberInput` がすべて `{}` スタブ |
| `domain/config/config.model.ts` | `ConfigLoadResult` 型と `Section` 型が定義されているが、どちらも `lib/config/index.ts` で独自定義しており二重定義状態 |
| `index.ts` | `loadConfig(requireEnv("INCIDENT_CONFIG_PATH"))` — 環境変数未設定で即クラッシュ（要件 9.3 違反） |

---

## 実装アプローチ

### A: 既存拡張（`slack-handler.ts` に直接実装）

**概要:** 既存 `slack-handler.ts` にモーダル・送信・チャンネル操作ロジックを全て記述する。

**メリット:**
- ファイル追加なし
- 小規模な変更で動作確認が速い

**デメリット:**
- `adapter/` の責務原則（"ビジネスロジックを書かない"）に反する
- テスト困難（Bolt の `app` オブジェクトに依存）
- `slack-handler.ts` が 400 行超えの神ファイルになる
- 通知ルール評価・エラーハンドリングの複雑さがハンドラーに混入する

**評価:** ❌ アーキテクチャ違反・スケール不可

---

### B: 新規作成（全レイヤーをゼロから設計）

**概要:** サービス層・Slack 実装・モーダルビルダー・通知評価器を独立したモジュールとして新規作成する。

**メリット:**
- 責務が明確に分離される
- 各モジュールを独立してテストできる

**デメリット:**
- 既存コード（`incidentRepository`・`loadConfig` 等）を活用せず再実装のリスク
- ファイル数が増加する

**評価:** ✅ 原則に適合するが「新規作成」と言っても既存資産は活用すべき

---

### C: ハイブリッド（既存拡張 + 不足モジュール新規作成）【推奨】

**概要:**
- **既存拡張:** `Incident` 型（`slackMessageTs` をオプション化）・`IncidentRepository`（`update` メソッド追加）・`loadConfig`（フォールバック対応）・`lib/slack/index.ts`（I/O 型定義）・`slack-handler.ts`（ハンドラー実装の接続のみ）
- **新規作成:** `features/incident/incident.service.ts`（オーケストレーション）・`infrastructure/slack/slack-client.ts`（Bolt の WebClient ラッパー）・`features/incident/notification-rule.evaluator.ts`（ルール評価）・`features/incident/modal-builder.ts`（モーダル UI）

**メリット:**
- 既存実装（repository・config・errors）を最大限再利用
- `adapter/` の薄さを維持しつつサービス層で複雑なロジックを集約
- 各コンポーネントが単一責務でテスト可能

**デメリット:**
- 複数ファイルの調整が必要（計画が複雑）
- `IncidentRepository` インターフェース変更は infrastructure 層にも波及

**評価:** ✅ 既存アーキテクチャと整合。**推奨アプローチ**

---

## 工数・リスク

| 項目 | 見積もり | 根拠 |
|------|---------|------|
| **工数** | **L（1〜2 週間）** | 新規モジュール（サービス・Slack 実装・モーダルビルダー・通知評価器）が 4 つ以上、既存型の変更と連鎖的な更新が複数レイヤーに及ぶ |
| **リスク** | **Medium** | Bolt v4 の API は既知で `@slack/web-api` も package.json に含まれる。アーキテクチャパターンは確立済み。複雑さは主にオーケストレーションと逐次エラーハンドリングにあり、未知技術はない |

---

## 設計フェーズへの推奨事項

### 推奨アプローチ: C（ハイブリッド）

### 設計時に確定すべき事項

1. **`IncidentRepository.update` vs 再 `store`**
   メッセージ ts・チャンネル ID の後追い保存をどう実現するか。
   - `update(id, Partial<Incident>)` を `IncidentRepository` に追加する方が意味が明確
   - ただし `set()` の上書き動作で `store` 再呼び出しでも代替可能（フロー内でオブジェクトを保持する前提）
   - 設計フェーズで選択し、インターフェース変更範囲を確定すること

2. **`SlackClient` 実装の配置**
   `infrastructure/slack/slack-client.ts` として Bolt の `WebClient` をラップし `SlackClient` インターフェースを実装する。
   `lib/slack/index.ts` の I/O 型を先に確定させること。

3. **設定ファイルのフォールバック設計**
   `loadConfig` を `ConfigLoadResult` 返却に変更するか、または `slack-handler.ts` 初期化時に `try/catch` でデフォルト値にフォールバックするかを決定すること。
   `index.ts` の `requireEnv("INCIDENT_CONFIG_PATH")` は `optionalEnv` に変更が必要。

4. **タイムラインのサービス層責務**
   本 spec では `incidentService` が `timeline.record({ type: "created", ... })` を呼び出す責務のみ定義する。
   `TimelineRepository` インターフェースのスタブ定義は本 spec スコープとし、実装は別 spec に委ねること。

5. **`lib/telematry` のタイポ修正（実装前の必須作業）**
   `infrastructure/incident/incident.repository.ts` が `@src/lib/telemetry.js` をインポートしており、現在 `tsc --noEmit` が失敗する。`lib/telematry/` ディレクトリを `lib/telemetry/` にリネームするか、import パスを `@src/lib/telematry` に修正すること。スコープ上はバグ修正（新規実装の前提条件）として扱うこと。
