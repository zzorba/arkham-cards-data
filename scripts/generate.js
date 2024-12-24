// Generate TypeScript definition from JSON Schema
const { compileFromFile } = require("json-schema-to-typescript");
let fsprom = require("fs/promises");

async function run(){
    await fsprom.mkdir('./build', {recursive: true});
    await fsprom.writeFile('./build/index.d.ts', '/* eslint-disable */\n');

    const ts = await compileFromFile('schema/schema.json', { declareExternallyReferenced: true, cwd: '.'});
    await fsprom.appendFile('./build/index.d.ts', ts);
}

run();