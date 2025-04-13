import type { Messages } from "@/translation/index";

export const EnMessages: Messages = {
  page: {
    incident: {
      pageTitle: "Incidents",
    },
    workflow: {
      pageTitle: "Automation",
    },
    resource: {
      pageTitle: "Resources",
      createNew: "Add New",
      categories: {
        team: "Team",
        communication: "Communication",
        service: "Service",
      }
    }
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
  generic: {
    state: {
      notSelected: "Not selected",
    },
  },
  error: {
    generic: "Something went wrong",
  },
};
