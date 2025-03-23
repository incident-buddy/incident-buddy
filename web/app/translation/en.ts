import { Messages } from "@/translation/index";

export const EnMessages: Messages = {
  page: {
    incident: {
      pageTitle: "Incidents",
    },
    workflow: {
      pageTitle: "Automation",
    },
  },
  workflow: {
    workflowName: "Workflow",
    status: "Status",
    searchPlaceholder: "Search",
  },
  trigger: {
    trigger: "Trigger",
    triggerName: (code: string) => {
      switch (code) {
        case "incident.updated":
          return "Incident updated";
        case "slack.channel.joined":
          return "Slack channel joined";
        default:
          return code;
      }
    },
    categoryName(category: string): string {
      switch (category) {
        case "incident":
          return "Incident";
        case "slack":
          return "Slack";
        default:
          return category;
      }
    },
  },
};
