// Reine Text-Hilfsfunktionen für die virtuelle Tastatur (P0.1 aus dem Entwicklungsauftrag
// "Veröffentlichungsfähigkeit"). Kein DOM-Zugriff hier — dadurch ohne Electron/Browser testbar.
//
// deleteGraphemeBefore() löscht beim Rücktaste-Drücken ein vollständiges Unicode-Graphem
// (z. B. Buchstabe + kombinierendes Vokalzeichen wie بَ als eine Einheit) statt nur einer
// UTF-16-Codeeinheit. Vorher schnitt `value.slice(0, start - 1)` z. B. bei بَ nur das Fatha ab
// und beließ den nackten Buchstaben — funktional nicht falsch (Akzeptanzkriterium erlaubt
// ausdrücklich "vollständig oder schrittweise"), aber uneinheitlich mit modernen IME-Konventionen
// und riskant bei zukünftigen Inhalten mit Zeichen außerhalb der Basic Multilingual Plane
// (Surrogatpaare), die eine naive Codeeinheiten-Schnitttechnik mitten durchtrennen könnte.

function hasGraphemeSegmenter() {
  return typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
}

function getSegmenter() {
  if (!hasGraphemeSegmenter()) return null;
  if (!getSegmenter._instance) {
    getSegmenter._instance = new Intl.Segmenter('ar', { granularity: 'grapheme' });
  }
  return getSegmenter._instance;
}

/**
 * Berechnet, was beim Drücken von Rücktaste an Position `index` in `text` passieren soll.
 * Löscht das letzte VOLLSTÄNDIGE Graphem vor `index` (Basisbuchstabe + kombinierende
 * Vokalzeichen zählen als ein Graphem), nicht nur die letzte UTF-16-Codeeinheit.
 * @returns {{ text: string, newIndex: number }}
 */
function deleteGraphemeBefore(text, index) {
  const clampedIndex = Math.max(0, Math.min(index, text.length));
  if (clampedIndex <= 0) return { text, newIndex: 0 };

  const before = text.slice(0, clampedIndex);
  const after = text.slice(clampedIndex);
  let cut;

  const segmenter = getSegmenter();
  if (segmenter) {
    let lastStart = 0;
    for (const seg of segmenter.segment(before)) {
      lastStart = seg.index;
    }
    cut = lastStart;
  } else {
    // Fallback ohne Intl.Segmenter: mindestens Surrogatpaare (astrale Codepoints) nicht
    // auseinanderreißen. Kombinierende Vokalzeichen würden hier weiterhin einzeln gelöscht
    // (schrittweise Variante des Akzeptanzkriteriums).
    cut = before.length - 1;
    if (cut > 0) {
      const code = before.charCodeAt(cut - 1);
      if (code >= 0xd800 && code <= 0xdbff) cut -= 1;
    }
  }

  return { text: before.slice(0, cut) + after, newIndex: cut };
}

/** Fügt `insertText` an Position `index` in `text` ein. */
function insertAt(text, index, insertText) {
  const clampedIndex = Math.max(0, Math.min(index, text.length));
  return {
    text: text.slice(0, clampedIndex) + insertText + text.slice(clampedIndex),
    newIndex: clampedIndex + insertText.length
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { deleteGraphemeBefore, insertAt, hasGraphemeSegmenter };
}
