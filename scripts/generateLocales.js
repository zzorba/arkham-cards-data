const promisify = require("util").promisify;
const fs = require("fs");
const path = require("path");
const PO = require("pofile");
const getFilePaths = require("./utils/getFilePaths");

const loadPOFile = promisify(PO.load);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

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
async function getPOEntries(filePath) {
  try {
    const poFile = await loadPOFile(filePath);
    return poFile.items;
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
    const rawData = await readFile(filePath);
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
    await mkdir(path.dirname(filePath), { recursive: true });
    writeFile(filePath, JSON.stringify(object, null, 2));
  } catch (err) {
    throw new Error("Could not load JSON file : " + err);
  }
}

/**
 * Recursively translate an object using entries from a PO file.
 * The object is modified in place.
 * It will only translate `text` properties.
 *
 * @param {object} object - The object to translate
 * @param {PO.Item[]} poEntires - The array of PO entries to use for translation
 */
async function translate(object, poEntries) {
  for (const prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (prop === "text" && typeof object[prop] === "string") {
        let foundPoEntry = poEntries.find(e => e.msgid === object[prop]);
        if (foundPoEntry !== undefined) {
          object[prop] = foundPoEntry.msgstr;
        }
      }
      if (typeof object[prop] === "object") {
        // Recursion
        translate(object[prop], poEntries);
      }
    }
  }
}

/**
 * Generate localized JSON files for a specific locale.
 *
 * @param {string} localeCode - Locale code (fr, it, es ...)
 */
async function generateLocale(localeCode) {
  const allScenarios = getFilePaths("./campaigns");
  for (const scenario of allScenarios) {
    const scenarioPoFile =
      "i18n/" + localeCode + "/" + scenario.replace(/json$/, "po");
    if (await exists(scenarioPoFile)) {
      console.log("(" + localeCode + ") Translating " + scenario);
      let poEntries = await getPOEntries(scenarioPoFile);
      let scenarioDesc = await readJSON(scenario);
      translate(scenarioDesc, poEntries);
      await writeJSON(
        scenarioDesc,
        "build/i18n/" + localeCode + "/" + scenario
      );
    } else {
      console.log(
        "(" + localeCode + ") No translation found for scenario " + scenario
      );
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
  for (const localeCode of localeCodes) {
    console.log("Generating translations for " + localeCode);
    generateLocale(localeCode);
  }
}

run();
