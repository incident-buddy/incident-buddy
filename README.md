# incident-buddy

Slack からインシデントを宣言・管理するボット。Firestore にインシデント情報を保存し、チャンネルへ通知する。

## 実装済み機能

| 機能 | Slack 操作 | 説明 |
|---|---|---|
| インシデント宣言 | `/inc` コマンド | タイトル・重大度・説明を入力してインシデントを作成。チャンネルに通知を投稿 |
| メンション応答 | `@incident-buddy` | 使い方を案内 |

### インシデント重大度

| レベル | 意味 |
|---|---|
| P1 - Critical | サービス全停止・重大な障害 |
| P2 - High | 主要機能の障害 |
| P3 - Medium | 部分的な機能低下 |
| P4 - Low | 軽微な問題 |

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
