import { ulid } from "ulid";
import * as z from "zod";

const idSchema = z.ulid();
export type Id = z.infer<typeof idSchema>;

export function generateId(): Id {
  return ulid();
}
