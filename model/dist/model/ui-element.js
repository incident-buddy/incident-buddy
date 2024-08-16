"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostElement = exports.ModalElement = exports.ButtonElement = void 0;
const zod_1 = require("zod");
// TODO validate field existence
const FillFieldElement = zod_1.z.object({
    type: zod_1.z.literal("fillField"),
    field: zod_1.z.string(),
});
const OptionItems = zod_1.z.record(zod_1.z.string(), zod_1.z.object({
    label: zod_1.z.string(),
}));
const PlainSelectElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("select"),
    label: zod_1.z.string(),
    options: OptionItems,
});
const ChannelSelectElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("channelSelect"),
    label: zod_1.z.string(),
});
const UserSelectElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("userSelect"),
    label: zod_1.z.string(),
});
const RadioElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("radio"),
    label: zod_1.z.string(),
    options: OptionItems,
});
const CheckboxElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("checkbox"),
    label: zod_1.z.string(),
    options: OptionItems,
});
const TextInputElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("textInput"),
    label: zod_1.z.string(),
    placeholder: zod_1.z.string().optional(),
    optional: zod_1.z.boolean().default(false),
    multiline: zod_1.z.boolean().default(false),
});
const DateTimePickerElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("dateTimePicker"),
    label: zod_1.z.string(),
});
const HeaderElement = zod_1.z.object({
    type: zod_1.z.literal("header"),
    text: zod_1.z.string(),
});
const TextElement = zod_1.z.object({
    type: zod_1.z.literal("text"),
    text: zod_1.z.string(),
});
const NoteElement = zod_1.z.object({
    type: zod_1.z.literal("note"),
    text: zod_1.z.string(),
});
const DefinitionListElement = zod_1.z.object({
    type: zod_1.z.literal("dl"),
    items: zod_1.z.record(zod_1.z.string(), zod_1.z.string()),
});
const DividerElement = zod_1.z.object({
    type: zod_1.z.literal("divider")
});
exports.ButtonElement = zod_1.z.object({
    elementId: zod_1.z.string(),
    type: zod_1.z.literal("button"),
    label: zod_1.z.string(),
    invoke: zod_1.z.string(),
});
exports.ModalElement = zod_1.z.discriminatedUnion("type", [
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
exports.PostElement = zod_1.z.discriminatedUnion("type", [
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
    exports.ButtonElement,
    DefinitionListElement,
    DividerElement,
]);
