import { z } from "zod";
declare const FillFieldElement: z.ZodObject<{
    type: z.ZodLiteral<"fillField">;
    field: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "fillField";
    field: string;
}, {
    type: "fillField";
    field: string;
}>;
export type FillFieldElement = z.infer<typeof FillFieldElement>;
declare const OptionItems: z.ZodRecord<z.ZodString, z.ZodObject<{
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
}, {
    label: string;
}>>;
export type OptionItems = z.infer<typeof OptionItems>;
declare const PlainSelectElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"select">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>;
export type PlainSelectElement = z.infer<typeof PlainSelectElement>;
declare const ChannelSelectElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"channelSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "channelSelect";
    label: string;
    elementId: string;
}, {
    type: "channelSelect";
    label: string;
    elementId: string;
}>;
export type ChannelSelectElement = z.infer<typeof ChannelSelectElement>;
declare const UserSelectElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"userSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "userSelect";
    label: string;
    elementId: string;
}, {
    type: "userSelect";
    label: string;
    elementId: string;
}>;
export type UserSelectElement = z.infer<typeof UserSelectElement>;
declare const RadioElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"radio">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>;
export type RadioElement = z.infer<typeof RadioElement>;
declare const CheckboxElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"checkbox">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>;
export type CheckboxElement = z.infer<typeof CheckboxElement>;
declare const TextInputElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"textInput">;
    label: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    optional: z.ZodDefault<z.ZodBoolean>;
    multiline: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "textInput";
    label: string;
    elementId: string;
    optional: boolean;
    multiline: boolean;
    placeholder?: string | undefined;
}, {
    type: "textInput";
    label: string;
    elementId: string;
    placeholder?: string | undefined;
    optional?: boolean | undefined;
    multiline?: boolean | undefined;
}>;
export type TextInputElement = z.infer<typeof TextInputElement>;
declare const DateTimePickerElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"dateTimePicker">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}>;
export type DateTimePickerElement = z.infer<typeof DateTimePickerElement>;
declare const HeaderElement: z.ZodObject<{
    type: z.ZodLiteral<"header">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "header";
    text: string;
}, {
    type: "header";
    text: string;
}>;
export type HeaderElement = z.infer<typeof HeaderElement>;
declare const TextElement: z.ZodObject<{
    type: z.ZodLiteral<"text">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
}, {
    type: "text";
    text: string;
}>;
export type TextElement = z.infer<typeof TextElement>;
declare const NoteElement: z.ZodObject<{
    type: z.ZodLiteral<"note">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    text: string;
}, {
    type: "note";
    text: string;
}>;
export type NoteElement = z.infer<typeof NoteElement>;
declare const DefinitionListElement: z.ZodObject<{
    type: z.ZodLiteral<"dl">;
    items: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "dl";
    items: Record<string, string>;
}, {
    type: "dl";
    items: Record<string, string>;
}>;
export type DefinitionListElement = z.infer<typeof DefinitionListElement>;
declare const DividerElement: z.ZodObject<{
    type: z.ZodLiteral<"divider">;
}, "strip", z.ZodTypeAny, {
    type: "divider";
}, {
    type: "divider";
}>;
export type DividerElement = z.infer<typeof DividerElement>;
export declare const ButtonElement: z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"button">;
    label: z.ZodString;
    invoke: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "button";
    label: string;
    elementId: string;
    invoke: string;
}, {
    type: "button";
    label: string;
    elementId: string;
    invoke: string;
}>;
export type ButtonElement = z.infer<typeof ButtonElement>;
export declare const ModalElement: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"fillField">;
    field: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "fillField";
    field: string;
}, {
    type: "fillField";
    field: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"select">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"channelSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "channelSelect";
    label: string;
    elementId: string;
}, {
    type: "channelSelect";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"userSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "userSelect";
    label: string;
    elementId: string;
}, {
    type: "userSelect";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"radio">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"checkbox">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"textInput">;
    label: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    optional: z.ZodDefault<z.ZodBoolean>;
    multiline: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "textInput";
    label: string;
    elementId: string;
    optional: boolean;
    multiline: boolean;
    placeholder?: string | undefined;
}, {
    type: "textInput";
    label: string;
    elementId: string;
    placeholder?: string | undefined;
    optional?: boolean | undefined;
    multiline?: boolean | undefined;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"dateTimePicker">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"header">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "header";
    text: string;
}, {
    type: "header";
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"text">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
}, {
    type: "text";
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"note">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    text: string;
}, {
    type: "note";
    text: string;
}>]>;
export type ModalElement = z.infer<typeof ModalElement>;
export declare const PostElement: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"select">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "select";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"channelSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "channelSelect";
    label: string;
    elementId: string;
}, {
    type: "channelSelect";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"userSelect">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "userSelect";
    label: string;
    elementId: string;
}, {
    type: "userSelect";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"radio">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "radio";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"checkbox">;
    label: z.ZodString;
    options: z.ZodRecord<z.ZodString, z.ZodObject<{
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
    }, {
        label: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}, {
    type: "checkbox";
    options: Record<string, {
        label: string;
    }>;
    label: string;
    elementId: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"textInput">;
    label: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    optional: z.ZodDefault<z.ZodBoolean>;
    multiline: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "textInput";
    label: string;
    elementId: string;
    optional: boolean;
    multiline: boolean;
    placeholder?: string | undefined;
}, {
    type: "textInput";
    label: string;
    elementId: string;
    placeholder?: string | undefined;
    optional?: boolean | undefined;
    multiline?: boolean | undefined;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"dateTimePicker">;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}, {
    type: "dateTimePicker";
    label: string;
    elementId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"header">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "header";
    text: string;
}, {
    type: "header";
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"text">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
}, {
    type: "text";
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"note">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "note";
    text: string;
}, {
    type: "note";
    text: string;
}>, z.ZodObject<{
    elementId: z.ZodString;
    type: z.ZodLiteral<"button">;
    label: z.ZodString;
    invoke: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "button";
    label: string;
    elementId: string;
    invoke: string;
}, {
    type: "button";
    label: string;
    elementId: string;
    invoke: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"dl">;
    items: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "dl";
    items: Record<string, string>;
}, {
    type: "dl";
    items: Record<string, string>;
}>, z.ZodObject<{
    type: z.ZodLiteral<"divider">;
}, "strip", z.ZodTypeAny, {
    type: "divider";
}, {
    type: "divider";
}>]>;
export type PostElement = z.infer<typeof PostElement>;
export {};
