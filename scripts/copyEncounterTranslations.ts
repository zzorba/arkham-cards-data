import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import * as path from 'path';
import { forEach } from 'lodash';
import * as gettextParser from 'gettext-parser';

const translationsDir = `${process.env.ARKHAMDB_DATA}/translations/`;
const poDir = `./i18n/`;

const loadJson = (jsonFile: string) => {
    const data = fs.readFileSync(jsonFile, 'utf-8');
    return JSON.parse(data);
}

const loadPo = (poFile: string) => {
    const data = fs.readFileSync(poFile, 'utf-8');
    return gettextParser.po.parse(data, 'utf-8');
}

const updatePoWithJson = (poData: any, jsonData: any[], codeToMsgid: { [code: string]: string}) => {
    jsonData.forEach(item => {
      const msgid = codeToMsgid[item.code];
      if (item.name !== msgid && poData.translations[''][msgid]) {
          poData.translations[''][msgid].msgstr[0] = item.name;
      }
    });
    return poData;
}

const savePo = (poData: any, poFile: string) => {
    const output = gettextParser.po.compile(poData, { foldLength: false });
    console.log(output);
    fs.writeFileSync(poFile, output);
}

const directories = fs.readdirSync(
  translationsDir, {
     withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const englishData = loadJson('./encounter_sets.json');
const codeToMsgid: { [code: string]: string } = {};
forEach(englishData, (item) => {
  codeToMsgid[item.code] = item.name;
});
directories.forEach(directory => {
    const match = directory.match(/([^\/]*)\/*$/);
    const lang = match ? match[1] : '';
    console.log(`Processing ${lang}:`);
    const jsonFile = path.join(translationsDir, directory, 'encounters.json');
    const poFile = path.join(poDir, lang, 'encounter_sets.po');
    console.log(`  ${jsonFile} -> ${poFile}`);
    if (fs.existsSync(jsonFile) && fs.existsSync(poFile)) {
        const jsonData = loadJson(jsonFile);
        const poData = loadPo(poFile);

        const updatedPoData = updatePoWithJson(poData, jsonData, codeToMsgid);

        savePo(updatedPoData, poFile);
    }
});