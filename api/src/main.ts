import { resourceMasterApi } from "./routes/resource_master.ts";
import { newApp } from "./app.ts";

const app = newApp();
resourceMasterApi(app);

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  Deno.serve(app.fetch);
}
