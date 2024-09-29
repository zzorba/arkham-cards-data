const fs = require('fs');
const fsprom = require('fs/promises');
const path = require('path');
const jsonata = require('jsonata');
const yargs = require('yargs');

async function listSubfolders(directory) {
    const files = await fsprom.readdir(directory, { withFileTypes: true });
    const subfolders = files
        .filter(dirent => dirent.isDirectory()) // Only directories
        .map(dirent => `${dirent.path}/${dirent.name}`);
    return subfolders;
}

async function listFiles(directory) {
    const files = await fsprom.readdir(directory, { withFileTypes: true });
    const folder_files = files
        .filter(dirent => dirent.isFile) // Only files
        .map(dirent => `${dirent.path}/${dirent.name}`);
    return folder_files;
}

async function buildCampaign(directory, outDir) {
    const data = {
        campaign: null,
        scenarios: []
    };

    // list and parse everey json file inside campaign folder
    const campaignFiles = await listFiles( directory );
    campaignFiles.sort();

    // Async version does not keep items sorted, sync do.
    campaignFiles.forEach( filepath =>{
        const content = fs.readFileSync(filepath, 'utf-8');
        const json = JSON.parse(content);

        // campaign.json is copied in 'campaign' property,
        // other files are pushed inside 'scenario' array
        if (filepath.endsWith('campaign.json')){
            data.campaign = json;
        }else{
            data.scenarios.push(json);
        }
    });

    const base = path.basename(directory);
    const OUTPUT_FILE = `${outDir}/campaigns/${base}.json`;
    const campaignContent = JSON.stringify(data, null, 2);
    await fsprom.writeFile(OUTPUT_FILE, campaignContent);
}

async function buildAllCampaigns(outDir) {
    console.log("Building allCampaigns.json")
    const allCampaigns = [];
    const campaigns_files = await listFiles(`${outDir}/campaigns`);
    campaigns_files.sort();

    // Async version does not keep items sorted.
    // await Promise.all(campaigns_files.map( async campaign_file =>{
    //     const content = await fsprom.readFile(campaign_file, 'utf-8');
    //     const json = JSON.parse(content);
    //     allCampaigns.push(json);
    // }));
    campaigns_files.forEach( campaign_file =>{
        const content = fs.readFileSync(campaign_file, 'utf-8');
        const json = JSON.parse(content);
        allCampaigns.push(json);
    });

    const allCampaignsPath = `${outDir}/allCampaigns.json`;
    const allCampaignsContent = JSON.stringify(allCampaigns, null, 2);
    await fsprom.writeFile(allCampaignsPath, allCampaignsContent, 'utf-8');
}

async function buildScenarioNames(outDir) {
    console.log("Building scenarioNames.json");
    const allCampaignsPath = `${outDir}/allCampaigns.json`;
    const content = await fsprom.readFile(allCampaignsPath, 'utf-8');
    const json = JSON.parse(content);

    // Select only scenarios with "id" and "scenario_name" properties; this ensures the creation of objects with two properties.
    // Map the scenario to new object with "id" and "name" property.
    // Sort the items by id.
    const expression = jsonata(`
        scenarios
          [id and scenario_name]
          .{ "id": $.id, "name":$.scenario_name}
          ^(id)
`);
    const result = await expression.evaluate(json);

    // Remove items with duplicate "id" (keep only he first)
    // BUG: Some items are just duplicated, but some other have same "id" and different "name" (look at  id: core)
    const usedIds = new Set();
    const unique = result.filter((item)=>{
        const ID = item.id;
        if (usedIds.has(ID)) return false;

        usedIds.add(ID);
        return true;
    });

    const scenarioNamesPath = `${outDir}/scenarioNames.json`;
    const scenarioNamesContent = JSON.stringify(unique, null, 2);
    await fsprom.writeFile(scenarioNamesPath, scenarioNamesContent, 'utf-8');
}

async function run(OUTPUT_DIR, INPUT_DIR, RETURN_INPUT_DIR){

    await fsprom.mkdir(OUTPUT_DIR, {recursive: true});
    await fsprom.copyFile(`${INPUT_DIR}/../encounter_sets.json`, `${OUTPUT_DIR}/encounterSets.json`)

    await fsprom.rm(`${OUTPUT_DIR}/campaigns`, {recursive: true, force: true});
    await fsprom.mkdir(`${OUTPUT_DIR}/campaigns`, {recursive: true});
    
    const campaigns = await listSubfolders(`${INPUT_DIR}`);
    const return_campaigns = await listSubfolders(`${RETURN_INPUT_DIR}`);
    const allCampaignFolders = [...campaigns, ...return_campaigns];
    await Promise.all(allCampaignFolders.map( async folder =>{
        await buildCampaign(folder, OUTPUT_DIR);
    }));

    await buildAllCampaigns(OUTPUT_DIR);
    await buildScenarioNames(OUTPUT_DIR);
}


const argv = yargs
  .option(
    'output', {
      alias: 'o',
      description: 'Output directory',
      type: 'string',
      default: './build',
    }
  )
  .option(
    'input', {
      alias: 'i',
      description: 'Campaigns definions directory',
      type: 'string',
      default: './campaigns',
    }
  )
  .option(
    'return', {
      alias: 'r',
      description: 'Return campaigns definions directory',
      type: 'string',
      default: './return_campaigns',
    }
  )
  .help().alias('help', 'h')
  .argv;

run(argv.output, argv.input, argv.return);
