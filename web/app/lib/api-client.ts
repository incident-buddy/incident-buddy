import createFetchClient from "openapi-fetch";
import { paths } from "generated/openapi/schema";
import { environment } from "environment";

export const apiClient = createFetchClient<paths>({
  baseUrl: environment.apiBaseUrl,
});
