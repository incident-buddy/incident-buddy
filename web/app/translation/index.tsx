import { JaMessages } from "@/translation/ja";
import { EnMessages } from "@/translation/en";
import { createContext, JSX, useState } from "react";

type Props = {
  children: JSX.Element;
};

type MessageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  dict: Messages;
};

export const MessageContext = createContext<MessageContextType>({
  lang: "notSet",
  setLang: (lang: Language) => {},
  dict: EnMessages,
});

export const MessageProvider = ({ children }: Props) => {
  const [lang, setLang] = useState<Language>("notSet");
  const dict = Dictionary[lang];

  return (
    <MessageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </MessageContext.Provider>
  );
};

export type Messages = {
  page: {
    incident: {
      pageTitle: string;
    };
    workflow: {
      pageTitle: string;
    };
  };

  workflow: {
    workflowName: string;
    status: string;
    searchPlaceholder: string;
  };

  trigger: {
    trigger: string;
    triggerName(code: string): string;
    categoryName(category: string): string;
  };

  generic: {
    state: {
      notSelected: string;
    };
  };

  error: {
    generic: string;
  };
};

type Language = "notSet" | "ja" | "en";

const Dictionary: { [key in Language]: Messages } = {
  notSet: JaMessages,
  en: EnMessages,
  ja: JaMessages,
};
