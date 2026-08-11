#!/usr/bin/env node
// npm run ui:smoke — Entwicklungsauftrag 18, Abschnitt 7. Schlanker, reproduzierbarer
// UI-Smoke-Test gegen die ECHTE Electron-Oberfläche (kein neues Test-Framework: playwright-core
// treibt den bereits vorhandenen Electron-Prozess, dasselbe Muster wie bei der visuellen
// Verifikation der vorherigen Entwicklungsaufträge). Startet mit einem isolierten, temporären
// --user-data-dir -- das echte Nutzerprofil/die echten Einstellungen/der echte Fortschritt werden
// NIE verändert. Prüft eine kleine, repräsentative Auswahl an Ansichten (Dashboard, Einstellungen,
// Lernkarte, Zuordnungsaufgabe, Fehlerfeedback, Zusammenfassung) auf unbehandelte JS-Fehler,
// horizontales Überlaufen, Hauptschaltflächen außerhalb des sichtbaren Bereichs, Überlagerung von
// Feedback und Aktionsleiste sowie fehlende zugängliche Namen bei Schaltflächen. Screenshots
// gehen in den ignorierten Ordner ui-smoke-output/ (siehe .gitignore), nie ins Quellpaket.

'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'ui-smoke-output');

function loadPlaywright() {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    return require('playwright-core');
  } catch (err) {
    return null;
  }
}

let shotIndex = 0;
function shotPath(name) {
  shotIndex += 1;
  return path.join(OUTPUT_DIR, `${String(shotIndex).padStart(2, '0')}-${name}.png`);
}

async function shot(win, name) {
  const p = shotPath(name);
  await win.screenshot({ path: p });
  return p;
}

async function robustClick(handle) {
  // Klickt über die native DOM-API statt Playwrights eigener Hit-Test-Logik -- robuster gegen
  // die feste (sticky) Aktionsleiste, die je nach Scroll-Position Klicks abfangen kann.
  await handle.evaluate((el) => el.click());
}

async function clickText(win, selector, text) {
  const handles = await win.$$(selector);
  for (const h of handles) {
    const t = (await h.textContent() || '').trim();
    if (t.includes(text)) { await robustClick(h); return true; }
  }
  return false;
}
async function clickWeiter(win) { return clickText(win, 'button', 'Weiter'); }

async function scrollContentToTop(win) {
  await win.evaluate(() => { const el = document.querySelector('.content'); if (el) el.scrollTop = 0; });
}
async function scrollContentToBottom(win) {
  await win.evaluate(() => { const el = document.querySelector('.content'); if (el) el.scrollTop = el.scrollHeight; });
}
async function stageHeading(win) {
  const el = await win.$('text=/Stufe \\d+ von 10/');
  if (!el) return null;
  return (await el.textContent() || '').trim();
}

// --- Automatisierte Prüfungen (Abschnitt 7) -----------------------------------------------------
async function checkNoHorizontalOverflow(win, label, findings) {
  const info = await win.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  if (info.scrollWidth > info.clientWidth + 2) {
    findings.push(`[Überlauf] ${label}: horizontales Überlaufen der Hauptansicht (${info.scrollWidth}px Inhalt, ${info.clientWidth}px sichtbar)`);
  }
}

async function checkMainNavVisible(win, label, findings) {
  const info = await win.evaluate(() => {
    const vw = window.innerWidth;
    const navButtons = Array.from(document.querySelectorAll('.main-nav button'));
    const out = navButtons.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > vw + 1);
    });
    return { total: navButtons.length, outCount: out.length };
  });
  if (info.total > 0 && info.outCount > 0) {
    findings.push(`[Außerhalb] ${label}: ${info.outCount} von ${info.total} Hauptnavigations-Schaltflächen liegen außerhalb des sichtbaren Bereichs`);
  }
}

