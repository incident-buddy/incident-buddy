# incident-buddy

## 開発環境 (MUST)

**開発は必ず devcontainer を使うこと。これは絶対に守るルールであり、例外はない。**

コマンドをホスト上で直接実行してはならない。すべての開発作業は devcontainer 内で行うこと。

```bash
# devcontainer の起動
mise run dc:up

# devcontainer のシェルに入る
mise run dc:shell
```

## タスクの把握

このプロジェクトで実行できるタスクは `mise tasks` で確認すること。

```bash
mise tasks
```

タスクを実行する前に必ず `mise tasks` を実行し、利用可能なタスクを把握した上で適切なものを選ぶ。
コマンドを直接実行するのではなく、対応する mise タスクがあればそちらを使うこと。

## コーディングルール

**作業開始前に必ず `docs/coding-rules.md` を参照すること。**

コード生成・レビュー時に以下を確認する：
- `as` 型アサーションを使っていないか
- Slack API の `ok: false` を明示チェックしているか
- エラーハンドリングの責務が適切に閉じ込められているか

## アーキテクチャルール

詳細は `docs/architecture.md` を参照。以下は必ず守るルール。

### レイヤー責務
- **`slack/handlers/`**: `ack()` + service 呼び出し + Slack API 呼び出しのみ。ビジネスロジックを書かない
- **`features/*.service.ts`**: ビジネスロジック。Firestore 型（`Timestamp`）と Slack SDK 型に依存しない
- **`features/*.repository.ts`**: Firestore CRUD + `toDomain()` による `Timestamp` → `Date` 変換
- **`features/*.presenter.ts`**: ドメイン型 → Slack ブロック変換（純粋関数）
- **`features/*.model.ts`**: ドメイン型定義。外部ライブラリに依存しない（`Date` を使う）

### 新機能追加時のルール
- 新しい機能は `features/{feature-name}/` ディレクトリを作って追加する
- `*.model.ts` → `*.repository.ts` → `*.service.ts` の順に実装する
- Slack ハンドラーは `features/` の型を直接知らなくてよい（service 経由で受け取る）
- `db/firestore.ts` や `membersCol` などを `slack/handlers/` から直接呼ばない

### 禁止事項
- `slack/handlers/` での Firestore 直接操作
- `features/` での `Timestamp` 型の使用（`Date` を使う）
- `features/` での `@slack/bolt` 型のインポート
