import { z } from "zod";

// TODO validate field existence
const FillFieldElement = z.object({
  type: z.literal("fillField"),
  field: z.string(),
  label: z.string(),
});

export type FillFieldElement = z.infer<typeof FillFieldElement>;

const OptionItems = z.array(
  z.object({
    code: z.string(),
    label: z.string(),
  }),
);
export type OptionItems = z.infer<typeof OptionItems>;

const PlainSelectElement = z.object({
  elementId: z.string(),
  type: z.literal("select"),
  label: z.string(),
  options: OptionItems,
});
export type PlainSelectElement = z.infer<typeof PlainSelectElement>;

const ChannelSelectElement = z.object({
  elementId: z.string(),
  type: z.literal("channelSelect"),
  label: z.string(),
});
export type ChannelSelectElement = z.infer<typeof ChannelSelectElement>;

const UserSelectElement = z.object({
  elementId: z.string(),
  type: z.literal("userSelect"),
  label: z.string(),
});
export type UserSelectElement = z.infer<typeof UserSelectElement>;

const RadioElement = z.object({
  elementId: z.string(),
  type: z.literal("radio"),
  label: z.string(),
  options: OptionItems,
});
export type RadioElement = z.infer<typeof RadioElement>;

const CheckboxElement = z.object({
  elementId: z.string(),
  type: z.literal("checkbox"),
  label: z.string(),
  options: OptionItems,
});
export type CheckboxElement = z.infer<typeof CheckboxElement>;

const TextInputElement = z.object({
  elementId: z.string(),
  type: z.literal("textInput"),
  label: z.string(),
  placeholder: z.string().optional(),
  optional: z.boolean().default(false),
  multiline: z.boolean().default(false),
});
export type TextInputElement = z.infer<typeof TextInputElement>;

const DateTimePickerElement = z.object({
  elementId: z.string(),
  type: z.literal("dateTimePicker"),
  label: z.string(),
});
export type DateTimePickerElement = z.infer<typeof DateTimePickerElement>;

const HeaderElement = z.object({
  type: z.literal("header"),
  text: z.string(),
});
export type HeaderElement = z.infer<typeof HeaderElement>;

const TextElement = z.object({
  type: z.literal("text"),
  text: z.string(),
});
export type TextElement = z.infer<typeof TextElement>;

const NoteElement = z.object({
  type: z.literal("note"),
  text: z.string(),
});
export type NoteElement = z.infer<typeof NoteElement>;

const DefinitionListElement = z.object({
  type: z.literal("dl"),
  items: z.record(z.string(), z.string()),
});
export type DefinitionListElement = z.infer<typeof DefinitionListElement>;

const DividerElement = z.object({
  type: z.literal("divider"),
});
export type DividerElement = z.infer<typeof DividerElement>;

export const ButtonElement = z.object({
  elementId: z.string(),
  type: z.literal("button"),
  label: z.string(),
  invoke: z.string(),
});
export type ButtonElement = z.infer<typeof ButtonElement>;

/** Elements that can be used in config */
export const ModalConfigElement = z.discriminatedUnion("type", [
  FillFieldElement,
  PlainSelectElement,
  ChannelSelectElement,
  UserSelectElement,
  RadioElement,
  CheckboxElement,
  TextInputElement,
  DateTimePickerElement,
  HeaderElement,
  TextElement,
  NoteElement,
]);
export type ModalConfigElement = z.infer<typeof ModalConfigElement>;

/** Elements that can be used in instatiated modal */
export const ModalElement = z.discriminatedUnion("type", [
  PlainSelectElement,
  ChannelSelectElement,
  UserSelectElement,
  RadioElement,
  CheckboxElement,
  TextInputElement,
  DateTimePickerElement,
  HeaderElement,
  TextElement,
  NoteElement,
]);
export type ModalElement = z.infer<typeof ModalElement>;

export const PostElement = z.discriminatedUnion("type", [
  PlainSelectElement,
  ChannelSelectElement,
  UserSelectElement,
  RadioElement,
  CheckboxElement,
  TextInputElement,
  DateTimePickerElement,
  HeaderElement,
  TextElement,
  NoteElement,
  ButtonElement,
  DefinitionListElement,
  DividerElement,
]);
export type PostElement = z.infer<typeof PostElement>;