async function checkActionBarButtonVisible(win, label, findings) {
  const info = await win.evaluate(() => {
    const bar = document.querySelector('.action-bar');
    if (!bar) return null;
    const btn = bar.querySelector('button');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vw: window.innerWidth, vh: window.innerHeight };
  });
  if (info && (info.right > info.vw + 1 || info.left < -1 || info.top > info.vh + 1)) {
    findings.push(`[Außerhalb] ${label}: Hauptschaltfläche der festen Aktionsleiste liegt außerhalb des sichtbaren Bereichs`);
  }
}

async function checkFeedbackActionBarOverlap(win, label, findings) {
  await scrollContentToBottom(win);
  await win.waitForTimeout(150);
  const info = await win.evaluate(() => {
    const panel = document.querySelector('.feedback-panel');
    const bar = document.querySelector('.action-bar');
    if (!panel || !bar) return null;
    const pr = panel.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    return { panelBottom: pr.bottom, barTop: br.top };
  });
  if (info && info.panelBottom > info.barTop + 4) {
    findings.push(`[Überlagerung] ${label}: Feedback-Panel überlappt die feste Aktionsleiste (Panel endet bei ${Math.round(info.panelBottom)}px, Leiste beginnt bei ${Math.round(info.barTop)}px)`);
  }
}

async function checkAccessibleNames(win, label, findings) {
  const missing = await win.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.content button, .sidebar button, .app-header button'));
    return buttons.filter((b) => {
      const text = (b.textContent || '').trim();
      const ariaLabel = b.getAttribute('aria-label');
      const title = b.getAttribute('title');
      return !text && !ariaLabel && !title;
    }).length;
  });
  if (missing > 0) {
    findings.push(`[Name fehlt] ${label}: ${missing} geprüfte Schaltfläche(n) ohne zugänglichen Namen (kein Text/aria-label/title)`);
  }
}

async function runChecks(win, label, findings) {
  await checkNoHorizontalOverflow(win, label, findings);
  await checkMainNavVisible(win, label, findings);
  await checkActionBarButtonVisible(win, label, findings);
  await checkAccessibleNames(win, label, findings);
}

// --- Ablauf -------------------------------------------------------------------------------------
async function driveToStage6(win) {
  let guard = 0;
  while (guard < 60) {
    guard += 1;
    await scrollContentToTop(win);
    const heading = await stageHeading(win);
    if (heading && /Stufe 6 von 10/.test(heading)) return true;
    const clicked = (await clickWeiter(win))
      || (await clickText(win, 'button', 'Verstanden'))
      || (await clickText(win, 'button', 'Lernen beginnen'))
      || (await clickText(win, 'button', 'Nächstes Wort'));
    if (!clicked) {
      const opt = await win.$('.rating-buttons button');
      if (opt) await robustClick(opt);
    }
    await win.waitForTimeout(150);
  }
  return false;
}

async function findButtonExact(win, text) {
  const buttons = await win.$$('button');
  for (const b of buttons) {
    const t = (await b.textContent() || '').trim();
    if (t === text) return b;
  }
  return null;
}

/** Löst genau eine Zuordnungsgruppe vollständig, Paar für Paar -- dasselbe bewährte Muster wie
 * solveMatchingGroup() in test/unit/sessionController.e2e.test.js, nur gegen die echte Seite. */
async function solveMatchingGroupOnce(win) {
  let safety = 0;
  while (safety < 200) {
    safety += 1;
    const result = await win.evaluate(() => {
      const grid = document.querySelector('.matching-grid');
      if (!grid) return { done: true };
      const leftButtons = Array.from(grid.children[0].querySelectorAll('button'));
      const target = leftButtons.find((b) => !b.disabled);
      if (!target) return { done: true };
      target.click();
      const rightButtons = Array.from(grid.children[1].querySelectorAll('button')).filter((b) => !b.disabled);
      for (const cand of rightButtons) {
        cand.click();
        if (target.disabled) return { done: false };
        target.click(); // falscher Versuch hat die Auswahl zurückgesetzt -- erneut auswählen
      }
      return { done: false };
    });
    if (result.done) return;
  }
}

