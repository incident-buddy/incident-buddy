import { z } from "zod/v4";

export const inputSchema = z.object({
	email: z.email(),
	password: z.string(),
});
