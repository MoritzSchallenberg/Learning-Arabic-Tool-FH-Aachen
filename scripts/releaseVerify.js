#!/usr/bin/env node
// npm run release:verify — Entwicklungsauftrag 19, Abschnitt 12. Prüft das TATSÄCHLICH GEBAUTE
// Paket (app.asar aus `npm run build:*`/electron-builder), nicht nur Dateianzahlen: die
// tatsächlichen Referenzen aus den Kursdaten (Vokabel-IDs, audio_key-Felder) werden gegen die
// gepackten Dateien geprüft, nicht nur gezählt.
//
// Nutzung:
//   node scripts/releaseVerify.js                         # sucht selbst unter dist/**/app.asar
//   node scripts/releaseVerify.js --asar dist/.../app.asar
//   node scripts/releaseVerify.js --tag v1.0.0-beta.1      # zusätzlich: Version==Tag prüfen
//
// Wird kein gebautes app.asar gefunden, fällt das Skript auf eine SOURCE-Prüfung des Repository-
// Baums zurück (klar als solche gekennzeichnet) -- nützlich für schnelle lokale Iteration, ersetzt
// aber NICHT die echte Paketprüfung in der CI (siehe .github/workflows/build.yml, Abschnitt 13).

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--asar') args.asar = argv[++i];
    else if (argv[i] === '--tag') args.tag = argv[++i];
  }
  return args;
}

function findAsar(dir) {
  if (!fs.existsSync(dir)) return null;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name === 'app.asar') return full;
    }
  }
  return null;
}

