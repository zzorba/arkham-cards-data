const Ajv = require("ajv");
const fs = require("fs");
const path = require("path");
const jsonlint = require("jsonlint");
const $RefParser = require("json-schema-ref-parser");

/** Retrieve file paths from a given folder and its subfolders. */
const getFilePaths = folderPath => {
  const entryPaths = fs
    .readdirSync(folderPath)
    .map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath =>
    fs.statSync(entryPath).isFile()
  );
  const dirPaths = entryPaths.filter(
    entryPath => !filePaths.includes(entryPath)
  );
  const dirFiles = dirPaths.reduce(
    (prev, curr) => prev.concat(getFilePaths(curr)),
    []
  );
  return [...filePaths, ...dirFiles];
};

function validate(validator, file, json, schemaName) {
  const valid = validator.validate(schemaName, json);
  if (!valid) {
    console.log(
      `SCHEMA Error(${file})\n${(validator.errors || [])
        .map(
          e =>
            `${e.keyword} - ${e.dataPath} - ${e.message} - ${JSON.stringify(
              e.params
            )}\n${JSON.stringify(e.data)}`
        )
        .join("\n\n")}\n\n\n\n`
    );
    process.exit(1);
  }
  const steps = {};
  const magicSteps = {
    $proceed: true,
    $upgrade_decks: true,
    $choose_investigators: true
  };
  if (
    json.type !== "interlude" &&
    json.type !== "epilogue" &&
    json.type !== "placeholder" &&
    json.scenario_name
  ) {
    steps["$play_scenario"] = true;
  }
  let error = false;
  if (json.steps) {
    json.steps.map(step => {
      // $play_scenario is an overrideable default step
      if (steps[step.id] && step.id !== "$play_scenario") {
        console.log(`DUPLICATE_STEP (${file}) - ${step.id}`);
        error = true;
      }
      steps[step.id] = true;
    });
  }
  const unusedSteps = { ...steps };
  if (!json.scenario_name) {
    // Campaign
    if (unusedSteps["$play_scenario"]) {
      delete unusedSteps["$play_scenario"];
    }
  }
  if (json.setup) {
    json.setup.map(step => {
      if (!steps[step] && !magicSteps[step]) {
        console.log(`MISSING_STEP (${file}) - ${step}`);
        error = true;
      } else {
        delete unusedSteps[step];
      }
    });
  }
  if (json.standalone_setup) {
    json.standalone_setup.map(step => {
      if (!steps[step] && !magicSteps[step]) {
        console.log(`MISSING_STEP (${file}) - ${step}`);
        error = true;
      } else {
        delete unusedSteps[step];
      }
    });
  }
  if (json.steps) {
    json.steps.map(step => {
      if (step.input) {
        const allChoices = [
          ...(step.input.options ? step.input.options : []),
          ...(step.input.choices ? step.input.choices : []),
          ...(step.input.branches ? step.input.branches : []),
          ...(step.input.campaign_log ? step.input.campaign_log : []),
          ...(step.input.default_option ? [step.input.default_option] : []),
        ];
        allChoices.map(choice => {
          if (choice.steps) {
            choice.steps.map(step => {
              if (!steps[step] && !magicSteps[step]) {
                console.log(`MISSING_STEP (${file}) - ${step}`);
                error = true;
              } else {
                delete unusedSteps[step];
              }
            });
          }
          if (choice.pre_border_effects) {
            choice.pre_border_effects.map(effect => {
              if (effect.type === "story_step" && effect.steps.length) {
                effect.steps.map(step => {
                  if (!steps[step] && !magicSteps[step]) {
                    console.log(`MISSING_STEP (${file}) - ${step}`);
                    error = true;
                  } else {
                    delete unusedSteps[step];
                  }
                });
              }
            });
          }
          if (choice.effects) {
            choice.effects.map(effect => {
              if (effect.type === "story_step" && effect.steps.length) {
                effect.steps.map(s => {
                  if (!steps[s] && !magicSteps[s]) {
                    console.log(`MISSING_STEP (${file}) - ${s}`);
                    error = true;
                  } else {
                    delete unusedSteps[s];
                  }
                });
              }
            });
          }
        });
        if (step.input.type === "investigator_choice_supplies") {
          [
            ...step.input.positiveChoice.effects,
            ...step.input.negativeChoice.effects
          ].map(effect => {
            if (effect.type === "story_step" && effect.steps.length) {
              effect.steps.map(step => {
                if (!steps[step] && !magicSteps[step]) {
                  console.log(`MISSING_STEP (${file}) - ${step}`);
                  error = true;
                } else {
                  delete unusedSteps[step];
                }
              });
            }
          });
        }
      }
      if (step.steps) {
        step.steps.map(step => {
          if (!steps[step] && !magicSteps[step]) {
            console.log(`MISSING_STEP (${file}) - ${step}`);
            error = true;
          } else {
            delete unusedSteps[step];
          }
        });
      }
      if (step.input && step.input.type === 'scenario_investigators' && step.input.choose_none_steps) {
        step.input.choose_none_steps.map(step => {
          if (!steps[step] && !magicSteps[step]) {
            console.log(`MISSING_STEP (${file}) - ${step}`);
            error = true;
          } else {
            delete unusedSteps[step];
          }
        });
      }
      if (step.condition && (step.condition.options || step.condition.default_option)) {
        const allOptions = [
          ...(step.condition.options ? step.condition.options : []),
          ...(step.condition.default_option ? [step.condition.default_option] : []),
        ];
        allOptions.map(option => {
          if (option.pre_border_effects) {
            option.pre_border_effects.map(effect => {
              if (effect.type === "story_step") {
                effect.steps.map(step => {
                  if (!steps[step] && !magicSteps[step]) {
                    console.log(`MISSING_STEP (${file}) - ${step}`);
                    error = true;
                  } else {
                    delete unusedSteps[step];
                  }
                });
              }
            });
          }
          if (option.effects) {
            option.effects.map(effect => {
              if (effect.type === "story_step") {
                effect.steps.map(step => {
                  if (!steps[step] && !magicSteps[step]) {
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
              if (!steps[step] && !magicSteps[step]) {
                console.log(`MISSING_STEP (${file}) - ${step}`);
                error = true;
              } else {
                delete unusedSteps[step];
              }
            });
          }
        });
      }
    });
  }
  if (json.resolutions) {
    json.resolutions.map(resolution => {
      if (resolution.steps) {
        resolution.steps.map(step => {
          if (!steps[step] && !magicSteps[step]) {
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
    console.log(
      `UNUSED STEPS (${file} - ${Object.keys(unusedSteps).join(", ")}`
    );
  }
  if (error) {
    process.exit(1);
  }
}

async function validateChaosTokens() {
  const chaosTokensSchema = fs
    .readFileSync('./schema/chaosTokens.schema.json')
    .toString();
  return await new Promise((resolve, reject) => {
    $RefParser.dereference(jsonlint.parse(chaosTokensSchema), (err, schema) => {
      if (err) {
        reject(err);
        console.error(err);
      } else {
        // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
        // including referenced files, combined into a single object
        const ajv = new Ajv({ verbose: true });
        const validator = ajv.addSchema(schema, "chaosTokens");
        const QUIET = false;

        const data = fs.readFileSync("./chaos_tokens.json", "utf-8").toString();
        if (!QUIET) {
          console.log("Validating chaos_tokens");
        }
        try {
          const json = jsonlint.parse(data);
          validate(validator, "chaos_tokens.json", json, "chaosTokens");
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
          reject(e);
          return;
        }
        resolve();
      }
    });
  });
}

async function validateScenarios() {
  console.log('****Validating Scenarios****');
  const scenarioSchema = fs
    .readFileSync("./schema/scenario.schema.json")
    .toString();
  return await new Promise((resolve, reject) => {
    $RefParser.dereference(jsonlint.parse(scenarioSchema), (err, schema) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        try {
          // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
          // including referenced files, combined into a single object
          const ajv = new Ajv({ verbose: true });
          const validator = ajv.addSchema(schema, "scenario");
          const QUIET = false;
          [
            ...getFilePaths("./campaigns").sort(),
            ...getFilePaths("./build/return_campaigns").sort()
          ]
            .sort()
            .map(file => {
              if (
                !file.endsWith(".schema.json") &&
                !file.endsWith("campaign.json") &&
                file.endsWith(".json")
              ) {
                const data = fs.readFileSync(file, "utf-8").toString();
                if (!QUIET) {
                  console.log("Validating: " + file);
                }
                try {
                  const json = jsonlint.parse(data);
                  validate(validator, file, json, "scenario");
                } catch (e) {
                  console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
                }
              }
            });
        } catch (e) {
          reject(e);
          return;
        }
        resolve();
      }
    });
  });
}

async function validateCampaigns() {
  console.log('****Validating Campaigns****');
  const campaignSchema = fs
    .readFileSync("./schema/campaign.schema.json")
    .toString();
  return await new Promise((resolve, reject) => {
    $RefParser.dereference(jsonlint.parse(campaignSchema), (err, schema) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        try {
          // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
          // including referenced files, combined into a single object
          const ajv = new Ajv({ verbose: true, allErrors: true  });
          const validator = ajv.addSchema(schema, "campaign");
          const QUIET = true;
          [
            ...getFilePaths("./campaigns").sort(),
            ...getFilePaths("./build/return_campaigns").sort()
          ].map(file => {
            if (file.endsWith("campaign.json")) {
              const data = fs.readFileSync(file, "utf-8").toString();
              if (!QUIET) {
                console.log("Validating: " + file);
              }
              try {
                const json = jsonlint.parse(data);
                validate(validator, file, json, "campaign");
              } catch (e) {
                console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
              }
            }
          });
        } catch(e) {
          reject(e);
          return;
        }
        resolve();
      }
    });
  });
}

async function validateErrata() {
  console.log('****Validating Errata****');
  const errataSchema = fs
    .readFileSync('./schema/errata.schema.json')
    .toString();
  return await new Promise((resolve, reject) => {
    $RefParser.dereference(jsonlint.parse(errataSchema), (err, schema) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        try {
          // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
          // including referenced files, combined into a single object
          const ajv = new Ajv({ verbose: true });
          const validator = ajv.addSchema(schema, "errata");
          const QUIET = false;

          getFilePaths("./errata").sort().map(file => {
            if (file.endsWith('errata.json')) {
              const data = fs.readFileSync(file, "utf-8").toString();
              if (!QUIET) {
                console.log("Validating errata: " + file);
              }
              try {
                const json = jsonlint.parse(data);
                validate(validator, file, json, "errata");
              } catch (e) {
                console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
              }
            }
          });
        } catch (e) {
          reject(e);
          return;
        }
      }
      resolve();
    });
  });
}

async function main() {
  await validateScenarios();
  await validateCampaigns();
  await validateChaosTokens();
  await validateErrata();
  //
}
main();
/*
const rulesSchema = fs
  .readFileSync('./schema/rules.schema.json')
  .toString();
$RefParser.dereference(jsonlint.parse(errataSchema), (err, schema) => {
  if (err) {
    console.error(err);
  } else {
     // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
    // including referenced files, combined into a single object
    const ajv = new Ajv({ verbose: true });
    const validator = ajv.addSchema(schema, "rules");
    const QUIET = false;

    getFilePaths("./rules").sort().map(file => {
      if (file.endsWith('foo.json')) {
        const data = fs.readFileSync(file, "utf-8").toString();
        if (!QUIET) {
          console.log("Validating: " + file);
        }
        try {
          const json = jsonlint.parse(data);
          validate(validator, file, json, "rules");
        } catch (e) {
          console.log(`JSON Error(${file})\n${e.message || e}\n\n`);
        }
      }
    });
  }
});
*/
