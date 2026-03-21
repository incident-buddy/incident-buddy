# インシデントチャンネル自動作成・招待

## 要求仕様

- インシデント対応者として、インシデント宣言時に専用の Slack チャンネルが自動作成されることで、対応メンバーが即座に集まれる場所を確保したい
- チームリーダーとして、通知ルールで指定したメンバーが自動的にチャンネルに招待されることで、手動招待の手間を省きたい
- 既存の通知チャンネル（#incidents 等）でインシデントチャンネルへのリンクを確認できることで、対応チャンネルに素早くアクセスしたい

## 機能仕様

### 正常系

- `/inc` モーダルでインシデントを宣言すると、`inc-{YYYYMMDD}-{NNN}` 形式（NNN は 3桁ゼロ埋め連番）のパブリックチャンネルが作成される
- チャンネル作成後、マッチした通知ルールの `mention` フィールドから招待対象を抽出してチャンネルに招待する
  - `@U...` / `@W...` → ユーザーID として直接招待
  - `@S...` → ユーザーグループID として `usergroups.users.list` でメンバーを取得し招待
  - `@here`, `@channel` → 招待には使用しない（通知メッセージへのメンションは従来どおり維持）
- 通知ルールにマッチした通知チャンネル（#incidents 等）へのメッセージに、作成したインシデントチャンネルのリンク `<#C...>` を追記する
- 招待対象ユーザーが重複する場合（複数ルールで同じユーザーが指定）は重複排除して1度だけ招待する

### 異常系・エッジケース

- **チャンネル名重複**: `name_taken` エラーが返った場合、連番を1増やしてリトライする（最大10回）
- **チャンネル作成失敗**: `conversations.create` が失敗した場合、既存の `postError` を使って元チャンネルにエラーを投稿し、以降の処理（チャンネル通知等）はスキップする
- **招待失敗**: `conversations.invite` が失敗してもインシデント作成・通知は成功扱いとし、エラーをコンソールに記録するのみ（処理を止めない）
- **グループメンバー取得失敗**: `usergroups.users.list` が失敗した場合は該当グループをスキップし、他の招待対象は処理を続行する
- **招待対象ゼロ**: 通知ルールにマッチしない、またはすべてのメンションが `@here`/`@channel` の場合は招待処理をスキップ
- **通知ルール未設定**: `INCIDENT_CONFIG_PATH` 未設定またはルールがマッチしない場合はチャンネルのみ作成し招待なし

## 実装方針

### 変更対象コンポーネント

- **`slack/handlers/incident-channel.ts`**（新規）
  - `buildChannelName(date: Date, seq: number): string` — `inc-YYYYMMDD-NNN` 生成（純粋関数）
  - `createIncidentChannel(client, date): Promise<{id: string, name: string}>` — 連番リトライ付きチャンネル作成
  - `resolveInvitees(client, mentions: string[]): Promise<string[]>` — メンション文字列をユーザーIDリストに変換
  - `inviteToChannel(client, channelId, userIds: string[]): Promise<void>` — チャンネル招待（失敗は握り潰しログ）

- **`slack/handlers/actions.ts`**（変更）
  - `incidentService.create` の後に `createIncidentChannel` → `resolveInvitees` → `inviteToChannel` を呼ぶ
  - `buildIncidentMessage` に `incidentChannelId` を渡す
  - 通知ルールの `postMessage` テキストにチャンネルリンクを追記

- **`features/incident/incident.presenter.ts`**（変更）
  - `buildIncidentMessage(incident, options?: { incidentChannelId?: string })` にオプションを追加
  - `incidentChannelId` が渡された場合、メッセージに `対応チャンネル: <#C...>` を追記

### 技術的アプローチ

- チャンネル作成・招待ロジックはすべて `slack/handlers/` に閉じ込める（Slack SDK 依存を features/ に持ち込まない）
- `resolveInvitees` は mentions 文字列のプレフィックスで振る舞いを分岐
  - `@U`, `@W` → `@` を除いた文字列をユーザーIDとして使用
  - `@S` → `@` を除いた文字列をグループIDとして `usergroups.users.list` を呼ぶ
  - `@here`, `@channel` → スキップ

## 受け入れ条件

- [ ] インシデント宣言時、`inc-YYYYMMDD-NNN` 形式のパブリックチャンネルが作成される
- [ ] チャンネル名が重複（`name_taken`）する場合、連番を増やして再作成される
- [ ] 通知ルールの `@U.../@W...` メンションのユーザーが作成チャンネルに招待される
- [ ] 通知ルールの `@S...` グループのメンバーが作成チャンネルに招待される
- [ ] `@here`/`@channel` は招待には使用されない（通知メッセージへのメンションは維持）
- [ ] 複数ルールで同じユーザーIDが指定された場合、重複排除して1回だけ招待される
- [ ] 通知チャンネル（#incidents 等）の通知メッセージにインシデントチャンネルリンクが含まれる
- [ ] チャンネル作成失敗時は `postError` でエラーを投稿し、通知処理をスキップする
- [ ] 招待失敗時は処理を止めず、コンソールにエラーログを出力する

## 除外事項

- インシデントチャンネル ID の Firestore 永続化（将来課題）
- インシデントチャンネルへのトピック・説明の自動設定
- インシデントチャンネルへのインシデント情報メッセージ投稿（宣言メッセージは既存チャンネルのみ）
- チャンネルをプライベートにするオプション
- 招待後のウェルカムメッセージ送信
