---
description: design-rules.md の違反を特定し、リスク分類に基づく cover & modify + TCR パターンで段階的にリファクタする
argument-hint: [対象ディレクトリ（省略時は api/src/）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion
---

対象ディレクトリ: $ARGUMENTS（省略時は `api/src/`）

あなたはリファクタリングオーケストレーターです。以下の Phase を順番に実行してください。
各 Phase に進む前に、前の Phase が完了していることを確認してください。

---

## Phase 1: Scan（違反スキャンとリスク分類）

**目的**: コードに触れず、違反箇所を洗い出して分類レポートを作成する。

### 1-1. ルールの読み込み

`docs/design-rules.md` と `docs/coding-rules.md` を読み、検出すべき違反パターンをすべてリストアップする。

### 1-2. 機械的スキャン

ルールドキュメントから導出した grep パターンで対象ディレクトリをスキャンする。

ルールの種類に応じて以下を参考にパターンを設計すること：
- 禁止キーワード（例: `as `, `Timestamp`, `@slack/bolt`）
- 禁止インポートパス（例: repository を handler から直接 import）
- 構造パターン（例: handler 内の inline try-catch）

### 1-3. リスク分類

検出した各違反を以下の 3 タイプに分類する。**タイプによって cover の要否が変わる**。

#### TYPE_MECHANICAL（機械的変換 / cover 不要）

ランタイム動作が変わらない純粋な変換。既存テストを Verify で通すだけで十分。

特徴:
- 型レベルの変換（型アサーション除去、zod 化など）
- 出力・副作用が同一のリファクタ

#### TYPE_ARCH（アーキテクチャ修正 / 既存 E2E を cover として使用）

レイヤー間の依存方向を修正するパターン。修正前に既存 E2E が green であることを確認し、それを cover として扱う。

特徴:
- ファイル間の import 経路が変わる
- 中間層（service 等）に新しいメソッドを追加する

E2E が存在しない場合はキャラクタリゼーションテストを追加する。

#### TYPE_BEHAVIOR（振る舞い変更を伴う / cover テスト必須）

呼び出し元から見えるシグネチャや error propagation が変わるパターン。
修正前に現在の振る舞いをテストで固定してから修正する。

特徴:
- 関数の抽出・分離
- エラーハンドリングの責務の移動

### 1-4. 違反レポートと修正順序の提示

違反をタイプ別に整理し、以下の情報を含むレポートを出力する：
- ファイルパスと行番号
- 違反しているルール（`docs/design-rules.md` の該当項目）
- 分類タイプ（TYPE_MECHANICAL / TYPE_ARCH / TYPE_BEHAVIOR）
- 推奨修正方針（1行サマリー）

**修正順序の原則**:
1. TYPE_ARCH（他の違反が依存する構造変更を先に行う）
2. TYPE_MECHANICAL（型変換のみ、依存なし）
3. TYPE_BEHAVIOR（関数分離は独立して実施可能）

### 1-5. ユーザー承認

`AskUserQuestion` で以下を確認する：
> 「スキャン結果を確認しました。\n\n[違反レポート]\n\n修正から除外する項目や優先度の変更はありますか？\n承認いただければ Phase 2（Cover）に進みます。」

---

## Phase 2: Cover（安全網の確認・追加）

**目的**: 修正対象ごとに必要な cover を準備する。TYPE_MECHANICAL はスキップ。

### 2-1. 既存テストの green 確認（TYPE_ARCH 用）

devcontainer 内でテストスイート全体を実行し、現状が green であることを確認する。

```
mise run dc:shell でdevcontainerに入り、mise tasks で利用可能なテストタスクを確認してから全テストを実行
```

- **全 green**: 既存 E2E を cover とみなし、Phase 3 へ
- **一部 fail**: 修正対象と無関係な既存失敗かを確認する。修正対象の振る舞いをカバーするテストが存在しない場合は 2-2 へ

### 2-2. キャラクタリゼーションテストの追加（TYPE_BEHAVIOR 用）

各 TYPE_BEHAVIOR 違反に対して、以下を確認するテストを追加する：

1. **正常時**: 元の処理が実行される
2. **例外発生時**: 例外が呼び出し元に伝播せず、意図した副作用（ログ出力等）が発生する

テストは修正対象の既存テストファイルに追記する。
追加後、テストが **green** になることを確認してから Phase 3 へ進む。

---

## Phase 3: Modify（TCR サイクルによる違反の修正）

**目的**: Phase 1 の修正順序（ARCH → MECHANICAL → BEHAVIOR）に従い、Kent Beck の TCR（test && commit || revert）で 1 違反ずつ修正する。

### TCR の基本ルール

1 違反の修正を加えるたびに、devcontainer 内でテストを実行して以下を判定する：

```
テスト実行
  → green: そのままコミット（テストと実装をまとめて）
  → red:   変更全体を即座に revert し、原因を特定してからやり直す
```

**「後で直す」は禁止。常に green な状態でのみコミットする。**

revert の目安: 1 違反の修正が small step に分割できているなら、red になることは稀。red になった場合は step がまだ大きすぎるサインと捉え、修正をより小さく分割する。

### コミット粒度とメッセージ形式

1 違反 = 1 コミット。複数の違反をまとめて修正しない。

```
refactor(<scope>): <修正の意図> [TYPE_ARCH|TYPE_MECHANICAL|TYPE_BEHAVIOR]
```

### 各タイプの修正指針

**TYPE_ARCH**:
- レイヤー違反の import を削除し、正しい経路（service 経由など）に置き換える
- 受け口となる中間層のメソッドが存在しない場合は、`docs/design-rules.md` のアーキテクチャルールに従い先に追加する
- `Date` / `Timestamp` の変換責務は repository 層に閉じ込める

**TYPE_MECHANICAL**:
- `as` キャスト → ローカル変数への取り出しと narrowing
- `JSON.parse(...) as T` → `z.object(...).safeParse(JSON.parse(...))` に変換
- 型ルールの例外（外部ライブラリの型不整合等）は `docs/coding-rules.md` の例外規定を参照し、該当する場合はコメントで理由を明記して残す

**TYPE_BEHAVIOR**:
- 「失敗してもログのみ継続」仕様の関数は `tryXxx()` 命名で分離し、内部で try-catch を完結させる
- 分離後の関数のシグネチャ（戻り値 `void`、例外非伝播）が cover テストで確認済みの振る舞いと一致することを確認する

---

## Phase 4: Verify（最終回帰確認）

**目的**: 全修正完了後、テストスイート全体で回帰がないことを最終確認し、残存違反がないことを機械的に検証する。

### 4-1. テスト全体実行

devcontainer 内で unit + e2e の全テストを実行する。

### 4-2. アーキテクチャ適合チェック

Phase 1 のスキャンと同じ grep パターンを再実行し、違反がゼロになっていることを確認する。残存する場合は Phase 3 に戻る。

### 4-3. 完了報告

```
リファクタリング完了

修正した違反:
  TYPE_ARCH:       X 件
  TYPE_MECHANICAL: Y 件
  TYPE_BEHAVIOR:   Z 件

全テスト: green
残存する例外（理由付き）: [あれば列挙、なければ「なし」]
```

---

## 重要なルール

- **devcontainer 必須**: コマンドはホストで直接実行禁止。`mise run dc:shell` 経由で実行する
- **Phase 1 はコード変更禁止**: スキャンフェーズは読み取り専用。全貌を把握してから修正を開始する
- **TCR を守る**: test && commit || revert。中途半端な状態でコミットしない。red になったら revert してステップを小さく分割する
- **修正順序を守る**: ARCH → MECHANICAL → BEHAVIOR。依存関係の破綻を防ぐ
- **1 違反 1 コミット**: 複数の違反をまとめない。revert の粒度を保つ
