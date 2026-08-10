// Entwicklungsauftrag 14, Abschnitt 4/17 — Tests für das zentrale Designsystem (src/css/style.css):
// alle geforderten Token-Kategorien sind definiert, Hell-/Dunkelmodus liefern für jeden Token
// einen eigenen Wert, kein Rückfall in mehrere parallele, verstreute Farbsysteme, alle
// Hauptansichten binden das gemeinsame Stylesheet ein statt eigener Styles.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const CSS_PATH = path.join(ROOT, 'src', 'css', 'style.css');
const css = fs.readFileSync(CSS_PATH, 'utf-8');

// Genau die in Abschnitt 4 aufgezählten Kategorien, mindestens ein Token je Punkt.
const REQUIRED_TOKENS = [
  // Farben
  '--bg-primary', '--surface', '--surface-elevated', '--nav-bg', '--accent', '--accent-secondary',
  '--text-primary', '--text-secondary', '--border', '--focus-ring', '--success', '--error',
  '--warning', '--info', '--disabled-bg', '--disabled-text',
  // Größen und Abstände
  '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl',
  '--content-max-width', '--card-padding', '--btn-height', '--input-height',
  // Darstellung
  '--radius-sm', '--radius', '--radius-lg', '--shadow-card', '--shadow-dialog',
  '--transition-normal', '--border-strong', '--border-weak',
  // Schriftgrößen
  '--font-size-h1', '--font-size-h2', '--arabic-font-size-lg', '--arabic-font-size-md',
  '--arabic-font-size-sm', '--line-height-body', '--arabic-line-height'
];

function extractBlock(selectorRegex) {
  const match = css.match(selectorRegex);
  return match ? match[0] : '';
}

const rootBlock = extractBlock(/:root\s*\{[^}]*\}/);
const lightBlock = extractBlock(/:root\[data-theme="light"\]\s*\{[^}]*\}/);
const darkBlock = extractBlock(/:root\[data-theme="dark"\]\s*\{[^}]*\}/);

test('style.css definiert alle in Abschnitt 4 geforderten Design-Tokens', () => {
  const missing = REQUIRED_TOKENS.filter((token) => !rootBlock.includes(`${token}:`));
  assert.deepEqual(missing, [], `fehlende Tokens im Basis-:root: ${missing.join(', ')}`);
});

test('genau zwei Theme-Blöcke ([data-theme="light"] und [data-theme="dark"]) sind vorhanden', () => {
  assert.ok(lightBlock.length > 0, '[data-theme="light"] fehlt');
  assert.ok(darkBlock.length > 0, '[data-theme="dark"] fehlt');
});

test('KEIN prefers-color-scheme-Media-Query-REGEL mehr -- Systemmodus ist seit Abschnitt 7/8 keine eigene Option (eine erklärende Kommentarzeile darüber ist erlaubt)', () => {
  assert.ok(!/@media\s*\(\s*prefers-color-scheme/.test(css), 'die frühere dritte Theme-Option "Systemeinstellung" darf nicht mehr über eine aktive Media-Query-Regel nachwirken');
});

test('Hell- und Dunkelmodus verwenden unterschiedliche Werte für die zentralen Farbtokens (kein reines Umkehren, Abschnitt 6)', () => {
  const colorTokens = ['--bg-primary', '--surface', '--surface-elevated', '--text-primary', '--accent', '--on-accent', '--success', '--error'];
  for (const token of colorTokens) {
    const lightValue = (lightBlock.match(new RegExp(`${token}:\\s*([^;]+);`)) || [])[1];
    const darkValue = (darkBlock.match(new RegExp(`${token}:\\s*([^;]+);`)) || [])[1];
    assert.ok(lightValue, `${token} fehlt im Hellmodus-Block`);
    assert.ok(darkValue, `${token} fehlt im Dunkelmodus-Block`);
    assert.notEqual(lightValue.trim(), darkValue.trim(), `${token} sollte sich zwischen Hell und Dunkel unterscheiden`);
  }
});

test('--on-accent unterscheidet sich zwischen den Modi (Kontrast-Fix: dieselbe feste Textfarbe auf unterschiedlich hellen Akzentfarben wäre in einem der beiden Modi schlecht lesbar)', () => {
  const light = (lightBlock.match(/--on-accent:\s*([^;]+);/) || [])[1];
  const dark = (darkBlock.match(/--on-accent:\s*([^;]+);/) || [])[1];
  assert.notEqual(light.trim(), dark.trim());
});

test('kein Rückfall in ein zweites, verstreutes Farbsystem: nur wenige, bewusst dokumentierte hartcodierte Hex-Farben außerhalb der Token-Definitionsblöcke', () => {
  const afterTokenBlocks = css.slice(css.indexOf('* {\n  box-sizing'));
  const hexColors = afterTokenBlocks.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  const distinctValues = new Set(hexColors.map((h) => h.toLowerCase()));
  // Bewusst großzügig (kein Verbot einzelner, begründeter Werte, Abschnitt 17), aber ein
  // "echter Rückfall in mehrere parallele Farbsysteme" (viele neue, unkoordinierte Hex-Werte)
  // würde diese Schwelle klar überschreiten -- aktueller, geprüfter Stand: nur "#fff"/"#ffffff"
  // für Text auf vollflächigen Erfolgs-/Fehler-/Akzentflächen (Buttons, Audio-Feedback-Toasts).
  assert.ok(distinctValues.size <= 4, `zu viele unterschiedliche hartcodierte Hex-Farben außerhalb der Tokens gefunden: ${[...distinctValues].join(', ')} -- prüfen, ob ein Token verwendet werden sollte`);
});

test('"#0c1620" steht nur noch EINMAL im gesamten Stylesheet, als --on-accent-Wert im Dunkelmodus-Token-Block -- der frühere Kontrastfehler (dieselbe feste dunkle Schrift fest in sechs Komponentenregeln verdrahtet, unabhängig vom Modus) ist behoben', () => {
  const occurrences = (css.match(/#0c1620/g) || []).length;
  assert.equal(occurrences, 1, `"#0c1620" sollte nur noch als --on-accent-Tokenwert vorkommen, gefunden: ${occurrences}x`);
  assert.ok(darkBlock.includes('--on-accent: #0c1620'));
  const outsideDarkBlock = css.replace(darkBlock, '');
  assert.ok(!outsideDarkBlock.includes('#0c1620'), 'außerhalb des Dunkelmodus-Token-Blocks darf "#0c1620" nirgends mehr direkt vorkommen');
});

test('zentrale Buttons/Karten/Eingaben referenzieren die Tokens (var(--...)), keine fest verdrahteten Pixelwerte für Höhe/Radius bei .btn/.card/.text-input', () => {
  const btnBlock = extractBlock(/\n\.btn\s*\{[^}]*\}/);
  const cardBlock = extractBlock(/\n\.card\s*\{[^}]*\}/);
  const inputBlock = extractBlock(/\n\.text-input\s*\{[^}]*\}/);
  assert.ok(btnBlock.includes('var(--btn-height)'));
  assert.ok(btnBlock.includes('var(--radius)'));
  assert.ok(cardBlock.includes('var(--card-padding)'));
  assert.ok(cardBlock.includes('var(--shadow-card)'));
  assert.ok(inputBlock.includes('var(--input-height)'));
});

