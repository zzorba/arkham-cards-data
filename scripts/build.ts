import * as fs from 'fs';
import * as path from 'path';
import jsonata from 'jsonata';

interface Args {
  inputDir: string;
  returnInputDir: string;
  outputDir: string;
}

interface Scenario {
  id: string;
  scenario_name: string;
  [key: string]: unknown;
}

interface Campaign {
  campaign: unknown;
  scenarios: Scenario[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    inputDir: './campaigns',
    returnInputDir: './build/return_campaigns',
    outputDir: './build',
  };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    switch (key) {
      case '-o':
      case '--output':
        args.outputDir = argv[++i];
        break;
      case '-i':
      case '--input':
        args.inputDir = argv[++i];
        break;
      case '-r':
      case '--return':
        args.returnInputDir = argv[++i];
        break;
      default:
        if (key.startsWith('-o=') || key.startsWith('--output=')) {
          args.outputDir = key.slice(key.indexOf('=') + 1);
        } else if (key.startsWith('-i=') || key.startsWith('--input=')) {
          args.inputDir = key.slice(key.indexOf('=') + 1);
        } else if (key.startsWith('-r=') || key.startsWith('--return=')) {
          args.returnInputDir = key.slice(key.indexOf('=') + 1);
        }
    }
  }
  return args;
}

function buildCampaign(dir: string, outputDir: string): Campaign | undefined {
  if (!fs.statSync(dir).isDirectory()) {
    return undefined;
  }
  const name = path.basename(dir);
  console.log(`Outputing ${name}.json`);

  const campaign = JSON.parse(fs.readFileSync(path.join(dir, 'campaign.json'), 'utf8'));
  const scenarios = fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json') && f !== 'campaign.json')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

  const result: Campaign = { campaign, scenarios };
  fs.writeFileSync(
    path.join(outputDir, 'campaigns', `${name}.json`),
    JSON.stringify(result, null, 2)
  );
  return result;
}

function buildDir(inputDir: string, outputDir: string): void {
  if (!fs.existsSync(inputDir)) {
    return;
  }
  for (const entry of fs.readdirSync(inputDir)) {
    buildCampaign(path.join(inputDir, entry), outputDir);
  }
}

// Sorted by id, mirroring build.sh's `jq "unique_by(.id)"` (sort by key, keep first occurrence per id)
const SCENARIO_NAMES_EXPR = jsonata(
  '$sort(scenarios.{ "id": id, "name": scenario_name }, function($l, $r) { $l.id > $r.id })'
);

async function main(): Promise<void> {
  const { inputDir, returnInputDir, outputDir } = parseArgs(process.argv.slice(2));

  fs.mkdirSync(outputDir, { recursive: true });

  fs.copyFileSync(
    path.join(inputDir, '..', 'encounter_sets.json'),
    path.join(outputDir, 'encounterSets.json')
  );

  const campaignsDir = path.join(outputDir, 'campaigns');
  if (fs.existsSync(campaignsDir)) {
    fs.rmdirSync(campaignsDir, { recursive: true });
  }
  fs.mkdirSync(campaignsDir);

  buildDir(inputDir, outputDir);
  buildDir(returnInputDir, outputDir);

  console.log('Building allCampaigns.json');
  const allCampaigns: Campaign[] = fs
    .readdirSync(campaignsDir)
    .sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(campaignsDir, f), 'utf8')));
  fs.writeFileSync(path.join(outputDir, 'allCampaigns.json'), JSON.stringify(allCampaigns, null, 2));

  const sortedScenarioNames = (await SCENARIO_NAMES_EXPR.evaluate(allCampaigns)) as { id: string; name: string }[] | undefined;
  const seenIds = new Set<string>();
  const scenarioNames: { id: string; name: string }[] = [];
  for (const entry of sortedScenarioNames ?? []) {
    if (!seenIds.has(entry.id)) {
      seenIds.add(entry.id);
      scenarioNames.push(entry);
    }
  }
  fs.writeFileSync(
    path.join(outputDir, 'scenarioNames.json'),
    JSON.stringify(scenarioNames, null, 2)
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
