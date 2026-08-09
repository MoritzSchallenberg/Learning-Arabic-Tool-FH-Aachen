#!/usr/bin/env node
// Entwicklungsauftrag 6 — Meilenstein 1 + 2 + (Datenanteil von) Meilenstein 3.
//
// Dieses Skript ist die mechanische Umsetzung des Wortplans (siehe scripts/data/*.js):
//   1) migriert alle 141 bestehenden Vokabeln auf das erweiterte Datenmodell
//      (arabic_vocalized/arabic_unvocalized/german_answers/accepted_arabic_answers/
//       application_prompts/content_status/unit_id/session_id/audio_key/difficulty_level),
//   2) legt für alle 30 Units neue Vokabel-Kategorien an (Units 1-5 mit vollständigem Modell,
//      Units 6-30 zunächst mit den für Meilenstein 2 geforderten Minimalfeldern),
//   3) baut vocabSessions.json komplett neu auf (30 Units, 90 Sessions, je 10 Wörter),
//   4) legt für jede Session ohne bestehendes Theoriedokument einen Platzhalter in theory.json an
//      (content_status "needs_language_review"), damit validate:course nicht wegen fehlender
//      Theorie hart fehlschlägt — die echten 15 Theoriedokumente für Units 1-5 werden danach von
//      Hand ergänzt (siehe theory.json, Abschnitt "Batch 1").
//
// Idempotent: mehrfaches Ausführen überschreibt keine bereits vorhandenen, handgepflegten Felder
// der ursprünglichen 25 migrierten Wörter (application_prompts etc. werden nur ERGÄNZT, nicht
// ersetzt), reproduziert aber deterministisch dieselbe Unit-/Session-Struktur.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');

const { UNIT_TITLES, UNIT_EXISTING_WORD_IDS } = require('./data/kurs1UnitPlan.js');
const FULL_UNITS = require('./data/kurs1Units1to5.js');
const STUB_UNITS = require('./data/kurs1Units6to30.js');

const NEW_WORDS_BY_UNIT = {
  1: FULL_UNITS.UNIT_1, 2: FULL_UNITS.UNIT_2, 3: FULL_UNITS.UNIT_3, 4: FULL_UNITS.UNIT_4, 5: FULL_UNITS.UNIT_5,
  6: STUB_UNITS.UNIT_6, 7: STUB_UNITS.UNIT_7, 8: STUB_UNITS.UNIT_8, 9: STUB_UNITS.UNIT_9, 10: STUB_UNITS.UNIT_10,
  11: STUB_UNITS.UNIT_11, 12: STUB_UNITS.UNIT_12, 13: STUB_UNITS.UNIT_13, 14: STUB_UNITS.UNIT_14, 15: STUB_UNITS.UNIT_15,
  16: STUB_UNITS.UNIT_16, 17: STUB_UNITS.UNIT_17, 18: STUB_UNITS.UNIT_18, 19: STUB_UNITS.UNIT_19, 20: STUB_UNITS.UNIT_20,
  21: STUB_UNITS.UNIT_21, 22: STUB_UNITS.UNIT_22, 23: STUB_UNITS.UNIT_23, 24: STUB_UNITS.UNIT_24, 25: STUB_UNITS.UNIT_25,
  26: STUB_UNITS.UNIT_26, 27: STUB_UNITS.UNIT_27, 28: STUB_UNITS.UNIT_28, 29: STUB_UNITS.UNIT_29, 30: STUB_UNITS.UNIT_30
};
const FULL_UNIT_NUMBERS = new Set([1, 2, 3, 4, 5]);

function pad2(n) { return String(n).padStart(2, '0'); }
function unitId(n) { return `vocab_unit_${pad2(n)}`; }

