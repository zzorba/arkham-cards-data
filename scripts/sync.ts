import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

const I18N_LANGS = ['es', 'ko', 'it', 'fr', 'ru', 'de', 'zh', 'pt', 'pl', 'vi', 'cs', 'zh-cn'];
const RULES_LANGS = ['es', 'ko', 'it', 'fr', 'ru', 'de', 'zh', 'pl', 'it', 'zh-cn'];

function copy(src: string, dest: string): void {
  fs.copyFileSync(path.join(ROOT_DIR, src), path.join(dest));
}

function main(): void {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('.env file is missing.');
    process.exit(1);
  }
  require('dotenv').config({ path: ENV_PATH });

  const arkhamCards = process.env.ARKHAM_CARDS ?? '';
  if (!fs.existsSync(arkhamCards) || !fs.statSync(arkhamCards).isDirectory()) {
    console.error(`Folder ${arkhamCards} does not exist.`);
    process.exit(1);
  }

  const generatedDir = path.join(arkhamCards, 'assets', 'generated');

  copy('build/index.d.ts', path.join(arkhamCards, 'src', 'data', 'scenario', 'types.d.ts'));
  copy('build/standalone.json', path.join(generatedDir, 'standalone_scenarios.txt'));
  copy('build/allCampaigns.json', path.join(generatedDir, 'all_campaigns.txt'));
  copy('build/scenarioNames.json', path.join(generatedDir, 'scenario_names.txt'));
  copy('build/campaignLogs.json', path.join(generatedDir, 'campaign_logs.txt'));
  copy('build/encounterSets.json', path.join(generatedDir, 'encounter_sets.txt'));
  copy('errata/en/errata.json', path.join(generatedDir, 'campaign_errata.txt'));
  copy('taboos.json', path.join(generatedDir, 'taboos.txt'));
  copy('chaos_tokens.json', path.join(generatedDir, 'chaos_odds.txt'));
  copy('rules/en/rules.json', path.join(generatedDir, 'rules.txt'));

  for (const lang of I18N_LANGS) {
    const langUnderscore = lang.replace(/-/g, '_');
    copy(`build/allCampaigns_${lang}.json`, path.join(generatedDir, `all_campaigns_${langUnderscore}.txt`));
    copy(`build/scenarioNames_${lang}.json`, path.join(generatedDir, `scenario_names_${langUnderscore}.txt`));
    copy(`build/campaignLogs_${lang}.json`, path.join(generatedDir, `campaign_logs_${langUnderscore}.txt`));
    copy(`build/encounterSets_${lang}.json`, path.join(generatedDir, `encounter_sets_${langUnderscore}.txt`));
    copy(`errata/${lang}/errata.json`, path.join(generatedDir, `campaign_errata_${langUnderscore}.txt`));
    copy(`build/chaos_tokens_${lang}.json`, path.join(generatedDir, `chaos_odds_${langUnderscore}.txt`));
    copy(`build/i18n/${lang}/taboos.json`, path.join(generatedDir, `taboos_${langUnderscore}.txt`));
  }

  for (const lang of RULES_LANGS) {
    const langUnderscore = lang.replace(/-/g, '_');
    copy(`rules/${lang}/rules.json`, path.join(generatedDir, `rules_${langUnderscore}.txt`));
  }
}

main();
