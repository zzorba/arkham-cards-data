const promisify = require("util").promisify;
const fs = require("fs");
const path = require("path");
const PO = require("pofile");
const getFilePaths = require("./utils/getFilePaths");
const unorm = require('unorm');
const yargs = require('yargs');

const loadPOFile = promisify(PO.load);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const argv = yargs
  .option(
    'lang', {
      alias: 'l',
      description: 'Language code',
      type: 'string',
      default: 'all',
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

/**
 * Write an object to JSON file.
 *
 * @param {object} object - The object to write as JSON in a file
 * @param {string} filePath - The path to write to
 */
async function writeJSON(object, filePath) {
  try {
    console.log(`Creating directory for file: ${filePath} - ${path.dirname(filePath)}`)
    fs.mkdirSync(path.dirname(filePath), { recursive: true }, err => {
      console.log(err);
    });
    writeFile(filePath, JSON.stringify(object, null, 2));
  } catch (err) {
    throw new Error("Could not write JSON file: " + filePath + err);
  }
}

const TRANSLATEABLE_KEYS = new Set(['text', 'title', 'subtext', 'name', 'description', 'confirm_text', 'scenario_name', 'full_name']);

/**
 * Recursively translate an object using entries from a PO file.
 * The object is modified in place.
 * It will only translate `text` properties.
 *
 * @param {object} object - The object to translate
 * @param {PO} poFile - The PO file to use for translation
 * @param {object} allPoEntries - All entities we have seen to date
 */
async function translate(object, poFile, allPoEntries) {
  for (const prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (TRANSLATEABLE_KEYS.has(prop) && typeof object[prop] === "string") {
        const normalized = unorm.nfc(object[prop]);
        let foundPoEntry = allPoEntries[normalized];
        if (!foundPoEntry) {
          foundPoEntry = poFile.items.find(e => unorm.nfc(e.msgid) === normalized);
        }
        if (foundPoEntry !== undefined) {
          if (foundPoEntry.msgstr && foundPoEntry.msgstr.length && foundPoEntry.msgstr[0]) {
            object[prop] = foundPoEntry.msgstr[0];
          }
        } else {
          const item = new PO.Item();
          item.msgid = object[prop];
          poFile.items.push(item);
        }
      }
      if (typeof object[prop] === "object") {
        // Recursion
        translate(object[prop], poFile, allPoEntries);
      }
    }
  }
}

async function readPOFile(scenarioPoFile) {
  if (await exists(scenarioPoFile)) {
    return await getPOFile(scenarioPoFile);
  }
  throw new Error(`Could not read: ${scenarioPoFile}`);
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

/**
 * Generate localized JSON files for a specific locale.
 *
 * @param {string} localeCode - Locale code (fr, it, es ...)
 */
async function checkLocale(localeCode) {
  const allPoFiles = getFilePaths(`i18n/${localeCode}`);
  const printErr = (err) => {
    if (err) {
      console.log(err);
    }
  };
  for (const scenarioPoFile of allPoFiles.sort()) {
    let missing = 0;
    if (scenarioPoFile.indexOf(".DS_Store") !== -1) {
      continue;
    }
    const poFile = await readPOFile(scenarioPoFile);
    poFile.items.forEach(item => {
      if (!(item.msgstr || []).filter(x => !!x).length) {
        missing ++;
      }
    });
    if (missing > 0) {
      console.log(`${scenarioPoFile} (${poFile.items.length - missing} / ${poFile.items.length})`);
    }
  }
}

/**
 * Get the list of available locales by reading folders under i18n
 *
 * @returns {string[]} The list of available locales
 */
async function getAvailableLocales() {
  if (argv.lang === 'all') {
    const entries = await readdir("i18n");
    return asyncFilter(entries, async e => {
      return !(await stat("i18n/" + e)).isFile();
    });
  }
  return [argv.lang];
}

async function run() {
  const localeCodes = await getAvailableLocales();
  for (const localeCode of localeCodes) {
    console.log("Checking translations for " + localeCode);
    await checkLocale(localeCode);
  }
}


run();
