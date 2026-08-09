#!/usr/bin/env node
// Kurs-Validator (Entwicklungsauftrag 3, Abschnitt 9/28: "npm run validate:course"; erweitert in
// Entwicklungsauftrag 6 und grundlegend präzisiert in Entwicklungsauftrag 7, Abschnitt 6/7/20/29).
//
// Prüft den aktuellen Zustand von language-packs/arabic/ gegen zwei Arten von Kriterien:
// 1) HARTE Fehler (führen zu Exit-Code 1): kaputtes JSON, doppelte Vokabel-IDs, doppelte
//    arabische Grundformen innerhalb derselben Kategorie, fehlende Audiodatei für ein bereits
//    sprachlich geprüftes Wort, ungültige Kurs/Unit/Buchstaben-Querverweise, strukturell
//    ungültige Felder (z. B. leeres german_answers-Array).
// 2) Informative Hinweise (ändern den Exit-Code NICHT): Inhalts-Vollständigkeitsgrad (siehe
//    Drei-Stufen-Modell unten), noch fehlende Sprachprüfung, noch fehlende Theorie für einzelne
//    Sessions/Schrift-Units — all das ist zu erwarten, solange Kurs 1 in Batches ausgebaut wird,
//    und soll sichtbar, aber nicht blockierend sein.
//
// Drei-Stufen-Datenmodell (Entwicklungsauftrag 7, Abschnitt 6) — ersetzt die frühere pauschale
// "erweitertes Modell: X/900"-Meldung, die zu optimistisch war (zählte ein Wort schon bei EINEM
// vorhandenen Zusatzfeld mit):
//   Minimal:    id, arabic_unvocalized, german_answers, unit_id, session_id, content_status
//   Lernfähig:  zusätzlich arabic_vocalized, transliteration, part_of_speech,
//               accepted_arabic_answers
//   Vollständig: zusätzlich die Felder gender/plural (auch wenn explizit null, weil für die
//               Wortart nicht zutreffend — das Vorhandensein des Feldes zeigt "geprüft", ein
//               komplett fehlendes Feld zeigt "noch nicht bearbeitet") sowie mindestens ein
//               application_prompt.

const fs = require('fs');
const path = require('path');

// COURSE_VALIDATE_ROOT-Override (Entwicklungsauftrag 11): erlaubt Tests, den Validator gegen eine
// isolierte, temporäre Kopie der Sprachpaketdateien laufen zu lassen, statt die echten,
// gemeinsam genutzten Dateien im Repository zu mutieren -- verhindert eine Race Condition mit
// anderen, nebenläufig laufenden Testdateien, die dieselben Dateien lesen (node --test führt
// mehrere Testdateien standardmäßig parallel aus). Ohne die Umgebungsvariable unverändertes
// Verhalten (echter Projekt-Root).
const ROOT = process.env.COURSE_VALIDATE_ROOT || path.join(__dirname, '..');
const PACK_DIR = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK_DIR, 'audio');
const LANGUAGE_REVIEW_DIR = path.join(ROOT, 'language-review');

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
const vocabSessions = loadJson('vocabSessions.json');
const theoryData = loadJson('theory.json');

