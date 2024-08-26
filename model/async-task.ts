import type { ViewOutput } from "@slack/bolt";

type ModalSubmission = {
  type: "modal_submission";
  payload: ViewOutput;
};

export type AsyncTask = ModalSubmission;
