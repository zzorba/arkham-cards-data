const fetch = require('node-fetch');
const fs = require('fs');

const spanRule = /<span class="icon-([^"]+)"( title="[^"]*")?><\/span>/g;
const newlineRule = /\r\n/g;
const cardLinkRule = /http(s?):\/\/arkhamdb\.com\/card\//g;
const rulesLinkRule = /http(s?):\/\/arkhamdb.com\/rules#/g;
const paragraphRule = /<p>/g;
const closeParagraphRule = /<\/p>/g;
const cycles = {
  '01': 'core',
  '02': 'dwl',
  '03': 'ptc',
  '04': 'tfa',
  '05': 'tcu',
  '06': 'tde',
  '07': 'tic',
  '08': 'eoe',
  '09': 'tsk',
  '50': 'rtnotz',
  '51': 'rtdwl',
  '52': 'rtptc',
  '53': 'rttfa',
  '54': 'rttcu',
  '60': 'investigator',
  '61': 'investigator',
  '62': 'investigator',
  '63': 'investigator',
  '64': 'investigator',
  '81': 'standalone',
  '82': 'standalone',
  '83': 'standalone',
  '84': 'standalone',
  '85': 'standalone',
  '86': 'standalone',
  '90': 'parallel',
  '98': 'books',
  '99': 'promo',
};

async function fetchFaq() {
  const uri = `https://arkhamdb.com/api/public/cards/?encounter=1`;

  console.log('Fetching all cards from ArkhamDB.');
  const response = await fetch(uri, {
    method: 'GET',
  });
  const json = await response.json();
  console.log(`Got ${json.length} cards`);
  const faqByPack = {};
  for (let i = 0; i < json.length; i++) {
    if (i % 100 === 99) {
      console.log(`Completed ${i} cards`);
    }
    const card = json[i];
    const code = card.code;
    const uri = `https://arkhamdb.com/api/public/faq/${code}.json`;
    const faqResponse = await fetch(uri, {
      method: 'GET',
    });

    const faqJson = await faqResponse.json();
    for (let j = 0; j < faqJson.length; j++) {
      const faq = faqJson[j];
      const text = faq.text
        .replace(spanRule, '[\$1]')
        .replace(newlineRule, '\n')
        .replace(cardLinkRule, '/card/')
        .replace(rulesLinkRule, '/rules#')
        .replace(paragraphRule, '')
        .replace(closeParagraphRule, '');
      const cycleName = cycles[faq.code.substring(0, 2)] || 'other';
      if (!faqByPack[cycleName]) {
        faqByPack[cycleName] = [];
      }
      const entry = {
        code: faq.code,
        text,
        updated_at: new Date(Date.parse(faq.updated.date)),
      };
      faqByPack[cycleName].push(entry);
    }
  }
  Object.keys(faqByPack).forEach(pack_code => {
    const json = faqByPack[pack_code];
    fs.writeFileSync(`./faq/en/${pack_code}.json`, JSON.stringify(json, null, 2));
  });
}

fetchFaq();