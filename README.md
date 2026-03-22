# incident-buddy

Slack からインシデントを宣言・管理するボット。Firestore にインシデント情報を保存し、チャンネルへ通知する。

## 実装済み機能

| 機能 | Slack 操作 | 説明 |
|---|---|---|
| インシデント宣言 | `/inc` | タイトル・重大度・説明を入力してインシデントを作成。チャンネルに通知を投稿 |
| 対応者アサイン | ウェルカムメッセージのボタン | インシデントチャンネルのウェルカムメッセージに表示されるロールボタンを押すと、自身をそのロール（コマンダー・調査担当など）の担当者として登録。ウェルカムメッセージに担当者一覧が反映され、timeline に記録される |
| 設定確認 | `/inc config` | 現在の重大度・サービス・通知ルール・ロール設定を ephemeral メッセージで表示 |
| エラー通知 | （自動） | コマンド処理中に例外が発生した場合、チャンネルにエラーメッセージを投稿 |

### Markdown による設定カスタマイズ

`INCIDENT_CONFIG_PATH` 環境変数に Markdown ファイルのパスを設定することで、重大度・サービス・通知ルールをカスタマイズできる。

```markdown
# Incident Config

## Severities

### P1
Critical

### P2
High

## Services

### payments
決済処理

## Roles

### commander
コマンダー。インシデント全体を指揮する。

### investigator
調査担当。原因究明を担当する。

## Notification Rules

### Notify Critical
- severity: P1
- mention: @sre-group @managers
```

設定ファイルが未設定の場合は Critical / High / Medium / Low のデフォルト重大度が使用される。設定ファイルの内容や読み込みエラーは `/inc config` で確認できる。

## アーキテクチャ

```
Slack（/inc コマンド）
  │
  ▼
slack/handlers/     ← ack() + service呼び出し + Slack API呼び出しのみ
  │
  ▼
features/incident/
  ├── incident.service.ts    ← ビジネスロジック（member upsert + incident 作成）
  ├── incident.repository.ts ← Firestore CRUD（Timestamp → Date 変換）
  ├── incident.presenter.ts  ← Slack メッセージ整形（純粋関数）
  └── incident.model.ts      ← ドメイン型（Incident, Severity, etc.）
features/member/
  └── member.repository.ts   ← メンバー upsert
  │
  ▼
Firestore（incidents / members コレクション）
```

詳細は [`docs/architecture.md`](docs/architecture.md) を参照。

## セットアップ・開発

[DEVELOPMENT.md](DEVELOPMENT.md) を参照。

開発は**必ず devcontainer で行う**こと（ホスト上での直接実行禁止）。

```bash
mise run dc:up     # devcontainer 起動
mise run dc:shell  # シェルに入る
mise tasks         # 利用可能なタスク一覧
```

## データモデル

[docs/datastore.md](docs/datastore.md) を参照。
