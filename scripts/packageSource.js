#!/usr/bin/env node
// Entwicklungsauftrag 7, Abschnitt 26/27 ("npm run package:source") — erzeugt eine saubere
// Quellcode-ZIP OHNE node_modules (bisheriges Problem: mehrere hundert MB in der Übergabe-ZIP)
// und MIT .gitignore/.github, die laut README/ROADMAP im Repository vorhanden sein sollen.
//
// Nutzt das auf den meisten Linux-/macOS-Systemen vorinstallierte `zip`-CLI-Tool (kein
// zusätzliches npm-Package nötig). Bricht mit einer klaren Fehlermeldung ab, wenn `zip` fehlt.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist-source');
const OUT_FILE = path.join(OUT_DIR, 'learning-arabic-source.zip');

// Nur diese Top-Level-Einträge werden aufgenommen (Entwicklungsauftrag 7, Abschnitt 26) —
// bewusst eine Allowlist statt einer Blockliste, damit neue, versehentlich nicht ignorierte
// Verzeichnisse nicht automatisch mit in die Übergabe-ZIP rutschen.
const INCLUDE = [
  'src',
  'language-packs',
  'test',
  'scripts',
  'language-review',
  'package.json',
  'package-lock.json',
  'README.md',
  'ROADMAP.md',
  'LICENSE',
  'LICENSES.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  '.gitignore',
  '.github',
  'main.js',
  'preload.js',
  'audio_generation_manifest.json'
].filter((entry) => fs.existsSync(path.join(ROOT, entry)));

// Innerhalb der aufgenommenen Verzeichnisse zusätzlich ausschließen (Entwicklungsauftrag 7,
// Abschnitt 26): node_modules, dist, dist-source, .git, __pycache__, *.pyc, Nutzerdaten, Logs,
// temporäre Dateien.
const EXCLUDE_PATTERNS = [
  '*/node_modules/*', 'node_modules/*',
  '*/dist/*', 'dist/*',
  '*/dist-source/*', 'dist-source/*',
  '*/.git/*', '.git/*',
  '*/__pycache__/*', '__pycache__/*', '*.pyc',
  '*/user_data/*', 'user_data/*',
  '*.log', '*.DS_Store', 'Thumbs.db',
  '*.tmp', '*.tmp-*', '*.bak'
];

function which(cmd) {
  try {
    execFileSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

if (!which('zip')) {
  console.error('FEHLER: Das Kommandozeilenwerkzeug "zip" wurde nicht gefunden. Bitte installieren (z. B. "apt install zip") und erneut versuchen.');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);

const args = ['-r', '-q', OUT_FILE, ...INCLUDE, '-x', ...EXCLUDE_PATTERNS];
execFileSync('zip', args, { cwd: ROOT, stdio: 'inherit' });

// --- Verifikation: node_modules darf unter keinen Umständen enthalten sein --------------------
const listing = execFileSync('unzip', ['-Z1', OUT_FILE], { cwd: ROOT }).toString('utf-8').split('\n').filter(Boolean);
const forbidden = listing.filter((entry) => /(^|\/)node_modules\//.test(entry) || /(^|\/)\.git\//.test(entry) || /(^|\/)__pycache__\//.test(entry) || entry.endsWith('.pyc'));
if (forbidden.length > 0) {
  console.error(`FEHLER: Die erzeugte ZIP enthält ${forbidden.length} verbotene Einträge (node_modules/.git/__pycache__), z. B.: ${forbidden.slice(0, 5).join(', ')}`);
  process.exit(1);
}
const hasGitignore = listing.includes('.gitignore');
const hasWorkflow = listing.some((e) => e.startsWith('.github/workflows/'));
if (!hasGitignore) console.error('WARNUNG: .gitignore fehlt in der erzeugten ZIP.');
if (!hasWorkflow) console.error('WARNUNG: .github/workflows/ fehlt in der erzeugten ZIP.');

const stats = fs.statSync(OUT_FILE);
console.log(`\nErzeugt: ${path.relative(ROOT, OUT_FILE)} (${(stats.size / 1024 / 1024).toFixed(1)} MB, ${listing.length} Einträge)`);
console.log(`OK: keine node_modules/.git/__pycache__-Einträge enthalten.`);
console.log(`.gitignore enthalten: ${hasGitignore ? 'ja' : 'NEIN'}`);
console.log(`.github/workflows/ enthalten: ${hasWorkflow ? 'ja' : 'NEIN'}`);
