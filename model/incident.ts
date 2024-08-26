export type Incident = {
  id: string;
  field: {
    std: StdField;
    custom: { [key: string]: CustomField };
  };
};

type StdDescriptionField = {
  type: "stdDescription";
  label: string;
  value?: string;
};

type StdStatusField = {
  type: "stdStatus";
  label: string;
  items: {
    code: string;
    type: "open" | "closed";
    label: string;
  }[];
  value?: {
    code: string;
    type: "open" | "closed";
    label: string;
  };
};

type StdSeverityField = {
  type: "stdSeverity";
  label: string;
  items: {
    code: string;
    label: string;
  }[];
  value?: {
    code: string;
    label: string;
  };
};

type StdField = {
  description: StdDescriptionField;
  status: StdStatusField;
  severity: StdSeverityField;
};

type SingleSelectField = {
  type: "singleSelect";
  label: string;
  items: {
    code: string;
    label: string;
  }[];
  value?: {
    code: string;
    label: string;
  };
};

type MultiSelectField = {
  type: "multiSelect";
  label: string;
  items: {
    code: string;
    label: string;
  }[];
  value?: {
    code: string;
    label: string;
  }[];
};

type NumberField = {
  type: "number";
  label: string;
  value?: string;
};

type TextField = {
  type: "text";
  label: string;
  value?: string;
};

type UserField = {
  type: "user";
  label: string;
  value?: {
    id: string;
    name: string;
  };
};

type CustomField =
  | SingleSelectField
  | MultiSelectField
  | NumberField
  | TextField
  | UserField;
