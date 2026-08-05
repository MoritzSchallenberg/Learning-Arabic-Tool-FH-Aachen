#!/usr/bin/env node
// Kurs-Validator (Entwicklungsauftrag 3, Abschnitt 9/28: "npm run validate:course").
//
// Prüft den aktuellen Zustand von language-packs/arabic/ gegen zwei Arten von Kriterien:
// 1) HARTE Fehler (führen zu Exit-Code 1): kaputtes JSON, doppelte Vokabel-IDs, doppelte
//    arabische Grundformen innerhalb derselben Kategorie, fehlende Audiodatei für ein Wort, das
//    von einer Lesson referenziert wird, ungültige Kurs/Unit/Buchstaben-Querverweise.
// 2) Informative Hinweise (ändern den Exit-Code NICHT): noch fehlende Felder aus dem für
//    Meilenstein D/E geplanten erweiterten Datenmodell (unit_id, session_id, content_status,
//    audio_key, difficulty_level, plural, gender, root) — diese Felder existieren VOR der
//    Migration (Meilenstein D) noch nicht flächendeckend, das ist zu diesem Zeitpunkt erwartet
//    und kein Fehler. Ebenso: aktuelle Wortanzahl vs. Zielwert 900 (informativ, kein Fehler,
//    solange Meilenstein E nicht begonnen hat).
//
// Ziel: das Skript ist schon JETZT nutzbar (Akzeptanzkriterium "npm run validate:course
// funktioniert") und wird nach der Migration auf das erweiterte Schema strenger, ohne dass der
// Aufbau des Skripts sich grundlegend ändern muss.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK_DIR = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK_DIR, 'audio');

let hardErrors = 0;
let notes = 0;

function fail(msg) {
  hardErrors += 1;
  console.error(`FEHLER: ${msg}`);
}

function note(msg) {
  notes += 1;
  console.log(`Hinweis: ${msg}`);
}

function loadJson(relPath) {
  const filePath = path.join(PACK_DIR, relPath);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    fail(`${relPath} ist nicht lesbar oder kein gültiges JSON (${err.message})`);
    return null;
  }
}

console.log('=== Kurs-Validierung: language-packs/arabic/ ===\n');

const vocabulary = loadJson('vocabulary.json');
const keyboard = loadJson('keyboard.json');
const courses = loadJson('courses.json');
const lessons = loadJson('lessons.json');

if (!vocabulary || !keyboard || !courses || !lessons) {
  console.error('\nKonnte Basisdateien nicht laden — breche ab.');
  process.exit(1);
}

// --- Vokabular: IDs, Duplikate, erwartete Felder, Audio ------------------------------------
const words = vocabulary.categories.flatMap((c) => c.words.map((w) => ({ ...w, categoryId: c.id })));
console.log(`--- Vokabular: ${words.length} Einträge über ${vocabulary.categories.length} Kategorien ---`);

const idCounts = new Map();
for (const w of words) idCounts.set(w.id, (idCounts.get(w.id) || 0) + 1);
const duplicateIds = [...idCounts.entries()].filter(([, n]) => n > 1);
if (duplicateIds.length > 0) {
  for (const [id, n] of duplicateIds) fail(`Vokabel-ID "${id}" kommt ${n}-mal vor`);
} else {
  console.log('OK: keine doppelten Vokabel-IDs.');
}

const arabicByCategory = new Map();
for (const w of words) {
  const key = `${w.categoryId}::${w.arabic}`;
  arabicByCategory.set(key, (arabicByCategory.get(key) || 0) + 1);
}
const duplicateArabic = [...arabicByCategory.entries()].filter(([, n]) => n > 1);
for (const [key, n] of duplicateArabic) fail(`Arabische Form "${key.split('::')[1]}" kommt ${n}-mal in Kategorie "${key.split('::')[0]}" vor`);

let missingAudio = 0;
let missingSlowAudio = 0;
for (const w of words) {
  const normalPath = path.join(AUDIO_DIR, 'vocabulary', `${w.id}.wav`);
  const slowPath = path.join(AUDIO_DIR, 'vocabulary', `${w.id}_slow.wav`);
  if (!fs.existsSync(normalPath)) {
    fail(`Fehlende Audiodatei für Vokabel "${w.id}": ${path.relative(ROOT, normalPath)}`);
    missingAudio += 1;
  }
  if (!fs.existsSync(slowPath)) missingSlowAudio += 1; // informativ, siehe Meilenstein F
}
if (missingAudio === 0) console.log('OK: jede Vokabel hat eine normale Audiodatei.');
if (missingSlowAudio > 0) {
  note(`${missingSlowAudio} Vokabeln haben (noch) keine separate *_slow.wav — Fallback über Wiedergabegeschwindigkeit ist Teil von Meilenstein F, noch nicht umgesetzt.`);
}

