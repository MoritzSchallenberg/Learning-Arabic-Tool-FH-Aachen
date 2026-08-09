#!/usr/bin/env node
// Entwicklungsauftrag 10 — hebt die 126 neuen Wörter der Units 21-25 vom Minimalmodell auf das
// volle Datenmodell an: findet die bereits bestehenden Wort-Objekte anhand ihrer ID (keine neuen
// IDs, keine neuen Kategorien) und ergänzt/überschreibt die inhaltlichen Felder aus
// scripts/data/kurs1Units21to25Full.js. Die bereits vollständigen Bestandswörter (0 in Unit 21,
// 6 in Unit 22, 4 in Unit 23, 7 in Unit 24, 7 in Unit 25 — insgesamt 24, z. B. transport_car,
// school_bag, uni_university, job_doctor) werden NICHT angefasst, weil sie schlicht nicht in
// ALL_ENTRIES vorkommen.
//
// application_prompts bekommen wie in upgrade-kurs1-units16to20.js sowohl expected_word_id (die
// eigene ID) als auch expected_meaning (siehe Untersuchung zu renderContextualChoice in
// Entwicklungsauftrag 9/10).
//
// Wie die Vorgänger-Skripte: setzt zusätzlich opposite_id (gegenseitig, auch unitübergreifend
// zulässig), confusion_group (selektiv) und homonym_group (nur wo im Datenmodell angegeben).
// Idempotent.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const VOCAB_PATH = path.join(PACK, 'vocabulary.json');

const { UNIT_21, UNIT_22, UNIT_23, UNIT_24, UNIT_25 } = require('./data/kurs1Units21to25Full.js');
const ALL_ENTRIES = [...UNIT_21, ...UNIT_22, ...UNIT_23, ...UNIT_24, ...UNIT_25];

// Diakritika-Bereiche als Hex-Codepoints statt \uXXXX-Escapes im Quelltext bzw. roher
// combining-mark-Zeichen definiert (siehe Bugfix-Hinweis in build-kurs1-batch.js /
// upgrade-kurs1-units11to15.js).
const DIACRITIC_RANGES = [
  [0x064B, 0x0652], [0x0653, 0x0655], [0x0656, 0x065F], [0x0670, 0x0670], [0x06D6, 0x06ED], [0x0640, 0x0640]
];
const DIACRITIC_CHARS = DIACRITIC_RANGES.flatMap(([from, to]) => {
  const chars = [];
  for (let code = from; code <= to; code += 1) chars.push(String.fromCodePoint(code));
  return chars;
}).join('');
const DIACRITICS_REGEX = new RegExp(`[${DIACRITIC_CHARS}]`, 'g');

function stripDiacritics(text) {
  return text.replace(DIACRITICS_REGEX, '');
}

const vocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const byId = new Map(words.map((w) => [w.id, w]));
const entryById = new Map(ALL_ENTRIES.map((e) => [e.id, e]));

let upgraded = 0;
let missing = 0;
let opposites = 0;
let confusionTags = 0;
let homonymTags = 0;
let strippedMismatch = 0;
for (const entry of ALL_ENTRIES) {
  const w = byId.get(entry.id);
  if (!w) { console.error(`WARNUNG: Wort-ID "${entry.id}" nicht in vocabulary.json gefunden — übersprungen.`); missing += 1; continue; }

  const strippedNew = stripDiacritics(entry.ar);
  // Die unvokalisierte Grundform darf sich durch dieses Skript NICHT ändern (bestehende, korrekte
  // Inhalte bleiben erhalten) — wenn schon eine arabic_unvocalized-Angabe existiert, muss die neu
  // vokalisierte Form exakt dazu strippen.
  if (w.arabic_unvocalized && w.arabic_unvocalized !== strippedNew) {
    console.error(`WARNUNG: "${entry.id}" — vokalisierte Form strippt zu "${strippedNew}", weicht aber von der bestehenden arabic_unvocalized "${w.arabic_unvocalized}" ab. Bitte prüfen.`);
    strippedMismatch += 1;
  }

  w.arabic = entry.ar;
  w.arabic_vocalized = entry.ar;
  w.arabic_unvocalized = strippedNew;
  w.german = entry.de[0];
  w.german_answers = entry.de;
  w.transliteration = entry.tr;
  w.part_of_speech = entry.pos;
  w.gender = entry.g;
  w.plural = entry.pl;
  const arabicAnswers = [entry.ar, strippedNew].filter((v, i, arr) => arr.indexOf(v) === i);
  w.accepted_arabic_answers = arabicAnswers;
  w.application_prompts = [{ type: 'context_choice', prompt: entry.app, expected_word_id: entry.id, expected_meaning: entry.de[0] }];
  if (entry.homonymGroup) { w.homonym_group = entry.homonymGroup; homonymTags += 1; }

  if (entry.opp) {
    if (!entryById.has(entry.opp)) {
      console.error(`WARNUNG: opposite_id "${entry.opp}" von "${entry.id}" ist selbst kein bekannter Wort-Eintrag dieses Batches.`);
    } else {
      w.opposite_id = entry.opp;
      opposites += 1;
    }
  }
  if (entry.conf) {
    w.confusion_group = entry.conf;
    confusionTags += 1;
  }
  // content_status bleibt "needs_language_review" (unverändert) — Sprachprüfung steht noch aus.
  upgraded += 1;
}

// Gegenseitigkeitsprüfung: wenn A -> B, dann muss auch B -> A gelten.
let asymmetric = 0;
for (const entry of ALL_ENTRIES) {
  if (!entry.opp) continue;
  const partner = entryById.get(entry.opp);
  if (partner && partner.opp !== entry.id) {
    console.error(`WARNUNG: opposite_id ist nicht gegenseitig: "${entry.id}" -> "${entry.opp}", aber "${entry.opp}" -> "${partner.opp || '(kein Gegenstück)'}"`);
    asymmetric += 1;
  }
}

fs.writeFileSync(VOCAB_PATH, `${JSON.stringify(vocabulary, null, 2)}\n`, 'utf-8');
console.log(`Wörter auf volles Datenmodell angehoben: ${upgraded}`);
console.log(`opposite_id gesetzt: ${opposites}`);
console.log(`confusion_group gesetzt: ${confusionTags}`);
console.log(`homonym_group gesetzt/bestätigt: ${homonymTags}`);
if (missing > 0) console.log(`Nicht gefunden (bitte prüfen): ${missing}`);
if (asymmetric > 0) console.log(`Nicht-gegenseitige opposite_id-Paare (bitte prüfen): ${asymmetric}`);
if (strippedMismatch > 0) console.log(`Abweichungen zur bestehenden arabic_unvocalized (bitte prüfen): ${strippedMismatch}`);
