import {Trigger} from "@/components/workflow/trigger";
import {Condition} from "@/components/workflow/condition";
import {Steps} from "~/components/workflow/step";
import {Input} from "~/components/ui/input";

export default function Page() {
  return (
    <div className="flex flex-col gap-y-5">
      <div className="container max-w-xl">
        <h3 className="scroll-m-20 font-semibold tracking-tight mb-4">
          <Input className="w-full md:text-xl h-12" placeholder="ワークフロー名" value="D2以上で担当チームにSlack通知" />
        </h3>
        <Trigger />
        <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
        <Condition />
        <div className="w-1 h-8 bg-slate-100 mx-auto"></div>
        <Steps />


      </div>
    </div>
  );
}