if (!vocabulary || !keyboard || !courses || !lessons || !vocabSessions || !theoryData) {
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

// Exakte vokalisierte Schreibweise doppelt in derselben Kategorie = fast immer ein Copy-Paste-
// Fehler -> harter Fehler (unverändert seit Entwicklungsauftrag 3).
const arabicByCategory = new Map();
for (const w of words) {
  const key = `${w.categoryId}::${w.arabic}`;
  arabicByCategory.set(key, (arabicByCategory.get(key) || 0) + 1);
}
const duplicateArabic = [...arabicByCategory.entries()].filter(([, n]) => n > 1);
for (const [key, n] of duplicateArabic) fail(`Arabische Form "${key.split('::')[1]}" kommt ${n}-mal in Kategorie "${key.split('::')[0]}" vor`);

// Entwicklungsauftrag 9, Abschnitt 2 Punkt 8: keine Arabic-Presentation-Forms-Codepoints
// (U+FB50-FDFF, U+FE70-FEFF -- kontextabhängig vorgerenderte Glyphenformen, z. B. aus falsch
// kopiertem PDF-Text) dürfen in arabischen Feldern landen. Sie sehen in manchen Editoren identisch
// zu normalen Grundbuchstaben aus, sind für die Anwendung (Unicode-Bidi/Shaping durch Chromium,
// siehe Architekturabschnitt README) aber falsch -- Verbindungstrainer/Tastaturabgleich erwarten
// ausschließlich normale Unicode-Grundbuchstaben. Bereich per Zahlen (nicht \uXXXX-Escapes oder
// rohe Zeichen im Quelltext) aufgebaut -- siehe Bugfix-Hinweis zur Diakritika-Regex weiter unten
// im Kommentarverlauf dieses Projekts (build-kurs1-batch.js/upgrade-kurs1-units11to15.js).
const PRESENTATION_FORMS_RANGES = [[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]];
const PRESENTATION_FORMS_REGEX = new RegExp(`[${PRESENTATION_FORMS_RANGES.map(([from, to]) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`).join('')}]`);
const ARABIC_TEXT_FIELDS = ['arabic', 'arabic_vocalized', 'arabic_unvocalized'];
let presentationFormViolations = 0;
for (const w of words) {
  for (const field of ARABIC_TEXT_FIELDS) {
    if (typeof w[field] === 'string' && PRESENTATION_FORMS_REGEX.test(w[field])) {
      fail(`Wort "${w.id}" enthält im Feld "${field}" Arabic-Presentation-Forms-Codepoints statt normaler Unicode-Grundbuchstaben`);
      presentationFormViolations += 1;
    }
  }
  if (Array.isArray(w.accepted_arabic_answers)) {
    for (const answer of w.accepted_arabic_answers) {
      if (typeof answer === 'string' && PRESENTATION_FORMS_REGEX.test(answer)) {
        fail(`Wort "${w.id}" hat in "accepted_arabic_answers" einen Eintrag mit Arabic-Presentation-Forms-Codepoints`);
        presentationFormViolations += 1;
      }
    }
  }
}
if (presentationFormViolations === 0) console.log('OK: keine Arabic-Presentation-Forms-Codepoints in arabischen Feldern gefunden.');

// Entwicklungsauftrag 6, Abschnitt 15/22: Wörter mit content_status "needs_language_review"
// dürfen (noch) keine Audiodatei haben — sie sind Inhaltsentwürfe und noch nicht zur
// Audioerzeugung freigegeben (siehe audio_generation_manifest.json). Das ist dort nur ein
// Hinweis, kein harter Fehler. Für bereits sprachlich geprüfte Wörter bleibt eine fehlende
// Audiodatei ein harter Fehler wie bisher.
let missingAudio = 0;
let missingAudioUnreviewed = 0;
let missingSlowAudio = 0;
for (const w of words) {
  const normalPath = path.join(AUDIO_DIR, 'vocabulary', `${w.id}.wav`);
  const slowPath = path.join(AUDIO_DIR, 'vocabulary', `${w.id}_slow.wav`);
  if (!fs.existsSync(normalPath)) {
    if (w.content_status === 'needs_language_review') {
      missingAudioUnreviewed += 1;
    } else {
      fail(`Fehlende Audiodatei für Vokabel "${w.id}": ${path.relative(ROOT, normalPath)}`);
      missingAudio += 1;
    }
  }
  if (!fs.existsSync(slowPath)) missingSlowAudio += 1;
}
if (missingAudio === 0) console.log('OK: jede sprachlich geprüfte Vokabel hat eine normale Audiodatei.');
if (missingAudioUnreviewed > 0) {
  note(`${missingAudioUnreviewed} Vokabeln mit content_status "needs_language_review" haben noch keine Audiodatei — erwartet, solange sie nicht sprachlich freigegeben sind (Entwicklungsauftrag 6, Abschnitt 15).`);
}
// Entwicklungsauftrag 7, Abschnitt 7: langsame Wiedergabe läuft seit Entwicklungsauftrag 5 über
// HTMLAudioElement.playbackRate=0.75, wenn keine eigene *_slow.wav existiert (audioPlayer.js,
// getestet in audioPlayer.test.js) — eine fehlende *_slow.wav ist deshalb kein Hinweis auf eine
// fehlende Funktion mehr, sondern schlicht der Normalfall für neue Wörter.
if (missingSlowAudio > 0) {
  note(`${missingSlowAudio} Vokabeln haben keine separate *_slow.wav — kein Problem: audioPlayer.js nutzt in diesem Fall automatisch die normale Aufnahme mit reduzierter Wiedergabegeschwindigkeit (playbackRate 0.75, seit Entwicklungsauftrag 5 umgesetzt).`);
}

// --- Drei-Stufen-Datenmodell (Entwicklungsauftrag 7, Abschnitt 6) --------------------------
console.log('\n--- Datenmodell-Stufen ---');

function hasNonEmptyStringArray(v) {
  return Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.trim().length > 0);
}
function hasNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isMinimal(w) {
  return hasNonEmptyString(w.id) && hasNonEmptyString(w.arabic_unvocalized) && hasNonEmptyStringArray(w.german_answers)
    && hasNonEmptyString(w.unit_id) && hasNonEmptyString(w.session_id) && hasNonEmptyString(w.content_status);
}
function isLernfaehig(w) {
  return isMinimal(w) && hasNonEmptyString(w.arabic_vocalized) && hasNonEmptyString(w.transliteration)
    && hasNonEmptyString(w.part_of_speech) && hasNonEmptyStringArray(w.accepted_arabic_answers);
}
function isVollstaendig(w) {
  // "gender"/"plural" gelten als bearbeitet, sobald der Schlüssel existiert (auch mit Wert null,
  // wenn für die Wortart bewusst nicht zutreffend) — ein komplett fehlender Schlüssel bedeutet
  // "noch nicht bearbeitet". application_prompts muss dagegen inhaltlich gefüllt sein.
  return isLernfaehig(w) && ('gender' in w) && ('plural' in w)
    && Array.isArray(w.application_prompts) && w.application_prompts.length > 0
    && w.application_prompts.every((p) => p && hasNonEmptyString(p.prompt) && (hasNonEmptyString(p.expected_meaning) || hasNonEmptyString(p.expected_word_id)));
}

// Feldgültigkeit weiterhin hart prüfen, wo ein Feld überhaupt vorhanden ist (unabhängig von der
// erreichten Stufe) — ein vorhandenes, aber strukturell kaputtes Feld ist immer ein echter Fehler.
for (const w of words) {
  if ('german_answers' in w && !hasNonEmptyStringArray(w.german_answers)) {
    fail(`Wort "${w.id}" hat ein ungültiges "german_answers"-Feld (erwartet: nicht-leeres Array von Strings)`);
  }
  if ('accepted_arabic_answers' in w && !hasNonEmptyStringArray(w.accepted_arabic_answers)) {
    fail(`Wort "${w.id}" hat ein ungültiges "accepted_arabic_answers"-Feld (erwartet: nicht-leeres Array von Strings)`);
  }
  // Verbindliche Application-Prompt-Semantik (Entwicklungsauftrag 11, Abschnitt 7): ein
  // application_prompt gehört IMMER zu dem Wort, in dessen application_prompts-Array er
  // gespeichert ist ("Besitzerwort") — dieses Besitzerwort ist die richtige Lösung. Der
  // tatsächliche Renderer (renderContextualChoice in exerciseRegistry.js) wertet Korrektheit
  // ausschließlich über Objektidentität aus (opt.id === ctx.word.id) und liest
  // expected_word_id/expected_meaning zur Laufzeit nicht — dieser Runtime-Fallback bleibt
  // bestehen. Die KURSVALIDIERUNG muss trotzdem sicherstellen, dass diese beiden Felder NIE
  // widersprüchliche Metadaten enthalten, damit inkonsistente Inhalte nicht unbemerkt in eine
  // spätere, strengere Renderer-Version oder in die Sprachprüfung gelangen.
  if ('application_prompts' in w) {
    if (!Array.isArray(w.application_prompts) || w.application_prompts.length === 0) {
      fail(`Wort "${w.id}" hat ein ungültiges "application_prompts"-Feld (erwartet: nicht-leeres Array)`);
    } else {
      for (const p of w.application_prompts) {
        if (!p || !hasNonEmptyString(p.prompt)) {
          fail(`Wort "${w.id}" hat einen application_prompt ohne (nicht-leeren) "prompt"`);
          continue;
        }
        if (!hasNonEmptyString(p.expected_meaning) && !hasNonEmptyString(p.expected_word_id)) {
          fail(`Wort "${w.id}" hat einen application_prompt ohne "expected_meaning"/"expected_word_id" (leere Lösung)`);
        }
        if (hasNonEmptyString(p.expected_word_id)) {
          if (!idCounts.has(p.expected_word_id)) {
            fail(`Wort "${w.id}" hat einen application_prompt mit unbekannter "expected_word_id" ("${p.expected_word_id}")`);
          } else if (p.expected_word_id !== w.id) {
            fail(`Wort "${w.id}" hat einen application_prompt, dessen "expected_word_id" ("${p.expected_word_id}") auf ein ANDERES Wort zeigt — expected_word_id muss immer der ID des Besitzerwortes entsprechen.`);
          }
        }
        if (hasNonEmptyString(p.expected_meaning)) {
          const ownerAnswers = Array.isArray(w.german_answers) ? w.german_answers : (w.german ? [w.german] : []);
          if (!ownerAnswers.includes(p.expected_meaning)) {
            fail(`Wort "${w.id}" hat einen application_prompt, dessen "expected_meaning" ("${p.expected_meaning}") keiner akzeptierten deutschen Antwort des Besitzerwortes entspricht (${JSON.stringify(ownerAnswers)}).`);
          }
        }
      }
    }
  }
}

const minimalCount = words.filter(isMinimal).length;
const lernfaehigCount = words.filter(isLernfaehig).length;
const vollstaendigCount = words.filter(isVollstaendig).length;

console.log(`Minimalmodell:  ${minimalCount} / ${words.length}`);
console.log(`Lernfähig:      ${lernfaehigCount} / ${words.length}`);
console.log(`Vollständig:    ${vollstaendigCount} / ${words.length}`);
console.log(`Noch zu vervollständigen: ${words.length - vollstaendigCount}`);
if (minimalCount < words.length) {
  note(`${words.length - minimalCount} Wörter erfüllen noch nicht einmal das Minimalmodell (id/arabic_unvocalized/german_answers/unit_id/session_id/content_status).`);
}

const missingPlural = words.filter((w) => w.part_of_speech === 'Substantiv' && !('plural' in w)).length;
if (missingPlural > 0) note(`${missingPlural} Substantive noch ohne bearbeitetes Plural-Feld (auch "bewusst kein Plural" fehlt noch als Angabe).`);
const missingGender = words.filter((w) => (w.part_of_speech === 'Substantiv' || w.part_of_speech === 'Substantiv/Adjektiv') && !('gender' in w)).length;
if (missingGender > 0) note(`${missingGender} Substantive noch ohne bearbeitetes Genus-Feld.`);

if (words.length !== 900) {
  note(`Wortanzahl: ${words.length} / Zielwert 900 (Entwicklungsauftrag 6 noch nicht vollständig abgeschlossen).`);
} else {
  console.log('OK: genau 900 Vokabeleinträge vorhanden (Zielwert Entwicklungsauftrag 6 erreicht).');
}

// --- Geschlossenes part_of_speech-Vokabular (Entwicklungsauftrag 8, Abschnitt 8; erweitert in
// Entwicklungsauftrag 10/11) -------------------------------------------------------------------
// Die Liste selbst lebt jetzt in scripts/partOfSpeechVocabulary.js als EINE zentrale, maßgebliche
// Quelle (Entwicklungsauftrag 11, Abschnitt 5) — Content-Tests importieren dieselbe Datei statt
// eigener Kopien zu pflegen. Details/Historie siehe Kommentarkopf dort.
const KNOWN_PART_OF_SPEECH = new Set(require('./partOfSpeechVocabulary.js').PART_OF_SPEECH_VALUES);
const unknownPartOfSpeech = new Map();
for (const w of words) {
  if (!w.part_of_speech) continue;
  if (!KNOWN_PART_OF_SPEECH.has(w.part_of_speech)) {
    if (!unknownPartOfSpeech.has(w.part_of_speech)) unknownPartOfSpeech.set(w.part_of_speech, []);
    unknownPartOfSpeech.get(w.part_of_speech).push(w.id);
  }
}
if (unknownPartOfSpeech.size > 0) {
  for (const [pos, ids] of unknownPartOfSpeech.entries()) {
    note(`part_of_speech-Wert "${pos}" ist nicht im zentralen Vokabular (${ids.length} Wort/Wörter, z. B. "${ids[0]}") — bitte prüfen: Tippfehler oder bewusste Erweiterung?`);
  }
} else {
  console.log(`OK: alle vergebenen part_of_speech-Werte gehören zum zentralen Vokabular (${KNOWN_PART_OF_SPEECH.size} zulässige Werte).`);
}

// --- opposite_id / confusion_group (Entwicklungsauftrag 8, Abschnitt 12/13) ----------------
console.log('\n--- Gegensatzpaare (opposite_id) und Verwechslungsgruppen (confusion_group) ---');
function byIdForOpposites(id) { return words.find((w) => w.id === id); }
let oppBroken = 0;
let oppAsymmetric = 0;
let oppCount = 0;
for (const w of words) {
  if (!w.opposite_id) continue;
  oppCount += 1;
  const partner = byIdForOpposites(w.opposite_id);
  if (!partner) {
    fail(`Wort "${w.id}" hat opposite_id "${w.opposite_id}", die keine bekannte Vokabel-ID ist`);
    oppBroken += 1;
  } else if (partner.opposite_id !== w.id) {
    fail(`opposite_id ist nicht gegenseitig: "${w.id}" -> "${w.opposite_id}", aber "${w.opposite_id}" -> "${partner.opposite_id || '(kein Gegenstück)'}"`);
    oppAsymmetric += 1;
  }
}
if (oppCount > 0 && oppBroken === 0 && oppAsymmetric === 0) {
  console.log(`OK: alle ${oppCount} opposite_id-Verweise zeigen auf existierende Wörter und sind gegenseitig.`);
} else if (oppCount === 0) {
  note('Noch keine opposite_id-Gegensatzpaare vergeben.');
}

const confusionGroups = new Map();
for (const w of words) {
  if (!w.confusion_group) continue;
  if (!confusionGroups.has(w.confusion_group)) confusionGroups.set(w.confusion_group, []);
  confusionGroups.get(w.confusion_group).push(w.id);
}
if (confusionGroups.size > 0) {
  console.log(`confusion_group: ${confusionGroups.size} Gruppe(n) über ${[...confusionGroups.values()].reduce((s, a) => s + a.length, 0)} Wörter (z. B. "${[...confusionGroups.keys()][0]}": ${confusionGroups.get([...confusionGroups.keys()][0]).join(', ')}).`);
} else {
  note('Noch keine confusion_group-Verwechslungsgruppen vergeben.');
}

// --- Homonym-/Duplikatbericht (Entwicklungsauftrag 7, Abschnitt 11/20) ---------------------
// Unterscheidet: ERROR (echtes Duplikat, s. o. bereits als harter Fehler behandelt), WARNING
// (identische unvokalisierte Schreibweise über MEHRERE Wort-IDs hinweg, ohne übereinstimmende
// homonym_group — potenziell versehentliches Duplikat, verdient menschliche Prüfung), INFO
// (identische unvokalisierte Schreibweise, aber bewusst per homonym_group als Homonym markiert).
console.log('\n--- Homonym-/Duplikatbericht ---');
const byUnvocalized = new Map();
for (const w of words) {
  const key = w.arabic_unvocalized || w.arabic;
  if (!key) continue;
  if (!byUnvocalized.has(key)) byUnvocalized.set(key, []);
  byUnvocalized.get(key).push(w);
}
let homonymWarnings = 0;
let homonymInfos = 0;
for (const [key, group] of byUnvocalized.entries()) {
  if (group.length < 2) continue;
  const groups = new Set(group.map((w) => w.homonym_group || null));
  const allTaggedSame = groups.size === 1 && group[0].homonym_group;
  if (allTaggedSame) {
    homonymInfos += 1;
    console.log(`INFO: "${key}" ist als bewusstes Homonym markiert (homonym_group="${group[0].homonym_group}"): ${group.map((w) => `${w.id} (${w.german_answers ? w.german_answers[0] : w.german})`).join(', ')}`);
  } else {
    homonymWarnings += 1;
    console.log(`WARNUNG: "${key}" kommt in ${group.length} Einträgen mit identischer unvokalisierter Schreibweise vor, aber ohne übereinstimmende homonym_group — bitte prüfen, ob Homonym oder Duplikat: ${group.map((w) => `${w.id} (${w.german_answers ? w.german_answers[0] : w.german})`).join(', ')}`);
  }
}
console.log(`${homonymWarnings} Warnung(en), ${homonymInfos} bestätigte(s) Homonym(e).`);

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

// --- Vokabel-Sessions (vocabSessions.json) --------------------------------------------------
console.log('\n--- Vokabel-Sessions (vocabSessions.json) ---');
const wordIdSet = new Set(words.map((w) => w.id));
const sessionIdCounts = new Map();
let realTheoryCount = 0;
let placeholderTheoryCount = 0;
for (const session of vocabSessions.sessions) {
  sessionIdCounts.set(session.session_id, (sessionIdCounts.get(session.session_id) || 0) + 1);

  if (session.new_word_ids.length > 10) {
    fail(`Session "${session.session_id}" hat ${session.new_word_ids.length} neue Wörter (erlaubt: höchstens 10)`);
  }

  for (const wordId of session.new_word_ids) {
    if (!wordIdSet.has(wordId)) fail(`Session "${session.session_id}" referenziert unbekannte Vokabel-ID "${wordId}"`);
  }

  const theoryDoc = theoryData.theories.find((t) => t.theory_id === session.theory_id);
  if (!theoryDoc) {
    fail(`Session "${session.session_id}" referenziert unbekanntes Theoriedokument "${session.theory_id}"`);
  } else if (!theoryDoc.content_status) {
    fail(`Theoriedokument "${theoryDoc.theory_id}" hat kein "content_status"-Feld`);
  } else if (theoryDoc.is_placeholder) {
    placeholderTheoryCount += 1;
  } else {
    realTheoryCount += 1;
  }
}
if (sessionIdCounts.size === vocabSessions.sessions.length) {
  console.log(`OK: alle ${vocabSessions.sessions.length} Sessions haben <= 10 neue Wörter und referenzieren gültige Wort-/Theorie-IDs.`);
}
console.log(`Session-Theorie (vollständig): ${realTheoryCount} / ${vocabSessions.sessions.length}`);
console.log(`Session-Theorie (Platzhalter):  ${placeholderTheoryCount} / ${vocabSessions.sessions.length}`);

const duplicateSessionIds = [...sessionIdCounts.entries()].filter(([, n]) => n > 1);
for (const [id, n] of duplicateSessionIds) fail(`Session-ID "${id}" kommt ${n}-mal vor`);

for (const unit of vocabSessions.vocab_units) {
  for (const sessionId of unit.session_ids) {
    if (!vocabSessions.sessions.some((s) => s.session_id === sessionId)) {
      fail(`Vokabel-Unit "${unit.id}" referenziert unbekannte Session-ID "${sessionId}"`);
    }
  }
}
if (vocabSessions.vocab_units.length === 30 && vocabSessions.sessions.length === 90) {
  console.log('OK: alle 30 Vokabel-Units mit je 90/30=3 Sessions vorhanden (Entwicklungsauftrag 6, Zielstruktur erreicht).');
} else {
  note(`${vocabSessions.vocab_units.length} Vokabel-Unit(s), ${vocabSessions.sessions.length} Session(s) — Zielwert 30 Units / 90 Sessions (Entwicklungsauftrag 6) noch nicht erreicht.`);
}

// --- Kurs-1-Zielstruktur (Entwicklungsauftrag 6, Abschnitt 22): 30×30 Wörter, 90×10 Wörter,
// jedes Wort genau einer Session zugeordnet — nur geprüft, wenn die 30-Unit-Struktur überhaupt
// existiert (vermeidet Doppelmeldungen mit dem obigen Struktur-Hinweis).
if (vocabSessions.vocab_units.length === 30) {
  console.log('\n--- Kurs-1-Zielstruktur (30 Units × 30 Wörter, 90 Sessions × 10 Wörter) ---');
  const wordsByUnit = new Map();
  for (const w of words) {
    if (!w.unit_id) continue;
    wordsByUnit.set(w.unit_id, (wordsByUnit.get(w.unit_id) || 0) + 1);
  }
  let unitCountsOk = true;
  for (const unit of vocabSessions.vocab_units) {
    const n = wordsByUnit.get(unit.id) || 0;
    if (n !== 30) { fail(`Unit "${unit.id}" hat ${n} Wörter mit unit_id-Zuordnung, erwartet: 30`); unitCountsOk = false; }
  }
  if (unitCountsOk) console.log('OK: jede der 30 Units hat genau 30 zugeordnete Wörter (Feld unit_id).');

  const sessionOfWord = new Map();
  for (const s of vocabSessions.sessions) {
    for (const wid of s.new_word_ids) {
      if (sessionOfWord.has(wid)) fail(`Wort "${wid}" ist mehreren Sessions zugeordnet ("${sessionOfWord.get(wid)}" und "${s.session_id}")`);
      sessionOfWord.set(wid, s.session_id);
    }
  }
  const wordsWithoutSession = words.filter((w) => w.unit_id && !sessionOfWord.has(w.id));
  if (wordsWithoutSession.length > 0) {
    fail(`${wordsWithoutSession.length} Wörter mit unit_id, aber keiner Session zugeordnet (z. B. "${wordsWithoutSession[0].id}")`);
  }
  const mismatched = words.filter((w) => w.session_id && sessionOfWord.has(w.id) && sessionOfWord.get(w.id) !== w.session_id);
  if (mismatched.length > 0) {
    fail(`${mismatched.length} Wörter, deren word.session_id nicht zur tatsächlichen Session-Zuordnung passt (z. B. "${mismatched[0].id}")`);
  }
  if (wordsWithoutSession.length === 0 && mismatched.length === 0) {
    console.log('OK: jedes zugeordnete Wort gehört zu genau einer Session, konsistent mit word.session_id.');
  }
}

// --- Theorie für Schrift-Units (Entwicklungsauftrag 5, Abschnitt 17) ------------------------
console.log('\n--- Theorie für Schrift-Units ---');
const letterGroupUnitsForTheory = course1 ? course1.units.filter((u) => u.type === 'letter_group' || u.type === 'diacritics') : [];
let scriptUnitsWithTheory = 0;
for (const unit of letterGroupUnitsForTheory) {
  const expectedId = unit.type === 'diacritics' ? 'theory_short_vowels' : `theory_${unit.id}`;
  const doc = theoryData.theories.find((t) => t.theory_id === expectedId);
  if (doc) {
    scriptUnitsWithTheory += 1;
    if (!doc.content_status) fail(`Theoriedokument "${doc.theory_id}" (Schrift-Unit "${unit.id}") hat kein "content_status"-Feld`);
  }
}
if (scriptUnitsWithTheory === letterGroupUnitsForTheory.length && letterGroupUnitsForTheory.length > 0) {
  console.log(`OK: alle ${letterGroupUnitsForTheory.length} Schrift-Units haben ein Theoriedokument.`);
} else {
  note(`${scriptUnitsWithTheory} von ${letterGroupUnitsForTheory.length} Schrift-Units haben bereits ein Theoriedokument.`);
}

// --- Sprachprüfung: Gesamtstand nach content_status (Entwicklungsauftrag 7, Abschnitt 29) ---
console.log('\n--- Sprachprüfung ---');
const statusCounts = new Map();
for (const w of words) {
  const status = w.content_status || '(kein content_status)';
  statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
}
console.log(`Wörter gesamt: ${words.length}`);
for (const [status, n] of [...statusCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${status}: ${n}`);
}

