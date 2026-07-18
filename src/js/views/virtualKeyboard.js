// Wiederverwendbare virtuelle arabische Tastatur (Spec Kapitel 6.2/6.5).
// Wird sowohl im Tastatur-Tutorial als auch als Eingabehilfe im Grundwortschatz-Modus genutzt.

const VirtualKeyboard = (() => {
  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const newPos = start + text.length;
    input.focus();
    input.setSelectionRange(newPos, newPos);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function backspaceAtCursor(input) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    if (start === end && start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(end);
      input.setSelectionRange(start - 1, start - 1);
    } else {
      input.value = input.value.slice(0, start) + input.value.slice(end);
      input.setSelectionRange(start, start);
    }
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function makeKey(label, onClick, extraClass = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vk-key' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function mount(container, targetInput, { showDiacritics = true, showSpecial = true } = {}) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'virtual-keyboard';

    for (const row of VIRTUAL_KEYBOARD_ROWS) {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      for (const letter of row) {
        rowEl.appendChild(makeKey(letter, () => insertAtCursor(targetInput, letter), letter === 'لا' ? 'wide' : ''));
      }
      wrapper.appendChild(rowEl);
    }

    if (showSpecial) {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      for (const ch of SPECIAL_CHARACTERS_ROW) {
        rowEl.appendChild(makeKey(ch, () => insertAtCursor(targetInput, ch), ch === 'لا' ? 'wide' : ''));
      }
      wrapper.appendChild(rowEl);
    }

    if (showDiacritics) {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      for (const d of DIACRITICS_ROW) {
        rowEl.appendChild(makeKey(d, () => insertAtCursor(targetInput, d)));
      }
      wrapper.appendChild(rowEl);
    }

    const controlsRow = document.createElement('div');
    controlsRow.className = 'vk-row';
    controlsRow.appendChild(makeKey(ARABIC_QUESTION_MARK, () => insertAtCursor(targetInput, ARABIC_QUESTION_MARK)));
    controlsRow.appendChild(makeKey('⌫', () => backspaceAtCursor(targetInput), 'wide'));
    controlsRow.appendChild(makeKey('Leerzeichen', () => insertAtCursor(targetInput, ' '), 'wide'));
    wrapper.appendChild(controlsRow);

    container.appendChild(wrapper);
  }

  return { mount, insertAtCursor, backspaceAtCursor };
})();
