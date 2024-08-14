import { z } from "zod";

export const StdField = z.object({
  description: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
  }),
  status: z.object({
    label: z.string(),
    items: z.array(
      z.object({
        code: z.string(),
        type: z.literal("open").or(z.literal("closed")),
        label: z.string(),
      }),
    ),
  }),
  severity: z.object({
    label: z.string(),
    items: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
      }),
    ),
  }),
  role: z.object({
    label: z.string(),
    items: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
      }),
    ),
  }),
});

export type StdField = z.infer<typeof StdField>;

const SingleSelectField = z.object({
  type: z.literal("singleSelect"),
  label: z.string(),
  items: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
    }),
  ),
});

const MultiSelectField = z.object({
  type: z.literal("multiSelect"),
  label: z.string(),
  items: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
    }),
  ),
});

const NumberField = z.object({
  type: z.literal("number"),
  label: z.string(),
});

const TextField = z.object({
  type: z.literal("text"),
  label: z.string(),
});

export const CustomField = z.record(
  z.string(),
  z.discriminatedUnion("type", [
    SingleSelectField,
    MultiSelectField,
    NumberField,
    TextField,
  ]),
);

export type CustomField = z.infer<typeof CustomField>;
