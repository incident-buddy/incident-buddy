export type SlackApiError = {
  readonly type: "SlackApiError";
  readonly method: string;
  readonly slackError: string;
};

export type FirestoreError = {
  readonly type: "FirestoreError";
  readonly operation: string;
  readonly cause: unknown;
};

export type NotFoundError = {
  readonly type: "NotFoundError";
  readonly resource: string;
  readonly id: string;
};

export type AlreadyResolvedError = {
  readonly type: "AlreadyResolvedError";
};

export type ConfigError = {
	readonly type: "ConfigError";
}

export type AppError =
  | SlackApiError
  | FirestoreError
  | NotFoundError
  | AlreadyResolvedError
  | ConfigError;

export const Errors = {
  slack: (method: string, slackError: string): SlackApiError => ({
    type: "SlackApiError",
    method,
    slackError,
  }),
  firestore: (operation: string, cause: unknown): FirestoreError => ({
    type: "FirestoreError",
    operation,
    cause,
  }),
  notFound: (resource: string, id: string): NotFoundError => ({
    type: "NotFoundError",
    resource,
    id,
  }),
  alreadyResolved: (): AlreadyResolvedError => ({
    type: "AlreadyResolvedError",
  }),
	config: (): ConfigError => ({
    type: "ConfigError",
  }),
};
