const promisify = require("util").promisify;
const fs = require("fs");
const path = require("path");
const PO = require("pofile");
const unorm = require('unorm');

const loadPOFile = promisify(PO.load);

const readFile = promisify(fs.readFile);
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
 * Get entries from a PO file.
 *
 * @param {string} filePath - The path to the PO file.
 * @returns {PO.Item[]} An array of PO items
 */
async function getPOFile(filePath) {
  try {
    const poFile = await loadPOFile(filePath);
    return poFile;
  } catch (err) {
    throw new Error("Could not load PO entries : " + err);
  }
}

/**
 * Read JSON from file.
 *
 * @param {string} filePath - The path to the JSON file.
 * @returns {object} The object read from JSON.
 */
async function readJSON(filePath) {
  try {
    const rawData = await readFile(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    throw new Error("Could not load JSON file : " + err);
  }
}

const SETTINGS_FOR_LANGUAGE = {
  fr: {
    'Language': 'fr',
    'Plural-Forms': 'nplurals=2; plural=(n > 1);',
  },
  es: {
    'Language': 'es',
    'Plural-Forms': 'nplurals=2; plural=(n != 1);',
  },
  de: {
    'Language': 'de',
    'Plural-Forms': 'nplurals=2; plural=(n != 1);',
  },
  it: {
    'Language': 'it',
    'Plural-Forms': 'nplurals=2; plural=(n != 1);',
  },
  ru: {
    'Language': 'ru',
    'Plural-Forms': 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
  },
  pl: {
    'Language': 'pl',
    'Plural-Forms': 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
  },
};

async function getOrCreatePOFile(scenarioPoFile, localeCode, scenario, quiet) {
  if (await exists(scenarioPoFile)) {
    !quiet && console.log("(" + localeCode + ") Translating " + scenario);
    return await getPOFile(scenarioPoFile);
  }
  !quiet && console.log("(" + localeCode + ") No translation found for scenario " + scenario + ". Creating placeholder file.");
  const po = new PO();
  po.headers = SETTINGS_FOR_LANGUAGE[localeCode];
  return po;
}

/**
 * Read the encounter sets.
 * @param {string} localeCode  - Locale code (en, es, ...)
 */
async function readEncounterSets(localeCode) {
  const json = await readJSON(`encounter_sets/${localeCode}.json`);
  const encounter_sets = {};
  for(let i = 0; i < json.length; i++) {
    const entry = json[i];
    encounter_sets[entry.code] = entry.name;
  }
  return encounter_sets;
}

function itemMessageId(item) {
  if (item.msgctxt) {
    return `${item.msgctxt}_${unorm.nfc(item.msgid)}`;
  }
  return unorm.nfc(item.msgid);
}

function messageId(msgId, context) {
  if (context) {
    return `${context}_${unorm.nfc(msgId)}`;
  }
  return unorm.nfc(msgId);
}

/**
 * Generate localized JSON files for a specific locale.
 *
 * @param {string} localeCode - Locale code (fr, it, es ...)
 */
async function generateNarration(localeCode) {
  const allCampaigns = await readJSON(localeCode === 'en' ? `${argv.arkham_cards}/build/allCampaigns.json` : `${argv.arkham_cards}/build/allCampaigns_${localeCode}.json`);
  const printErr = (err) => {
    if (err) {
      console.log(err);
    }
  };

  // First we gather all the known PO entries.
  fs.mkdirSync(`${argv.arkham_cards}/build/${localeCode}`, { recursive: true, exists: true });
  for (const { campaign, scenarios } of allCampaigns) {
    fs.mkdirSync(`${argv.arkham_cards}/build/${localeCode}/${campaign.id}/`, { recursive: true, exists: true });
    if (campaign.steps) {
      let output = '';
      const print = (s) => {
        output = output + s + '\n';
      }
      print(campaign.name);
      for (step_idx in campaign.steps) {
        const step = campaign.steps[step_idx];
        if (step.narration) {
          print("------");
          print(step.narration.id);
          if (step.title) {
            print(step.title);
          }
          if (step.text) {
            print(step.text);
          }
          print("------");
        }
      }
      fs.writeFileSync(`${argv.arkham_cards}/build/${localeCode}/${campaign.id}/0_campaign.txt`, output);
    }
    const allScenarios = [...campaign.scenarios, ...(campaign.hidden_scenarios || [])];
    for (const idx in allScenarios) {
      const scenario_code = allScenarios[idx];
      const scenario = scenarios.find(s => s.id === scenario_code);
      if (scenario) {
        let output = ''
        const print = (s) => {
          output = output + s + '\n';
        }
        print(scenario.scenario_name);
        for (step_idx in scenario.steps) {
          const step = scenario.steps[step_idx];
          if (step.narration) {
            print("======");
            print(step.narration.id);
            print("------");
            if (step.title) {
              print(step.title);
            }
            if (step.text) {
              print(step.text);
            }
            print("======");
          }
        }
        if (scenario.resolutions) {
          for (resolution_idx in scenario.resolutions) {
            const resolution = scenario.resolutions[resolution_idx];
            if (resolution.narration) {
              print("======");
              print(resolution.narration.id);
              print("------");
              if (resolution.title) {
                print(resolution.title);
              }
              if (resolution.text) {
                print(resolution.text);
              }
              print("======");
            }
          }
        }
        fs.writeFileSync(`${argv.arkham_cards}/build/${localeCode}/${campaign.id}/${parseInt(idx, 10) + 1}_${scenario.id}.txt`, output);
      }
    }
  }
}

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
  for (const localeCode of ['en', ...localeCodes]) {
    console.log("Generating narration script for " + localeCode);
    await generateNarration(localeCode);
  }
}


run();
