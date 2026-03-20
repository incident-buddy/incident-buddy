# Development Guide

## 必要なツール

| ツール | 用途 | インストール |
|---|---|---|
| [mise](https://mise.jdx.dev/) | Node.js / pnpm バージョン管理 | `curl https://mise.run \| sh` |
| [Docker](https://docs.docker.com/get-docker/) | Firestore Emulator 実行 | 公式サイト参照 |
| [ngrok](https://ngrok.com/) | Slack からのリクエストをローカルへ転送 | `brew install ngrok` など |

## セットアップ

### 1. ツールバージョンのインストール

```bash
mise install
```

`mise.toml` に記載された Node.js (LTS) と pnpm (latest) がインストールされる。

### 2. 依存パッケージのインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env` に Slack App の認証情報を記入する。

```bash
# .env
SLACK_SIGNING_SECRET=<Slack App の Signing Secret>
SLACK_BOT_TOKEN=xoxb-<Slack Bot Token>
PORT=8888
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080   # Emulator 使用時はそのまま
FIRESTORE_PROJECT_ID=demo-incident-buddy  # Emulator 使用時はそのまま
```

Slack App の認証情報は [api.slack.com/apps](https://api.slack.com/apps) の該当アプリで確認できる。

- **Signing Secret**: Settings > Basic Information > App Credentials
- **Bot Token**: Settings > Install App > Bot User OAuth Token

### 4. Slack App の設定

Slack App に以下の権限・設定が必要。

**OAuth Scopes (Bot Token Scopes)**

| Scope | 用途 |
|---|---|
| `chat:write` | チャンネルへのメッセージ投稿 |
| `commands` | スラッシュコマンドの受信 |

**Slash Commands**

| コマンド | Request URL |
|---|---|
| `/inc` | `https://<ngrok-url>/slack/events` |

**Event Subscriptions**

- Request URL: `https://<ngrok-url>/slack/events`
- Subscribe to bot events: `app_mention`

**Interactivity & Shortcuts**

- Request URL: `https://<ngrok-url>/slack/interactions`

## 起動

### ターミナル 1: Firestore Emulator

```bash
docker compose -f docker/compose.yml up
```

起動後、Emulator UI が http://localhost:4000 で利用可能。

### ターミナル 2: API サーバー

```bash
pnpm -F api dev
```

起動確認:

```bash
curl http://localhost:8888/health
# → {"status":"ok"}
```

### ターミナル 3: ngrok トンネル

```bash
ngrok http 8888
```

表示された `https://<id>.ngrok-free.app` を Slack App の各 URL に設定する。

## ディレクトリ構成

```
incident-buddy/
├── .env                        # 環境変数 (git 管理外)
├── firebase.json               # Firebase / Emulator 設定
├── firestore.rules             # Firestore セキュリティルール
├── docker/
│   └── compose.yml             # Firestore Emulator サービス
├── docs/
│   └── datastore.md            # Firestore データモデル
└── api/
    ├── firestore.indexes.json  # 複合インデックス定義
    └── src/
        ├── index.ts            # エントリポイント (Hono サーバー)
        ├── env.ts              # 環境変数バリデーション
        ├── receiver/
        │   └── HonoReceiver.ts # Bolt ↔ Hono ブリッジ
        ├── db/
        │   ├── types.ts        # Firestore ドキュメント型定義
        │   └── firestore.ts    # Firestore singleton + typed collections
        ├── features/
        │   └── incident/
        │       └── incident.repository.ts
        └── slack/
            ├── app.ts          # Bolt App インスタンス
            └── handlers/
                ├── commands.ts # /inc コマンド
                ├── actions.ts  # モーダル submit
                └── events.ts   # Events API
```

## 動作確認

1. 上記 3 つのターミナルをすべて起動した状態で、Slack の任意のチャンネルで `/inc` を実行
2. モーダルが表示される → Title / Severity を入力して **Create**
3. チャンネルにインシデント通知が投稿される
4. Emulator UI (http://localhost:4000) の `incidents` コレクションにドキュメントが作成されていることを確認