function stripDiacritics(text) {
  // Arabische Tashkil-Zeichen (Fatha/Damma/Kasra/Sukun/Shadda/Tanwin/Hamza-Traeger-Zeichen
  // etc.) plus Tatweel entfernen -- ergibt die unvokalisierte Konsonantenskelett-Form.
  // Bewusst ueber numerische \uXXXX-Escapes statt roher combining-mark-Zeichen im Quelltext
  // (Letztere liessen sich beim Editieren/Kopieren leicht verfaelschen, siehe Bugfix waehrend
  // der Entwicklung: eine falsch kopierte Zeichenklasse strippte ganze Woerter auf '').
  return text.replace(/[\u064B-\u0652\u0653-\u0655\u0656-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
}

function chunk10(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 10) out.push(ids.slice(i, i + 10));
  return out;
}

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(PACK, name), 'utf-8'));
}
function saveJson(name, data) {
  fs.writeFileSync(path.join(PACK, name), `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

// --- 1) Unit-/Session-Struktur berechnen (rein aus IDs, nicht aus Textinhalten) -------------
const unitSessionPlan = {}; // unitNumber -> { unitId, sessionIds: [...], wordToSession: Map }
const wordUnitSession = new Map(); // wordId -> { unitId, sessionId }

for (let n = 1; n <= 30; n += 1) {
  const existingIds = UNIT_EXISTING_WORD_IDS[n] || [];
  const newIds = NEW_WORDS_BY_UNIT[n].map((w) => w.id);
  const allIds = existingIds.concat(newIds);
  const chunks = chunk10(allIds);
  const uId = unitId(n);
  const letters = ['a', 'b', 'c'];
  const sessionIds = chunks.map((_, i) => `${uId}_${letters[i]}`);
  unitSessionPlan[n] = { unitId: uId, sessionIds, chunks };
  chunks.forEach((wordIds, i) => {
    for (const wid of wordIds) wordUnitSession.set(wid, { unitId: uId, sessionId: `${uId}_${letters[i]}` });
  });
}

// --- 2) vocabulary.json: bestehende 141 Wörter migrieren + neue Kategorien anlegen ----------
const vocabulary = loadJson('vocabulary.json');

const PROMPT_TEMPLATES = {
  numbers: (w) => `Du zählst und kommst zur Zahl "${w.german}".`,
  colors: (w) => `Du beschreibst die Farbe eines Gegenstands: ${w.german}.`,
  food_drink: (w) => `Das steht auf dem Tisch beim Essen: ${w.german}.`,
  clothing: (w) => `Du ziehst dieses Kleidungsstück an: ${w.german}.`,
  body: (w) => `Du zeigst auf diesen Körperteil: ${w.german}.`,
  weather: (w) => `So beschreibst du das Wetter heute: ${w.german}.`,
  times_of_day: (w) => `Diese Tageszeit ist gerade: ${w.german}.`,
  university: (w) => `Das gehört zum Unileben: ${w.german}.`,
  technology: (w) => `Das benutzt du am Computer: ${w.german}.`,
  animals: (w) => `Dieses Tier siehst du im Zoo oder auf dem Land: ${w.german}.`,
  places: (w) => `Dorthin gehst du in der Stadt: ${w.german}.`,
  question_words: (w) => `Damit beginnst du eine Frage: ${w.german}.`,
  simple_verbs: (w) => `Das machst du gerade: ${w.german}.`,
  professions: (w) => `Diesen Beruf übt die Person aus: ${w.german}.`,
  transportation: (w) => `Damit fährst du von A nach B: ${w.german}.`,
  shopping: (w) => `Das brauchst du beim Einkaufen: ${w.german}.`,
  leisure: (w) => `Das machst du in deiner Freizeit: ${w.german}.`,
  school_items: (w) => `Das hast du in deiner Schultasche: ${w.german}.`
};

let migratedCount = 0;
for (const cat of vocabulary.categories) {
  for (const w of cat.words) {
    let touched = false;
    if (!w.arabic_vocalized) { w.arabic_vocalized = w.arabic; touched = true; }
    if (!w.arabic_unvocalized) { w.arabic_unvocalized = stripDiacritics(w.arabic); touched = true; }
    if (!Array.isArray(w.german_answers) || w.german_answers.length === 0) {
      w.german_answers = w.german.split(' / ').map((s) => s.trim());
      touched = true;
    }
    if (!Array.isArray(w.accepted_arabic_answers) || w.accepted_arabic_answers.length === 0) {
      w.accepted_arabic_answers = [w.arabic];
      touched = true;
    }
    if (!Array.isArray(w.application_prompts) || w.application_prompts.length === 0) {
      const tmpl = PROMPT_TEMPLATES[cat.id];
      const prompt = tmpl ? tmpl(w) : `Das ist ein Beispiel für "${w.german}".`;
      w.application_prompts = [{ type: 'context_choice', prompt, expected_meaning: w.german }];
      touched = true;
    }
    if (!w.content_status) { w.content_status = 'needs_language_review'; touched = true; }
    if (!w.audio_key) { w.audio_key = `vocabulary/${w.id}`; touched = true; }
    if (w.difficulty_level === undefined) { w.difficulty_level = 1; touched = true; }
    const place = wordUnitSession.get(w.id);
    if (place) {
      w.unit_id = place.unitId;
      w.session_id = place.sessionId;
    }
    if (touched) migratedCount += 1;
  }
}

// --- Neue Kategorien für alle 30 Units anlegen (falls noch nicht vorhanden) -----------------
const existingCategoryIds = new Set(vocabulary.categories.map((c) => c.id));
let newCategoriesAdded = 0;
let newWordsAdded = 0;
for (let n = 1; n <= 30; n += 1) {
  const catId = `c1_unit_${pad2(n)}`;
  if (existingCategoryIds.has(catId)) continue; // idempotent
  const uId = unitId(n);
  const isFull = FULL_UNIT_NUMBERS.has(n);
  const words = NEW_WORDS_BY_UNIT[n].map((entry) => {
    const place = wordUnitSession.get(entry.id);
    const base = {
      id: entry.id,
      arabic: entry.ar,
      german: entry.de[0],
      content_status: 'needs_language_review',
      unit_id: place ? place.unitId : uId,
      session_id: place ? place.sessionId : null,
      audio_key: `vocabulary/${entry.id}`,
      audio_status: 'missing',
      difficulty_level: 1,
      german_answers: entry.de,
      arabic_unvocalized: stripDiacritics(entry.ar)
    };
    if (isFull) {
      base.transliteration = entry.tr;
      base.part_of_speech = entry.pos;
      base.gender = entry.g;
      base.plural = entry.pl;
      base.arabic_vocalized = entry.ar;
      base.accepted_arabic_answers = [entry.ar, stripDiacritics(entry.ar)].filter((v, i, arr) => arr.indexOf(v) === i);
      base.application_prompts = [{ type: 'context_choice', prompt: entry.app, expected_meaning: entry.de[0] }];
    }
    newWordsAdded += 1;
    return base;
  });
  vocabulary.categories.push({
    id: catId,
    title: UNIT_TITLES[n],
    lesson: n <= 15 ? 3 : 6,
    words
  });
  newCategoriesAdded += 1;
}

saveJson('vocabulary.json', vocabulary);

// --- 3) vocabSessions.json komplett neu aufbauen --------------------------------------------
const PHASES = [
  { type: 'theory', required_first_time: true },
  { type: 'word_preview' },
  { type: 'recognition' },
  { type: 'reconstruction' },
  { type: 'guided_production' },
  { type: 'independent_production' },
  { type: 'application' },
  { type: 'summary' }
];
const COMPLETION_RULES = {
  minimum_score: 0.75,
  all_words_exposed: true,
  required_phases: ['theory', 'word_preview', 'recognition', 'independent_production']
};

const vocab_units = [];
const sessions = [];
for (let n = 1; n <= 30; n += 1) {
  const plan = unitSessionPlan[n];
  vocab_units.push({
    id: plan.unitId,
    title: UNIT_TITLES[n],
    description: `30 Wörter zum Thema „${UNIT_TITLES[n]}“, aufgeteilt in drei Sessions zu je 10 Wörtern.`,
    session_ids: plan.sessionIds
  });
  plan.chunks.forEach((wordIds, i) => {
    const sessionId = plan.sessionIds[i];
    sessions.push({
      session_id: sessionId,
      unit_id: plan.unitId,
      title: UNIT_TITLES[n],
      description: `Lerne ${wordIds.length} Wörter zum Thema „${UNIT_TITLES[n]}“.`,
      estimated_minutes: 10,
      theory_id: `theory_${sessionId}`,
      new_word_ids: wordIds,
      review_count: 5,
      phases: PHASES,
      completion_rules: COMPLETION_RULES
    });
  });
}

const vocabSessions = { vocab_units, sessions };
saveJson('vocabSessions.json', vocabSessions);

// --- 4) Platzhalter-Theorie für Sessions ohne bestehendes Dokument anlegen -------------------
const theoryData = loadJson('theory.json');
const existingTheoryIds = new Set(theoryData.theories.map((t) => t.theory_id));
let stubTheoryAdded = 0;
for (const session of sessions) {
  if (existingTheoryIds.has(session.theory_id)) continue;
  theoryData.theories.push({
    theory_id: session.theory_id,
    title: session.title,
    content_status: 'needs_language_review',
    // Entwicklungsauftrag 7, Abschnitt 6/29: maschinenlesbares Flag statt reinem Text-Matching,
    // damit der Validator "echte" von "Platzhalter"-Theorie unterscheiden kann. Wird beim
    // Ersetzen durch echte Theorie (siehe scripts/apply-kurs1-theory-batch*.js) nicht gesetzt.
    is_placeholder: true,
    learning_objectives: [`Die ${session.new_word_ids.length} neuen Wörter dieser Session erkennen und anwenden können.`],
    blocks: [
      {
        type: 'paragraph',
        text: `Diese Theorieseite ist ein Platzhalter und wird in einem späteren Arbeitsschritt (Entwicklungsauftrag 6, weitere Batches) durch eine vollständige, auf die ${session.new_word_ids.length} Wörter dieser Session zugeschnittene Erklärung ersetzt.`
      },
      { type: 'word_preview', word_ids: session.new_word_ids }
    ]
  });
  existingTheoryIds.add(session.theory_id);
  stubTheoryAdded += 1;
}
saveJson('theory.json', theoryData);

console.log('--- Kurs 1 Batch-Aufbau abgeschlossen ---');
console.log(`Bestehende Wörter migriert/aktualisiert: ${migratedCount} / 141`);
console.log(`Neue Kategorien angelegt: ${newCategoriesAdded} (0 bedeutet: bereits vorhanden, Skript ist idempotent)`);
console.log(`Neue Wörter hinzugefügt: ${newWordsAdded}`);
console.log(`Vokabel-Units: ${vocab_units.length}, Sessions: ${sessions.length}`);
console.log(`Neue Platzhalter-Theoriedokumente angelegt: ${stubTheoryAdded}`);
