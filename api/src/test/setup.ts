import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";

// MSW をモジュールロード時に起動 — テストファイルのモジュールグラフが
// 解決される前に Slack API インターセプトを有効にする
export const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "warn" });
