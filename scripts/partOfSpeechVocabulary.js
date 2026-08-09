// Zentrales, geschlossenes part_of_speech-Vokabular für Kurs 1 (Entwicklungsauftrag 8, Abschnitt 8;
// erweitert in Entwicklungsauftrag 10, Abschnitt 3, und Entwicklungsauftrag 11, Abschnitt 5).
//
// Dies ist die EINE maßgebliche Quelle für zulässige part_of_speech-Werte im gesamten Projekt.
// scripts/validateCourse.js UND alle Content-Tests müssen diese Liste importieren/daraus ableiten
// statt eigene, möglicherweise abweichende Kopien zu pflegen (Auftrag 11, Abschnitt 5: "keine
// voneinander abweichenden Wortartenlisten in mehreren Tests").
//
// Historie:
// - Entwicklungsauftrag 8: über die 388 damals bereits vollständigen Wörter (Units 1-10) hatte
//   sich ein deutschsprachiges Vokabular etabliert (statt des im Auftrag vorgeschlagenen
//   englischen) — hier als zentrale, geschlossene Liste festgeschrieben: Substantiv (+ Dual/
//   Plural/Pluraletantum/Adjektiv-Mischform), Adjektiv, Verb (3. Pers. m. Vergangenheit), Adverb,
//   Ausdruck, Zahlwort, Fragewort, Eigenname.
// - Entwicklungsauftrag 10: "Präposition" ergänzt (Unit 21 war die erste Unit mit einer
//   nennenswerten Zahl echter Präpositionen).
// - Entwicklungsauftrag 11: "Konjunktion", "Partikel", "Pronomen (Demonstrativ)",
//   "Pronomen (Indefinit)" ergänzt für Unit 30 (Fragewörter/Konnektoren/Funktionswörter) — diese
//   Funktionswörter wurden bewusst NICHT unter "Ausdruck"/"Adverb" gezwängt, nur weil zuvor keine
//   passendere Kategorie existierte. Abgrenzung der beiden neuen Pronomen-Unterkategorien:
//   "Pronomen (Demonstrativ)" für hinweisende Pronomen (هَذَا/هَذِهِ, "dieser/diese"),
//   "Pronomen (Indefinit)" für unbestimmte Mengen-/Existenzangaben (كُلّ/بَعْض/لَا أَحَد/شَيْء/لَا شَيْء,
//   "alle/einige/niemand/etwas/nichts") — beide sind grammatisch klar unterscheidbare
//   Pronomen-Unterarten, keine beliebige Aufsplitterung.
const PART_OF_SPEECH_VALUES = [
  'Substantiv', 'Substantiv (Dual)', 'Substantiv (Plural)', 'Substantiv (Pluraletantum)',
  'Substantiv/Adjektiv', 'Adjektiv', 'Verb (3. Pers. m. Vergangenheit)', 'Adverb', 'Ausdruck',
  'Zahlwort', 'Fragewort', 'Eigenname', 'Präposition',
  'Konjunktion', 'Partikel', 'Pronomen (Demonstrativ)', 'Pronomen (Indefinit)'
];

module.exports = { PART_OF_SPEECH_VALUES };
