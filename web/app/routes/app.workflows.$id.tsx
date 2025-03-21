import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Trigger} from "~/components/workflow/trigger";
import {Condition} from "~/components/workflow/condition";

export const handle = {
  pageName: "D2以上で担当チームにSlack通知",
};

export default function Page() {
  return (
    <div className="overflow-x-auto flex flex-col gap-y-4">
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        D2以上で担当チームにSlack通知
      </h3>
      <div className="container max-w-xl">
        <Trigger />
        <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
        <Condition />
        <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
        <Card>
          <CardHeader>
            <CardTitle>ステップ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li><code>サービス</code>の<code>担当チーム</code>の<code>Slackチャンネル</code>にメッセージを送信する</li>
              <li><code>サービス</code>の<code>担当チーム</code>の<code>Slackチャンネル</code>にメッセージを送信する</li>
              <li><code>サービス</code>の<code>担当チーム</code>の<code>Slackチャンネル</code>にメッセージを送信する</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

