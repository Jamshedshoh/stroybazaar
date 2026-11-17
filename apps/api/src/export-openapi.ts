// Prints the generated OpenAPI document as YAML, or writes it to the given path (e.g. for client codegen).
// The live document is served at /openapi.json; nothing in the repo is generated from this.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stringify } from "yaml";
import { buildApi, buildDocument, defaultOptions } from "./app";

const output = process.argv[2] && resolve(process.argv[2]);
// The demo endpoint stays in the contract (marked deprecated) because the mobile mock client uses it.
const options = { ...defaultOptions(), demoEndpoints: true, publicUrl: "http://localhost:4000" };
const yaml = stringify(buildDocument(buildApi(options), options));

if (output) {
  writeFileSync(output, yaml);
  console.error(`Wrote ${output}`);
} else {
  process.stdout.write(yaml);
}
