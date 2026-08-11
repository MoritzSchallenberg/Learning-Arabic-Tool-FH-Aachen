#!/usr/bin/env node
// Entwicklungsauftrag 16, Abschnitt 4/5/18 — ersetzt in allen 90 Sessions das alte, sechs
// technische Phasentypen umfassende Ablaufmodell (theory, word_preview, recognition,
// reconstruction, guided_production, independent_production, application, summary) durch das
// endgültige, sieben Phasentypen umfassende Modell:
//   theory, word_preview, recognition, matching, guided_writing, independent_writing, summary
// Die früheren sichtbaren Phasen 'reconstruction'/'guided_production'/'independent_production'/
// 'application' verschwinden als eigene Hauptstufen -- ihre Aufgabentypen leben als
// Unteraufgaben von 'guided_writing' (order_pieces+guided_typing) bzw. als Zuordnungsvariante
// von 'matching' (vormals contextual_choice/application) weiter (Abschnitt 3, Tabelle).
//
// completion_rules.required_phases wird informativ auf das neue Modell aktualisiert (die
// eigentliche Abschlusslogik prüft in sessionEngine.js#checkCompletion() zusätzlich direkt die
// Wort-Abdeckung je Stufe, nicht nur diese Liste -- siehe Abschnitt 10.4).
//
// Rührt AUSSCHLIESSLICH vocabSessions.json an -- vocabulary.json/theory.json/Audiodateien
// bleiben unverändert (Abschnitt 21). Idempotent: ein zweiter Lauf ohne zwischenzeitliche
// Änderungen verändert die Datei nicht (byte-identischer Vergleich in
// test/unit/upgradeSessionPhasesV16.test.js).

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = process.env.COURSE_UPGRADE_ROOT || path.join(__dirname, '..');
const VOCAB_SESSIONS_PATH = path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json');

const NEW_PHASES = [
  { type: 'theory', required_first_time: true },
  { type: 'word_preview' },
  { type: 'recognition' },
  { type: 'matching' },
  { type: 'guided_writing' },
  { type: 'independent_writing' },
  { type: 'summary' }
];

const NEW_REQUIRED_PHASES = ['theory', 'word_preview', 'recognition', 'matching', 'guided_writing', 'independent_writing'];

function phasesAreCurrent(phases) {
  if (!Array.isArray(phases) || phases.length !== NEW_PHASES.length) return false;
  return phases.every((p, i) => p && p.type === NEW_PHASES[i].type
    && Boolean(p.required_first_time) === Boolean(NEW_PHASES[i].required_first_time));
}

function main() {
  const vocabSessions = JSON.parse(fs.readFileSync(VOCAB_SESSIONS_PATH, 'utf-8'));
  const before = JSON.stringify(vocabSessions);

  let changedSessions = 0;
  for (const session of vocabSessions.sessions) {
    if (!phasesAreCurrent(session.phases)) {
      session.phases = NEW_PHASES.map((p) => ({ ...p }));
      changedSessions += 1;
    }
    const rules = session.completion_rules || {};
    session.completion_rules = {
      minimum_score: typeof rules.minimum_score === 'number' ? rules.minimum_score : 0.75,
      all_words_exposed: rules.all_words_exposed !== false,
      required_phases: NEW_REQUIRED_PHASES
    };
  }

  const after = JSON.stringify(vocabSessions);
  if (after === before) {
    console.log('vocabSessions.json bereits auf dem neuen Phasenmodell -- keine Änderung (idempotent).');
    return;
  }

  writeJsonFileAtomic(VOCAB_SESSIONS_PATH, `${JSON.stringify(vocabSessions, null, 2)}\n`);
  console.log(`vocabSessions.json aktualisiert: ${changedSessions} / ${vocabSessions.sessions.length} Sessions bekamen das neue Phasenmodell, alle ${vocabSessions.sessions.length} completion_rules aktualisiert.`);
}

main();
