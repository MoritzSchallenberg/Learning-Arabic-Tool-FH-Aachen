#!/usr/bin/env node
// Entwicklungsauftrag 12, Abschnitt 10 -- Kommandozeilen-Einstiegspunkt für die
// Audio-Erzeugungspipeline. Drei Modi, wie im Auftrag empfohlen:
//
//   node scripts/audioCli.js plan      [--ids a,b] [--unit vocab_unit_26] [--sample N]
//   node scripts/audioCli.js generate  --all | --sample N | --ids a,b  [--dry-run] [--unit ...]
//   node scripts/audioCli.js verify
//
// npm-Skripte (package.json): audio:plan, audio:generate:sample, audio:generate, audio:verify.
//
// AUDIO_PIPELINE_ROOT erlaubt Tests, gegen eine isolierte temporäre Kopie zu laufen, statt die
// echten Projektdateien anzufassen (gleiches Muster wie COURSE_VALIDATE_ROOT in validateCourse.js).

const path = require('path');
const {
  defaultPaths, loadContext, selectTargets, planReport, runGeneration, verify
} = require('./audio/audioPipeline.js');
const { elevenLabsAvailable, elevenLabsConfigFromEnv, synthesizeWithElevenLabs } = require('./audio/ttsProviders.js');

const ROOT = process.env.AUDIO_PIPELINE_ROOT || path.join(__dirname, '..');
const paths = defaultPaths(ROOT);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--sample') args.sample = parseInt(argv[++i], 10);
    else if (a === '--ids') args.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--unit') args.unit = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else args._.push(a);
  }
  return args;
}

function printPlan(report) {
  console.log(`Dateien geplant:            ${report.fileCount}`);
  console.log(`Zeichen gesamt:             ${report.totalCharacters}`);
  console.log(`API-Aufrufe geplant:        ${report.apiCallsPlanned} (nur normale Datei je Wort, keine "_slow.wav" -- Abschnitt 11)`);
  console.log(`bereits erzeugt (Manifest): ${report.alreadyGenerated}`);
  if (report.existingLegacyAudioApprox !== null) {
    console.log(`vorhandene Bestandsaudios (außerhalb des Manifests, unverändert): ~${report.existingLegacyAudioApprox}`);
  }
  if (report.fileCount <= 30) console.log(`IDs: ${report.ids.join(', ')}`);
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (mode === 'plan') {
    const context = loadContext(paths);
    const targets = selectTargets(context, { ids: args.ids, unitIds: args.unit, sampleSize: args.sample, all: true });
    const report = planReport(context, targets);
    console.log('=== Audio-Erzeugungsplan ===\n');
    printPlan(report);
    console.log(`\nAnbieter (ElevenLabs) verfügbar: ${elevenLabsAvailable() ? 'ja' : 'NEIN -- ELEVENLABS_API_KEY ist nicht gesetzt'}`);
    return;
  }

  if (mode === 'generate') {
    const context = loadContext(paths);
    const targets = selectTargets(context, { ids: args.ids, unitIds: args.unit, sampleSize: args.sample, all: args.all });
    const report = planReport(context, targets);
    console.log('=== Kostenschutz-Vorschau (Abschnitt 12) ===\n');
    printPlan(report);
    console.log('');

    if (targets.length === 0) {
      console.log('Keine passenden Einträge gefunden -- nichts zu tun.');
      return;
    }

    if (args.dryRun) {
      console.log('--dry-run: es werden KEINE Dateien geschrieben und KEIN API-Aufruf ausgeführt.\n');
    } else {
      const cfg = elevenLabsConfigFromEnv();
      if (!cfg.apiKey) {
        console.error('ABGEBROCHEN: ELEVENLABS_API_KEY ist in dieser Umgebung nicht gesetzt.');
        console.error('Es wurde NICHTS erzeugt und NICHTS am Manifest geändert (Fail-Fast vor dem ersten Wort).');
        console.error(`Betroffene, nicht erzeugte Dateien: ${targets.length}`);
        console.error('Siehe AUDIO_GENERATION_GUIDE.md für die Einrichtung des API-Schlüssels.');
        process.exitCode = 1;
        return;
      }
    }

    const cfg = elevenLabsConfigFromEnv();
    const providerFn = args.dryRun
      ? async () => Buffer.alloc(0)
      : (text) => synthesizeWithElevenLabs(text, { apiKey: cfg.apiKey, voiceId: cfg.voiceId, modelId: cfg.modelId });

    runGeneration(context, targets, {
      providerFn,
      providerName: 'elevenlabs',
      modelId: cfg.modelId,
      voiceId: cfg.voiceId,
      dryRun: Boolean(args.dryRun),
      onProgress: (p) => {
        if (p.dryRun) console.log(`  [dry-run] ${p.id} (${p.textLength} Zeichen)`);
        else if (p.status === 'generated') console.log(`  [OK] ${p.id} (sha256 ${p.checksum.slice(0, 12)}...)`);
        else if (p.status === 'validation_failed') console.log(`  [ABGELEHNT] ${p.id}: ${p.problems.join('; ')}`);
        else if (p.status === 'error') console.log(`  [FEHLER, Versuch ${p.attempt}] ${p.id}: ${p.error}`);
        else if (p.status === 'blocked_existing_file') console.log(`  [BLOCKIERT] ${p.id}: ${p.error}`);
      }
    }).then((results) => {
      console.log('\n=== Ergebnis ===');
      console.log(`erzeugt:    ${results.generated.length}`);
      console.log(`fehlgeschlagen: ${results.failed.length}`);
      console.log(`blockiert (Schutz vorhandener Datei): ${results.blocked.length}`);
      if (args.dryRun) console.log(`dry-run (nichts geschrieben): ${results.dryRun.length}`);
      if (results.failed.length > 0) {
        console.log('\nFehlgeschlagene IDs:');
        for (const f of results.failed) console.log(`  ${f.id}: ${f.error}`);
        process.exitCode = 1;
      }
    });
    return;
  }

  if (mode === 'verify') {
    const context = loadContext(paths);
    const result = verify(context);
    console.log(`=== Audio-Konsistenzprüfung ===\n`);
    console.log(`in Ordnung: ${result.ok.length}`);
    console.log(`Probleme:   ${result.problems.length}`);
    for (const p of result.problems) console.log(`  ${p.id}: ${p.problem}`);
    if (result.problems.length > 0) process.exitCode = 1;
    return;
  }

  console.error('Aufruf: node scripts/audioCli.js <plan|generate|verify> [--all] [--dry-run] [--sample N] [--ids a,b] [--unit u1,u2]');
  process.exitCode = 1;
}

main();
