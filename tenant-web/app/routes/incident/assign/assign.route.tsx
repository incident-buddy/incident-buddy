import { Button } from "@/components/ui/button";
import { Form, href, redirect } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "@conform-to/react";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";

import { Modal } from "@/components/modal";
import { createClient } from "@connectrpc/connect";
import { notFound } from "~/utils/response";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { FormItem } from "@/components/ui/form";

const schema = z.object({
  title: z.string().min(1).max(300),
});

export async function loader({ context, params }: Route.LoaderArgs) {}

export const action = async ({ context, request, params }: Route.ActionArgs) => {};

export default function ({ loaderData, actionData }: Route.ComponentProps) {
  return <Modal title="インシデント名称の更新">{(closeFn) => <div>hello</div>}</Modal>;
}
