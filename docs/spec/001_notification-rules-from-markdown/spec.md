# インシデント設定のmarkdown定義機能

## 要求仕様

- SREとして、インシデント登録時の通知先をコードを変更せずに管理・変更したい
- SREとして、severity定義とサービス一覧もコードを変更せずに管理したい
- SREとして、チームやサービスに応じた通知先の振り分けルールをmarkdownで定義したい

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
- channel: #payment-oncall
- mention: @payment-lead @oncall-group

### All Critical Incidents
- severity: Critical
- channel: #incidents-critical
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
- `channel: #channel-name` — 通知先チャンネル（必須）
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
3. マッチしたルールのチャンネルへ追加通知メッセージを送信する（メンション付き）
4. ルールが1件もマッチしない場合は元のチャンネルのみに通知（現状維持）

### 正常系

- 設定ファイルに定義されたseverityとserviceがモーダルに表示される
- severity + service の AND 条件にマッチしたルールのチャンネルへ通知が飛ぶ
- メンション（`@user`）が通知メッセージに含まれる
- 複数ルールにマッチした場合、全てのチャンネルへ通知が飛ぶ
- severity条件のみのルールが正しく評価される
- service条件のみのルールが正しく評価される
- `>= High` のような比較演算子が正しく評価される

### 異常系・エッジケース

- `INCIDENT_CONFIG_PATH` が未設定の場合: 通常フローを継続（元チャンネルのみ通知）
- 設定ファイルが存在しない場合: ログを出力し通常フローを継続
- 設定ファイルのパースに失敗した場合: ログを出力し通常フローを継続
- モーダル表示時にファイルが読めない場合: デフォルトのseverity/serviceなしでモーダルを表示
- どのルールにもマッチしない場合: 元チャンネルのみに通知（現状維持）
- `mention:` のみ・`channel:` なしのルールは無効（無視する）

## 実装方針

### 変更対象コンポーネント

#### 新規: `features/incident-config/`
- `incident-config.model.ts` — ドメイン型定義
  - `SeverityDef`: `{ label: string; description: string }`
  - `ServiceDef`: `{ label: string; description: string }`
  - `SeverityCondition`: `{ op: "==" | ">=" | "<=" ; label: string }`
  - `NotificationRule`: `{ name: string; conditions: { severity?: SeverityCondition; service?: string }; actions: { channels: string[]; mentions: string[] } }`
  - `IncidentConfig`: `{ severities: SeverityDef[]; services: ServiceDef[]; notificationRules: NotificationRule[] }`
- `incident-config.parser.ts` — markdownパース（純粋関数、I/Oなし）
- `incident-config.service.ts` — ファイル読み込み + ルール評価ロジック
  - `loadConfig(filePath: string): Promise<IncidentConfig>`
  - `matchRules(config: IncidentConfig, severity: string, serviceName: string): NotificationRule[]`
  - `compareSeverity(severities: SeverityDef[], a: string, op: string, b: string): boolean`

#### 変更: `features/incident/incident.model.ts`
- `Severity` 型を `string` に変更
- `CreateIncidentParams` に `serviceName: string` を追加
- `Incident` に `serviceName: string` を追加

#### 変更: `db/types.ts`
- `IncidentDoc` に `serviceName: string` を追加
- `Severity` 型の re-export を削除（または `string` に変更）

#### 変更: `features/incident/incident.presenter.ts`
- `SEVERITY_COLORS` のハードコードを削除
- severityに依存しない固定色（またはデフォルト色）を使用

#### 変更: `slack/handlers/commands.ts`
- `/inc` コマンド処理時に設定ファイルを読み込み
- Severity/Serviceドロップダウンを動的生成
- `INCIDENT_CONFIG_PATH` が未設定でもデフォルトモーダルを表示

#### 変更: `slack/handlers/actions.ts`
- `create_incident` 送信時に設定ファイルを読み込み
- マッチしたルールの各チャンネルへ追加通知を送信

#### 変更: `api/src/env.ts`
- `INCIDENT_CONFIG_PATH` 環境変数を追加（任意）

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
- [ ] マッチした全ルールのチャンネルへ追加通知が飛ぶ
- [ ] `mention:` に記載したメンション（`@user` 等）が通知メッセージに含まれる
- [ ] どのルールにもマッチしない場合は元チャンネルのみへ通知（現状維持）

## 除外事項

- Severity の色定義（`SEVERITY_COLORS` のmarkdown化）
- サービスの詳細情報（説明文・オーナーチームなど）のmarkdown定義
- `OR` 条件や正規表現マッチングなどの高度な条件式
- 設定ファイルのホットリロード（キャッシュ + ファイル監視）
- 通知ルールの優先度・排他制御
