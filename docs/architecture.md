# アーキテクチャ概要

## レイヤー構造

```
┌─────────────────────────────────────────────────────────┐
│  Slack Layer（slack/handlers/）                          │
│  - Bolt ハンドラー（commands.ts / actions.ts / events.ts）│
│  - ack() + service呼び出し + Slack API呼び出しのみ        │
│  - ビジネスロジックを持たない                             │
└────────────────────┬────────────────────────────────────┘
                     │ 呼び出す
┌────────────────────▼────────────────────────────────────┐
│  Feature Layer（features/{feature}/）                    │
│  ├── *.model.ts    ドメイン型（Date, 純粋なTS型）          │
│  ├── *.service.ts  ビジネスロジック（repository を協調）   │
│  ├── *.repository.ts  永続化（Firestore↔Domain変換）      │
│  └── *.presenter.ts   Slack メッセージ整形（純粋関数）     │
└────────────────────┬────────────────────────────────────┘
                     │ 呼び出す
┌────────────────────▼────────────────────────────────────┐
│  Infrastructure Layer（db/）                             │
│  ├── firestore.ts  Firestore singleton + 型付きコレクション│
│  └── types.ts      Firestore ドキュメント型（Timestamp）   │
└─────────────────────────────────────────────────────────┘
```

## 各層の責務とルール

### Slack Layer（`slack/handlers/`）
- **やること**: `ack()` で即時応答 → service を呼ぶ → Slack API を呼ぶ
- **やらないこと**: ビジネスロジック、Firestore への直接アクセス、型変換

### Feature Layer（`features/{feature}/`）

#### `*.model.ts` — ドメイン型
- Firestore の `Timestamp` に依存しない（`Date` を使う）
- Slack SDK の型に依存しない
- 新しいビジネス概念はここで定義する

#### `*.service.ts` — ビジネスロジック
- 複数の repository を協調させる
- 外部サービス（Slack）の型を受け取らない
- 単一の責務: ユースケースを実現する

#### `*.repository.ts` — 永続化
- `IncidentDoc`（Firestore型）↔ `Incident`（ドメイン型）の変換を担う
- `toDomain()` で `Timestamp` → `Date` に変換
- クエリロジックはここに閉じ込める

#### `*.presenter.ts` — 整形
- ドメイン型 → Slack ブロック形式への変換（純粋関数）
- 副作用なし → ユニットテストが容易

### Infrastructure Layer（`db/`）
- Firestore の初期化・コレクション参照のみ
- `db/types.ts` はドメイン型（`Severity` 等）を `features/` から import してよい

## 新機能追加時のチェックリスト

1. `features/{feature}/` ディレクトリを作る
2. `*.model.ts` でドメイン型を定義する（`Date` を使う、外部依存なし）
3. `*.repository.ts` で永続化を実装し、`toDomain()` を必ず書く
4. `*.service.ts` でビジネスロジックを実装する
5. Slack への通知が必要なら `*.presenter.ts` を追加する
6. `slack/handlers/` から service を呼ぶだけにする

## 型の依存方向

```
slack/handlers/ → features/*.service  → features/*.repository → db/
                → features/*.presenter
                                       → db/types.ts → features/*.model
```

ドメイン型（`features/*.model`）は誰にも依存しない。

## ディレクトリ構成

```
api/src/
├── index.ts              # Hono サーバーエントリポイント（ルーティングのみ）
├── env.ts                # 環境変数バリデーション
├── receiver/
│   └── HonoReceiver.ts   # Bolt ↔ Hono ブリッジ
├── db/
│   ├── firestore.ts      # Firestore singleton + 型付きコレクション参照
│   └── types.ts          # Firestore ドキュメント型（Timestamp を持つ）
├── features/
│   ├── incident/
│   │   ├── incident.model.ts       # ドメイン型（Incident, Severity, etc.）
│   │   ├── incident.repository.ts  # Firestore CRUD + toDomain 変換
│   │   ├── incident.service.ts     # ビジネスロジック（member upsert + 作成）
│   │   └── incident.presenter.ts   # Slack ブロック整形（純粋関数）
│   └── member/
│       └── member.repository.ts    # メンバー upsert
└── slack/
    ├── app.ts            # Bolt App インスタンス
    └── handlers/
        ├── commands.ts   # /inc コマンド → モーダル表示
        ├── actions.ts    # create_incident 送信 → service + Slack 通知
        └── events.ts     # app_mention
```