// --- Zwei austauschbare "Paketquellen": echtes app.asar ODER der rohe Source-Baum -------------
function makeAsarSource(asarPath) {
  let asar;
  try {
    asar = require('@electron/asar');
  } catch (err) {
    throw new Error(
      '@electron/asar nicht verfügbar (transitive Abhängigkeit von electron-builder). '
      + 'npm install ausführen und erneut versuchen.'
    );
  }
  const entries = asar.listPackage(asarPath); // z. B. ["/main.js", "/src/index.html", ...]
  const fileSet = new Set(entries.map((e) => e.replace(/^\//, '')));
  return {
    label: `app.asar (${path.relative(ROOT, asarPath)})`,
    isRealPackage: true,
    exists(relPath) { return fileSet.has(relPath); },
    listAll() { return [...fileSet]; },
    readText(relPath) {
      if (!this.exists(relPath)) return null;
      return asar.extractFile(asarPath, relPath).toString('utf8');
    }
  };
}

function makeSourceTreeSource() {
  const INCLUDE_ROOTS = [
    'main.js', 'preload.js', 'src', 'language-packs', 'package.json',
    'LICENSE', 'LICENSES.md', 'NOTICE-AUDIO.md'
  ];
  const EXCLUDE_DIRS = new Set(['review', '.staging']);
  const files = new Set();
  function walk(relDir) {
    const abs = path.join(ROOT, relDir);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.gitkeep') continue;
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
      const absPath = path.join(ROOT, relPath);
      if (entry.isDirectory()) walk(relPath);
      else files.add(relPath);
    }
  }
  for (const root of INCLUDE_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) walk(root); else files.add(root);
  }
  return {
    label: 'Source-Baum (KEIN gebautes Paket gefunden -- Ersatzprüfung, siehe Hinweis oben)',
    isRealPackage: false,
    exists(relPath) { return files.has(relPath); },
    listAll() { return [...files]; },
    readText(relPath) {
      if (!this.exists(relPath)) return null;
      return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    }
  };
}

// --- Prüfungen ------------------------------------------------------------------------------
function run() {
  const args = parseArgs(process.argv.slice(2));
  const failures = [];
  const warnings = [];
  const ok = (msg) => console.log(`  ✓ ${msg}`);
  const fail = (msg) => { failures.push(msg); console.log(`  ✗ ${msg}`); };
  const warn = (msg) => { warnings.push(msg); console.log(`  ! ${msg}`); };

  let asarPath = args.asar ? path.resolve(args.asar) : findAsar(path.join(ROOT, 'dist'));
  let src;
  if (asarPath && fs.existsSync(asarPath)) {
    src = makeAsarSource(asarPath);
  } else {
    if (args.asar) console.log(`Angegebenes --asar nicht gefunden: ${args.asar}\n`);
    src = makeSourceTreeSource();
  }
  console.log(`Prüfe: ${src.label}\n`);

  // 1) Hauptanwendung/Preload/Rendererdateien
  console.log('-- Grunddateien --');
  ['main.js', 'preload.js', 'package.json'].forEach((f) => {
    src.exists(f) ? ok(f) : fail(`${f} fehlt`);
  });
  ['src/index.html', 'src/js/app.js', 'src/css/style.css'].forEach((f) => {
    src.exists(f) ? ok(f) : fail(`Rendererdatei fehlt: ${f}`);
  });

  // 2) Kurs-1-Daten
  console.log('\n-- Kurs-1-Daten --');
  const courseFiles = [
    'language-packs/arabic/language.json', 'language-packs/arabic/lessons.json',
    'language-packs/arabic/vocabulary.json', 'language-packs/arabic/vocabSessions.json',
    'language-packs/arabic/courses.json', 'language-packs/arabic/theory.json',
    'language-packs/arabic/keyboard.json'
  ];
  courseFiles.forEach((f) => { src.exists(f) ? ok(f) : fail(`Kursdatei fehlt: ${f}`); });

  let vocabWords = [];
  let sessionCount = 0;
  const vocabRaw = src.readText('language-packs/arabic/vocabulary.json');
  if (vocabRaw) {
    const vocab = JSON.parse(vocabRaw);
    vocabWords = (vocab.categories || []).flatMap((c) => c.words || []);
    vocabWords.length === 900 ? ok(`900 Vokabeleinträge (${vocabWords.length})`)
      : fail(`Erwartet 900 Vokabeleinträge, gefunden ${vocabWords.length}`);
  } else {
    fail('vocabulary.json nicht lesbar -- Vokabelanzahl nicht prüfbar');
  }
  const sessionsRaw = src.readText('language-packs/arabic/vocabSessions.json');
  if (sessionsRaw) {
    const vs = JSON.parse(sessionsRaw);
    sessionCount = (vs.sessions || []).length;
    sessionCount === 90 ? ok(`90 Sessions (${sessionCount})`)
      : fail(`Erwartet 90 Sessions, gefunden ${sessionCount}`);
  } else {
    fail('vocabSessions.json nicht lesbar -- Sessionanzahl nicht prüfbar');
  }

  // 3) Referenzierte Audios (echte Referenzen aus den Kursdaten, nicht nur Dateianzahl)
  console.log('\n-- Referenzierte Audiodateien --');
  let missingNormal = 0;
  let missingSlow = 0;
  let presentSlow = 0;
  for (const word of vocabWords) {
    if (!word.audio_key) continue;
    const normalPath = `language-packs/arabic/audio/${word.audio_key}.wav`;
    if (!src.exists(normalPath)) missingNormal += 1;
    // Nicht jedes Wort hat eine langsame Variante (nur die 141 Bestandswörter, siehe
    // audio-provenance.json) -- geprüft wird daher gegen die tatsächlich im Repository
    // vorhandenen Quelldateien, nicht gegen alle 900 Wörter.
    const slowSourcePath = path.join(ROOT, 'language-packs', 'arabic', 'audio', `${word.audio_key}_slow.wav`);
    if (fs.existsSync(slowSourcePath)) {
      const slowPackedPath = `language-packs/arabic/audio/${word.audio_key}_slow.wav`;
      if (src.exists(slowPackedPath)) presentSlow += 1; else missingSlow += 1;
    }
  }
  missingNormal === 0 ? ok(`alle referenzierten normalen Audios vorhanden (${vocabWords.length - missingNormal}/${vocabWords.length})`)
    : fail(`${missingNormal} referenzierte normale Audiodateien fehlen im Paket`);
  missingSlow === 0 ? ok(`alle vorhandenen langsamen Audios im Paket enthalten (${presentSlow} geprüft)`)
    : fail(`${missingSlow} vorhandene langsame Audiodateien fehlen im Paket`);

  // 4) Audioherkunft + Lizenz-/Hinweisdokumente
  console.log('\n-- Herkunfts-/Lizenzdokumentation --');
  src.exists('language-packs/arabic/audio-provenance.json')
    ? ok('audio-provenance.json enthalten')
    : fail('language-packs/arabic/audio-provenance.json fehlt im Paket');
  ['LICENSE', 'LICENSES.md', 'NOTICE-AUDIO.md'].forEach((f) => {
    src.exists(f) ? ok(`${f} enthalten`) : fail(`${f} fehlt im Paket (Abschnitt 7.4: muss im Info-/Lizenzbereich der Anwendung sichtbar sein)`);
  });

  // 5) Ausschlüsse: keine Entwicklungs-/Geheimnisdateien im Paket
  console.log('\n-- Ausschlüsse (dürfen NICHT im Paket sein) --');
  const all = src.listAll();
  const flagIfAny = (predicate, label) => {
    const hits = all.filter(predicate);
    hits.length === 0 ? ok(`${label}: keine gefunden`) : fail(`${label}: ${hits.length} gefunden, z. B. "${hits[0]}"`);
  };
  flagIfAny((f) => f === '.env' || f.endsWith('/.env') || /\.env\.[a-z]+$/i.test(f), 'keine .env-Datei');
  flagIfAny((f) => f.startsWith('test/') || f === 'test', 'kein test/-Ordner');
  flagIfAny((f) => f.startsWith('user_data/') || /\.progress\.json$/.test(f) || f.endsWith('settings.json') && f.startsWith('user_data'), 'keine Nutzerfortschrittsdateien');
  flagIfAny((f) => f.startsWith('ui-smoke-output/') || /ui-smoke.*\.png$/i.test(f), 'keine UI-Smoke-Screenshots');
  flagIfAny((f) => f.startsWith('src/review/'), 'kein Sprachprüf-Arbeitsbereich (src/review/, nur für npm run review:start)');
  flagIfAny((f) => f.startsWith('language-review/'), 'keine Sprachprüf-Rohdaten (language-review/)');
  flagIfAny((f) => /\.staging\//.test(f), 'keine Audio-Pipeline-Staging-Dateien (.staging/)');

  // 6) Grobe Geheimnissuche im Textinhalt gepackter Dateien
  console.log('\n-- Geheimnissuche im Paketinhalt --');
  const SECRET_PATTERNS = [
    { name: 'ElevenLabs-API-Key-Muster', re: /\bel[_-]?[a-z0-9]{28,}\b/i },
    { name: 'generisches "api_key/secret/token"-Zuweisungsmuster mit langem Wert', re: /(api[_-]?key|secret|token|password)\s*[:=]\s*["'`][A-Za-z0-9_\-]{20,}["'`]/i },
    { name: 'AWS Access Key', re: /AKIA[0-9A-Z]{16}/ },
    { name: 'GitHub Token', re: /gh[pousr]_[A-Za-z0-9]{20,}/ },
    { name: 'Slack Token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ }
  ];
  const TEXT_EXT = /\.(js|json|html|css|md|txt)$/i;
  let secretHits = 0;
  for (const f of all) {
    if (!TEXT_EXT.test(f)) continue;
    if (f.startsWith('language-packs/arabic/audio')) continue; // Binärdateien, nie Text
    const text = src.readText(f);
    if (!text) continue;
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.re.test(text)) {
        fail(`möglicher Schlüssel/Token (${pattern.name}) in ${f}`);
        secretHits += 1;
      }
    }
  }
  if (secretHits === 0) ok('keine erkennbaren API-Schlüssel/Tokens gefunden');

  // 7) node_modules nicht als extern erforderlicher Ordner
  console.log('\n-- Laufzeitabhängigkeiten --');
  const pkgRaw = src.readText('package.json');
  if (pkgRaw) {
    const pkg = JSON.parse(pkgRaw);
    const deps = pkg.dependencies || {};
    Object.keys(deps).length === 0
      ? ok('keine externen npm-Laufzeitabhängigkeiten (nur Electron selbst als Laufzeit)')
      : warn(`package.json enthält "dependencies": ${Object.keys(deps).join(', ')} -- sicherstellen, dass diese NICHT als externer node_modules-Ordner neben app.asar erwartet werden`);
    if (src.isRealPackage) {
      const hasExternalNodeModules = all.some((f) => f.startsWith('node_modules/'));
      hasExternalNodeModules
        ? fail('node_modules/ ist Teil des Pakets (sollte in asar eingebettet oder gar nicht nötig sein)')
        : ok('kein externer node_modules-Ordner im Paket');
    }

    // 8) Paketversion vs. Tag
    console.log('\n-- Version --');
    console.log(`  Paketversion: ${pkg.version}`);
    if (args.tag) {
      const cleanTag = args.tag.replace(/^v/, '');
      cleanTag === pkg.version
        ? ok(`Version stimmt mit Tag überein (${args.tag})`)
        : fail(`Version (${pkg.version}) stimmt NICHT mit Tag (${args.tag}) überein`);
    } else if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME) {
      const cleanTag = process.env.GITHUB_REF_NAME.replace(/^v/, '');
      cleanTag === pkg.version
        ? ok(`Version stimmt mit Git-Tag überein (${process.env.GITHUB_REF_NAME})`)
        : fail(`Version (${pkg.version}) stimmt NICHT mit Git-Tag (${process.env.GITHUB_REF_NAME}) überein`);
    } else {
      warn('kein --tag angegeben und kein GitHub-Actions-Tag-Kontext erkannt -- Versionsvergleich übersprungen');
    }
  } else {
    fail('package.json nicht lesbar -- Version/Laufzeitabhängigkeiten nicht prüfbar');
  }

  if (!src.isRealPackage) {
    warn('Dies war eine SOURCE-Prüfung, kein echtes gebautes Paket -- ersetzt nicht die CI-Prüfung gegen ein reales app.asar.');
  }

  console.log(`\n${failures.length === 0 ? 'release:verify: OK' : 'release:verify: FEHLGESCHLAGEN'} (${failures.length} Fehler, ${warnings.length} Hinweise)`);
  if (failures.length > 0) process.exit(1);
}

run();
