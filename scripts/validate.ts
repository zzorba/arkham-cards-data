import * as fs from 'fs';
import * as path from 'path';
import jsonata from 'jsonata';

const ROOT_DIR = path.join(__dirname, '..');
const ALL_CAMPAIGNS_PATH = path.join(ROOT_DIR, 'build', 'allCampaigns.json');
const ENCOUNTER_SETS_PATH = path.join(ROOT_DIR, 'encounter_sets.json');

interface EncounterSet {
  code: string;
  name: string;
}

// Finds "has_card" conditions with effects other than "trauma"/"story_step" (kept for parity with the disabled check in the old jq-based script)
const INVALID_HAS_CARD_EXPR = jsonata(
  '$.scenarios.steps[condition != null].condition[type = "has_card"].options.effects[type != "trauma" and type != "story_step"]'
);

const ENCOUNTER_SETS_EXPR = jsonata(
  '$.scenarios.steps[type = "encounter_sets" and encounter_sets != null].encounter_sets'
);

function asArray(value: unknown): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value as string];
}

async function main(): Promise<void> {
  if (!fs.existsSync('.env')) {
    console.error('.env file is missing.');
    process.exit(1);
  }

  require('dotenv').config();

  if (!fs.existsSync(ALL_CAMPAIGNS_PATH)) {
    console.error('./build/allCampaigns.json file is missing. Build it first.');
    process.exit(1);
  }

  const allCampaigns = JSON.parse(fs.readFileSync(ALL_CAMPAIGNS_PATH, 'utf8'));
  const validEncounterSets = new Set(
    (JSON.parse(fs.readFileSync(ENCOUNTER_SETS_PATH, 'utf8')) as EncounterSet[]).map(set => set.code)
  );

  console.log('Looking for invalid encounter sets');
  const encounterSets = asArray(await ENCOUNTER_SETS_EXPR.evaluate(allCampaigns));
  for (const code of encounterSets) {
    if (!validEncounterSets.has(code)) {
      console.error(`Encounter code ${code} is invalid`);
      process.exit(1);
    }
  }
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
