const promisify = require("util").promisify;
const fs = require("fs");
const path = require("path");
const PO = require("pofile");
const getFilePaths = require("./utils/getFilePaths");
const unorm = require('unorm');

const loadPOFile = promisify(PO.load);

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const yargs = require('yargs');

const argv = yargs
  .option(
    'arkham_cards', {
      alias: 'ac',
      description: 'Arkham Cards directory',
      type: 'string',
      default: '.',
    }
  )
  .option(
    'audio', {
      alias: 'd',
      description: 'Audio file directory',
      type: 'string',
    }
  )
  .option(
    'locale', {
      alias: 'l',
      description: 'Locale Code',
      type: 'string',
      default: 'es',
    }
  )
  .option(
    'verbose', {
      alias: 'v',
      description: 'Verbose mode',
      type: 'boolean',
      default: false,
    }
  )
  .help()
  .alias('help', 'h')
  .argv;

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
    fs.mkdirSync(path.dirname(filePath), { recursive: true }, err => {
      console.log(err);
    });
    writeFile(filePath, JSON.stringify(object, null, 2));
  } catch (err) {
    throw new Error("Could not write JSON file: " + filePath + err);
  }
}

async function checkNarration(step, localeCode, audioDir) {
  if (step.narration) {
    const id = step.narration.id;
    const file = `${audioDir}/${id}.mp3`
    if (await exists(file)) {
      if (argv.verbose) {
        console.log(`Found: ${file}`);
      }
      if (!step.narration.lang.find(x => x === localeCode)) {
        step.narration.lang.push(localeCode);
      }
    } else {
      if (argv.verbose) {
        console.log(`Missing: ${file}`);
      } else {
        console.log(id);
      }
    }
  }
}

/**
 * Update the scenario for the give localeCode
 * @param {string} localeCode
 * @param {Object} scenario
 * @param {string} audioDir
 */
async function updateScenarioNarration(localeCode, scenario, audioDir) {
  if (scenario.steps) {
    for (const idx in scenario.steps) {
      const step = scenario.steps[idx];
      await checkNarration(step, localeCode, audioDir);
    }
  }
  if (scenario.resolutions) {
    for (const idx in scenario.resolutions) {
      const resolution = scenario.resolutions[idx];
      await checkNarration(resolution, localeCode, audioDir);
    }
  }
}

/**
 * Generate localized JSON files for a specific locale.
 *
 * @param {string} localeCode - Locale code (fr, it, es ...)
 * @param {string} audioDir - Folder containing all audio files.
 */
async function updateLangNarration(localeCode, audioDir) {
  const allScenarios = getFilePaths("./campaigns");
  const allReturnScenarios = getFilePaths("./return_campaigns");
  for (const scenario of [...allScenarios, ...allReturnScenarios].sort()) {
    if (scenario.indexOf(".DS_Store") !== -1) {
      continue;
    }
    const scenarioDesc = await readJSON(scenario);
    await updateScenarioNarration(localeCode, scenarioDesc, audioDir);
    writeJSON(scenarioDesc, scenario);
  }
}

async function run() {
  await updateLangNarration(argv.locale, argv.audio);
}


run();
