# コーディングルール

作業のたびにこのドキュメントを参照し、ルールを遵守すること。

---

## TypeScript

### `as` 型アサーション禁止

**ルール**: `as` による型アサーションは原則使わない。

```typescript
// NG: TypeScript の健全性を壊す
const id = result.channel?.id as string;

// OK: ローカル変数に取り出して narrowing する
const id = result.channel?.id;
if (id) {
  return { id };
}
```

**理由**:
- `as` は「TypeScript より私の方が型を知っている」という主張。それが本当に言えるケースは稀
- `if (obj?.prop)` でチェックしても、オブジェクトリテラル内で TypeScript は narrowing できない
- 型エラーを隠蔽するために使うと、実行時エラーに変わるだけ

**例外**: 外部ライブラリの型定義が不正確で、かつそれが証明できる場合のみ許容。その際はコメントで理由を明記する。

**チェックポイント**: コード生成・レビュー時に `as` が含まれていたら必ず立ち止まって代替手段を検討する。

---

### `ok: false` の明示チェック

**ルール**: Slack WebClient を使う場合、SDK が `ok: false` を throw することに加え、戻り値の `ok` も明示的にチェックする。

```typescript
// NG: SDK の throw だけに依存
const result = await client.conversations.create({ name });
return result.channel.id; // ok: false の場合の防御がない

// OK: throw + 明示チェック
const result = await client.conversations.create({ name });
if (!result.ok) {
  throw new Error(result.error ?? "conversations.create failed");
}
```

**理由**: 意図が明確になる。`ok: false` を throw しない SDK に切り替えた場合のバグも防げる。

---

### エラーハンドリングの責務を関数内に閉じ込める

**ルール**: 「失敗しても処理を継続する」仕様の関数は、try-catch を内部で完結させ、呼び出し元に例外を伝播させない。

```typescript
// NG: 呼び出し元が try-catch を書く必要がある
export async function inviteToChannel(...) {
  await client.conversations.invite(...); // throws on failure
}

// OK: 自己完結
export async function inviteToChannel(...) {
  try {
    const result = await client.conversations.invite(...);
    if (!result.ok) {
      console.error("[incident-buddy] Failed to invite users:", result.error);
    }
  } catch (e) {
    console.error("[incident-buddy] Failed to invite users:", e);
  }
}
```

**理由**: 仕様（「失敗はログのみ、処理継続」）が関数シグネチャに表れる。呼び出し元がシンプルになる。

**命名規則（tryXxx パターン）**: ハンドラー内で「失敗してもログのみ・処理継続」の操作を呼び出す場合、`try` プレフィックス付きのラッパー関数として切り出す。

```typescript
// OK: tryXxx() 命名・内部完結ラッパーとして切り出す
async function trySetResolvedChannelTopic(
  client: SlackClient,
  channelId: string,
  title: string,
): Promise<void> {
  await setChannelTopic({ client, channelId, topic: `[Resolved] ${title}` });
}

// NG: ハンドラー内に直接 try-catch を書く、または命名規則なしで呼ぶ
onResolved: async (incident) => {
  try {
    await setChannelTopic(...); // ← tryXxx に切り出すべき
  } catch (e) { ... }
}
```

`setChannelTopic` 自体が内部で try-catch 完結していても、呼び出し側を `tryXxx()` で包むことで「この操作はベストエフォートだ」という意図が読み手に伝わる。

---

### `JSON.parse` の型安全化に `zod` を使う

**ルール**: `JSON.parse` の結果は `zod` で検証する。`as` による強制キャストは使わない。

```typescript
// NG: as キャストで型安全性をバイパス
const meta = JSON.parse(raw) as { incidentId: string };

// OK: zod で安全にパース
import { z } from "zod";
const schema = z.object({ incidentId: z.string() });
const result = schema.safeParse(JSON.parse(raw));
if (!result.success) return; // 不正データは早期リターン
const { incidentId } = result.data;
```

**理由**: `JSON.parse` は `any` を返す。`as` で型を付けても実行時エラーは防げない。`zod` は実行時バリデーションと型安全性を同時に提供する。

**プロジェクト標準**: `zod` は本プロジェクトの標準依存。新しく `JSON.parse` を使う箇所では必ず `zod` を使うこと。
