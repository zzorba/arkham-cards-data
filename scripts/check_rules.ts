import * as fs from 'fs';
import * as path from 'path';

interface Rule {
  id: string;
  rules?: Rule[];
  [key: string]: unknown;
}

function main(): void {
  const langCode = process.argv[2];
  if (!langCode) {
    console.error(`Usage: ${process.argv[1]} <language_code>`);
    process.exit(1);
  }

  const file = path.join('rules', langCode, 'rules.json');
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    process.exit(0);
  }

  const rules: Rule[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  const topLevelIds = rules.map(rule => rule.id);
  const nestedIds = rules
    .filter(rule => rule.rules != null)
    .flatMap(rule => rule.rules!.map(nested => nested.id));

  const allIds = [...topLevelIds, ...nestedIds].filter(id => !!id);

  const counts = new Map<string, number>();
  for (const id of allIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();

  if (duplicates.length === 0) {
    console.log('No duplicate ids found.');
  } else {
    console.log('Duplicate ids found:');
    duplicates.forEach(id => console.log(id));
    process.exit(1);
  }
}

main();
