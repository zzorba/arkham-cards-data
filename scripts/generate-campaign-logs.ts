import * as fs from 'fs';
import * as path from 'path';
import jsonata from 'jsonata';

interface LogEntry {
  id: unknown;
  text?: unknown;
  masculine_text?: unknown;
  feminine_text?: unknown;
  nonbinary_text?: unknown;
}

interface Section {
  section: unknown;
  entries: LogEntry[];
}

interface CampaignLog {
  campaignId: unknown;
  sections: Section[];
  supplies: unknown[];
}

interface RawLogEntry {
  id: unknown;
  text?: unknown;
  masculine_text?: unknown;
  feminine_text?: unknown;
  nonbinary_text?: unknown;
  section?: unknown;
  investigator_section?: unknown;
}

function parseOutputDir(argv: string[]): string {
  let outputDir = './build';
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '-o' || key === '--output') {
      outputDir = argv[++i];
    } else if (key.startsWith('-o=') || key.startsWith('--output=')) {
      outputDir = key.slice(key.indexOf('=') + 1);
    }
  }
  return outputDir;
}

// Mirrors jq's `.. .effects? | .[]? | select(...)`: recursively collect and filter campaign log effects
const LOG_ENTRIES_EXPR = jsonata(
  '**.effects[' +
    'type in ["campaign_log", "campaign_log_count", "campaign_log_cards"] ' +
    'and (text or masculine_text or feminine_text or nonbinary_text) ' +
    'and $not(cross_out = true)' +
  '].{' +
    '"id": id, "text": text, "masculine_text": masculine_text, ' +
    '"feminine_text": feminine_text, "nonbinary_text": nonbinary_text, ' +
    '"section": section, "investigator_section": investigator_section' +
  '}'
);

// Mirrors jq's `.. .supplies? | .[]?`
const SUPPLIES_EXPR = jsonata('**.supplies');

async function evaluateAsArray<T>(expr: jsonata.Expression, input: unknown): Promise<T[]> {
  const result = await expr.evaluate(input);
  if (result === undefined) return [];
  return Array.isArray(result) ? result : [result];
}

function jqTypeOrder(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (value === false) return 1;
  if (value === true) return 2;
  if (typeof value === 'number') return 3;
  if (typeof value === 'string') return 4;
  if (Array.isArray(value)) return 5;
  return 6; // object
}

// Mirrors jq's generic value ordering: null < false < true < numbers < strings < arrays < objects.
// Objects are compared by their *sorted key set* first, then by values in that same key order -
// key insertion order is irrelevant, unlike a plain JSON.stringify() comparison.
function jqCompare(a: unknown, b: unknown): number {
  const ta = jqTypeOrder(a);
  const tb = jqTypeOrder(b);
  if (ta !== tb) return ta - tb;
  switch (ta) {
    case 0:
    case 1:
    case 2:
      return 0;
    case 3:
      return (a as number) - (b as number);
    case 4:
      return a === b ? 0 : (a as string) < (b as string) ? -1 : 1;
    case 5: {
      const arrA = a as unknown[];
      const arrB = b as unknown[];
      const len = Math.min(arrA.length, arrB.length);
      for (let i = 0; i < len; i++) {
        const cmp = jqCompare(arrA[i], arrB[i]);
        if (cmp !== 0) return cmp;
      }
      return arrA.length - arrB.length;
    }
    default: {
      const objA = a as Record<string, unknown>;
      const objB = b as Record<string, unknown>;
      const keysA = Object.keys(objA).sort();
      const keysB = Object.keys(objB).sort();
      const len = Math.min(keysA.length, keysB.length);
      for (let i = 0; i < len; i++) {
        if (keysA[i] !== keysB[i]) return keysA[i] < keysB[i] ? -1 : 1;
      }
      if (keysA.length !== keysB.length) return keysA.length - keysB.length;
      for (const key of keysA) {
        const cmp = jqCompare(objA[key], objB[key]);
        if (cmp !== 0) return cmp;
      }
      return 0;
    }
  }
}

// Serializes with recursively sorted object keys, since jq equality (unlike JSON.stringify) is key-order independent
function canonicalKey(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = v[k];
        return acc;
      }, {});
    }
    return v;
  });
}

// Mirrors jq's `unique`: sort using jq's value ordering, then drop consecutive duplicates
function uniqueByJson<T>(items: T[]): T[] {
  const sorted = [...items].sort(jqCompare);
  const seen = new Set<string>();
  return sorted.filter(item => {
    const key = canonicalKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function buildSections(campaign: unknown): Promise<Section[]> {
  const rawEntries = await evaluateAsArray<RawLogEntry>(LOG_ENTRIES_EXPR, campaign);

  // jq groups by the raw `.section` field (which is absent/null for investigator-scoped entries);
  // `investigator_section` only supplies the group's *displayed* name, taken from the first entry.
  const groups = new Map<unknown, { section: unknown; entries: LogEntry[] }>();
  for (const raw of rawEntries) {
    const groupKey = raw.section;
    // Only assign keys that are actually present - object literal shorthand would otherwise create
    // e.g. a `text: undefined` key, which breaks jq's key-set-based object comparison in jqCompare.
    const entry: LogEntry = { id: raw.id };
    if (raw.text !== undefined) entry.text = raw.text;
    if (raw.masculine_text !== undefined) entry.masculine_text = raw.masculine_text;
    if (raw.feminine_text !== undefined) entry.feminine_text = raw.feminine_text;
    if (raw.nonbinary_text !== undefined) entry.nonbinary_text = raw.nonbinary_text;

    if (!groups.has(groupKey)) {
      const section = raw.investigator_section !== undefined ? raw.investigator_section : raw.section;
      groups.set(groupKey, { section, entries: [] });
    }
    groups.get(groupKey)!.entries.push(entry);
  }

  return [...groups.entries()]
    .sort((a, b) => jqCompare(a[0], b[0]))
    .map(([, group]) => ({ section: group.section, entries: uniqueByJson(group.entries) }));
}


async function buildCampaignLogs(allCampaigns: any[]): Promise<CampaignLog[]> {
  const grouped = new Map<unknown, { sections: Section[]; supplies: unknown[] }>();

  for (const campaign of allCampaigns) {
    const campaignId = campaign?.campaign?.id;

    const sections = await buildSections(campaign);
    const supplies = await evaluateAsArray<unknown>(SUPPLIES_EXPR, campaign);

    if (!grouped.has(campaignId)) {
      grouped.set(campaignId, { sections: [], supplies: [] });
    }
    const group = grouped.get(campaignId)!;
    group.sections.push(...sections);
    group.supplies.push(...supplies);
  }

  return [...grouped.entries()]
    .sort((a, b) => jqCompare(a[0], b[0]))
    .map(([campaignId, group]) => ({
      campaignId,
      sections: group.sections,
      supplies: uniqueByJson(group.supplies),
    }));
}

async function main(): Promise<void> {
  const outputDir = parseOutputDir(process.argv.slice(2));
  const allCampaignsPath = path.join(outputDir, 'allCampaigns.json');

  if (!fs.existsSync(allCampaignsPath)) {
    console.error(`${outputDir}/allCampaigns.json file is missing. Build it first.`);
    process.exit(1);
  }

  const allCampaigns = JSON.parse(fs.readFileSync(allCampaignsPath, 'utf8'));
  const campaignLogs = await buildCampaignLogs(allCampaigns);
  fs.writeFileSync(path.join(outputDir, 'campaignLogs.json'), JSON.stringify(campaignLogs, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
