#!/usr/bin/env node
// Nachträglich (auf Nutzerwunsch, direkt im Anschluss an Entwicklungsauftrag 9) — schließt den in
// Entwicklungsauftrag 9, Abschnitt 3/7 dokumentierten "Batch 0"-Folgepunkt: erzeugt
// language-review/batch_00.json für die 141 ursprünglichen Bestandswörter (Lektionen 3/6/8, mit
// bereits vorhandener Audiodatei). Diese Wörter erfüllen bereits das volle "Vollständig"-
// Datenmodell (verifiziert: 0/141 fehlen irgendein Feld) — anders als bei Batch 1-4 wird hier also
// KEIN Datenmodell mehr angehoben, sondern nur ein Sprachprüfeintrag für bereits vollständige
// Angaben nachgeliefert, die bisher schlicht nie in eine language-review/*.json aufgenommen
// wurden (siehe Ursachenanalyse in Entwicklungsauftrag 9).
//
// Bewusst NICHT in audio_generation_manifest.json aufgenommen: dieses Manifest steuert die
// AUDIOERZEUGUNG neuer Wörter (status "needs_language_review" -> irgendwann "ready_for_
// generation" -> Audiodatei wird erzeugt). Die 141 Wörter hier haben bereits eine Audiodatei --
// sie brauchen keine neue Erzeugung, nur eine nachträgliche SPRACHPRÜFUNG der längst vorhandenen
// Angaben. Beides zu vermischen würde fälschlich suggerieren, für diese Wörter stehe noch eine
// Audioerzeugung aus.
//
// Kein theory_review-Array: die Sessions, in die diese 141 Wörter eingebettet sind, sind entweder
// bereits über die theory_review-Einträge der Batches 1-4 abgedeckt (Units 1-20) oder haben noch
// gar keine echte Theorie (Units 21-30, weiterhin is_placeholder) -- in beiden Fällen wäre ein
// zusätzlicher theory_review-Eintrag hier entweder doppelt oder verfrüht.
//
// Idempotent. Aufruf: node scripts/build-batch0-legacy-review.js

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');

const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');

const legacyWords = words
  .filter((w) => !w.id.startsWith('c1_') && fs.existsSync(path.join(AUDIO_DIR, `${w.id}.wav`)))
  .sort((a, b) => a.id.localeCompare(b.id));

const reviewEntries = legacyWords.map((w) => ({
  id: w.id,
  unit_id: w.unit_id || null,
  session_id: w.session_id || null,
  arabic_unvocalized: w.arabic_unvocalized,
  proposed_arabic_vocalized: w.arabic_vocalized || null,
  proposed_transliteration: w.transliteration || null,
  german_answers: w.german_answers,
  part_of_speech: w.part_of_speech || null,
  gender: ('gender' in w) ? w.gender : null,
  plural: ('plural' in w) ? w.plural : null,
  accepted_arabic_answers: w.accepted_arabic_answers || [],
  application_prompts: w.application_prompts || [],
  homonym_group: w.homonym_group || null,
  opposite_id: w.opposite_id || null,
  confusion_group: w.confusion_group || null,
  has_audio: true,
  notes: '',
  review_status: 'needs_language_review',
  review: {
    arabic_vocalization_reviewed: false,
    transliteration_reviewed: false,
    german_translation_reviewed: false,
    application_prompts_reviewed: false
  }
}));

// units_covered als Array (wie bei Batch 1-4), damit report:language-review/validateCourse.js
// dasselbe Format über alle Batches hinweg annehmen dürfen -- hier eben viele, nicht 5
// zusammenhängende Units, da diese Wörter über den ganzen Kurs verteilt eingebettet sind.
const unitsCovered = [...new Set(legacyWords.map((w) => w.unit_id).filter(Boolean))]
  .map((id) => parseInt(id.replace('vocab_unit_', ''), 10))
  .sort((a, b) => a - b);

const reviewDoc = {
  note: 'Sprachprüfdatei "Batch 0" für die 141 ursprünglichen Bestandswörter (Lektionen 3/6/8, VOR der Kurs-1-Erweiterung entstanden). Diese Wörter haben bereits eine echte, ausgelieferte Audiodatei UND erfüllen bereits das volle Datenmodell — sie wurden bisher aber nie in eine language-review/*.json aufgenommen, weil die Batch-Erzeugungsskripte (build-language-review-and-manifest.js) bislang nur neue "c1_"-Wort-IDs berücksichtigen (siehe Entwicklungsauftrag 9, Abschnitt 3/7). Eine vorhandene Audiodatei ist KEINE Sprachprüfung — content_status bleibt für alle diese Wörter "needs_language_review", bis eine Person mit Arabischkenntnissen sie tatsächlich geprüft hat. Anders als bei Batch 1-4 ist hier kein theory_review-Feld enthalten (siehe Kommentarkopf in build-batch0-legacy-review.js). units_covered ist hier ungewöhnlich lang, weil diese Wörter über den ganzen Kurs verteilt eingebettet sind (nicht 5 zusammenhängende Units wie bei Batch 1-4).',
  batch: 0,
  units_covered: unitsCovered,
  word_count: reviewEntries.length,
  entries: reviewEntries
};

fs.mkdirSync(path.join(ROOT, 'language-review'), { recursive: true });
writeJsonFileAtomic(path.join(ROOT, 'language-review', 'batch_00.json'), `${JSON.stringify(reviewDoc, null, 2)}\n`);

console.log(`language-review/batch_00.json: ${reviewEntries.length} Einträge geschrieben (ursprüngliche Bestandswörter mit vorhandener Audiodatei).`);
