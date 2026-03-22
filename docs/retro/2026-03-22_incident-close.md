# レトロスペクティブ議事録

**日付**: 2026-03-22
**機能**: インシデントのクローズ（バックログ A）
**参加者**: EM（ユーザー）、オーケストレーター（Claude）、各専門エージェント

---

## 起きたこと（Facts）

### 開発フロー
| Phase | 内容 | 結果 |
|-------|------|------|
| Phase 1 | 計画立案（BA + テックリードレビュー 3回） | REQUEST_CHANGES × 3 |
| Phase 2 | 仕様書作成 | `docs/spec/010_incident-close.md` |
| Phase 3 | E2Eテスト実装（8件） | 全件 fail 確認 |
| Phase 4 | TDD実装 | 全 111 テスト pass |
| Phase 5 | 受け入れテスト | PASS（9/9 受け入れ条件充足） |

### テックリードレビューの経緯（3回）
**1回目 → REQUEST_CHANGES（HIGH × 4）**
- 既存コードの `addTimelineEvent()` が `Timestamp.now()` を service 層で使う違反
- `resolve()` が `FieldValue.serverTimestamp()` を使うため resolve 後の `findById()` で `resolvedAt` が null になる問題
- `IncidentDoc`（`db/types.ts`）への `resolvedBy`/`resolvedByName` 追加漏れ
- "失敗してもログのみ継続" 処理の `try-catch` 責務の不整合

**2回目 → REQUEST_CHANGES（HIGH × 4, MEDIUM × 2）**
- `AddTimelineEventInput` 型設計漏れ（`TimelineEventDoc` との不整合）
- `private_metadata` の型安全化（`zod` を検討）
- `postError` のチャンネルID取得戦略が未定義
- `refreshIncidentSlackMessage` の変更による既存ハンドラーへの影響

**3回目 → REQUEST_CHANGES（HIGH × 4, MEDIUM × 2）**
- `zod` が未導入（ユーザーが途中でインストールして解決）
- `ack()` タイミングと UX の明確化不足
- `AlreadyResolvedError` の配置場所が曖昧
- 経過時間計算ロジックの重複（QA 後に修正）

### 既存バグ修正（シフトレフトの成果）
- `incidentService.addResponder()` が `Timestamp.now()` を直接使用していた（アーキテクチャ違反）
- `incidentRepository.resolve()` が `FieldValue.serverTimestamp()` を使うことで、`resolve()` 後の `findById()` で `resolvedAt` が `null` になるリスク

---

## うまくいったこと（Keep）

### 既存バグの発見（EMコメント: 想定外の収穫）
テックリードレビューのアーキテクチャ適合チェックが、計画フェーズで既存の `Timestamp` 依存バグを発見した。実装フェーズ前に問題を把握できたため、修正コストが低かった。

### 受け入れテストの完全充足
9/9 の受け入れ条件を全て充足。E2E テストがビジネス価値に直結する検証となった。

### 段階的な型安全性の向上
`zod` 導入により、`JSON.parse` 結果の型安全化をコーディングルール違反なしに実現した。

### 責務分離の徹底
- `formatElapsedTime` を presenter に集約（QA 指摘を受けて handler 内の重複を除去）
- `AlreadyResolvedError` を `model.ts` に配置（ドメインルールの適切な表現）

---

## 問題だったこと（Problem）

### テックリードレビューが 3 回必要だった
バックログに詳細な仕様があったにもかかわらず、計画フェーズで繰り返し REQUEST_CHANGES が発生した。主因は以下：
- テックリードが毎回の計画書から「既存コードの詳細」を読み取る前に指摘が先行する構造
- 計画書に「既存コードの実態」を記載する慣習がなかった

### エージェント間のコンテキスト共有が弱い（EMコメント）
BAエージェントは確認モーダルを記載漏れした。テックリードエージェントは計画書の `private_metadata` 設計を見落とした。各エージェントの出力が次のエージェントの入力として完全に引き継がれないケースがあった。

### `zod` の未導入で一時的に設計が揺れた
計画フェーズで「zod が利用可能か」を先に確認すべきだったが、3回目のレビューまで未確認だった。ユーザーが途中でインストールして解決したが、最初から確認する習慣があれば防げた。

---

## 学んだこと（Learn）

### テックリードレビューには「既存コードの調査結果」を事前に渡す
計画書に「現在の実装状態（メソッドシグネチャ・既存パターン）」を含めることで、テックリードが設計の妥当性を検証しやすくなる。これにより指摘の精度が上がり、レビューサイクルを削減できる。

### 型安全性のツールチェーンは計画フェーズで確認する
`zod`・`io-ts` などの validation ライブラリの有無を計画フェーズの最初に確認し、計画書に明記することで設計の揺れを防ぐ。

### シフトレフトの有効性
Phase 1 のアーキテクチャ指摘が、Phase 4 での既存バグ修正に繋がった。テックリードレビューはコードレビューとしてだけでなく、既存負債の発見機会としても機能する。

---

## アクションアイテム（Action Items）

### [HIGH] テックリードエージェントのプロンプト改善
**内容**: テックリードに計画書を渡す前に、実装対象の既存コードを Explorer エージェントで調査させ、その結果を計画書に付記する手順を `feature-dev.md` に追加する。
**Why**: 3回のレビューのうち、「既存コードを読めば分かる指摘」がHIGH判定で複数出た。事前調査で防げる。
**優先度**: HIGH

### [HIGH] `zod` をプロジェクト標準依存として明記
**内容**: `docs/coding-rules.md` に「JSON.parse の結果は `zod` で型検証する」ルールを追加。`package.json` に `zod` が含まれていることを確認し、なければ追加する。
**Why**: `as` 型アサーション禁止ルールと `JSON.parse` の型安全化要件を両立するための唯一の標準手段として確立する。
**優先度**: HIGH

### [HIGH] `design-rules.md` への指摘事項の追記
**内容**: 今回のテックリードレビューで判明した以下のルールを `docs/design-rules.md` に追加する：
- `[2026-03-22 incident-close]` `addTimelineEvent()` の引数は `Date` 型で受け取り repository 内で `Timestamp.fromDate()` に変換する
- `[2026-03-22 incident-close]` `resolve()` は `FieldValue.serverTimestamp()` ではなく service 層で生成した `Date` を `Timestamp.fromDate()` で変換して使う
- `[2026-03-22 incident-close]` "失敗してもログのみ継続" 処理は handler 内でインラインに書かず、内部 try-catch を持つ関数として切り出す
**優先度**: HIGH

### [MEDIUM] エージェント間コンテキスト共有の改善記録
**内容**: BAエージェントの出力を次フェーズに引き継ぐ際に、「前エージェントの未解決の疑問点」を明示的に次エージェントのプロンプトに含める手順を検討する。
**Why**: BAエージェントが確認モーダルを記載漏れした。オーケストレーターが前フェーズの出力を検証してから次フェーズに渡す責務を明確にする。
**優先度**: MEDIUM

---

## 次のアクション

1. `docs/design-rules.md` への追記（即実施）
2. `docs/coding-rules.md` への `zod` ルール追記（即実施）
3. `feature-dev.md` のテックリードレビュー手順改善（次回開発前に実施）
