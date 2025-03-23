import { Trigger } from "@/components/workflow/trigger";
import { Condition } from "@/components/workflow/condition";
import { Steps } from "@/components/workflow/step";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const ActionArea = () => {
    return (
      <div className="sticky bottom-6 right-8 w-max ml-auto">
        <div className="flex flex-row gap-x-4">
          <Button variant="outline">キャンセル</Button>
          <Button variant="default">保存</Button>
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="flex flex-col gap-y-5">
        <div className="container max-w-xl">
          <h3 className="scroll-m-20 font-semibold tracking-tight mb-4">
            <Input
              className="w-full md:text-xl h-12"
              placeholder="ワークフロー名"
              value="D2以上で担当チームにSlack通知"
            />
          </h3>
          <Trigger />
          <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
          <Condition />
          <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
          <Steps />
        </div>
      </div>
      <ActionArea />
    </>
  );
}
