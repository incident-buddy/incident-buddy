import { http, HttpResponse } from "msw";

export const handlers = [
  // Slack API
  http.post("https://slack.com/api/auth.test", () => {
    return HttpResponse.json({ ok: true, user_id: "U000TEST", team_id: "T000TEST" });
  }),
  http.post("https://slack.com/api/views.open", () => {
    return HttpResponse.json({ ok: true, view: { id: "V000TEST" } });
  }),
  http.post("https://slack.com/api/chat.postMessage", () => {
    return HttpResponse.json({ ok: true, ts: "1234567890.000001", channel: "C000TEST" });
  }),

  // GCP メタデータサーバーへのリクエストを即時 404 で返す。
  // Firebase Admin SDK が認証情報チェックで link-local アドレスへ接続しタイムアウトするのを防ぐ。
  http.get("http://169.254.169.254/computeMetadata/v1/instance", () => {
    return new HttpResponse(null, { status: 404 });
  }),
  http.get("http://metadata.google.internal./computeMetadata/v1/instance", () => {
    return new HttpResponse(null, { status: 404 });
  }),
];
