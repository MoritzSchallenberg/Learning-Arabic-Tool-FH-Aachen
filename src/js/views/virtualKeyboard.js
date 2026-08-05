// Wiederverwendbare virtuelle arabische Tastatur (Spec Kapitel 6.2/6.5), P0.1 aus dem
// Entwicklungsauftrag "Veröffentlichungsfähigkeit": optisch an einer echten Arabic-101-Tastatur
// orientiert (siehe keyboardData.js), alle 28 Grundbuchstaben inkl. ذ, Funktionstasten
// (Leertaste, Rücktaste, Alles-löschen, Bestätigen, Shift/Sonderzeichen-Umschaltung,
// Vokalzeichen-Umschaltung, Satzzeichen, arabische Ziffern), Unicode-sicheres Löschen
// (textEditing.js), sichtbares Tastendruck-Feedback, ARIA-Labels, sichtbarer Fokusrahmen.
//
// Entwicklungsauftrag 3 (Meilenstein B, Abschnitt 15): Tastatur-Lernstufen 1-4. Das Layout
// bleibt in JEDER Stufe die normale virtuelle Tastatur — nur der Grad der Führung ändert sich:
//   Stufe 1 (stark geführt): nächste benötigte Taste stark markiert, andere Tasten abgeschwächt
//   Stufe 2 (leicht geführt): nächste Taste nur dezent markiert, alle Tasten normal sichtbar
//   Stufe 3 (normal): keine Markierung
//   Stufe 4 (selbstständig): virtuelle Tastatur ausblendbar, physische Tastatur im Vordergrund,
//     jederzeit wieder einblendbar
// Die "nächste benötigte Taste" wird rein aus `expectedWord` (Zielantwort) + der aktuellen
// Cursorposition berechnet — NUR zur Hervorhebung, nie zur automatischen Auswertung.

