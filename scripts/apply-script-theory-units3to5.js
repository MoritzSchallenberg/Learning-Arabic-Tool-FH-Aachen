#!/usr/bin/env node
// Entwicklungsauftrag 7, Abschnitt 24 — Schrift-Theorie für die Buchstabengruppen-Units 3-5
// (ج ح خ / س ش ص ض / ط ظ), im selben Blockformat wie die bereits vorhandene Theorie für Unit 1/2
// (siehe theory_unit_2 als Vorlage). Idempotent (ersetzt anhand der theory_id).

const fs = require('fs');
const path = require('path');

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
    theory_id: 'theory_unit_3',
    title: 'ج ح خ — drei ähnliche Formen, unterschiedliche Laute',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die gemeinsame Grundform von ج, ح und خ erkennen',
      'Die Punkte als Unterscheidungsmerkmal zwischen ج, ح und خ benennen können',
      'ح und خ klanglich sicher unterscheiden'
    ],
    blocks: [
      { type: 'paragraph', text: 'Die drei Buchstaben dieser Unit — ج (Jīm), ح (Ḥāʾ) und خ (Khāʾ) — teilen dieselbe bootähnliche Grundform mit einer tiefen Rundung. Nur ج trägt einen Punkt darunter; ح bleibt punktlos, خ trägt einen Punkt darüber. Anders als bei ب/ت/ث (Unit 2) unterscheiden sich hier nicht nur die Punkte, sondern auch die Laute stark voneinander.' },
      { type: 'heading', text: 'Punkte UND Laute unterscheiden' },
      { type: 'paragraph', text: 'ج klingt wie „dsch“ in „Dschungel“. ح ist ein stark gehauchtes h, tief im Rachen gebildet — im Deutschen gibt es dafür keine echte Entsprechung. خ klingt wie das „ch“ in „Bach“. Gerade ح und خ werden von Anfängern oft verwechselt, weil beide im Rachen gebildet werden — ح ist dabei glatt und gehaucht ohne Reibung, خ dagegen rau und reibend.' },
      { type: 'callout', variant: 'tip', title: 'Beispiel: جَبَل', text: 'جَبَل (Jabal, „Berg“) beginnt mit ج (ein Punkt unten) — die Grundform dieses Buchstabens erkennst du an der tiefen Rundung mit dem Punkt darunter.' },
      { type: 'heading', text: 'Verbindungsverhalten' },
      { type: 'paragraph', text: 'Alle drei Buchstaben verbinden sich nach beiden Seiten (Anfang, Mitte und Ende sehen jeweils anders aus als isoliert) — wie schon bei den ب/ت/ث-Buchstaben aus Unit 2.' },
      comparison([
        ['ج', 'Jīm', '1 Punkt unten', 'wie „dsch“ in Dschungel'],
        ['ح', 'Ḥāʾ', 'kein Punkt', 'gehauchtes h, tief im Rachen'],
        ['خ', 'Khāʾ', '1 Punkt oben', 'wie „ch“ in Bach']
      ]),
      audioWord('letters/jim', 'ج'),
      audioWord('letters/ha_emph', 'ح'),
      audioWord('letters/kha', 'خ'),
      { type: 'heading', level: 'full', text: 'Mehr erfahren: Rachenlaute im Arabischen' },
      { type: 'paragraph', level: 'full', text: 'ح gehört zu einer kleinen Gruppe von Rachenlauten (Pharyngalen), die im Deutschen keine direkte Entsprechung haben — ein weiterer, ع, folgt in einer späteren Unit. Am besten lernst du solche Laute durch Nachahmen der Audioaufnahme, nicht durch den Vergleich mit einem ähnlichen deutschen Laut, den es eigentlich nicht gibt.' },
      { type: 'callout', level: 'full', variant: 'info', title: 'Typische Verwechslung', text: 'ح und خ klingen für ungeübte Ohren ähnlich — ح ist glatt/gehaucht, خ ist rau/reibend, vergleichbar mit dem Unterschied zwischen leisem Hauchen und Räuspern.' },
      { type: 'mini_check', questions: [
        mc('Welcher der drei Buchstaben trägt einen Punkt darunter?', [opt('ج', true), opt('ح', false)]),
        mc('Wie klingt ح؟', [opt('gehauchtes h, tief im Rachen', true), opt('wie „ch“ in Bach', false)], 'Das ist خ — ح ist glatter und ohne Reibung.'),
        mc('Welches Wort beginnt mit ج؟', [opt('جَبَل (Berg)', true), opt('حَلِيب (Milch)', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_unit_4',
    title: 'س ش ص ض — einfache und emphatische s/d-Laute',
    content_status: 'needs_language_review',
    learning_objectives: [
      'Die gezackte Grundform von س/ش von der runden Grundform von ص/ض unterscheiden',
      'Punkte als Unterscheidungsmerkmal innerhalb der beiden Paare erkennen',
      'Einfache (س) und emphatische (ص) Laute als unterschiedliche Lautgruppen verstehen'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese Unit bringt vier Buchstaben zusammen, die sich in zwei Paare aufteilen lassen: س (Sīn) und ش (Shīn) haben eine gezackte Grundform mit drei kleinen „Zähnen“; ص (Ṣād) und ض (Ḍād) haben dagegen eine runde, geschlossene Grundform mit einer kleinen Schlaufe.' },
      { type: 'heading', text: 'Innerhalb der Paare entscheiden die Punkte' },
      { type: 'paragraph', text: 'س hat keine Punkte, ش hat drei Punkte darüber (dieselbe Anzahl wie ث aus Unit 2!). ص hat keine Punkte, ض hat einen Punkt darüber. Innerhalb jedes Paares ist also wieder der Punkt das entscheidende Unterscheidungsmerkmal — genau wie bei den Buchstabenfamilien aus Unit 2 und 3.' },
      { type: 'heading', text: 'Einfach vs. emphatisch' },
      { type: 'paragraph', text: 'Der zweite wichtige Unterschied liegt zwischen den beiden Paaren: س und ش sind „einfache“ Laute, die dem Deutschen recht ähnlich klingen (س wie ein scharfes s, ش wie „sch“). ص und ض sind dagegen „emphatische“ (auch: velarisierte) Laute — sie klingen entfernt wie س bzw. د, werden aber mit zurückgezogener Zunge und tieferem Klang gebildet. Diesen Unterschied vertiefst du in Unit 5 bei ط/ظ noch einmal.' },
      { type: 'callout', variant: 'tip', title: 'Beispiel: شَمْس', text: 'شَمْس (Shams, „Sonne“) beginnt mit ش (drei Punkte) und endet mit س (keine Punkte) — ein Wort zeigt hier beide Formen des ersten Paares.' },
      comparison([
        ['س', 'Sīn', 'keine Punkte', 'einfaches, scharfes s'],
        ['ش', 'Shīn', '3 Punkte oben', 'wie deutsches „sch“'],
        ['ص', 'Ṣād', 'keine Punkte', 'emphatisches (kehliges) s'],
        ['ض', 'Ḍād', '1 Punkt oben', 'emphatisches d']
      ]),
      audioWord('letters/sin', 'س'),
      audioWord('letters/shin', 'ش'),
      audioWord('letters/sad', 'ص'),
      audioWord('letters/dad', 'ض'),
      { type: 'heading', level: 'full', text: 'Mehr erfahren: was bedeutet „emphatisch“?' },
      { type: 'paragraph', level: 'full', text: 'Emphatische Laute (ص, ض und die in Unit 5 folgenden ط, ظ) sind eine Besonderheit des Arabischen: Die Zunge wird beim Sprechen nach hinten/unten gezogen, wodurch benachbarte Vokale dunkler und tiefer klingen. Muttersprachler hören den Unterschied zwischen س (einfach) und ص (emphatisch) sofort, auch wenn beide auf den ersten Blick „wie s“ klingen.' },
      { type: 'callout', level: 'full', variant: 'info', title: 'Typische Verwechslung', text: 'س und ص werden von Anfängern oft gleich ausgesprochen — achte in den Audiobeispielen bewusst auf den „dunkleren“, kehligeren Klang von ص.' },
      { type: 'mini_check', questions: [
        mc('Welche zwei Buchstaben haben eine gezackte Grundform?', [opt('س und ش', true), opt('ص und ض', false)]),
        mc('Wie viele Punkte hat ض؟', [opt('1, oben', true), opt('3, oben', false)], 'ش hat drei Punkte — ض nur einen.'),
        mc('Was bedeutet „emphatisch“ bei ص/ض؟', [opt('zurückgezogene, tiefere Aussprache', true), opt('genau wie im Deutschen ausgesprochen', false)])
      ] }
    ]
  },
  {
    theory_id: 'theory_unit_5',
    title: 'ط ظ — die letzten emphatischen Buchstaben',
    content_status: 'needs_language_review',
    learning_objectives: [
      'ط und ظ als emphatische Gegenstücke zu ت und ذ erkennen',
      'Die gemeinsame einfache Grundform (Schlaufe mit senkrechtem Strich) wiedererkennen',
      'Zwischen ط und ظ anhand des einzigen Unterscheidungsmerkmals (Punkt) unterscheiden'
    ],
    blocks: [
      { type: 'paragraph', text: 'Diese kurze Unit schließt das Thema „emphatische Laute“ ab, das du in Unit 4 bei ص/ض begonnen hast. ط (Ṭāʾ) und ظ (Ẓāʾ) sind die emphatischen Gegenstücke zu ت (Tāʾ, Unit 2) bzw. ذ (Dhāl, Unit 1) — dieselbe Zungenposition wie bei den einfachen Lauten, aber mit zurückgezogener, tieferer Aussprache.' },
      { type: 'heading', text: 'Eine sehr einfache Grundform' },
      { type: 'paragraph', text: 'Beide Buchstaben bestehen aus derselben Form: einer runden Schlaufe mit einem senkrechten Strich darüber, der über die Zeile hinausragt. Das einzige Unterscheidungsmerkmal ist wieder der Punkt: ط hat keinen Punkt, ظ hat einen Punkt darüber.' },
      { type: 'callout', variant: 'tip', title: 'Beispiel: بَطَل', text: 'بَطَل (Baṭal, „Held“) enthält ط ohne Punkt. ظُهْر (Ẓuhr, „Mittag“, aus Unit 6) enthält dagegen ظ mit Punkt — dieselbe Grundform, aber unterschiedliche Bedeutung durch den Punkt.' },
      { type: 'heading', text: 'Rückblick: die ganze emphatische Familie' },
      { type: 'paragraph', text: 'Mit ط und ظ hast du jetzt alle vier emphatischen Buchstaben des Arabischen kennengelernt: ص (emphatisches s), ض (emphatisches d), ط (emphatisches t) und ظ (emphatisches th/z, aus Unit 4). Alle vier werden mit zurückgezogener Zunge gesprochen und klingen dadurch dunkler und tiefer als ihre nicht-emphatischen Verwandten.' },
      comparison([
        ['ط', 'Ṭāʾ', 'kein Punkt', 'emphatisches t'],
        ['ظ', 'Ẓāʾ', '1 Punkt oben', 'emphatisches th/z']
      ]),
      audioWord('letters/ta_emph', 'ط'),
      audioWord('letters/za_emph', 'ظ'),
      { type: 'heading', level: 'full', text: 'Mehr erfahren: warum emphatische Laute wichtig sind' },
      { type: 'paragraph', level: 'full', text: 'Von den 28 arabischen Grundbuchstaben sind nur vier emphatisch (ص ض ط ظ) — sie kommen seltener vor als ihre einfachen Gegenstücke, verändern aber die Wortbedeutung genauso zuverlässig wie jeder andere Buchstabenwechsel. Die Verwechslung von emphatisch und einfach ist deshalb kein rein kosmetischer Ausspracheunterschied, sondern kann ein anderes Wort ergeben.' },
      { type: 'callout', level: 'full', variant: 'info', title: 'Typischer Fehler', text: 'ط und ت (Unit 2) werden von Anfängern oft gleich ausgesprochen — ط klingt tiefer und dumpfer, ت heller und klarer.' },
      { type: 'mini_check', questions: [
        mc('Wozu ist ظ das emphatische Gegenstück?', [opt('zu ذ', true), opt('zu ز', false)]),
        mc('Wie unterscheiden sich ط und ظ voneinander؟', [opt('durch einen Punkt', true), opt('durch eine komplett andere Form', false)]),
        mc('Wie viele emphatische Buchstaben hat das Arabische insgesamt؟', [opt('vier (ص ض ط ظ)', true), opt('zwei (ط ظ)', false)])
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

fs.writeFileSync(THEORY_PATH, `${JSON.stringify(theoryData, null, 2)}\n`, 'utf-8');
console.log(`Schrift-Theoriedokumente ersetzt/angelegt: ${replaced}`);
console.log(`Theoriedokumente insgesamt: ${theoryData.theories.length}`);
