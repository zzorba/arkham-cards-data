const fs = require("fs");
const fsprom = require("fs/promises");
const jsonata = require('jsonata');
const yargs = require('yargs');


async function run(lang_code){
    const file=`rules/${lang_code}/rules.json`

    const exists = fs.existsSync( file );
    if (exists === false){
        console.log(`(${lang_code}) Rules file not found.`);
        return
    }

    const content = await fsprom.readFile(file, 'utf-8');
    const json = JSON.parse(content);
    
    const all_ids = await jsonata(`**.id`).evaluate(json);
    const unique_ids = new Set(all_ids);
    
    // Check if there are any duplicates
    if(all_ids.length === unique_ids.size){
      console.log("No duplicate ids found.");
    } else {
        const duplicates = all_ids.filter(item => {
            if (unique_ids.has(item)) {
              unique_ids.delete(item);
              return false; // Not a duplicate yet, remove from Set to catch next occurrence
            }
            return true; // Already removed from Set, thus a duplicate
        });

      console.log(`(${lang_code}) Rules, duplicate ids found:`, duplicates);
      process.exit(1);
    }
}

if (require.main === module){
  // Invoked from the shell, not from a require()

  const argv = yargs
        .option('lang',{
          describe: 'Two letters lang code',
          demandOption: true
      })
      .help().alias('help', 'h')
      .argv;
  
  run( argv.lang );

}

module.exports = { run };