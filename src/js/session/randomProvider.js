// RandomProvider (Entwicklungsauftrag 7, Abschnitt 4.1) — injizierbarer Zufallszahlengenerator.
// Macht die zufallsabhängigen Teile von SessionQueue/SessionEngine (Aufgabenmischung,
// Wiederholungs-Verzögerung) für Tests deterministisch reproduzierbar, ohne das produktive
// Verhalten zu verändern.
//
// Produktiv: RandomProvider.create() ohne Seed nutzt weiterhin Math.random (unverändertes
// Verhalten). In Tests: RandomProvider.create(seed) liefert bei gleichem Seed IMMER dieselbe
// Zahlenfolge (mulberry32-PRNG, keine externe Abhängigkeit nötig) — dadurch können Tests exakt
// die Bedingungen herstellen, die sie prüfen wollen, statt auf einen zufälligen Aufgaben-Subset
// zu hoffen.

const RandomProvider = (() => {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function random() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWith(random, arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** @param {number} [seed] - fehlt/undefined/null => produktives Verhalten (Math.random). */
  function create(seed) {
    const random = (seed === undefined || seed === null) ? Math.random : mulberry32(seed);
    return { random, shuffle: (arr) => shuffleWith(random, arr) };
  }

  return { create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RandomProvider;
}
