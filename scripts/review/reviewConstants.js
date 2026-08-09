// Entwicklungsauftrag 12, Abschnitt 5/6 — gemeinsames Vokabular für den lokalen
// Sprachprüf-Arbeitsbereich. EINE zentrale Quelle (wie schon bei part_of_speech,
// scripts/partOfSpeechVocabulary.js) statt mehrfach kopierter Listen in UI/Backend/Tests.

// Abschnitt 5, "Getrennte Prüfaspekte" -- 9 Aspekte, jeder Wort-Eintrag bekommt für jeden davon
// ein eigenes, unabhängiges Ergebnis. "audio_pronunciation" ist die letzte in der Liste
// genannte ("Audioaussprache") und wird zusätzlich im eigenen Audio-Tab bedient (Abschnitt 15).
const WORD_ASPECT_KEYS = [
  'vocalization',
  'transliteration',
  'translation',
  'part_of_speech',
  'gender_plural',
  'accepted_arabic_answers',
  'application_prompts',
  'homonym_opposite_confusion',
  'audio_pronunciation'
];

const WORD_ASPECT_LABELS_DE = {
  vocalization: 'Vokalisierung',
  transliteration: 'Umschrift',
  translation: 'Übersetzung',
  part_of_speech: 'Wortart',
  gender_plural: 'Genus und Plural',
  accepted_arabic_answers: 'akzeptierte arabische Antworten',
  application_prompts: 'Application-Prompts',
  homonym_opposite_confusion: 'Homonym-/Gegensatz-/Verwechslungszuordnung',
  audio_pronunciation: 'Audioaussprache'
};

// Abschnitt 6, Theorieprüfung -- eigene Aspektliste (Theorien haben andere Bestandteile als
// einzelne Wörter).
const THEORY_ASPECT_KEYS = [
  'title_objectives',
  'intro_text',
  'extended_content',
  'word_preview',
  'arabic_examples',
  'vocalization_transliteration',
  'explanations_hints',
  'mini_checks',
  'application_prompts'
];

const THEORY_ASPECT_LABELS_DE = {
  title_objectives: 'Titel und Lernziele',
  intro_text: 'kurze Erklärung',
  extended_content: 'ausführlicher Inhalt ("Mehr erfahren")',
  word_preview: 'Wortvorschau',
  arabic_examples: 'arabische Beispiele',
  vocalization_transliteration: 'Vokalisierung und Umschrift',
  explanations_hints: 'Merksätze, typische Fehler, Erklärungen',
  mini_checks: 'Mini-Checks (Lösungen, Feedback)',
  application_prompts: 'Application-Prompts'
};

// "Zulässige Ergebnisse je Aspekt" (Abschnitt 5).
const ASPECT_RESULTS = ['not_yet_reviewed', 'correct', 'correction_proposed', 'uncertain', 'not_applicable'];
const ASPECT_RESULT_LABELS_DE = {
  not_yet_reviewed: 'noch nicht geprüft',
  correct: 'korrekt',
  correction_proposed: 'Korrektur vorgeschlagen',
  uncertain: 'unsicher/Rückfrage erforderlich',
  not_applicable: 'nicht anwendbar'
};

// "Übergeordnete Status" (Abschnitt 5).
const OVERALL_STATUSES = ['needs_language_review', 'in_review', 'corrections_required', 'reviewed', 'approved'];
const OVERALL_STATUS_LABELS_DE = {
  needs_language_review: 'noch nicht begonnen',
  in_review: 'in Bearbeitung',
  corrections_required: 'Korrekturbedarf',
  reviewed: 'geprüft',
  approved: 'ausdrücklich freigegeben'
};

// Felder, die als Korrekturvorschlag zu einem Wort bearbeitbar sind (Abschnitt 4).
const CORRECTABLE_WORD_FIELDS = [
  'proposed_arabic_vocalized',
  'proposed_transliteration',
  'german_answers',
  'accepted_arabic_answers',
  'part_of_speech',
  'gender',
  'plural',
  'application_prompts',
  'notes'
];

// Abschnitt 9 -- Audio-Prüfstatus im Manifest (Spiegel von scripts/audio/audioManifestModel.js,
// hier bewusst nicht re-importiert, um scripts/review/ unabhängig von scripts/audio/ zu halten).
const AUDIO_REVIEW_STATUS_VALUES = ['not_reviewed', 'approved', 'rejected', 'uncertain'];

module.exports = {
  WORD_ASPECT_KEYS,
  WORD_ASPECT_LABELS_DE,
  THEORY_ASPECT_KEYS,
  THEORY_ASPECT_LABELS_DE,
  ASPECT_RESULTS,
  ASPECT_RESULT_LABELS_DE,
  OVERALL_STATUSES,
  OVERALL_STATUS_LABELS_DE,
  CORRECTABLE_WORD_FIELDS,
  AUDIO_REVIEW_STATUS_VALUES
};
