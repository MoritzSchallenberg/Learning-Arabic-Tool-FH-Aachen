// Wiederverwendbare virtuelle arabische Tastatur (Spec Kapitel 6.2/6.5), P0.1 aus dem
// Entwicklungsauftrag "Veröffentlichungsfähigkeit": optisch an einer echten Arabic-101-Tastatur
// orientiert (siehe keyboardData.js), alle 28 Grundbuchstaben inkl. ذ, Funktionstasten
// (Leertaste, Rücktaste, Alles-löschen, Bestätigen, Shift/Sonderzeichen-Umschaltung,
// Vokalzeichen-Umschaltung, Satzzeichen, arabische Ziffern), Unicode-sicheres Löschen
// (textEditing.js), sichtbares Tastendruck-Feedback, ARIA-Labels, sichtbarer Fokusrahmen.

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
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    btn.addEventListener('click', () => {
      onClick();
      // Sichtbares Tastendruck-Feedback über die reine :active-Pseudoklasse hinaus (die bei
      // reinem Mausklick evtl. zu kurz sichtbar ist): kurz eine Klasse setzen.
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 150);
    });
    return btn;
  }

  function letterKey(targetInput, letter) {
    const hint = keyNameHint(letter);
    return makeKey({
      label: letter,
      ariaLabel: hint ? `Buchstabe ${hint}` : `Zeichen ${letter}`,
      onClick: () => insertAtCursor(targetInput, letter),
      extraClass: letter === 'لا' ? 'wide' : ''
    });
  }

  function mount(container, targetInput, options = {}) {
    const {
      showDiacritics = true,
      showSpecial = true,
      allowDiacriticsToggle = true,
      allowSpecialToggle = true,
      onSubmit = null
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

    for (const row of VIRTUAL_KEYBOARD_ROWS) {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      for (const letter of row) {
        rowEl.appendChild(letterKey(targetInput, letter));
      }
      wrapper.appendChild(rowEl);
    }

    // Satzzeichen-Reihe ist immer sichtbar (klein, kein eigener Umschalt-Bedarf).
    const punctuationRow = document.createElement('div');
    punctuationRow.className = 'vk-row';
    for (const ch of PUNCTUATION_ROW) {
      punctuationRow.appendChild(letterKey(targetInput, ch));
    }
    wrapper.appendChild(punctuationRow);

    specialRowEl = document.createElement('div');
    specialRowEl.className = 'vk-row';
    for (const ch of SPECIAL_CHARACTERS_ROW) {
      specialRowEl.appendChild(letterKey(targetInput, ch));
    }
    specialRowEl.style.display = specialVisible ? '' : 'none';
    wrapper.appendChild(specialRowEl);

    diacriticsRowEl = document.createElement('div');
    diacriticsRowEl.className = 'vk-row';
    for (const d of DIACRITICS_ROW) {
      diacriticsRowEl.appendChild(letterKey(targetInput, d));
    }
    diacriticsRowEl.style.display = diacriticsVisible ? '' : 'none';
    wrapper.appendChild(diacriticsRowEl);

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
    if (allowSpecialToggle || allowDiacriticsToggle) wrapper.appendChild(toggleRow);

    // Steuerungstasten: Rücktaste, Leerzeichen, Alles löschen, Bestätigen.
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
  }

  return { mount, insertAtCursor, backspaceAtCursor, clearAll };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualKeyboard;
}
