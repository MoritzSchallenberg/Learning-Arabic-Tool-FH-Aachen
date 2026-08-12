#!/usr/bin/env node
// npm run build:web -- baut die statische, per GitHub Pages hostbare Website nach docs/ (ersetzt
// den bisherigen Installer-Verteilweg, siehe README.md/DEVELOPMENT_FOUNDATION.md). Kopiert genau
// die zur Laufzeit benötigten Dateien (Renderer + aktives Sprachpaket), fügt zwei zusätzliche
// <script>-Tags in eine Kopie von src/index.html ein (webApi.js, progressStore.js -- siehe
// src/js/webApi.js für die Begründung der Ladereihenfolge) und lässt src/index.html sowie
// main.js/preload.js selbst UNVERÄNDERT (weiterhin per `npm start` lokal mit Electron nutzbar).

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs');

function copyDir(srcDir, destDir, { exclude = [] } = {}) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // .staging/ etc. -- nie mit ausliefern
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, { exclude });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildIndexHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');

  const earlyThemeTag = '<script src="js/earlyTheme.js"></script>';
  if (!html.includes(earlyThemeTag)) {
    throw new Error(`buildWebSite: "${earlyThemeTag}" nicht in src/index.html gefunden -- Skript an geänderte Struktur anpassen.`);
  }
  html = html.replace(earlyThemeTag, `<script src="js/webApi.js"></script>\n  ${earlyThemeTag}`);

  const firstBodyScriptTag = '<script src="js/srs.js"></script>';
  if (!html.includes(firstBodyScriptTag)) {
    throw new Error(`buildWebSite: "${firstBodyScriptTag}" nicht in src/index.html gefunden -- Skript an geänderte Struktur anpassen.`);
  }
  html = html.replace(firstBodyScriptTag, `<script src="js/progressStore.js"></script>\n  ${firstBodyScriptTag}`);

  return html;
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildIndexHtml(), 'utf8');
  // Verhindert, dass GitHub Pages den Ordner durch Jekyll vorverarbeitet (nicht nötig für eine
  // reine statische JS-Anwendung, könnte sonst z. B. Unterordner mit führendem "_" verschlucken).
  fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '', 'utf8');
  fs.copyFileSync(path.join(ROOT, 'src', 'favicon.png'), path.join(OUT_DIR, 'favicon.png'));

  copyDir(path.join(ROOT, 'src', 'css'), path.join(OUT_DIR, 'css'));
  copyDir(path.join(ROOT, 'src', 'js'), path.join(OUT_DIR, 'js'), { exclude: ['review'] });
  copyDir(
    path.join(ROOT, 'language-packs', 'arabic'),
    path.join(OUT_DIR, 'language-packs', 'arabic')
  );

  console.log(`Statische Website gebaut: ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
