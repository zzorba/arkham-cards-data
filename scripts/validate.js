const fs = require("fs");
const fsprom = require("fs/promises");
const jsonata = require('jsonata');

require('dotenv').config()

async function validateEncounterSets(){
    console.log("Looking for invalid encounter sets");

    // Load allCampaigns.json file and extract all encounter_set code
    const allCampaignsPath = `./build/allCampaigns.json`;
    const content = await fsprom.readFile(allCampaignsPath, 'utf-8');
    const json = JSON.parse(content);

    // Select every "step" at any depth with type="encounter_sets"
    // and extract its encounter_set value
    const expression = jsonata(`$distinct( **.steps[type="encounter_sets"].encounter_sets )`);
    const encounter_sets = await expression.evaluate(json);

    // Load encounter_sets.json file and extract all "code" properties
    const es_content = await fsprom.readFile(`./encounter_sets.json`, 'utf-8');
    const es = JSON.parse(es_content);
    const encounter_sets_codes = await jsonata(`code`).evaluate(es);
    const index = new Set(encounter_sets_codes);

    // Every encounter set in allCampaigns.json MUST exists in encounter_sets.json
    encounter_sets.forEach( es => {
        if (index.has(es) === false) {
            console.log(`Encounter code ${es} is invalid`);
            process.exit(1);
        }
    });
}

if (!fs.existsSync('.env')){
    console.log(".env file is missing.")
    process.exit(1);
}

if (fs.existsSync('./build/allCampaigns.json')){
    validateEncounterSets();
} else {
    console.log("./build/allCampaigns.json file is missing. Build it first.")
    process.exit(1);
}