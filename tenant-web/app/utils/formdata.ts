import { z } from "zod/v4";

export function parseFormData<T>(formData: FormData, schema: z.ZodSchema<T>) {
	return schema.safeParse(Object.fromEntries(formData));
}
