// Entwicklungsauftrag 12, Abschnitt 2 — "sichere Ausgabe über textContent bzw. sichere
// DOM-Methoden". Diese kleine Helferdatei ist die EINZIGE Stelle im Review-Modus, die Elemente
// baut -- nirgendwo sonst wird innerHTML mit aus Daten stammendem Text verwendet. Arabischer
// Text bekommt automatisch dir="rtl" (Abschnitt 2: "korrekte RTL-Darstellung").

const ReviewDom = (() => {
  function el(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.class) node.className = options.class;
    if (options.attrs) {
      for (const [key, value] of Object.entries(options.attrs)) {
        if (value === undefined || value === null) continue;
        node.setAttribute(key, value);
      }
    }
    if (options.text !== undefined) node.textContent = options.text;
    if (options.onClick) node.addEventListener('click', options.onClick);
    if (options.onChange) node.addEventListener('change', options.onChange);
    if (options.onInput) node.addEventListener('input', options.onInput);
    for (const child of [].concat(children)) {
      if (child === null || child === undefined) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  /** Arabischer Text -- immer mit dir="rtl" und eigener Schriftklasse. */
  function arabic(text, extraClass = '') {
    return el('span', { class: `arabic-text ${extraClass}`.trim(), attrs: { dir: 'rtl', lang: 'ar' }, text: text || '' });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function badge(text, kind) {
    return el('span', { class: `badge badge-${kind || 'neutral'}`, text });
  }

  return { el, arabic, clear, badge };
})();
