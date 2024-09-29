const jsonata = require('jsonata');
const fs = require('fs');
const fsprom = require('fs/promises');
const yargs = require('yargs');


async function buildCampaignLogs(outDir){
  console.log("Building campaignLogs.json");
  const allCampaignsPath = `${outDir}/allCampaigns.json`;
  const content = await fsprom.readFile(allCampaignsPath, 'utf-8');
  const json = JSON.parse(content);

  const expression = jsonata(`
$map($, function($item) {
    (

        $effects := $item.scenarios.**.effects
        [type in ["campaign_log" ,"campaign_log_count", "campaign_log_cards"]]
        [text or masculine_text or feminine_text or nonbinary_text]
        [$not($exists(cross_out)) or cross_out != true];

        $supplies := $item.**.supplies;

        $section_names := $distinct($effects.section);

        {
            "campaignId": $item.campaign.id,
            "sections": $map($section_names, function($section_name){

                return {
                    "section": $section_name,
                    "entries": $distinct($effects[section=$section_name].{
                        "id": $.id,
                        "text": $.text ? $.text :  
                            $.masculine_text ? $.masculine_text : 
                            $.feminine_text ? $.feminine_text :   
                            $.nonbinary_text ? $.nonbinary_text : null
                    })
                }

            }),
            "supplies": $supplies ? $supplies : []
        }

   )
})
    `);
  const result = await expression.evaluate(json);

  const campaignLogsPath = `${outDir}/campaignLogs.json`;
  const campaignLogsContent = JSON.stringify(result, null, 2);
  await fsprom.writeFile(campaignLogsPath, campaignLogsContent, 'utf-8');
}


async function run( OUTPUT_DIR ){
  const exists = fs.existsSync(`${OUTPUT_DIR}/allCampaigns.json`);
  if (exists === true){
    await buildCampaignLogs(OUTPUT_DIR);
  }else{
    console.log(`${OUTPUT_DIR}/allCampaigns.json file is missing. Build it first.`)
    process.exit(1);
  }
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
    .help().alias('help', 'h')
  .argv;

run( argv.output );