let reviewBatchFiles = [];
if (fs.existsSync(LANGUAGE_REVIEW_DIR)) {
  reviewBatchFiles = fs.readdirSync(LANGUAGE_REVIEW_DIR).filter((f) => /^batch_\d+\.json$/.test(f)).sort();
}
const batchedWordIds = new Set();
let totalTheoryReviewEntries = 0;
if (reviewBatchFiles.length > 0) {
  console.log(`\nSprachprüfdateien (${LANGUAGE_REVIEW_DIR.replace(`${ROOT}/`, '')}):`);
  let totalReviewEntries = 0;
  for (const file of reviewBatchFiles) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, file), 'utf-8'));
      const count = Array.isArray(doc.entries) ? doc.entries.length : 0;
      totalReviewEntries += count;
      const theoryCount = Array.isArray(doc.theory_review) ? doc.theory_review.length : 0;
      totalTheoryReviewEntries += theoryCount;
      console.log(`  ${file}: ${count} Wort-Einträge, ${theoryCount} Theorie-Prüfeinträge vorbereitet`);
      if (Array.isArray(doc.entries)) {
        for (const entry of doc.entries) {
          if (!wordIdSet.has(entry.id)) fail(`${file} referenziert unbekannte Vokabel-ID "${entry.id}"`);
          batchedWordIds.add(entry.id);
        }
      }
      if (Array.isArray(doc.theory_review)) {
        for (const t of doc.theory_review) {
          if (!theoryData.theories.some((td) => td.theory_id === t.theory_id)) {
            fail(`${file} referenziert in theory_review ein unbekanntes Theoriedokument "${t.theory_id}"`);
          }
        }
      }
    } catch (err) {
      fail(`${file} ist nicht lesbar oder kein gültiges JSON (${err.message})`);
    }
  }
  console.log(`Sprachprüfdateien gesamt: ${totalReviewEntries} vorbereitete Wort-Einträge, ${totalTheoryReviewEntries} Theorie-Prüfeinträge über ${reviewBatchFiles.length} Batch(es).`);
} else {
  note('Noch keine language-review/batch_*.json-Dateien vorhanden.');
}

