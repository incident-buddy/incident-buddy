import { fromPromise, type ResultAsync } from "neverthrow";

import { type Cause, cause } from "@/error-handler.ts";
import { UserContext } from "@/context.ts";
import { ResourceMasterRepository } from "./repository.ts";
import { ResourceMaster } from "./model.ts";

export class ResourceMasterService {
  constructor(private repo: ResourceMasterRepository) {}

  list(c: UserContext): ResultAsync<ResourceMaster[], Cause> {
    return fromPromise(this.repo.list(c), cause);
  }
}
