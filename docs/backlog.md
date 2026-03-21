# バックログ

優先順位順。上から着手する。

---

## B: 対応者の追加

インシデントチャンネルのウェルカムメッセージにロールベースの「自身をアサイン」ボタンを設置し、
クリック操作でインシデント対応者をロール付きで登録できるようにする。

### ユーザーストーリー
- As a インシデント対応チームのメンバー, I want to ウェルカムメッセージのボタンを押すだけで
  自分を特定ロール（コマンダー・調査担当など）にアサインできる, so that チャンネルに入った
  直後から「誰が何をするか」を明確にでき、混乱を防げる

### なぜここか（優先度の根拠）
- インシデント宣言・チャンネル作成・ウェルカムメッセージが実装済みで、次の自然な一手は
  「誰が対応するか」の可視化
- timeline への書き込みを初めて実装するため、後続（A: resolve、G: note）の基盤になる

### 機能仕様

#### 正常系
- ウェルカムメッセージに `incident-config` で定義されたロールごとの「[ロール名]になる」ボタンを表示する
- ボタンを押すと：
  1. インシデントの `responders` に `{ roleId, userId, userName }` が追加される
  2. ウェルカムメッセージが `chat.update` で更新され、現在の担当者一覧が反映される
  3. `#incidents` のインシデントメッセージも `refreshIncidentSlackMessage` で更新される
  4. インシデントチャンネルに「@alice がコマンダーになりました」通知が投稿される
  5. timeline に `type: "responder_added"` として記録される
- ロール制約（上限人数など）は設定ファイルに記載するが UI ガイドのみ（システム強制なし）

#### 異常系・エッジケース
- すでに同じロールにアサイン済みのユーザーが再度ボタンを押した場合、ephemeral で
  「既にアサイン済みです」と返す（Firestore 更新・timeline 記録は行わない）
- `chat.update`（ウェルカムメッセージ更新）が失敗した場合はエラーをスローし `postError` で処理
- `refreshIncidentSlackMessage`（#incidents 更新）失敗時はログのみで処理継続
  （アサイン自体は成功扱い）
- チャンネルへの通知投稿（`chat.postMessage`）失敗時はログのみで処理継続

### 実装のポイント
- `features/incident/incident.model.ts`: `Responder: { roleId: string, userId: string,
  userName: string }` 型を追加し、`Incident` の `responderIds: string[]` を
  `responders: Responder[]` に変更（アーキテクチャルール確認済み）
- `db/types.ts`: Firestore ドキュメント型の `responderIds` を `responders` に変更
- `features/incident/incident.repository.ts`: `toDomain()` の `responders` 変換を追加
- `features/incident/incident.service.ts`:
  - `findById(id: string): Promise<Incident | null>` を追加
  - `addResponder(incidentId, roleId, userId, userName): Promise<Incident>` を追加
- `features/incident/incident.presenter.ts`: `buildChannelWelcomeMessage` を更新して
  現在の担当者一覧とロールボタンを含める
- `slack/handlers/actions.ts`:
  - `refreshIncidentSlackMessage` 内の `incidentRepository.findById()` を
    `incidentService.findById()` に変更（アーキテクチャ修正を兼ねる）
  - `assign_role_{roleId}` アクションハンドラーを追加
  - チャンネル ID → インシデント ID のルックアップは `incidentChannelId` フィールドから行う
- `features/incident-config/`: ロール定義を新セクションとして `incident-config` に統合

### 受け入れ条件（仮）
- [ ] ウェルカムメッセージに `incident-config` のロール数だけボタンが表示される
- [ ] ボタン押下で `incidentService.addResponder` が呼ばれ `responders` にエントリが追加される
- [ ] ウェルカムメッセージが更新され担当者名が反映される
- [ ] `#incidents` のインシデントメッセージが `refreshIncidentSlackMessage` で更新される
- [ ] インシデントチャンネルにアサイン通知が投稿される
- [ ] timeline に `responder_added` イベントが記録される
- [ ] 重複アサイン時に ephemeral でエラーが返り、Firestore は変更されない
- [ ] `actions.ts` 内で `incidentRepository` を直接参照していない

### 除外事項（今回スコープ外）
- アンアサイン（自身を担当から外す）機能
- ロール制約のシステム強制（上限超過時のエラー）
- 他者を代理でアサインする機能

---

## A: インシデントのクローズ（`/inc resolve`）

インシデントチャンネルで `/inc resolve` を実行すると、`status: resolved`・`resolvedAt` を書き込み、Slack メッセージを解決済み表示に更新。解決通知をチャンネルに投稿。

**実装のポイント**:
- `incidentService.resolve(incidentId, userId, userName)` を実装
- timeline に `resolved` イベントを記録
- Slack メッセージの色・テキストを resolved 用に変更（`incident.presenter.ts`）

---

## C: インシデント一覧（`/inc list`）

`/inc list` でオープン中のインシデント一覧を ephemeral 表示。Firestore の `status + createdAt` 複合インデックスはすでに定義済み。

**実装のポイント**:
- `incidentRepository.listOpen()` を実装（インデックス活用）
- 一覧メッセージは `incident.presenter.ts` に追加

---

## I: 重大度変更（`/inc severity <level>`）

対応中にインシデントの重大度が変わった場合、`/inc severity critical` で更新。Slack メッセージも更新（F）。timeline に記録。

**実装のポイント**:
- `incidentService.updateSeverity(incidentId, severity, userId, userName)` を実装
- severity の選択肢はモーダルと同じ Severity 型を再利用

---

## J: インシデントチャンネルのトピック自動設定

チャンネル作成後、`conversations.setTopic` でトピックに `[Critical] DB障害 - 対応中` をセット。チャンネル一覧から内容が分かる。解決時は `[Resolved] DB障害` に更新。

**実装のポイント**:
- `incident-channel.ts` に `setChannelTopic` を追加
- 解決時（A の実装後）にもトピック更新を呼ぶ

---

## G: タイムラインへのメモ追記（`/inc note`）

インシデントチャンネルで `/inc note <テキスト>` を実行すると timeline に `type: "note"` で記録される。ポストモーテムの材料になる。

**実装のポイント**:
- `incidentService.addNote(incidentId, note, userId, userName)` を実装
- timeline サブコレクションへの書き込みは B で実装済みのものを再利用

---

## H: 解決時のポストモーテムテンプレート自動生成

`/inc resolve` 時に、timeline の内容（対応者・メモ・所要時間）をもとにポストモーテムのドラフトをチャンネルに投稿する。

**実装のポイント**:
- G（メモ機能）が実装済みであることが前提
- timeline を時系列で取得し、テンプレートに埋め込む
- Slack の `blocks` で見やすく整形

---

## K: リアクションによるポストモーテムタイムライン収集

Markdownの設定ファイルに指定したリアクション（`:pushpin:` など）がついたインシデントチャンネル内の投稿を、ポストモーテム生成時のタイムラインに自動で取り込む。

**ユースケース**: 対応中に重要な発見・判断・コマンド実行結果などを流れで投稿し、後から `:pushpin:` を付けるだけで自動的にポストモーテムの材料として収集される。`/inc note` との違いは「後からピン留め」できる点。

**実装のポイント**:
- 設定ファイルに `postmortem.pinReaction: "pushpin"` のような項目を追加
- `reaction_added` イベントを Bolt でハンドリング → 対象メッセージのチャンネルがインシデントチャンネルかチェック（E の `incidentChannelId` を使う）→ timeline に `type: "pinned_message"` で記録
- H のポストモーテム生成時に `pinned_message` イベントも取り込む
- H が実装済みであることが前提
