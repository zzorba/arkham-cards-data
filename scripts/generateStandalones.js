const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require('jsonlint');
const { filter } = require('lodash');
const yargs = require('yargs');

const argv = yargs
  .option(
    'input', {
      alias: 'i',
      description: 'Input directory',
      type: 'string',
      default: '.',
    }
  ).option(
    'output', {
      alias: 'o',
      description: 'Output directory',
      type: 'string',
      default: './build',
    }
  ).help()
  .alias('help', 'h')
  .argv;

const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

const output_dir = argv.output || './build';

if (!fs.existsSync(output_dir)) {
  fs.mkdirSync(output_dir, { recursive: true })
}
if (!fs.existsSync(`${output_dir}`)) {
  fs.mkdirSync(`${output_dir}`, { recursive: true })
}
const input_dir = argv.input || '.';
const standaloneList = [];
getFilePaths(`${input_dir}/campaigns`).sort().map(file => {
  if (file.endsWith('.schema.json') || !file.endsWith('.json')) {
    return;
  }
  const json = jsonlint.parse(fs.readFileSync(file, 'utf-8').toString());
  if (file.endsWith('campaign.json')) {
    if (json.campaign_type === 'standalone') {
      standaloneList.push({
        type: 'campaign',
        campaignId: json.id,
      });
    }
    return;
  }
  if (json.standalone_setup) {
    const parts = file.split('/');
    const campaignFile =  jsonlint.parse(fs.readFileSync(filter(parts, x => x !== parts[parts.length - 1]).join('/') + '/campaign.json', 'utf-8').toString())
    standaloneList.push({
      type: 'scenario',
      campaignId: campaignFile.id,
      scenarioId: json.id,
    });
  }
});
fs.writeFileSync(`${output_dir}/standalone.json`, JSON.stringify(standaloneList, null, 2));