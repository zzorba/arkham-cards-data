const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require("jsonlint");

/** Retrieve file paths from a given folder and its subfolders. */
const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

const ajv = new Ajv();
const validator = ajv.addSchema(require('../scenario.schema.json'), 'scenario');

const QUIET = true;
getFilePaths('./campaigns').sort().map(file => {
  if (!file.endsWith('.schema.json') && !file.endsWith('campaign.json') && file.endsWith('.json')) {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (!QUIET) {
        console.log('Validating: ' + file);
      }
      if (err) {
        console.log(err);
      } else {
        try {
          const json = jsonlint.parse(data);
          const valid = validator.validate('scenario', json);
          if (!valid) {
            console.log(`SCHEMA Error(${file})\n${ajv.errors.map(e => `${e.keyword} - ${e.dataPath} - ${e.message}`).join('\n')}\n\n`);
          }
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
        }
      }
    });
  }
});

