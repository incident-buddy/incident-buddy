import { z } from "zod";

const StdDescriptionField = z.object({
  type: z.literal("stdDescription").default("stdDescription"),
  label: z.string(),
  placeholder: z.string().optional(),
});

const StdStatusField = z.object({
  type: z.literal("stdStatus").default("stdStatus"),
  label: z.string(),
  items: z.array(
    z.object({
      code: z.string(),
      type: z.literal("open").or(z.literal("closed")),
      label: z.string(),
    }),
  ),
});

const StdSeverityField = z.object({
  type: z.literal("stdSeverity").default("stdSeverity"),
  label: z.string(),
  items: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
    }),
  ),
});

export const StdField = z.object({
  description: StdDescriptionField,
  status: StdStatusField,
  severity: StdSeverityField,
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

const UserField = z.object({
  type: z.literal("user"),
  label: z.string(),
});

export const CustomField = z.record(
  z.string(),
  z.discriminatedUnion("type", [
    SingleSelectField,
    MultiSelectField,
    NumberField,
    TextField,
    UserField,
  ]),
);

export type CustomField = z.infer<typeof CustomField>;
