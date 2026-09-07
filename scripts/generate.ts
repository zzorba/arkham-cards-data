import * as fs from 'fs';
import * as path from 'path';
import { compileFromFile } from 'json-schema-to-typescript';

const ROOT_DIR = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT_DIR, 'schema', 'schema.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'build', 'index.d.ts');

async function main(): Promise<void> {
  const definitions = await compileFromFile(SCHEMA_PATH, {
    declareExternallyReferenced: true,
    cwd: ROOT_DIR,
  });
  fs.writeFileSync(OUTPUT_PATH, `/* eslint-disable */\n${definitions}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
