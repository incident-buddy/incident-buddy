import { createHmac } from "node:crypto";

type SignedHeaders = {
  "content-type": string;
  "x-slack-signature": string;
  "x-slack-request-timestamp": string;
};

/**
 * Slack リクエスト署名ヘッダーを生成する。
 *
 * HonoReceiver の verifySignature() と同じアルゴリズム:
 *   v0:${timestamp}:${body}  を HMAC-SHA256 で署名
 */
export function signSlackRequest(
  body: string,
  signingSecret: string,
  contentType = "application/x-www-form-urlencoded",
): SignedHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(`v0:${timestamp}:${body}`);
  const signature = `v0=${hmac.digest("hex")}`;

  return {
    "content-type": contentType,
    "x-slack-signature": signature,
    "x-slack-request-timestamp": timestamp,
  };
}
