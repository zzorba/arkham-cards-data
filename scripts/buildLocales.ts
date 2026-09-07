import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

async function main(): Promise<void> {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('.env file is missing.');
    process.exit(1);
  }
  require('dotenv').config({ path: ENV_PATH });

  console.log(process.env.ARKHAM_CARDS ?? '');

  const { run } = require('./buildLocales.js');
  await run(process.env.ARKHAM_CARDS ?? '.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
