import { Form, href, redirect } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import type { Route } from "./+types/incident.update.route";

const schema = z.object({
	title: z.string().min(1).max(300),
	description: z.string(),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== "success") {
		return submission.reply();
	}
	console.log("Update Incident", { id: params.incidentId, ...submission.value });
	
	return redirect(href("/incident/:incidentId", params))
}

export default function({ actionData }: Route.ComponentProps) {
	const lastResult = actionData
	const [form, fields] = useForm({
		id: "incident-update-form",
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		constraint: getZodConstraint(schema),
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	})

	return (
		<div>
			<Form
				method="POST"
				id={form.id}
				onSubmit={form.onSubmit}
				aria-describedby={form.errors ? form.errorId : undefined}
				noValidate>
				<label>title</label>
				<input
					type="text"
					key={fields.title.key}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
					aria-invalid={fields.title.errors ? true : undefined}
					aria-describedby={fields.title.errors ? fields.title.errorId : undefined}
				/>
				<div id={fields.title.errorId}>{fields.title.errors}</div>
				<label>description</label>
				<textarea
					key={fields.description.key}
					name={fields.description.name}
					defaultValue={fields.description.defaultValue}
					required={fields.description.required}
          minLength={fields.description.minLength}
          maxLength={fields.description.maxLength}
					aria-invalid={fields.description.errors ? true : undefined}
					aria-describedby={fields.description.errors ? fields.description.errorId : undefined}
				/>
				<div id={fields.description.errorId}>{fields.description.errors}</div>
				<button type="submit">Update Incident</button>
			</Form>
		</div>
	)
}