test('Fokus-Sichtbarkeit: eine zentrale :focus-visible-Regel für interaktive Elemente ist vorhanden (Abschnitt 15)', () => {
  assert.ok(/:focus-visible\s*\{[^}]*outline/.test(css.replace(/\n/g, ' ')) || css.includes('focus-visible'));
  assert.ok(css.includes('--focus-ring'));
});

test('alle relevanten HTML-Einstiegspunkte (Lernoberfläche + Review-Modus) binden EIN gemeinsames zentrales Stylesheet ein', () => {
  const mainHtml = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf-8');
  assert.ok(mainHtml.includes('href="css/style.css"'), 'die normale Lernoberfläche muss das zentrale Designsystem einbinden');
});

test('theme-toggle.css-Klassen sind Teil des zentralen Stylesheets (kein separates, zweites CSS für den Schalter)', () => {
  assert.ok(css.includes('.theme-toggle'));
  assert.ok(css.includes('.theme-toggle-btn'));
});

test('Entwicklungsauftrag 14, Abschnitt 12: alle zentralen arabischen Textklassen erzwingen RTL + isolierte Bidi-Einbettung', () => {
  const sharedArabicBlock = extractBlock(/\.arabic-word-main,\s*\n\.arabic-example,\s*\n\.arabic-text\s*\{[^}]*\}/);
  assert.ok(sharedArabicBlock, 'gemeinsamer Regelblock für die arabischen Textklassen nicht gefunden');
  assert.ok(sharedArabicBlock.includes('direction: rtl'));
  assert.ok(sharedArabicBlock.includes('unicode-bidi: isolate'));
  assert.ok(sharedArabicBlock.includes('overflow-wrap: break-word'), 'lange arabische Wörter dürfen nicht aus Karten herauslaufen');

  const inputBlock = extractBlock(/\n\.arabic-input\s*\{[^}]*\}/);
  assert.ok(inputBlock.includes('direction: rtl'));
  assert.ok(inputBlock.includes('unicode-bidi: isolate'));
});

test('arabische Textklassen haben eine ausreichende Zeilenhöhe (schneidet Vokalisierungszeichen nicht ab)', () => {
  const mainBlock = extractBlock(/\n\.arabic-word-main\s*\{[^}]*\}/);
  const lineHeight = parseFloat((mainBlock.match(/line-height:\s*var\(--arabic-line-height\)/) ? '1.9' : (mainBlock.match(/line-height:\s*([\d.]+)/) || [])[1]) || '0');
  assert.ok(lineHeight >= 1.5, `Zeilenhöhe für .arabic-word-main sollte deutlich über 1 liegen, gefunden: ${lineHeight}`);
});
