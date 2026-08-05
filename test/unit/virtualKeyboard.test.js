// End-zu-Ende-Test von VirtualKeyboard.mount() gegen den DOM-Stub (test/helpers/domStub.js) —
// deckt Tastenzuordnung, Einfügen und Löschen ab (P0.1-Akzeptanzkriterium), ganz ohne Electron
// oder eine echte Browser-Umgebung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub, FakeKeyboardEvent } = require('../helpers/domStub.js');

const keyboardData = require('../../src/js/keyboardData.js');
const textEditing = require('../../src/js/textEditing.js');

function loadVirtualKeyboard() {
  const context = {
    document: createDocumentStub(),
    Event, // in Node global verfügbar (WHATWG Event)
    KeyboardEvent: FakeKeyboardEvent,
    setTimeout,
    console,
    ...keyboardData,
    ...textEditing
  };
  vm.createContext(context);
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'js', 'views', 'virtualKeyboard.js'),
    'utf-8'
  );
  vm.runInContext(src + '\nthis.__VirtualKeyboard = VirtualKeyboard;', context);
  return context.__VirtualKeyboard;
}

function makeInput(doc) {
  const input = doc.createElement('input');
  input.value = '';
  input.selectionStart = 0;
  input.selectionEnd = 0;
  return input;
}

test('VirtualKeyboard rendert alle 28 Grundbuchstaben inkl. ذ als klickbare Tasten', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, {});

  const buttons = container.findAllButtons();
  const labels = buttons.map((b) => b.textContent);
  assert.ok(labels.includes('ذ'), 'ذ-Taste fehlt im gerenderten Layout');
  for (const letter of keyboardData.VIRTUAL_KEYBOARD_ROWS.flat()) {
    assert.ok(labels.includes(letter), `Taste für ${letter} fehlt`);
  }
});

test('Klick auf eine Buchstaben-Taste fügt das Zeichen an der Cursorposition ein', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, {});

  const buttons = container.findAllButtons();
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  babBtn.click();
  assert.equal(input.value, 'ب');

  const alifBtn = buttons.find((b) => b.textContent === 'ا');
  alifBtn.click();
  assert.equal(input.value, 'با');
});

test('virtuelle und physische Eingabe erzeugen dasselbe Unicode-Zeichen (kein Presentation-Form-Codepoint)', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, {});

  const buttons = container.findAllButtons();
  buttons.find((b) => b.textContent === 'ب').click();
  // physische Eingabe simuliert: direktes Setzen wie ein echtes <input> es bei Tastatureingabe täte
  input.value += 'ا';

  assert.equal(input.value, 'با');
  assert.equal(input.value.codePointAt(0), 'ب'.codePointAt(0));
  assert.equal(input.value.codePointAt(1), 'ا'.codePointAt(0));
});

test('Rücktaste löscht Buchstabe+Vokalzeichen (بَ) vollständig als eine Einheit', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, {});

  input.value = 'بَ';
  input.selectionStart = input.value.length;
  input.selectionEnd = input.value.length;

  const buttons = container.findAllButtons();
  const backspaceBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Rücktaste — letztes Zeichen löschen');
  assert.ok(backspaceBtn, 'Rücktaste nicht gefunden');
  backspaceBtn.click();

  assert.equal(input.value, '');
});

test('"Alles löschen" leert das gesamte Eingabefeld', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, {});

  input.value = 'بَاب';
  const buttons = container.findAllButtons();
  const clearBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Gesamtes Eingabefeld löschen');
  assert.ok(clearBtn, '"Alles löschen"-Taste nicht gefunden');
  clearBtn.click();

  assert.equal(input.value, '');
});

test('Bestätigen-Taste ruft onSubmit auf, wenn übergeben', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  let submitted = false;
  VirtualKeyboard.mount(container, input, { onSubmit: () => { submitted = true; } });

  const buttons = container.findAllButtons();
  const submitBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Eingabe bestätigen');
  assert.ok(submitBtn, 'Bestätigen-Taste nicht gefunden');
  submitBtn.click();

  assert.equal(submitted, true);
});

test('Sonderzeichen-Reihe (أ إ آ) ist standardmäßig ausblendbar per Shift-Umschaltung', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { showSpecial: false });

  const buttons = container.findAllButtons();
  // أ ist zunächst versteckt (showSpecial:false), aber als Taste vorhanden.
  const alifHamzaBtn = buttons.find((b) => b.textContent === 'أ');
  assert.ok(alifHamzaBtn, 'أ-Taste fehlt komplett');

  const shiftToggle = buttons.find((b) => (b.getAttribute('aria-label') || '').includes('Sonderzeichen ein- oder ausblenden'));
  assert.ok(shiftToggle, 'Shift/Sonderzeichen-Umschalttaste fehlt');
  shiftToggle.click();
  alifHamzaBtn.click();
  assert.equal(input.value, 'أ');
});

// --- Tastatur-Lernstufen 1-4 (Entwicklungsauftrag 3, Meilenstein B) -----------------------

