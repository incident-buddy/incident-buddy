# バックログ

優先順位順。上から着手する。

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
