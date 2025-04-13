import type { Messages } from "@/translation/index";

export const JaMessages: Messages = {
  page: {
    incident: {
      pageTitle: "インシデント",
    },
    workflow: {
      pageTitle: "ワークフロー",
    },
    resource: {
      pageTitle: "リソース",
      master: {
        name: "マスタの名称",
        nameExample: "提供サービス",
        code: "マスタを一意に特定するコード",
        codeExample: "service",
        description: "説明文",
        descriptionExample: "顧客に提供中のサービス",
        icon: "アイコン",
        category: "マスタが属するカテゴリ",
      },
      addNewMaster: "マスタの追加",
      categories: {
        team: "チーム",
        communication: "コミュニケーション",
        service: "サービス",
      },
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
