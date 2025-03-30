import { Messages } from "@/translation/index";

export const JaMessages: Messages = {
  page: {
    incident: {
      pageTitle: "インシデント",
    },
    workflow: {
      pageTitle: "ワークフロー",
    },
  },
  workflow: {
    workflowName: "ワークフロー",
    status: "ステータス",
    searchPlaceholder: "検索",
  },
  trigger: {
    trigger: "トリガー",
    triggerName: (code: string) => {
      switch (code) {
        case "incident.updated":
          return "インシデント更新";
        case "slack.channel.joined":
          return "Slackチャンネル参加";
        default:
          return code;
      }
    },
    categoryName(category: string): string {
      switch (category) {
        case "incident":
          return "インシデント";
        case "slack":
          return "Slack";
        default:
          return category;
      }
    },
  },
  generic: {
    state: {
      notSelected: "選択されていません",
    },
  },
  error: {
    generic: "エラーが発生しました",
  },
};