/** Klickt Baustein-Kacheln (Stufe 8, "Schreiben mit Hilfe") in Reihenfolge, bis keine mehr übrig
 * sind -- Kachel-Rekonstruktion analog zum Testmuster in sessionController.e2e.test.js. */
async function reconstructTiles(win) {
  const chrome = ['Theorie ansehen', 'Session verlassen', 'Zurücksetzen', 'Prüfen', 'Hilfe', 'Audio'];
  let guard = 0;
  while (guard < 50) {
    guard += 1;
    const clicked = await win.evaluate((chromeList) => {
      const buttons = Array.from(document.querySelectorAll('.content button'));
      const tile = buttons.find((b) => {
        const t = b.textContent.trim();
        return t !== '' && !chromeList.includes(t);
      });
      if (!tile) return false;
      tile.click();
      return true;
    }, chrome);
    if (!clicked) return;
    await win.waitForTimeout(80);
  }
}

/** Durchläuft die gradierten Übungsstufen (6-9: Wiedererkennen/Zuordnung/Schreiben mit und ohne
 * Hilfe) bis zur Zusammenfassung (Stufe 10) -- ein einziger generischer Ablauf statt separater,
 * stufenspezifischer Schleifen, mit ein paar wenigen, gezielten Zwischenaufnahmen. */
async function driveThroughExercises(win, findings) {
  let guard = 0;
  let capturedMatching = false;
  let capturedFeedback = false;

  while (guard < 300) {
    guard += 1;
    if (process.env.UI_SMOKE_DEBUG && guard % 5 === 0) {
      const h = await stageHeading(win);
      console.error(`[debug] guard=${guard} heading=${h}`);
    }
    await scrollContentToTop(win);
    const state = await win.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return {
        done: bodyText.includes('Session abgeschlossen') || bodyText.includes('Session beendet'),
        hasMatching: !!document.querySelector('.matching-grid'),
        hasOptions: !!document.querySelector('.rating-buttons button'),
        hasInput: !!document.querySelector('.content input'),
        hasPruefen: Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Prüfen')
      };
    });
    if (state.done) return true;

    if (state.hasMatching) {
      if (!capturedMatching) {
        capturedMatching = true;
        await shot(win, 'zuordnung');
        await runChecks(win, 'Zuordnungsaufgabe', findings);
      }
      await solveMatchingGroupOnce(win);
      await win.waitForTimeout(150);
      await clickWeiter(win);
      await win.waitForTimeout(150);
      continue;
    }

    if (state.hasOptions) {
      const opt = await win.$('.rating-buttons button');
      if (opt) await robustClick(opt);
      await win.waitForTimeout(150);
    } else if (state.hasInput) {
      const input = await win.$('.content input');
      await input.evaluate((el) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, 'falsch');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const pruefen = await findButtonExact(win, 'Prüfen');
      if (pruefen) await robustClick(pruefen);
      await win.waitForTimeout(200);
    } else if (state.hasPruefen) {
      await reconstructTiles(win);
      const pruefen = await findButtonExact(win, 'Prüfen');
      if (pruefen) await robustClick(pruefen);
      await win.waitForTimeout(200);
    } else {
      // Nichts Bekanntes gefunden (z. B. Übergangs-/Zwischenbildschirm) -- einfach "Weiter"
      // versuchen und andernfalls abbrechen, um keine Endlosschleife zu riskieren.
      const advanced = await clickWeiter(win);
      if (!advanced) break;
      await win.waitForTimeout(150);
      continue;
    }

    // Nach dem Beantworten sollte jetzt das Feedback-Panel sichtbar sein -- einmalig aufnehmen und
    // prüfen (inkl. der geforderten 900×600-Kontrolle), BEVOR "Weiter" es wieder wegklickt.
    await scrollContentToTop(win);
    const feedbackNow = await win.evaluate(() => !!document.querySelector('.feedback-panel'));
    if (feedbackNow && !capturedFeedback) {
      capturedFeedback = true;
      await shot(win, 'feedback-umfangreich');
      await checkFeedbackActionBarOverlap(win, 'Feedback (umfangreich)', findings);
      await runChecks(win, 'Feedback (umfangreich)', findings);
      await win.setViewportSize({ width: 900, height: 600 });
      await win.waitForTimeout(250);
      await shot(win, 'feedback-900x600');
      await checkFeedbackActionBarOverlap(win, 'Feedback (900×600)', findings);
      await runChecks(win, 'Feedback (900×600)', findings);
      await win.setViewportSize({ width: 1366, height: 768 });
      await win.waitForTimeout(200);
      await scrollContentToTop(win);
    }

    await clickWeiter(win);
    await win.waitForTimeout(150);
  }
  return false;
}

