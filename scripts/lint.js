#!/usr/bin/env node
// Abhängigkeitsfreies Lint-Skript (kein ESLint-Install nötig, läuft komplett offline):
// 1) node --check über alle JS-Dateien (Syntaxfehler)
// 2) JSON.parse über alle Sprachpaket-Dateien (kaputtes JSON)
// 3) Kollisions-Check: da src/js/*.js und src/js/views/*.js als klassische <script>-Tags ohne
//    Module geladen werden, teilen sich alle top-level const/let/var/function-Deklarationen
//    EIN globales Objekt — ein doppelter Name in zwei Dateien würde beim Start im Browser mit
//    "Identifier has already been declared" crashen (siehe ROADMAP/CLAUDE-Historie).

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let failed = false;

function findFiles(dir, extensions, exclude = ['node_modules', 'dist', '.git']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, extensions, exclude));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function checkJsSyntax() {
  console.log('--- node --check (JS-Syntax) ---');
  const files = [
    ...findFiles(path.join(ROOT, 'src'), ['.js']),
    ...findFiles(path.join(ROOT, 'scripts'), ['.js']),
    ...findFiles(path.join(ROOT, 'test'), ['.js']),
    path.join(ROOT, 'main.js'),
    path.join(ROOT, 'preload.js')
  ].filter((f) => fs.existsSync(f));

  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      failed = true;
      console.error(`FEHLER (Syntax): ${path.relative(ROOT, file)}`);
      console.error(err.stderr ? err.stderr.toString() : err.message);
    }
  }
  console.log(`${files.length} JS-Dateien geprüft.`);
}

function checkJsonSyntax() {
  console.log('--- JSON.parse (Sprachpakete) ---');
  const files = findFiles(path.join(ROOT, 'language-packs'), ['.json']);
  for (const file of files) {
    try {
      JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
      failed = true;
      console.error(`FEHLER (JSON): ${path.relative(ROOT, file)} — ${err.message}`);
    }
  }
  console.log(`${files.length} JSON-Dateien geprüft.`);
}

function checkGlobalIdentifierCollisions() {
  console.log('--- Kollisions-Check (geteilter globaler Scope in src/js) ---');
  const files = [
    ...findFiles(path.join(ROOT, 'src', 'js'), ['.js'])
  ];
  const declPattern = /^(?:const|let|var|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/;
  const declaredIn = new Map(); // name -> [files]

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(declPattern);
      if (!match) continue;
      const name = match[1];
      if (!declaredIn.has(name)) declaredIn.set(name, new Set());
      declaredIn.get(name).add(path.relative(ROOT, file));
    }
  }

  let collisions = 0;
  for (const [name, fileSet] of declaredIn.entries()) {
    if (fileSet.size > 1) {
      collisions += 1;
      failed = true;
      console.error(`FEHLER (Kollision): "${name}" in mehreren Dateien deklariert: ${Array.from(fileSet).join(', ')}`);
    }
  }
  console.log(`${declaredIn.size} globale Top-Level-Bezeichner geprüft, ${collisions} Kollisionen.`);
}

checkJsSyntax();
checkJsonSyntax();
checkGlobalIdentifierCollisions();

if (failed) {
  console.error('\nLint FEHLGESCHLAGEN.');
  process.exit(1);
} else {
  console.log('\nLint OK.');
}
