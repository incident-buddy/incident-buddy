import { JaMessages } from "~/translation/ja";
import { EnMessages } from "~/translation/en";
import { createContext, JSX, useState } from "react";

type Props = {
  children: JSX.Element;
};

type MessageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
};

export const MessageContext = createContext<MessageContextType>({
  lang: "notSet",
  setLang: (lang: Language) => {},
});

export const MessageProvider = ({ children }: Props) => {
  const [lang, setLang] = useState<Language>("notSet");

  return (
    <MessageContext.Provider value={{ lang, setLang }}>
      {children}
    </MessageContext.Provider>
  );
};

type Messages = {
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
};

type Language = "notSet" | "ja" | "en";

const Dictionary: { [key in Language]: Messages } = {
  notSet: EnMessages,
  en: EnMessages,
  ja: JaMessages,
};
