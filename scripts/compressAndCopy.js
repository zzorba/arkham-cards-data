const promisify = require("util").promisify;
const jsonpack = require("jsonpack");
const fs = require("fs");
const yargs = require('yargs');
const zlib = require('zlib');
const { exit } = require("process");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const argv = yargs
  .option(
    'input', {
      alias: 'i',
      description: 'input file',
      type: 'string',
    }
  ).option(
    'output', {
      alias: 'o',
      description: 'output file',
      type: 'string',
    },
  ).help()
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
    await writeFile(filePath, JSON.stringify(object));
  } catch (err) {
    throw new Error("Could not write JSON file: " + filePath + err);
  }
}

async function run() {
  console.log(`Compressing ${argv.input} to ${argv.output}`)
  const content = await readJSON(argv.input);
  const compressed = jsonpack.pack(content);
  await writeJSON(compressed, argv.output);
  exit(0);
}

run();
