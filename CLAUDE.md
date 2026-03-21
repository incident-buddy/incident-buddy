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
