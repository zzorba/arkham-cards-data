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

function validate(validator, file, json, schemaName) {
  const valid = validator.validate(schemaName, json);
  if (!valid) {
    console.log(`SCHEMA Error(${file})\n${validator.errors.map(e => `${e.keyword} - ${e.dataPath} - ${e.message} - ${JSON.stringify(e.params)}\n${JSON.stringify(e.data)}`).join('\n\n')}\n\n\n\n`);
    process.exit();
  }
  const steps = {};
  if (!json.interlude && json.scenarioName) {
    steps['$choose_resolution'] = true;
  }
  let error = false;
  json.steps.map(step => {
    if (steps[step.id]) {
      console.log(`DUPLICATE_STEP (${file}) - ${step.id}`);
      error = true;
    }
    steps[step.id] = true;
  });
  const unusedSteps = { ...steps };
  if (json.setup) {
    json.setup.map(step => {
      if (!steps[step] && step !== '$proceed') {
        console.log(`MISSING_STEP (${file}) - ${step}`);
        error = true;
      } else {
        delete unusedSteps[step];
      }
    });
  }
  if (json.steps) {
    json.steps.map(step => {
      if (step.input && step.input.choices) {
        step.input.choices.map(choice => {
          if (choice.steps) {
            choice.steps.map(step => {
              if (!steps[step] && step !== '$proceed') {
                console.log(`MISSING_STEP (${file}) - ${step}`);
                error = true;
              } else {
                delete unusedSteps[step];
              }
            });
          }
        });
      }
      if (step.steps) {
        step.steps.map(step => {
          if (!steps[step] && step !== '$proceed') {
            console.log(`MISSING_STEP (${file}) - ${step}`);
            error = true;
          } else {
            delete unusedSteps[step];
          }
        });
      }
      if (step.condition && step.condition.options) {
        step.condition.options.map(option => {
          if (option.effects) {
            option.effects.map(effect => {
              if (effect.type === 'story_step') {
                effect.steps.map(step => {
                  if (!steps[step] && step !== '$proceed') {
                    console.log(`MISSING_STEP (${file}) - ${step}`);
                    error = true;
                  } else {
                    delete unusedSteps[step];
                  }
                });
              }
            });
          }
          if (option.steps) {
            option.steps.map(step => {
              if (!steps[step] && step !== '$proceed') {
                console.log(`MISSING_STEP (${file}) - ${step}`);
                error = true;
              } else {
                delete unusedSteps[step];
              }
            });
          }
        });
      }
      if (step.condition && step.condition.defaultOption) {
        const option = step.condition.defaultOption;
        if (option.steps) {
          option.steps.map(step => {
            if (!steps[step] && step !== '$proceed') {
              console.log(`MISSING_STEP (${file}) - ${step}`);
              error = true;
            } else {
              delete unusedSteps[step];
            }
          });
        }
      }

    });
  }
  if (json.resolutions) {
    json.resolutions.map(resolution => {
      if (resolution.steps) {
        resolution.steps.map(step => {
          if (!steps[step] && step !== '$proceed') {
            console.log(`MISSING_STEP (${file}) - ${step}`);
            error = true;
          } else {
            delete unusedSteps[step];
          }
        });
      }
    });
  }
  if (Object.keys(unusedSteps).length > 0) {
    console.log(`UNUSED STEPS (${file} - ${Object.keys(unusedSteps).join(', ')}`)
  }
  if (error) {
    process.exit();
  }
}

const scenarioSchema = fs.readFileSync('./schema/scenario.schema.json').toString();
$RefParser.dereference(jsonlint.parse(scenarioSchema), (err, schema) => {
  if (err) {
    console.error(err);
  } else {
    // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
    // including referenced files, combined into a single object
    const ajv = new Ajv({ verbose: true });
    const validator = ajv.addSchema(schema, 'scenario');
    const QUIET = false;
    getFilePaths('./campaigns').sort().map(file => {
      if (!file.endsWith('.schema.json') && !file.endsWith('campaign.json') && file.endsWith('.json')) {
        const data = fs.readFileSync(file, 'utf-8').toString();
        if (!QUIET) {
          console.log('Validating: ' + file);
        }
        try {
          const json = jsonlint.parse(data);
          validate(validator, file, json, 'scenario');
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
        }
      }
    });
  }
});

const campaignSchema = fs.readFileSync('./schema/campaign.schema.json').toString();
$RefParser.dereference(jsonlint.parse(campaignSchema), (err, schema) => {
  if (err) {
    console.error(err);
  } else {
    // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
    // including referenced files, combined into a single object
    const ajv = new Ajv({ verbose: true });
    const validator = ajv.addSchema(schema, 'campaign');
    const QUIET = true;
    getFilePaths('./campaigns').sort().map(file => {
      if (file.endsWith('campaign.json')) {
        const data = fs.readFileSync(file, 'utf-8').toString();
        if (!QUIET) {
          console.log('Validating: ' + file);
        }
        try {
          const json = jsonlint.parse(data);
          validate(validator, file, json, 'campaign');
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
        }
      }
    });
  }
});

