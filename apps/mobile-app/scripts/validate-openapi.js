/* Minimal structural validation of docs/openapi.yaml (YAML parse + local $ref check). */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const file = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');
const doc = YAML.parse(fs.readFileSync(file, 'utf8'));

const refs = [];
(function walk(node) {
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') refs.push(value);
    else walk(value);
  }
})(doc);

const broken = refs.filter((ref) => {
  let current = doc;
  for (const part of ref.replace(/^#\//, '').split('/')) {
    current = current && current[part];
  }
  return !current;
});

console.log(`OpenAPI ${doc.openapi}`);
console.log(`Paths: ${Object.keys(doc.paths).length}`);
console.log(`Schemas: ${Object.keys(doc.components.schemas).length}`);
console.log(`Local $refs: ${refs.length}, broken: ${broken.length}`);
if (broken.length) {
  console.error(broken.join('\n'));
  process.exit(1);
}
