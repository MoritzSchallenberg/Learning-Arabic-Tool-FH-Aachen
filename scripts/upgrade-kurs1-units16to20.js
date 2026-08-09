#!/usr/bin/env node
// Entwicklungsauftrag 9 — hebt die 134 neuen Wörter der Units 16-20 vom Minimalmodell auf das
// volle Datenmodell an: findet die bereits bestehenden Wort-Objekte anhand ihrer ID (keine neuen
// IDs, keine neuen Kategorien) und ergänzt/überschreibt die inhaltlichen Felder aus
// scripts/data/kurs1Units16to20Full.js. Die bereits vollständigen Wörter (1 in Unit 16, 5 in
// Unit 17, 2 in Unit 18, 0 in Unit 19, 8 in Unit 20 — insgesamt 16, z. B. verb_live, verb_go,
// verb_study, place_city) werden NICHT angefasst, weil sie schlicht nicht in ALL_ENTRIES
// vorkommen.
//
// application_prompts bekommen sowohl expected_word_id (die eigene ID) als auch expected_meaning:
// die tatsächliche Anwendungsübung (renderContextualChoice in exerciseRegistry.js) wertet
// Korrektheit über "die angeklickte Option ist dasselbe Wortobjekt wie das gefragte" aus, nicht
// über einen Vergleich mit dem Prompt-Feld selbst — die einzige Wort-ID, die für dieses Wort
// tatsächlich "erwartet" wird, ist deshalb seine eigene. expected_meaning bleibt zusätzlich
// gesetzt für Sprachprüfung/Anzeige und Abwärtskompatibilität mit der bisherigen Konvention.
//
// Wie upgrade-kurs1-units11to15.js setzt dieses Skript zusätzlich opposite_id (gegenseitig) und
// confusion_group (selektiv). Idempotent.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const VOCAB_PATH = path.join(PACK, 'vocabulary.json');

const { UNIT_16, UNIT_17, UNIT_18, UNIT_19, UNIT_20 } = require('./data/kurs1Units16to20Full.js');
const ALL_ENTRIES = [...UNIT_16, ...UNIT_17, ...UNIT_18, ...UNIT_19, ...UNIT_20];

// Diakritika-Bereiche als Hex-Codepoints statt \uXXXX-Escapes im Quelltext bzw. roher
// combining-mark-Zeichen definiert -- ein Editier-/Tooling-Schritt kann \uXXXX-Escapes beim
// Speichern in echte Zeichen umwandeln; über String.fromCodePoint aus Zahlen aufgebaut bleibt die
// Zeichenklasse eindeutig nachvollziehbar und unveränderlich. Siehe auch den Bugfix-Hinweis in
// build-kurs1-batch.js (eine falsch kopierte Zeichenklasse strippte dort einmal ganze Woerter
// auf '').
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
let strippedMismatch = 0;
for (const entry of ALL_ENTRIES) {
  const w = byId.get(entry.id);
  if (!w) { console.error(`WARNUNG: Wort-ID "${entry.id}" nicht in vocabulary.json gefunden — übersprungen.`); missing += 1; continue; }

  const strippedNew = stripDiacritics(entry.ar);
  // Die unvokalisierte Grundform darf sich durch dieses Skript NICHT ändern (Auftrag 9, Abschnitt
  // 2: "Bereits vorhandene ... korrekte Inhalte dürfen nicht unnötig ersetzt werden") — wenn schon
  // eine arabic_unvocalized-Angabe existiert, muss die neu vokalisierte Form exakt dazu strippen.
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
  if (entry.homonymGroup) w.homonym_group = entry.homonymGroup;

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
if (missing > 0) console.log(`Nicht gefunden (bitte prüfen): ${missing}`);
if (asymmetric > 0) console.log(`Nicht-gegenseitige opposite_id-Paare (bitte prüfen): ${asymmetric}`);
if (strippedMismatch > 0) console.log(`Abweichungen zur bestehenden arabic_unvocalized (bitte prüfen): ${strippedMismatch}`);
