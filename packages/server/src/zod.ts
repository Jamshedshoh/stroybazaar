import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Adds `.openapi()` to every Zod schema. Import `z` from here (not from "zod") in API code
// so the extension is always applied before schemas are defined.
extendZodWithOpenApi(z);

export { z };