const VirtualKeyboard = (() => {
  function currentCursor(input) {
    const pos = input.selectionStart;
    return typeof pos === 'number' ? pos : input.value.length;
  }

  function applyEdit(input, result) {
    input.value = result.text;
    input.focus();
    input.setSelectionRange(result.newIndex, result.newIndex);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const withoutSelection = input.value.slice(0, start) + input.value.slice(end);
    applyEdit(input, insertAt(withoutSelection, start, text));
  }

  // Löscht beim Drücken von Rücktaste ein vollständiges Unicode-Graphem (Buchstabe +
  // kombinierendes Vokalzeichen zählen als eine Einheit), nicht nur eine UTF-16-Codeeinheit.
  // Bei einer aktiven Textauswahl wird stattdessen einfach die Auswahl gelöscht.
  function backspaceAtCursor(input) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    if (start !== end) {
      applyEdit(input, { text: input.value.slice(0, start) + input.value.slice(end), newIndex: start });
      return;
    }
    applyEdit(input, deleteGraphemeBefore(input.value, start));
  }

  function clearAll(input) {
    input.value = '';
    input.focus();
    input.setSelectionRange(0, 0);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function confirm(input, onSubmit) {
    if (typeof onSubmit === 'function') {
      onSubmit();
      return;
    }
    // Kein onSubmit übergeben: Enter-Tastendruck auf dem Eingabefeld simulieren, damit
    // eventuelle vorhandene Enter-Handler trotzdem greifen.
    const opts = { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true };
    input.dispatchEvent(new KeyboardEvent('keydown', opts));
    input.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function makeKey({ label, ariaLabel, onClick, extraClass = '' }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vk-key' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = label;
    if (ariaLabel) {
      btn.setAttribute('aria-label', ariaLabel);
      btn.setAttribute('title', ariaLabel); // Tooltip, v. a. für Tastaturstufe 1 relevant
    }
    btn.addEventListener('click', () => {
      onClick();
      // Sichtbares Tastendruck-Feedback über die reine :active-Pseudoklasse hinaus (die bei
      // reinem Mausklick evtl. zu kurz sichtbar ist): kurz eine Klasse setzen.
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 150);
    });
    return btn;
  }

  function letterKey(targetInput, letter, registry) {
    const hint = keyNameHint(letter);
    const btn = makeKey({
      label: letter,
      ariaLabel: hint ? `Buchstabe ${hint}` : `Zeichen ${letter}`,
      onClick: () => insertAtCursor(targetInput, letter),
      extraClass: letter === 'لا' ? 'wide' : ''
    });
    if (registry) {
      if (!registry.has(letter)) registry.set(letter, []);
      registry.get(letter).push(btn);
    }
    return btn;
  }

  /**
   * @param {HTMLElement} container
   * @param {HTMLInputElement} targetInput
   * @param {object} options
   * @param {boolean} [options.showDiacritics=true]
   * @param {boolean} [options.showSpecial=true]
   * @param {boolean} [options.allowDiacriticsToggle=true]
   * @param {boolean} [options.allowSpecialToggle=true]
   * @param {(()=>void)|null} [options.onSubmit]
   * @param {1|2|3|4} [options.keyboardLevel=3] - Tastatur-Lernstufe (siehe helpLevel.js)
   * @param {string|null} [options.expectedWord] - Zielantwort NUR zur Tasten-Hervorhebung
   *   (Stufe 1/2), niemals zur automatischen Auswertung der Eingabe verwendet.
   */
  function mount(container, targetInput, options = {}) {
    const {
      showDiacritics = true,
      showSpecial = true,
      allowDiacriticsToggle = true,
      allowSpecialToggle = true,
      onSubmit = null,
      keyboardLevel = 3,
      expectedWord = null
    } = options;

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'virtual-keyboard';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', 'Virtuelle arabische Tastatur');

    let specialVisible = showSpecial;
    let diacriticsVisible = showDiacritics;
    let specialRowEl = null;
    let diacriticsRowEl = null;
    const letterButtonRegistry = new Map(); // Zeichen -> [Buttons], für Hervorhebung (Stufe 1/2)

    // Stufe 4: alle Tasten-Reihen in einem ausblendbaren Block, Steuerungstasten (Löschen/
    // Bestätigen) bleiben immer erreichbar.
    const keysBlock = document.createElement('div');
    keysBlock.className = 'vk-keys-block';

    for (const row of VIRTUAL_KEYBOARD_ROWS) {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      for (const letter of row) {
        rowEl.appendChild(letterKey(targetInput, letter, letterButtonRegistry));
      }
      keysBlock.appendChild(rowEl);
    }

    // Satzzeichen-Reihe ist immer sichtbar (klein, kein eigener Umschalt-Bedarf).
    const punctuationRow = document.createElement('div');
    punctuationRow.className = 'vk-row';
    for (const ch of PUNCTUATION_ROW) {
      punctuationRow.appendChild(letterKey(targetInput, ch, letterButtonRegistry));
    }
    keysBlock.appendChild(punctuationRow);

    specialRowEl = document.createElement('div');
    specialRowEl.className = 'vk-row';
    for (const ch of SPECIAL_CHARACTERS_ROW) {
      specialRowEl.appendChild(letterKey(targetInput, ch, letterButtonRegistry));
    }
    specialRowEl.style.display = specialVisible ? '' : 'none';
    keysBlock.appendChild(specialRowEl);

    diacriticsRowEl = document.createElement('div');
    diacriticsRowEl.className = 'vk-row';
    for (const d of DIACRITICS_ROW) {
      diacriticsRowEl.appendChild(letterKey(targetInput, d, letterButtonRegistry));
    }
    diacriticsRowEl.style.display = diacriticsVisible ? '' : 'none';
    keysBlock.appendChild(diacriticsRowEl);

    // Umschalt-Tasten (Shift/Sonderzeichen, Vokalzeichen).
    const toggleRow = document.createElement('div');
    toggleRow.className = 'vk-row';
    let specialToggleBtn = null;
    let diacriticsToggleBtn = null;

    if (allowSpecialToggle) {
      specialToggleBtn = makeKey({
        label: 'Shift (أ إ آ)',
        ariaLabel: 'Sonderzeichen ein- oder ausblenden (أ إ آ)',
        onClick: () => {
          specialVisible = !specialVisible;
          specialRowEl.style.display = specialVisible ? '' : 'none';
          specialToggleBtn.classList.toggle('toggled', specialVisible);
        },
        extraClass: 'control wide' + (specialVisible ? ' toggled' : '')
      });
      toggleRow.appendChild(specialToggleBtn);
    }

    if (allowDiacriticsToggle) {
      diacriticsToggleBtn = makeKey({
        label: 'Vokalzeichen',
        ariaLabel: 'Vokalzeichen ein- oder ausblenden',
        onClick: () => {
          diacriticsVisible = !diacriticsVisible;
          diacriticsRowEl.style.display = diacriticsVisible ? '' : 'none';
          diacriticsToggleBtn.classList.toggle('toggled', diacriticsVisible);
        },
        extraClass: 'control wide' + (diacriticsVisible ? ' toggled' : '')
      });
      toggleRow.appendChild(diacriticsToggleBtn);
    }
    if (allowSpecialToggle || allowDiacriticsToggle) keysBlock.appendChild(toggleRow);

    wrapper.appendChild(keysBlock);

    // Steuerungstasten: Rücktaste, Leerzeichen, Alles löschen, Bestätigen — bleiben in JEDER
    // Tastaturstufe erreichbar, auch wenn keysBlock (Stufe 4) ausgeblendet ist.
    const controlsRow = document.createElement('div');
    controlsRow.className = 'vk-row';
    controlsRow.appendChild(makeKey({
      label: '⌫',
      ariaLabel: 'Rücktaste — letztes Zeichen löschen',
      onClick: () => backspaceAtCursor(targetInput),
      extraClass: 'wide'
    }));
    controlsRow.appendChild(makeKey({
      label: 'Leerzeichen',
      ariaLabel: 'Leerzeichen einfügen',
      onClick: () => insertAtCursor(targetInput, ' '),
      extraClass: 'wide'
    }));
    controlsRow.appendChild(makeKey({
      label: 'Alles löschen',
      ariaLabel: 'Gesamtes Eingabefeld löschen',
      onClick: () => clearAll(targetInput),
      extraClass: 'control wide'
    }));
    controlsRow.appendChild(makeKey({
      label: '⏎ Bestätigen',
      ariaLabel: 'Eingabe bestätigen',
      onClick: () => confirm(targetInput, onSubmit),
      extraClass: 'control wide'
    }));
    wrapper.appendChild(controlsRow);

    container.appendChild(wrapper);

    // --- Tastatur-Lernstufen 1-4 -----------------------------------------------------------
    function updateHighlight() {
      if (keyboardLevel >= 3 || !expectedWord) {
        for (const btns of letterButtonRegistry.values()) {
          for (const btn of btns) { btn.classList.remove('vk-key-next'); btn.classList.remove('vk-key-dim'); }
        }
        return;
      }
      const pos = currentCursor(targetInput);
      const expectedChar = pos < expectedWord.length ? expectedWord[pos] : null;
      for (const [ch, btns] of letterButtonRegistry.entries()) {
        for (const btn of btns) {
          const isNext = expectedChar !== null && ch === expectedChar;
          btn.classList.toggle('vk-key-next', isNext);
          // Stufe 1: unbeteiligte Tasten abschwächen. Stufe 2: alle Tasten normal sichtbar,
          // nur dezente Markierung der nächsten Taste (keine Abschwächung der anderen).
          btn.classList.toggle('vk-key-dim', keyboardLevel === 1 && expectedChar !== null && !isNext);
        }
      }
    }

    targetInput.addEventListener('input', updateHighlight);
    updateHighlight();

    // Stufe 4: virtuelle Tastatur startet ausgeblendet, physische Tastatur im Vordergrund,
    // jederzeit über eine Schaltfläche wieder einblendbar.
    if (keyboardLevel === 4) {
      keysBlock.style.display = 'none';
      const showToggle = makeKey({
        label: 'Virtuelle Tastatur einblenden',
        ariaLabel: 'Virtuelle Tastatur ein- oder ausblenden',
        onClick: () => {
          const nowVisible = keysBlock.style.display === 'none';
          keysBlock.style.display = nowVisible ? '' : 'none';
          showToggle.textContent = nowVisible ? 'Virtuelle Tastatur ausblenden' : 'Virtuelle Tastatur einblenden';
        },
        extraClass: 'control wide'
      });
      wrapper.insertBefore(showToggle, wrapper.firstChild);
    }
  }

  return { mount, insertAtCursor, backspaceAtCursor, clearAll };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualKeyboard;
}
