const promisify = require("util").promisify;
const fs = require("fs");
const shell = require('shelljs')

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const yargs = require('yargs');

const argv = yargs
  .option(
    'arkham_cards', {
      alias: 'ac',
      description: 'Arkham Cards directory',
      type: 'string',
      default: '.',
    }
  ).help()
  .alias('help', 'h')
  .argv;

/** Asynchronous filtering of an array. */
const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then(results =>
    arr.filter((_v, index) => results[index])
  );

/**
 * Get the list of available locales by reading folders under i18n
 *
 * @returns {string[]} The list of available locales
 */
async function getAvailableLocales() {
  const entries = await readdir("i18n");
  return asyncFilter(entries, async e => {
    return !(await stat("i18n/" + e)).isFile();
  });
}

async function run() {
  const localeCodes = await getAvailableLocales();
  shell.exec(`node ./scripts/generateLocales.js --arkham_cards ${argv.arkham_cards}`)
  for (const localeCode of localeCodes) {
    shell.exec(`node ./scripts/generateReturnCampaigns.js -i build/i18n/${localeCode} -o build/i18n/${localeCode}/build`);
    shell.exec(`./scripts/build.sh -i build/i18n/${localeCode}/campaigns -o build/i18n/${localeCode}/build -r build/i18n/${localeCode}/build/return_campaigns`)
    shell.exec(`./scripts/generate-campaign-logs.sh -o build/i18n/${localeCode}/build`);
    shell.cp(`./build/i18n/${localeCode}/build/allCampaigns.json`, `./build/allCampaigns_${localeCode}.json`);
    shell.cp(`./build/i18n/${localeCode}/build/campaignLogs.json`, `./build/campaignLogs_${localeCode}.json`);
    shell.cp(`./build/i18n/${localeCode}/build/encounterSets.json`, `./build/encounterSets_${localeCode}.json`);
  }
}


run();