test('Stufe 1: die als Nächstes benötigte Taste wird stark markiert, andere abgeschwächt', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { keyboardLevel: 1, expectedWord: 'باب' });

  const buttons = container.findAllButtons();
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  const alifBtn = buttons.find((b) => b.textContent === 'ا');

  assert.ok(babBtn.className.includes('vk-key-next'), 'ب (erster erwarteter Buchstabe) sollte hervorgehoben sein');
  assert.ok(alifBtn.className.includes('vk-key-dim'), 'ا sollte in Stufe 1 abgeschwächt sein (noch nicht dran)');
});

test('Stufe 1: Hervorhebung folgt der Eingabe (auch bei simulierter physischer Tastatureingabe)', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { keyboardLevel: 1, expectedWord: 'باب' });

  // Simuliert physische Tastatureingabe: Wert direkt setzen + natives 'input'-Event auslösen
  // (das täte ein echtes <input>-Feld bei Tastatureingabe automatisch).
  input.value = 'ب';
  input.selectionStart = 1;
  input.dispatchEvent({ type: 'input' });

  const buttons = container.findAllButtons();
  const alifBtn = buttons.find((b) => b.textContent === 'ا');
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  assert.ok(alifBtn.className.includes('vk-key-next'), 'nach "ب" sollte ا als Nächstes markiert sein');
  assert.ok(!babBtn.className.includes('vk-key-next'), 'ب sollte nicht mehr markiert sein (schon getippt)');
});

test('Stufe 2: nächste Taste dezent markiert, aber keine Tasten abgeschwächt', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { keyboardLevel: 2, expectedWord: 'باب' });

  const buttons = container.findAllButtons();
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  const alifBtn = buttons.find((b) => b.textContent === 'ا');
  assert.ok(babBtn.className.includes('vk-key-next'));
  assert.ok(!alifBtn.className.includes('vk-key-dim'), 'Stufe 2 darf keine Tasten abschwächen');
});

test('Stufe 3: keine Hervorhebung, auch wenn expectedWord übergeben wurde', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { keyboardLevel: 3, expectedWord: 'باب' });

  const buttons = container.findAllButtons();
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  assert.ok(!babBtn.className.includes('vk-key-next'));
  assert.ok(!babBtn.className.includes('vk-key-dim'));
});

test('Stufe 4: virtuelle Tastatur startet ausgeblendet und kann wieder eingeblendet werden', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { keyboardLevel: 4 });

  const buttons = container.findAllButtons();
  const babBtn = buttons.find((b) => b.textContent === 'ب');
  // Der Buchstabe ist weiterhin im DOM vorhanden (nicht entfernt), nur sein Elternblock ist
  // ausgeblendet.
  assert.ok(babBtn, 'Buchstaben-Tasten sollten trotz Stufe 4 im DOM existieren');

  const toggleBtn = buttons.find((b) => (b.getAttribute('aria-label') || '') === 'Virtuelle Tastatur ein- oder ausblenden');
  assert.ok(toggleBtn, 'Ein-/Ausblenden-Taste fehlt in Stufe 4');
  assert.equal(toggleBtn.textContent, 'Virtuelle Tastatur einblenden');

  toggleBtn.click();
  assert.equal(toggleBtn.textContent, 'Virtuelle Tastatur ausblenden');
});

test('ohne expectedWord bleibt Stufe 1/2 ohne Hervorhebung (kein Crash)', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  assert.doesNotThrow(() => VirtualKeyboard.mount(container, input, { keyboardLevel: 1 }));
  const buttons = container.findAllButtons();
  assert.ok(!buttons.some((b) => b.className.includes('vk-key-next')));
});

test('keine doppelt vorhandenen Zeichentasten im gesamten gerenderten Layout (inkl. Sonderzeichen)', () => {
  const VirtualKeyboard = loadVirtualKeyboard();
  const doc = createDocumentStub();
  const container = doc.createElement('div');
  const input = makeInput(doc);
  VirtualKeyboard.mount(container, input, { showSpecial: true, showDiacritics: true });

  const buttons = container.findAllButtons();
  const letterLikeButtons = buttons.filter((b) => !b.className.includes('control') || b.className.includes('toggled'));
  // Nur Zeichentasten zählen (keine Steuerungstasten wie "Alles löschen"/"Bestätigen", die
  // absichtlich Mehrwort-Labels haben statt einzelner Zeichen).
  const charButtons = buttons.filter((b) => Array.from(b.textContent).length <= 2 && !/[a-zA-ZäöüÄÖÜ]/.test(b.textContent));
  const counts = {};
  for (const b of charButtons) counts[b.textContent] = (counts[b.textContent] || 0) + 1;
  const duplicates = Object.entries(counts).filter(([, n]) => n > 1);
  assert.deepEqual(duplicates, [], `Doppelt gerenderte Tasten: ${JSON.stringify(duplicates)}`);
});
