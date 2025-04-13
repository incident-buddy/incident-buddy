import { fromPromise, type ResultAsync } from "neverthrow";

import { type Cause, cause } from "@/error-handler.ts";
import { UserContext } from "@/context.ts";
import { ResourceMasterQuery } from "./query.ts";
import { ResourceMaster } from "./model.ts";

export class ResourceMasterService {
  constructor(private repo: ResourceMasterQuery) {}

  list(c: UserContext): ResultAsync<ResourceMaster[], Cause> {
    return fromPromise(this.repo.list(c), cause);
  }
}
