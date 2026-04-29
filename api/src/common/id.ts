import * as z from "zod";
import { ulid } from "ulid";

const idSchema = z.ulid();
export type Id = z.infer<typeof idSchema>;

export function generateId(): Id {
	return ulid();
}
