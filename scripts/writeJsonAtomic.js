// Entwicklungsauftrag 11 — behebt eine echte, seltene Testflakiness: mehrere Content-Test-Dateien
// (kurs1Units16to20/21to25/26to30Content.test.js, legacyBatch0Review.test.js) enthalten
// Idempotenz-Tests, die ein Batch-Skript per execFileSync ein zweites Mal ausführen. Node's
// eingebauter Test-Runner (`node --test`) führt mehrere Testdateien standardmäßig NEBENLÄUFIG
// aus — während Skript A gerade z. B. audio_generation_manifest.json oder eine batch_NN.json
// per `fs.writeFileSync()` (NICHT atomar) neu schreibt, konnte ein GLEICHZEITIG laufender Test
// aus einer anderen Datei genau diese Datei lesen und dabei einen unvollständig geschriebenen
// Zwischenstand erwischen ("Unexpected end of JSON input" bei JSON.parse) — beobachtet in einem
// von 10 aufeinanderfolgenden `npm test`-Läufen.
//
// Fix (analog zum bereits etablierten Muster in src/js/progressStore.js#writeJsonFileAtomic):
// erst in eine temporäre Datei im selben Verzeichnis schreiben, dann per fs.renameSync() atomar
// an den Zielnamen umbenennen. Ein gleichzeitiger Leser sieht dadurch IMMER entweder die
// vollständige alte oder die vollständige neue Datei, nie einen Zwischenzustand.
const fs = require('fs');
const path = require('path');

function writeJsonFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = { writeJsonFileAtomic };
