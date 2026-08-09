#!/usr/bin/env node
// Entwicklungsauftrag 11, Abschnitt 7 — Einmalkorrektur für 12 ältere application_prompts (10
// ursprüngliche Bestandswörter aus Lektionen 3/6/8 + 2 frühe Batch-1-Wörter), deren
// "expected_meaning" nicht exakt einer akzeptierten deutschen Antwort (german_answers) des
// Besitzerwortes entsprach — z. B. "Professor / Lehrer" statt exakt "Professor". Diese Prompts
// wurden ursprünglich mit dem inzwischen abgelösten Singularfeld `word.german` erzeugt (siehe
// scripts/build-kurs1-batch.js, ältere Version), das teils eine zusammenfassende Formulierung
// statt des exakten ersten german_answers-Eintrags enthielt.
//
// scripts/validateCourse.js prüft seit Entwicklungsauftrag 11 hart, dass expected_meaning exakt
// einer akzeptierten deutschen Antwort des Besitzerwortes entspricht — dieses Skript behebt die
// dadurch aufgedeckten 12 Fälle. Es handelt sich um eine reine Metadaten-Korrektur
// (application_prompts.expected_meaning + der Wortlaut am Satzende des zugehörigen prompt-Texts),
// NICHT um eine sprachliche Neuinterpretation des Wortes selbst — arabic_vocalized/
// transliteration/german_answers bleiben unangetastet. Jede Korrektur ist unten einzeln
// dokumentiert (Auftrag Abschnitt 3, Regel 15: "Notwendige Korrekturen einzeln dokumentieren").
//
// Idempotent (wendet dieselbe Korrektur erneut an, falls das Skript mehrfach läuft).

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const VOCAB_PATH = path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json');

// [id, alter (falscher) expected_meaning-Text, neuer (korrekter) Text = exakter
// german_answers-Eintrag des Besitzerwortes]
const FIXES = [
  ['time_morning', 'Morgen', 'Morgen (Tageszeit)'],
  ['uni_professor', 'Professor / Lehrer', 'Professor'],
  ['place_street', 'Straße', 'Straße (in der Stadt)'],
  ['q_howmany', 'wie viel / wie viele', 'wie viel'],
  ['verb_go', 'gehen', 'gehen (sich begeben, allgemein)'],
  ['verb_study', 'lernen / studieren', 'lernen (studieren, ein Fach)'],
  ['shop_store', 'Laden / Geschäft', 'Laden'],
  ['shop_bag', 'Tüte / Beutel', 'Tüte'],
  ['leisure_game', 'Spiel', 'Spiel (allgemein)'],
  ['school_bag', 'Tasche / Rucksack', 'Tasche'],
  ['c1_u01_04', 'Gut', 'Mir geht es gut'],
  ['c1_u03_14', 'Decke', 'Decke (Zimmerdecke)']
];

const vocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const byId = new Map(words.map((w) => [w.id, w]));

let fixed = 0;
for (const [id, oldText, newText] of FIXES) {
  const w = byId.get(id);
  if (!w) { console.error(`WARNUNG: Wort-ID "${id}" nicht gefunden — übersprungen.`); continue; }
  if (!Array.isArray(w.german_answers) || !w.german_answers.includes(newText)) {
    console.error(`WARNUNG: "${id}" — Zielwert "${newText}" ist keine akzeptierte Antwort in german_answers (${JSON.stringify(w.german_answers)}). Übersprungen.`);
    continue;
  }
  for (const p of w.application_prompts || []) {
    if (p.expected_meaning === oldText) {
      p.expected_meaning = newText;
      if (p.prompt && p.prompt.endsWith(`${oldText}.`)) {
        p.prompt = `${p.prompt.slice(0, -(oldText.length + 1))}${newText}.`;
      }
      fixed += 1;
    } else if (p.expected_meaning === newText) {
      // Bereits korrigiert (idempotenter zweiter Lauf) — nichts zu tun.
    }
  }
}

writeJsonFileAtomic(VOCAB_PATH, `${JSON.stringify(vocabulary, null, 2)}\n`);
console.log(`application_prompts korrigiert: ${fixed} von ${FIXES.length} vorgesehenen Fällen.`);
