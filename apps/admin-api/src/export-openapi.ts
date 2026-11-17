// Prints the generated OpenAPI document as YAML, or writes it to the given path (e.g. for client codegen).
// The live document is served at /openapi.json; nothing in the repo is generated from this.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stringify } from "yaml";
import { buildApi, buildDocument } from "./app";

const output = process.argv[2] && resolve(process.argv[2]);
const yaml = stringify(buildDocument(buildApi(), "http://localhost:4001"));

if (output) {
  writeFileSync(output, yaml);
  console.error(`Wrote ${output}`);
} else {
  process.stdout.write(yaml);
}
