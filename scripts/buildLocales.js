const promisify = require("util").promisify;
const fs = require("fs");
const shell = require('shelljs')

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const check_rules = require('./check_rules');
const yargs = require('yargs');
require('dotenv').config()

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

/**
 * Get the list of available locales by reading folders under i18n
 *
 * @returns {Promise<string[]>} The list of available locales
 */
async function getAvailableLocales() {
  const entries = await readdir("i18n", {withFileTypes: true});
  const langs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  return langs;
}

async function run() {
  const localeCodes = await getAvailableLocales();
  shell.exec(`node ./scripts/generateLocales.js --arkham_cards ${argv.arkham_cards}`)
  for (const localeCode of localeCodes) {
    // Check rules script
    await check_rules.run(localeCode);

    shell.exec(`node ./scripts/generateReturnCampaigns.js -i build/i18n/${localeCode} -o build/i18n/${localeCode}/build`);
    shell.exec(`node ./scripts/build.js -i build/i18n/${localeCode}/campaigns -o build/i18n/${localeCode}/build -r build/i18n/${localeCode}/build/return_campaigns`);
    shell.exec(`node ./scripts/generate-campaign-logs.js -o build/i18n/${localeCode}/build`);
    fs.copyFileSync(`./build/i18n/${localeCode}/build/allCampaigns.json`, `./build/allCampaigns_${localeCode}.json`)
    fs.copyFileSync(`./build/i18n/${localeCode}/build/scenarioNames.json`, `./build/scenarioNames_${localeCode}.json`);
    fs.copyFileSync(`./build/i18n/${localeCode}/build/campaignLogs.json`, `./build/campaignLogs_${localeCode}.json`);
    fs.copyFileSync(`./build/i18n/${localeCode}/build/encounterSets.json`, `./build/encounterSets_${localeCode}.json`);
  }
}


run();
