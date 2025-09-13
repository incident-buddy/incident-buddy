import { Button } from "@/components/ui/button";
import { Form, href, redirect } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { Route } from "./+types/incident.update.route";
import { Modal } from "@/components/modal";
import { createClient } from "@connectrpc/connect";
import { notFound } from "~/utils/response";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { FormItem } from "@/components/ui/form";

const schema = z.object({
  title: z.string().min(1).max(300),
});

export async function loader({ context, params }: Route.LoaderArgs) {
  const { incidentId } = params;
  const client = createClient(IncidentService, context.transport);
  const { incident } = await client.getIncident({ id: incidentId });

  if (!incident) {
    throw notFound(`incident: ${incidentId}`);
  }

  return { incident };
}

export const action = async ({ context, request, params }: Route.ActionArgs) => {
  const { incidentId } = params;
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }
  const client = createClient(IncidentService, context.transport);
  await client.updateIncidentTitle({ id: incidentId, title: submission.value.title });

  return redirect(href("/incident/:incidentId", params));
};

export default function ({ loaderData, actionData }: Route.ComponentProps) {
  const { title } = loaderData.incident;

  const lastResult = actionData;
  const [form, fields] = useForm({
    id: "incident-update-form",
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Modal title="インシデント名称の更新">
      {(closeFn) => (
        <Form
          method="POST"
          id={form.id}
          onSubmit={form.onSubmit}
          aria-describedby={form.errors ? form.errorId : undefined}
          noValidate
        >
          <div className="flex flex-col gap-y-4">
            <FormItem>
              <Label htmlFor={fields.title.id}>タイトル</Label>
              <Input
                type="text"
                key={fields.title.key}
                name={fields.title.name}
                defaultValue={title}
                aria-invalid={fields.title.errors ? true : undefined}
                aria-describedby={fields.title.errors ? fields.title.errorId : undefined}
              />
              <div id={fields.title.errorId} className="text-sm text-red-800">
                {fields.title.errors}
              </div>
            </FormItem>
            <div className="flex flex-row justify-end">
              <Button variant="outline" className="mr-2" onClick={closeFn}>
                キャンセル
              </Button>
              <Button type="submit" disabled={!form.valid}>
                更新
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Modal>
  );
}
