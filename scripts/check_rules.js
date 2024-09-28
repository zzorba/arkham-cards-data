const fs = require("fs");
const fsprom = require("fs/promises");
const jsonata = require('jsonata');
const yargs = require('yargs');


async function run(lang_code){
    const file=`rules/${lang_code}/rules.json`

    const exists = fs.existsSync( file );
    if (exists === false){
        console.log("File not found");

        // TODO this is an error, process should exit with an error code
        process.exit(0);
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
            if (uniqueSet.has(item)) {
              uniqueSet.delete(item);
              return false; // Not a duplicate yet, remove from Set to catch next occurrence
            }
            return true; // Already removed from Set, thus a duplicate
        });
    
      console.log("Duplicate ids found:", duplicates);
      process.exit(1);
    }
}


const argv = yargs
    .option('lang',{
        describe: 'Two letters lang code',
        demandOption: true
    })
    .help().alias('help', 'h')
    .argv;

run( argv.lang );