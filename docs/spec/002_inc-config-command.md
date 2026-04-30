# /inc config — 設定確認コマンド

## 要求仕様

- Slack オペレーターとして、現在の incident-buddy 設定（severity / service / notification rules）を手軽に確認したい
- 確認結果は自分にだけ見える ephemeral message で返ってほしい（他のメンバーのチャンネルを汚さない）
- 設定ファイルに不備がある場合は、エラー内容を通知してオペレーターが気付けるようにしたい

## 機能仕様

### 正常系

**設定ファイルあり（INCIDENT_CONFIG_PATH が設定されており、パースも成功）**

`/inc config` を実行すると、実行したユーザーにのみ以下の ephemeral message が届く：

```
📋 *Incident Config* (loaded from /path/to/config.md)

*Severities*
• P1 - Critical
• P2 - High

*Services*
• payments
• auth

*Notification Rules*
• rule-name: severity==P1 → #incidents-critical @here
```

**設定ファイルなし（INCIDENT_CONFIG_PATH が未設定の場合）**

```
📋 *Incident Config* (no config file — using defaults)

*Severities (default)*
• Critical / High / Medium / Low

*Services*: なし

*Notification Rules*: なし
```

**既存コマンドへの影響なし**

`/inc`（引数なし）は従来通り incident 作成 modal を開く。

### 異常系・エッジケース

**INCIDENT_CONFIG_PATH は設定されているが、ファイルが存在しない or パースエラー**

デフォルト表示へのフォールバックは行わない。以下のようなエラーメッセージを表示し、オペレーターが設定ファイルの不備に気付けるようにする：

```
⚠️ *Incident Config — Load Error*

Failed to load config from `/path/to/config.md`:
<エラーメッセージ>

Please check the file and fix the issue.
```

**severities / services / notificationRules のいずれかが空配列**

該当セクションは「なし」と表示する。

**notificationRule の conditions が空（常にマッチ）**

条件なし（`(no condition)`）として表示する。

### メッセージフォーマット詳細

- conditions の表示: `severity==P1` / `service=payments` / `severity>=P2 & service=auth`
- actions の表示: `→ #channel1 #channel2 @mention1`

## 受け入れ条件

- [ ] `/inc config` を打つと実行ユーザーのみに ephemeral message が届く
- [ ] config ありのとき severities / services / notification rules がすべて表示される
- [ ] config なしのとき「デフォルト設定使用中」のメッセージが表示される
- [ ] パースエラー時はエラーメッセージが表示され、デフォルトにフォールバックしない
- [ ] notification rule の conditions / actions が正しく文字列化される
- [ ] `/inc`（引数なし）は従来通り modal が開く（既存動作のリグレッションなし）

## 除外事項

- 設定ファイルの内容編集機能（読み取り専用）
- 管理者限定などのアクセス制御
- ページネーション（ルール数が多い場合でも全件表示）