async function main() {
  const pw = loadPlaywright();
  if (!pw) {
    console.error('UI-Smoke-Test übersprungen: playwright-core ist nicht installiert (siehe package.json#devDependencies).');
    console.error('In dieser Sandbox kann "npm install" für dieses Paket hängen bleiben (bekannte, umgebungsspezifische');
    console.error('Einschränkung, siehe Abschlussbericht) -- kein weiterer Versuch mit einer anderen Installationsart.');
    process.exit(1);
  }

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vt-ui-smoke-'));
  console.log('Isoliertes, temporäres Nutzerprofil:', isolatedDir);

  const env = { ...process.env, DISPLAY: process.env.DISPLAY || ':0' };
  delete env.ELECTRON_RUN_AS_NODE;

  let app;
  try {
    app = await pw._electron.launch({ args: [ROOT, `--user-data-dir=${isolatedDir}`], cwd: ROOT, env, timeout: 20000 });
  } catch (err) {
    console.error('UI-Smoke-Test: die grafische Electron-Oberfläche konnte nicht gestartet werden (Umgebungsblocker):');
    console.error(String((err && err.message) || err));
    console.error('Kein weiterer Versuch mit einer anderen Konfiguration/Installation (Abschnitt 7).');
    fs.rmSync(isolatedDir, { recursive: true, force: true });
    process.exit(1);
  }

  const jsErrors = [];
  const findings = [];
  let audioErrorsIgnored = 0;

  try {
    const win = await app.firstWindow();
    win.on('pageerror', (err) => jsErrors.push(String((err && err.message) || err)));
    win.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // AudioFeedback.reportAudioError() (audioFeedback.js) protokolliert erwartungsgemäß und
      // GEFANGEN "[Audio] Fehler in ..." Meldungen, wenn Wiedergabe fehlschlägt -- z. B. weil diese
      // Sandbox kein funktionierendes Audio-Ausgabegerät hat. Kein unbehandelter Fehler, keine
      // UI-Auffälligkeit, und Audio-Verifikation ist für diesen Smoke-Test ausdrücklich nicht
      // vorgesehen (Auftrag, Abschnitt 8/9) -- daher hier bewusst ausgeklammert.
      if (/^\[Audio\] Fehler in/.test(text)) { audioErrorsIgnored += 1; return; }
      jsErrors.push(text);
    });

    await win.setViewportSize({ width: 1366, height: 768 });
    await win.waitForTimeout(1200);

    // --- Dashboard (Hellmodus, Standard) ---
    await shot(win, 'dashboard-light');
    await runChecks(win, 'Dashboard (1366×768, hell)', findings);

    // --- Einstellungen inkl. neuer Anzeigeoption ---
    await win.evaluate(() => { App.navigateToSettings(); });
    await win.waitForTimeout(400);
    const scaleSelect = await win.$('#settings-arabic-font-scale');
    if (!scaleSelect) {
      findings.push('[Fehlt] Einstellungen: "Arabische Schriftgröße" nicht gefunden');
    } else {
      const optionCount = await win.evaluate((sel) => sel.querySelectorAll('option').length, scaleSelect);
      if (optionCount !== 3) findings.push(`[Unerwartet] Einstellungen: Arabische Schriftgröße hat ${optionCount} statt 3 Stufen`);
    }
    await shot(win, 'settings-light');
    await runChecks(win, 'Einstellungen (hell)', findings);

    // --- Dunkelmodus umschalten (kompakter Kopfbereich-Schalter) ---
    const darkBtn = await win.$('button[aria-label*="Dunkeles Farbschema"]');
    if (darkBtn) { await robustClick(darkBtn); await win.waitForTimeout(300); }
    await shot(win, 'settings-dark');
    await runChecks(win, 'Einstellungen (dunkel)', findings);

    // Zurück zu Hell für den Rest des Durchlaufs.
    const lightBtn = await win.$('button[aria-label*="Helles Farbschema"]');
    if (lightBtn) { await robustClick(lightBtn); await win.waitForTimeout(300); }

    // --- Session: Lernkarte (Stufe 3), Zuordnung (Stufe 7), Fehlerfeedback (Stufe 6/9) ---
    await win.evaluate(() => { App.navigateToSession('vocab_unit_01', 'vocab_unit_01_a'); });
    await win.waitForTimeout(500);
    await clickText(win, 'button', 'Lernen beginnen');
    await win.waitForTimeout(300);
    await clickText(win, 'button', 'Weiter zu den Lernkarten');
    await win.waitForTimeout(300);
    await shot(win, 'lernkarte');
    await runChecks(win, 'Lernkarte (Stufe 3)', findings);

    const reachedStage6 = await driveToStage6(win);
    if (!reachedStage6) {
      findings.push('[Fehlt] Stufe 6 (Wiedererkennen) wurde innerhalb des Prüfbudgets nicht erreicht');
    } else {
      // --- Stufen 6-9 (Wiedererkennen, Zuordnung, Schreiben mit/ohne Hilfe) bis zur
      // Zusammenfassung (Stufe 10) -- ein Durchlauf, wenige gezielte Zwischenaufnahmen.
      const reachedSummary = await driveThroughExercises(win, findings);
      if (!reachedSummary) {
        findings.push('[Fehlt] Die Zusammenfassung (Stufe 10) wurde innerhalb des Prüfbudgets nicht erreicht');
      } else {
        await scrollContentToTop(win);
        await shot(win, 'zusammenfassung');
        await runChecks(win, 'Zusammenfassung (Stufe 10)', findings);
      }
    }
  } catch (err) {
    findings.push(`[Ausnahme] Unerwarteter Fehler während des Smoke-Tests: ${String((err && err.stack) || err)}`);
  } finally {
    await app.close().catch(() => {});
    fs.rmSync(isolatedDir, { recursive: true, force: true });
  }

  // --- Zusammenfassung ---
  console.log('');
  console.log(`Screenshots: ${OUTPUT_DIR} (${shotIndex} Datei(en))`);
  if (audioErrorsIgnored > 0) {
    console.log(`Ignoriert: ${audioErrorsIgnored} erwartete Audio-Wiedergabefehler (kein Audio-Ausgabegerät in dieser Umgebung, keine Audio-Verifikation vorgesehen)`);
  }
  console.log(`Unbehandelte JS-Fehler: ${jsErrors.length}`);
  jsErrors.forEach((e) => console.log(`  - ${e}`));
  console.log(`Layout-/A11y-Befunde: ${findings.length}`);
  findings.forEach((f) => console.log(`  - ${f}`));

  if (jsErrors.length > 0 || findings.length > 0) {
    console.log('');
    console.log('UI-Smoke-Test: FEHLGESCHLAGEN');
    process.exit(1);
  }
  console.log('');
  console.log('UI-Smoke-Test: OK');
}

main();