// --- Erweitertes Datenmodell (Meilenstein D/E) — informativ, kein Fehler vor der Migration ---
const EXTENDED_FIELDS = ['unit_id', 'session_id', 'content_status', 'audio_key', 'difficulty_level'];
const missingExtendedByField = {};
for (const field of EXTENDED_FIELDS) {
  missingExtendedByField[field] = words.filter((w) => !(field in w)).length;
}
const allMissingExtended = EXTENDED_FIELDS.every((f) => missingExtendedByField[f] === words.length);
if (allMissingExtended) {
  note(`Erweitertes Datenmodell (unit_id/session_id/content_status/audio_key/difficulty_level) noch nicht migriert (${words.length}/${words.length} Wörter) — geplant für Meilenstein D, hier noch nicht begonnen.`);
} else {
  for (const field of EXTENDED_FIELDS) {
    const n = missingExtendedByField[field];
    if (n > 0) note(`${n} von ${words.length} Wörtern ohne Feld "${field}".`);
  }
}

const missingPlural = words.filter((w) => w.part_of_speech === 'Substantiv' && !w.plural).length;
if (missingPlural > 0) note(`${missingPlural} Substantive ohne Pluralform.`);
const missingGender = words.filter((w) => w.part_of_speech === 'Substantiv' && !w.gender).length;
if (missingGender > 0) note(`${missingGender} Substantive ohne Genusangabe.`);

console.log(`\nWortanzahl: ${words.length} / Zielwert 900 (Meilenstein E, noch nicht begonnen — kein Fehler).`);

// --- Buchstaben-Querverweise (courses.json <-> keyboard.json) -------------------------------
console.log('\n--- Buchstaben-Querverweise ---');
const allLetterIds = new Set(keyboard.letters.map((l) => l.id));
const course1 = courses.courses.find((c) => c.id === 'course_1');
if (course1) {
  const letterGroupUnits = course1.units.filter((u) => u.type === 'letter_group');
  const referenced = new Map();
  for (const unit of letterGroupUnits) {
    for (const letterId of unit.letters) {
      if (!allLetterIds.has(letterId)) fail(`Unit "${unit.id}" referenziert unbekannten Buchstaben "${letterId}"`);
      referenced.set(letterId, (referenced.get(letterId) || 0) + 1);
    }
  }
  const missingLetters = [...allLetterIds].filter((id) => !referenced.has(id));
  const duplicatedLetters = [...referenced.entries()].filter(([, n]) => n > 1);
  if (missingLetters.length > 0) fail(`Buchstaben ohne Unit-Zuordnung: ${missingLetters.join(', ')}`);
  if (duplicatedLetters.length > 0) {
    for (const [id, n] of duplicatedLetters) fail(`Buchstabe "${id}" ist ${n} Units zugeordnet (erwartet: genau 1)`);
  }
  if (missingLetters.length === 0 && duplicatedLetters.length === 0) {
    console.log(`OK: alle ${allLetterIds.size} Buchstaben genau einer Unit zugeordnet.`);
  }
} else {
  fail('courses.json enthält keinen Kurs mit id "course_1"');
}

// --- lessons.json <-> Kurs-Schlüssel ---------------------------------------------------------
console.log('\n--- lessons.json-Registry ---');
const lessonKeys = new Set(lessons.lessons.map((l) => l.key));
const missingKeys = [];
for (const course of courses.courses) {
  for (const unit of course.units) {
    const key = unit.type === 'existing_lesson_group' ? unit.lesson_keys[0]
      : unit.type === 'existing_lesson' ? unit.lesson_key
      : unit.id;
    if (!lessonKeys.has(key)) missingKeys.push(key);
  }
}
if (missingKeys.length > 0) {
  for (const key of missingKeys) fail(`Von courses.json referenzierter Schlüssel "${key}" fehlt in lessons.json`);
} else {
  console.log('OK: alle in courses.json referenzierten Schlüssel existieren in lessons.json.');
}

// --- Zusammenfassung -------------------------------------------------------------------------
console.log('\n=== Zusammenfassung ===');
console.log(`${hardErrors} Fehler, ${notes} Hinweise.`);
if (hardErrors > 0) {
  console.error('\nValidierung FEHLGESCHLAGEN.');
  process.exit(1);
} else {
  console.log('\nValidierung OK (Hinweise betreffen geplante, noch nicht begonnene Meilensteine).');
}
