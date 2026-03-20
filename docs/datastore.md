# Firestore データモデル

## コレクション構造

```
/incidents/{incidentId}
  id, title, description, status, severity
  slackChannelId, slackMessageTs        ← bot メッセージのスレッド操作用
  createdBy (memberId), createdByName   ← Slack userId + 名前スナップショット
  teamIds: string[]                     ← array-contains クエリ用
  serviceIds: string[]                  ← array-contains クエリ用
  responderIds: string[]                ← array-contains クエリ用
  createdAt, resolvedAt, updatedAt

  /incidents/{incidentId}/timeline/{eventId}
    type: "created"|"responder_added"|"service_added"|"resolved"|"note"
    actorId, actorName (スナップショット), note, occurredAt

/teams/{teamId}
  id, name, slackChannelId, createdAt, updatedAt

/members/{memberId}          ← memberId = Slack userId (U012ABC)
  slackUserId, displayName, avatarUrl
  teamIds: string[]

/services/{serviceId}
  id, name, description, ownerTeamId (N:1), createdAt, updatedAt
```

## 設計のポイント

- **M:N は配列で持つ** → `array-contains` で 1 ドキュメント読み込みのみ
- **memberId = Slack userId** → Slack イベントからの lookup 不要
- **名前スナップショット** (`createdByName`, `actorName`) → リスト表示時の N 回読み込みを回避

## インデックス

複合インデックスは `api/firestore.indexes.json` で管理:

| コレクション | フィールド1 | フィールド2 | 用途 |
|---|---|---|---|
| incidents | status (ASC) | createdAt (DESC) | オープン一覧 |
| incidents | teamIds (CONTAINS) | createdAt (DESC) | チーム別一覧 |
| incidents | responderIds (CONTAINS) | createdAt (DESC) | 担当者別一覧 |
