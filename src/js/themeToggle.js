// Entwicklungsauftrag 14, Abschnitt 7 — EIN wiederverwendbarer Theme-Schalter (Hell/Dunkel),
// sowohl für die größere Darstellung in den Einstellungen als auch für den kompakten Schalter im
// Kopfbereich. Zwei echte <button>-Elemente (native Tastaturbedienung: Tab, Enter/Leertaste),
// role="group" + aria-pressed je Button statt eines <select> — macht den aktiven Modus optisch
// UND für Screenreader eindeutig erkennbar, ohne nur auf Farbe zu setzen (Abschnitt 15).

const ThemeToggle = (() => {
  const OPTIONS = [
    { value: 'light', label: 'Hell', icon: '☀️' },
    { value: 'dark', label: 'Dunkel', icon: '🌙' }
  ];

  /**
   * @param {'light'|'dark'} currentTheme
   * @param {(theme: 'light'|'dark') => void} onChange
   * @param {{compact?: boolean}} [options] - compact: nur Symbole (Kopfbereich), sonst Symbol+Text
   * @returns {HTMLElement}
   */
  function render(currentTheme, onChange, { compact = false } = {}) {
    const resolved = currentTheme === 'dark' ? 'dark' : 'light';
    const wrap = document.createElement('div');
    wrap.className = `theme-toggle${compact ? ' theme-toggle-compact' : ''}`;
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Farbschema');

    for (const opt of OPTIONS) {
      const isActive = resolved === opt.value;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `theme-toggle-btn${isActive ? ' active' : ''}`;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.setAttribute('aria-label', `${opt.label}es Farbschema${isActive ? ' (aktiv)' : ''}`);
      btn.title = `${opt.label}es Farbschema`;
      if (compact) {
        btn.textContent = opt.icon;
      } else {
        const iconSpan = document.createElement('span');
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = opt.icon;
        btn.appendChild(iconSpan);
        btn.appendChild(document.createTextNode(` ${opt.label}`));
      }
      btn.addEventListener('click', () => {
        if (resolved === opt.value) return;
        onChange(opt.value);
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  return { render, OPTIONS };
})();