// --- Wörter außerhalb aller Batches, aber mit vorhandener Audiodatei (Entwicklungsauftrag 9,
// Abschnitt 7) — die ursprünglichen Bestandswörter (vor Kurs-1-Erweiterung) haben zwar bereits
// eine echte Audiodatei, wurden aber nie in eine language-review/batch_NN.json aufgenommen (die
// Batch-Skripte filtern bislang auf neue "c1_"-IDs). Eine vorhandene Audiodatei ersetzt KEINE
// Sprachprüfung -- diese Wörter bleiben deshalb ebenfalls "needs_language_review" und werden hier
// separat gezählt, statt in der 900er-Bilanz unsichtbar zu bleiben.
const legacyWordsWithAudioNotBatched = words.filter((w) => !batchedWordIds.has(w.id) && fs.existsSync(path.join(AUDIO_DIR, 'vocabulary', `${w.id}.wav`)));
if (legacyWordsWithAudioNotBatched.length > 0) {
  note(`${legacyWordsWithAudioNotBatched.length} ursprüngliche Bestandswörter haben bereits eine Audiodatei, sind aber noch in keiner Sprachprüfdatei erfasst (z. B. "${legacyWordsWithAudioNotBatched[0].id}") — eine vorhandene Audiodatei ist keine Sprachprüfung, siehe ROADMAP-Folgepunkt.`);
}

if (fs.existsSync(path.join(ROOT, 'audio_generation_manifest.json'))) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));
    const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
    const readyCount = entries.filter((e) => e.status === 'ready_for_generation').length;
    const pendingCount = entries.filter((e) => e.status !== 'ready_for_generation').length;
    console.log(`\nAudio-Generierungsmanifest: ${entries.length} Einträge (${readyCount} ready_for_generation, ${pendingCount} noch nicht freigegeben).`);
    for (const e of entries) {
      if (!wordIdSet.has(e.id)) fail(`audio_generation_manifest.json referenziert unbekannte Vokabel-ID "${e.id}"`);
      if (e.status === 'ready_for_generation') {
        const w = words.find((ww) => ww.id === e.id);
        if (w && w.content_status === 'needs_language_review') {
          fail(`audio_generation_manifest.json markiert "${e.id}" als "ready_for_generation", obwohl das Wort noch content_status "needs_language_review" hat`);
        }
      }
    }
  } catch (err) {
    fail(`audio_generation_manifest.json ist nicht lesbar oder kein gültiges JSON (${err.message})`);
  }
} else {
  note('Noch kein audio_generation_manifest.json vorhanden.');
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
