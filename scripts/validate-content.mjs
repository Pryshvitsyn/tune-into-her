import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const languages = ["en", "it", "ru", "uk", "es", "fr", "ms", "ms-baba", "hi"];
const validLearnIds = new Set(["menstrual", "follicular", "mid_cycle", "luteal"]);
const catalog = JSON.parse(await readFile(path.join(root, "content/catalog.json"), "utf8"));
const ids = catalog.map((record) => record.id);
const problems = [];

if (catalog.length < 365) problems.push("Expected at least 365 records; found " + catalog.length + ".");
if (new Set(ids).size !== ids.length) problems.push("Duplicate cue IDs found.");
for (const record of catalog) if (!validLearnIds.has(record.learnMoreId)) problems.push(record.id + " has invalid Learn More ID.");
for (const language of languages) {
  const locale = JSON.parse(await readFile(path.join(root, "content/locales/" + language + ".json"), "utf8"));
  for (const id of ids) {
    const entry = locale[id];
    const validMoves = Array.isArray(entry?.practicalMoves) && entry.practicalMoves.length === 3 && entry.practicalMoves.every((move) => move?.trim());
    if (!entry?.howSheMayFeel?.trim() || !entry?.whatYouCanDo?.trim() || !validMoves) problems.push(language + ": invalid canonical cue " + id + ".");
  }
}
const ms = JSON.parse(await readFile(path.join(root, "content/locales/ms.json"), "utf8"));
const baba = JSON.parse(await readFile(path.join(root, "content/locales/ms-baba.json"), "utf8"));
if (JSON.stringify(ms) === JSON.stringify(baba)) problems.push("Baba Malay content must not duplicate standard Malay.");
const hindi = JSON.parse(await readFile(path.join(root, "content/locales/hi.json"), "utf8"));
if (!Object.values(hindi).some((entry) => /[\u0900-\u097F]/.test(entry.howSheMayFeel))) problems.push("Hindi cues do not contain Devanagari.");
if (problems.length) {
  console.error(problems.join(String.fromCharCode(10)));
  process.exit(1);
}
console.log("Validated " + catalog.length + " canonical cues across " + languages.length + " languages.");
