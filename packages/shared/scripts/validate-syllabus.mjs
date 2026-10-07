import { readFile } from 'node:fs/promises';

const expected = { Physics: { units: 20, topics: 147 }, Chemistry: { units: 20, topics: 121 }, Biology: { units: 10, topics: 74 } };
const syllabus = JSON.parse(await readFile(new URL('../data/syllabus.seed.json', import.meta.url), 'utf8'));
const actual = Object.fromEntries(syllabus.subjects.map((subject) => [subject.name, {
  units: subject.units.length,
  topics: subject.units.reduce((total, unit) => total + unit.topics.length, 0),
}]));

for (const [name, counts] of Object.entries(expected)) {
  const result = actual[name];
  if (!result || result.units !== counts.units || result.topics !== counts.topics) {
    throw new Error(`${name}: expected ${counts.units} units/${counts.topics} topics, got ${result?.units ?? 0} units/${result?.topics ?? 0} topics`);
  }
  console.log(`${name}: ${result.units} units, ${result.topics} topics`);
}

const totalUnits = Object.values(actual).reduce((total, value) => total + value.units, 0);
const totalTopics = Object.values(actual).reduce((total, value) => total + value.topics, 0);
if (totalUnits !== 50 || totalTopics !== 342) throw new Error(`Total mismatch: expected 50 units/342 topics, got ${totalUnits} units/${totalTopics} topics`);
console.log(`Total: ${totalUnits} units, ${totalTopics} topics`);
