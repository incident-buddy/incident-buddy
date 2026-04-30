# インシデント設定のmarkdown定義機能

## 要求仕様

- SREとして、インシデント登録時の通知先をコードを変更せずに管理・変更したい
- SREとして、severity定義とサービス一覧もコードを変更せずに管理したい
- SREとして、チームやサービスに応じた通知ルールをmarkdownで定義したい

## 機能仕様

### 設定ファイル

`INCIDENT_CONFIG_PATH` 環境変数で指定したmarkdownファイルを設定ファイルとして使用する。

ファイルは以下のセクションを持つ：

```markdown
# Incident Config

## Severities

### Critical
本番サービスが完全停止している

### High
本番サービスが部分的に影響を受けている

### Medium
機能の一部が劣化している

### Low
軽微な問題

## Services

### payment-api
決済処理サービス

### user-service
ユーザー管理サービス

### platform
プラットフォーム基盤

## Notification Rules

### Payment Critical
- severity: >= High
- service: payment-api
- mention: @payment-lead @oncall-group

### All Critical Incidents
- severity: Critical
- mention: @here
```

#### Severities セクション
- H3見出しがseverityのラベル（識別子として使用）
- 見出し直後の本文が説明文
- **ファイル内の記載順が重要度順**（最初が最も重要）
- モーダルのドロップダウン選択肢として表示される

#### Services セクション
- H3見出しがサービスのラベル（識別子として使用）
- 見出し直後の本文が説明文
- モーダルのドロップダウン選択肢として表示される（ラベルと説明文）

#### Notification Rules セクション
- H3見出しがルール名（任意）
- `severity: <value>` — severity条件（省略可）
- `service: <value>` — service条件（省略可、完全一致・大文字小文字無視）
- `mention: @user1 @user2` — スペース区切りのメンション（省略可）
- 複数条件はAND評価
- 複数ルールがマッチした場合は全ルールのアクションを実行

### Severity 比較演算子

Severityの記載順（上が最重要）をインデックスとして比較演算子を評価する。

| 演算子 | 意味 |
|--------|------|
| `Critical` (単純一致) | Criticalのみ |
| `>= High` | High以上の重要度（Critical, High） |
| `<= Medium` | Medium以下の重要度（Medium, Low） |

### インシデント登録モーダルの変更

- Severityドロップダウン: 設定ファイルの `Severities` セクションから動的に生成（ラベルと説明文を表示）
- Serviceドロップダウン: 設定ファイルの `Services` セクションから動的に生成（任意入力）
- コマンド呼び出し時に設定ファイルを読み込み、モーダルの選択肢を構築する

### 通知フロー

1. インシデント作成後、`INCIDENT_CONFIG_PATH` のファイルを読み込む
2. 全ルールを評価し、マッチしたルールを収集する
3. マッチしたルールのメンション先に、元のチャンネルでメンションをする

### 正常系

- 設定ファイルに定義されたseverityとserviceがモーダルに表示される
- メンション（`@user`）が通知メッセージに含まれる
- severity条件のみのルールが正しく評価される
- service条件のみのルールが正しく評価される
- `>= High` のような比較演算子が正しく評価される

### 異常系・エッジケース

- `INCIDENT_CONFIG_PATH` が未設定の場合: 通常フローを継続（元チャンネルのみ通知）
- 設定ファイルが存在しない場合: ログを出力し通常フローを継続
- 設定ファイルのパースに失敗した場合: ログを出力し通常フローを継続
- モーダル表示時にファイルが読めない場合: デフォルトのseverity/serviceなしでモーダルを表示

### 技術的アプローチ

- markdownパースは外部ライブラリ不使用。行ベースの単純パーサーで実装
  - `## ` → セクション切り替え（Severities / Services / Notification Rules）
  - `### ` → エントリ開始（severity名 / service名 / ルール名）
  - `- key: value` → ルールのアクション/条件
  - その他の行 → 直前エントリの説明文
- 設定ファイルは毎回読み込み（キャッシュなし）。再起動不要でルール変更が即時反映される
- Severity比較はファイル内インデックスで実装: `severities.indexOf(a) <= severities.indexOf(b)` (>= の場合)

## 受け入れ条件

- [ ] `INCIDENT_CONFIG_PATH` が未設定でも `/inc` コマンドが正常動作する
- [ ] `INCIDENT_CONFIG_PATH` のファイルが存在しない場合も正常動作する
- [ ] 設定ファイルの `Severities` セクションのラベルがモーダルのドロップダウンに表示される（説明文付き）
- [ ] 設定ファイルの `Services` セクションのサービス一覧がモーダルのドロップダウンに表示される（説明文付き）
- [ ] `severity: Critical`（完全一致）のルールが正しく評価される
- [ ] `severity: >= High`（以上比較）のルールが正しく評価される
- [ ] `severity: <= Medium`（以下比較）のルールが正しく評価される
- [ ] `service: payment-api`（完全一致・大文字小文字無視）のルールが正しく評価される
- [ ] severity + service の AND 条件が正しく評価される
- [ ] `mention:` に記載したメンション（`@user` 等）が通知メッセージに含まれる

## 除外事項

- Severity の色定義（`SEVERITY_COLORS` のmarkdown化）
- サービスの詳細情報（説明文・オーナーチームなど）のmarkdown定義
- `OR` 条件や正規表現マッチングなどの高度な条件式
- 設定ファイルのホットリロード（キャッシュ + ファイル監視）
- 通知ルールの優先度・排他制御
