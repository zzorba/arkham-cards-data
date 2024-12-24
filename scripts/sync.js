const yargs = require('yargs');
const fs = require("fs");
const fsprom = require("fs/promises");
require('dotenv').config()

async function copyFileIgnoreMissing(source, destination) {
  try {
    await fsprom.copyFile(source, destination);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // ignore missing source files
    } else {
      // everything else
      throw err;
    }
  }
}

async function run(ARKHAM_CARDS){

  const exists = fs.existsSync(ARKHAM_CARDS);
  if (exists === true){
    await Promise.all([
      fsprom.copyFile('./build/index.d.ts', `${ARKHAM_CARDS}/src/data/scenario/types.d.ts`),
      fsprom.copyFile('./build/standalone.json', `${ARKHAM_CARDS}/assets/generated/standaloneScenarios.json`),
      fsprom.copyFile('./build/allCampaigns.json', `${ARKHAM_CARDS}/assets/generated/allCampaigns.json`),
      fsprom.copyFile('./build/scenarioNames.json', `${ARKHAM_CARDS}/assets/generated/scenarioNames.json`),
      fsprom.copyFile('./build/campaignLogs.json', `${ARKHAM_CARDS}/assets/generated/campaignLogs.json`),
      fsprom.copyFile('./build/encounterSets.json', `${ARKHAM_CARDS}/assets/generated/encounterSets.json`),
      fsprom.copyFile('./errata/en/errata.json', `${ARKHAM_CARDS}/assets/generated/campaignErrata.json`),
      fsprom.copyFile('./taboos.json', `${ARKHAM_CARDS}/assets/generated/taboos.json`),
      fsprom.copyFile('./chaos_tokens.json', `${ARKHAM_CARDS}/assets/generated/chaosOdds.json`),
      fsprom.copyFile('./rules/en/rules.json', `${ARKHAM_CARDS}/assets/generated/rules.json`)
    ]);
  
    // I18n files
    const langs=['es', 'ko', 'it', 'fr', 'ru', 'de', 'zh', 'pt', 'pl', 'vi', 'cs', 'zh-cn'];
    await Promise.allSettled( langs.flatMap(async (lang)=>{
      return [
        copyFileIgnoreMissing(`./build/allCampaigns_${lang}.json`, `${ARKHAM_CARDS}/assets/generated/allCampaigns_${lang}.json`),
        copyFileIgnoreMissing(`./build/scenarioNames_${lang}.json`, `${ARKHAM_CARDS}/assets/generated/scenarioNames_${lang}.json`),
        copyFileIgnoreMissing(`./build/campaignLogs_${lang}.json`, `${ARKHAM_CARDS}/assets/generated/campaignLogs_${lang}.json`),
        copyFileIgnoreMissing(`./build/encounterSets_${lang}.json`, `${ARKHAM_CARDS}/assets/generated/encounterSets_${lang}.json`),
        copyFileIgnoreMissing(`./errata/${lang}/errata.json`, `${ARKHAM_CARDS}/assets/generated/campaignErrata_${lang}.json`),
        copyFileIgnoreMissing(`./rules/${lang}/rules.json`, `${ARKHAM_CARDS}/assets/generated/rules_${lang}.json`)
      ]
    }));
  
  } else {
    console.log(`Folder ${ARKHAM_CARDS} does not exist.`);
    process.exit(1);
  }

}


const argv = yargs
  .option(
    'arkham_cards', {
      alias: 'ac',
      description: 'Arkham Cards directory',
      type: 'string',
      default: process.env.ARKHAM_CARDS || '.',
    }
  ).help()
  .alias('help', 'h')
  .argv;

run( argv.arkham_cards )