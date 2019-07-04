const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require('jsonlint');
const $RefParser = require('json-schema-ref-parser');


/** Retrieve file paths from a given folder and its subfolders. */
const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

const scenarioSchema = fs.readFileSync('scenario.schema.json').toString();
$RefParser.dereference(jsonlint.parse(scenarioSchema), (err, schema) => {
  if (err) {
    console.error(err);
  }
  else {
    // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
    // including referenced files, combined into a single object
    const ajv = new Ajv({ verbose: true });
    const validator = ajv.addSchema(schema, 'scenario');
    const QUIET = true;
    getFilePaths('./campaigns').sort().map(file => {
      if (!file.endsWith('.schema.json') && !file.endsWith('campaign.json') && file.endsWith('.json')) {
        const data = fs.readFileSync(file, 'utf-8').toString();
        if (!QUIET) {
          console.log('Validating: ' + file);
        }
        try {
          const json = jsonlint.parse(data);
          const valid = validator.validate('scenario', json);
          if (!valid) {
            console.log(`SCHEMA Error(${file})\n${ajv.errors.map(e => `${e.keyword} - ${e.dataPath} - ${e.message} - ${JSON.stringify(e.params)}\n${JSON.stringify(e.data)}`).join('\n\n')}\n\n\n\n`);
            process.exit();
          }
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
        }
      }
    });
  }
});

