#!/usr/bin/env node
// Entwicklungsauftrag 7, Abschnitt 24 (fortgesetzt) — Schrift-Theorie für die letzten beiden
// Buchstabengruppen-Units (ع غ / ف ق ك ل م ه), komplettiert damit alle 8 Schrift-Units aus
// courses.json (letter_group + diacritics) mit echter Theorie. Idempotent.

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const THEORY_PATH = path.join(ROOT, 'language-packs', 'arabic', 'theory.json');

function mc(question, options, explanation) {
  const q = { question, options };
  if (explanation) q.explanation = explanation;
  return q;
}
function opt(text, correct) { return { text, correct }; }
function audioWord(audioKey, text) { return { type: 'audio_word', audio_key: audioKey, text }; }
function comparison(items) { return { type: 'comparison', headers: ['Buchstabe', 'Name', 'Punkte', 'Laut'], items }; }

const DOCS = [
  {
    theory_id: 'theory_unit_6',
    title: 'ع غ — zwei verwandte Rachenlaute',
    content_status: 'needs_language_review',
    learning_objectives: [
      'ع als stimmhaften Rachenlaut ohne deutsches Äquivalent erkennen',
      'غ vom französischen, im Rachen gerollten „r“ her einordnen',
      'Die gemeinsame Grundform beider Buchstaben in allen Wortpositionen wiedererkennen'
    ],
    blocks: [
      { type: 'paragraph', text: 'ع (ʿAyn) und غ (Ghayn) teilen dieselbe Grundform — eine offene, nach links geöffnete Schlaufe. غ trägt zusätzlich einen Punkt darüber, ع bleibt punktlos. Beide Laute werden tief im Rachen gebildet und gehören zu den für deutsche Muttersprachler ungewohntesten Lauten des Arabischen.' },
      { type: 'heading', text: 'Zwei sehr unterschiedliche Rachenlaute' },
      { type: 'paragraph', text: 'ع ist ein stimmhafter Kehllaut ohne jede deutsche Entsprechung — am ehesten vergleichbar mit einem sehr tiefen, gepressten „Ah“, das im Rachen statt im Mund gebildet wird. غ klingt dagegen ähnlich wie das französische, im Rachen gerollte „r“ (wie in „Paris“). Beide Laute brauchen Übung — am besten hilft aufmerksames Nachsprechen der Audioaufnahmen.' },
      { type: 'callout', variant: 'tip', title: 'Beispiel: غَرْب', text: 'غَرْب (Gharb, „Westen“) beginnt mit غ (mit Punkt) — die offene Schlaufenform mit dem Punkt darüber ist das entscheidende Erkennungsmerkmal.' },
      { type: 'heading', text: 'Verbindungsverhalten' },
      { type: 'paragraph', text: 'Wie fast alle arabischen Buchstaben verbinden sich ع und غ nach beiden Seiten — ihre Form am Wortanfang, in der Mitte und am Ende unterscheidet sich jeweils von der isolierten Form, bleibt aber die offene Schlaufe mit (bei غ) demselben Punkt.' },
      comparison([
        ['ع', 'ʿAyn', 'kein Punkt', 'stimmhafter Kehllaut ohne deutsches Äquivalent'],
        ['غ', 'Ghayn', '1 Punkt oben', 'wie franz. „r“, im Rachen gerollt']
      ]),
      audioWord('letters/ain', 'ع'),
      audioWord('letters/ghain', 'غ'),
      { type: 'heading', level: 'full', text: 'Mehr erfahren: ع als einer der markantesten arabischen Laute' },
      { type: 'paragraph', level: 'full', text: 'ع gilt als einer der charakteristischsten Laute des Arabischen und kommt in vielen häufigen Wörtern vor — z. B. beginnt عَرَبِيّ („arabisch“) selbst damit. Er gehört zur selben kleinen Gruppe von Rachenlauten wie ح aus Unit 3 — beide werden tief im Rachen statt im Mundraum gebildet.' },
      { type: 'callout', level: 'full', variant: 'info', title: 'Typische Verwechslung', text: 'ع und ح klingen für ungeübte Ohren manchmal ähnlich — ح ist gehaucht und stimmlos, ع ist gepresst und stimmhaft (die Stimmbänder schwingen mit).' },
      { type: 'mini_check', questions: [
        mc('Welcher der beiden Buchstaben trägt einen Punkt: ع oder غ؟', [opt('غ', true), opt('ع', false)]),
        mc('غ klingt am ehesten wie…', [opt('das französische, im Rachen gerollte „r“', true), opt('das deutsche „g“', false)]),
        mc('Welches Wort beginnt mit غ؟', [opt('غَرْب (Westen)', true), opt('عَيْن (Auge)', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_unit_7',
    title: 'ف ق ك ل م ه — die letzten sechs Grundbuchstaben',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die letzten sechs arabischen Grundbuchstaben (ف ق ك ل م ه) sicher benennen',
      'ق von ك lautlich unterscheiden',
      'Die besondere لا-Verbindung (Lām + Alif) erkennen'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese letzte Buchstaben-Unit schließt das arabische Alphabet ab: ف (Fāʾ), ق (Qāf), ك (Kāf), ل (Lām), م (Mīm) und ه (Hāʾ). Anders als in den vorherigen Units haben diese sechs Buchstaben UNTERSCHIEDLICHE Grundformen — es geht hier also weniger um das Unterscheiden von Punkten als darum, sechs neue, gut unterscheidbare Formen zu lernen.' },
      { type: 'heading', text: 'ق und ك: zwei k-Laute' },
      { type: 'paragraph', text: 'ف klingt wie das deutsche „f“, ك wie das deutsche „k“. ق ist dagegen ein kehliges k, das viel weiter hinten im Rachen gebildet wird als ك — ähnlich wie der Unterschied zwischen den einfachen und den emphatischen Lauten aus Unit 4/5. ل, م und ه klingen dagegen fast genau wie die deutschen Laute „l“, „m“ und „h“.' },
      { type: 'callout', variant: 'tip', title: 'Beispiel: قَلَم', text: 'قَلَم (Qalam, „Stift“) enthält sowohl ق als auch ل — zwei der sechs neuen Buchstaben in einem kurzen, alltäglichen Wort.' },
      { type: 'heading', text: 'Die لا-Verbindung' },
      { type: 'paragraph', text: 'Wenn ل direkt vor ا (Alif) steht, verschmelzen beide zu einer besonderen, gemeinsamen Form: لا (Lām-Alif). Das ist keine Ausnahme, die du separat auswendig lernen musst, sondern das ganz normale Verbindungsverhalten von ل vor ا — es sieht nur ungewohnt aus, weil sich die vertikale Form von ل um das ا herumlegt.' },
      comparison([
        ['ف', 'Fāʾ', '1 Punkt oben', 'wie deutsches „f“'],
        ['ق', 'Qāf', '2 Punkte oben', 'kehliges k, weiter hinten als ك'],
        ['ك', 'Kāf', 'kein Punkt', 'wie deutsches „k“'],
        ['ل', 'Lām', 'kein Punkt', 'wie deutsches „l“'],
        ['م', 'Mīm', 'kein Punkt', 'wie deutsches „m“'],
        ['ه', 'Hāʾ', 'kein Punkt', 'wie deutsches „h“']
      ]),
      audioWord('letters/fa', 'ف'),
      audioWord('letters/qaf', 'ق'),
      audioWord('letters/kaf', 'ك'),
      audioWord('letters/lam', 'ل'),
      audioWord('letters/mim', 'م'),
      audioWord('letters/ha', 'ه'),
      { type: 'heading', level: 'full', text: 'Mehr erfahren: geschafft — alle 28 Buchstaben!' },
      { type: 'paragraph', level: 'full', text: 'Mit dieser Unit hast du alle 28 arabischen Grundbuchstaben in ihren Grundformen kennengelernt. Die folgenden Units (kurze Vokale, lange Vokale, Sonderformen) bauen direkt darauf auf und zeigen dir, wie aus diesen Grundformen mit Vokalzeichen vollständig lesbare Wörter werden.' },
      { type: 'callout', level: 'full', variant: 'info', title: 'Typischer Fehler', text: 'ق und ك werden von Anfängern oft gleich ausgesprochen — ق klingt tiefer und kehliger, ك heller und weiter vorne im Mund.' },
      { type: 'mini_check', questions: [
        mc('Welcher Buchstabe wird weiter hinten im Rachen gebildet als ك؟', [opt('ق', true), opt('ف', false)]),
        mc('Was ist لا؟', [opt('die Verbindung von ل und ا', true), opt('ein eigener, 29. Buchstabe', false)]),
        mc('Wie viele arabische Grundbuchstaben gibt es insgesamt؟', [opt('28', true), opt('26', false)])
      ] }
    ]
  }
];

const theoryData = JSON.parse(fs.readFileSync(THEORY_PATH, 'utf-8'));
const byId = new Map(theoryData.theories.map((t, i) => [t.theory_id, i]));

let replaced = 0;
for (const doc of DOCS) {
  if (byId.has(doc.theory_id)) {
    theoryData.theories[byId.get(doc.theory_id)] = doc;
  } else {
    theoryData.theories.push(doc);
    byId.set(doc.theory_id, theoryData.theories.length - 1);
  }
  replaced += 1;
}

writeJsonFileAtomic(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`);
console.log(`Schrift-Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
