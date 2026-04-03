# インシデント一覧表示 (`/inc list`)

## 要求仕様

- As a チームメンバー, I want to `/inc list` でオープン中のインシデント一覧を ephemeral 確認できる, so that 障害対応中に「自分以外で進行中のインシデントがあるか」を即座に把握できる

## 機能仕様

### 正常系

- `/inc list` を任意の Slack チャンネルで実行すると、実行者のみに見える ephemeral メッセージで一覧を返す
- 表示内容（1件ごと）: タイトル・severity・宣言者・経過時間・対応チャンネルへのリンク（`<#channelId>` 形式）
- 表示順: 作成日時の降順（最新が上）
- 最大10件表示（Firestore クエリ側で `.limit(10)` を適用）

### 異常系・エッジケース

- オープン中インシデントが0件 → 「オープン中のインシデントはありません」と ephemeral 表示
- 11件以上存在する場合 → Firestore クエリで直近10件のみ取得・表示（超過件数の案内なし）
- `findOpen()` が失敗した場合 → `respond()` で ephemeral エラーメッセージを表示

## 実装方針

### 変更対象コンポーネント

| ファイル | 変更内容 |
|---|---|
| `features/incident/incident.repository.ts` | `findOpen(limit = 10)` に `.limit(limit)` を追加 |
| `features/incident/incident.service.ts` | `findOpen()` を追加（repository の `findOpen` に委譲） |
| `features/incident/incident.presenter.ts` | `buildIncidentListMessage(incidents: Incident[], now: Date)` を追加（純粋関数） |
| `slack/handlers/commands.ts` | `/inc list` 分岐を追加。失敗時は `respond()` で ephemeral エラーを表示 |

### 技術的アプローチ

- Firestore クエリで `.limit(10)` を適用し、アプリ側での `slice()` を不要にする
- `buildIncidentListMessage(incidents, now)` は `now: Date` を引数で受け取り純粋関数を維持する。`now` は handler 側で `new Date()` を生成して渡す
- 経過時間の表示は既存の `formatElapsedTime(createdAt, endAt)` を流用する（`endAt` に `now` を渡す）
- `commands.ts` のエラーハンドリングは `try-catch` + `respond()` パターンを踏襲する

## 受け入れ条件

- [ ] `/inc list` を実行するとオープン中インシデント一覧が ephemeral で表示される
- [ ] 1件ごとにタイトル・severity・宣言者・経過時間・対応チャンネルリンクが表示される
- [ ] 表示は作成日時の降順（新しい順）
- [ ] 最大10件まで表示される（Firestore クエリで制限）
- [ ] 0件の場合は「オープン中のインシデントはありません」と表示される
- [ ] 他のユーザーには見えない（ephemeral）
- [ ] `findOpen()` 失敗時はユーザーに ephemeral エラーが表示される

## 除外事項

- resolved 済みインシデントの表示
- フィルタ・検索機能
- ページネーション
- 10件超過時の件数案内
