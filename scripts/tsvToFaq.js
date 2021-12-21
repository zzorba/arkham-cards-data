const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require('jsonlint');
const { flatMap, replace } = require('lodash');
const yargs = require('yargs');
const { parse } = require('csv-parse/sync');

const argv = yargs
  .option(
    'input', {
      alias: 'i',
      description: 'Input directory',
      type: 'string',
      default: '.',
    }
  ).option(
    'output', {
      alias: 'o',
      description: 'Output directory',
      type: 'string',
      default: './build',
    }
  ).help()
  .alias('help', 'h')
  .argv;


const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

getFilePaths(`${argv.input}`).sort().map(file => {
  if (!file.endsWith('.tsv')) {
    return;
  }
  const parts = file.split('/');
  const name = parts[parts.length - 1].replace('.tsv', '.json');
  const tsv = parse(fs.readFileSync(file, 'utf-8').toString(), { delimiter: '\t', relax_quotes: true, columns: true });
  const entries = flatMap(tsv, line => {
    const text = line['text-ru'] || line['text-en'];
    if (!text) {
      return [];
    }
    return {
      code: line.code,
      text: replace(text, /\\n/g, '\n'),
      updated_at: line.updated_at,
    };
  })
  fs.writeFileSync(`${argv.output}/${name}`, JSON.stringify(entries, null, 2));
});
