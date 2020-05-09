const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require('jsonlint');

const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

const json = jsonlint.parse(fs.readFileSync('./build/tempCampaignLogs.json', 'utf-8').toString());
const sideCampaign = json.find(entry => entry.campaignId === 'side');
const resultJson = [];
json.forEach(campaignLog => {
  if (campaignLog.campaignId !== 'side') {
    const sections = [];
    const usedSideSections = [];
    campaignLog.sections.forEach(section => {
      const sideSection = sideCampaign.sections.find(side => side.section === section.section);
      if (sideSection) {
        usedSideSections.push(section.section);
        sections.push({
          section: section.section,
          entries: [
            ...section.entries,
            ...sideSection.entries,
          ],
        });
      } else {
        sections.push(section);
      }
    });
    const usedSideSectionsSet = new Set(usedSideSections);
    sideCampaign.sections.forEach(side => {
      if (!usedSideSectionsSet.has(side.section)) {
        sections.push(side);
      }
    });
    resultJson.push({
      ...campaignLog,
      sections,
    });
  }
})
fs.writeFileSync('./build/campaignLogs.json',
  JSON.stringify(resultJson, null, 2)
);
