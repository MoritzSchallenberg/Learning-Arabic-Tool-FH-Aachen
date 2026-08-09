// Entwicklungsauftrag 12, Abschnitt 9 — erweitertes, rückwärtskompatibles Statusmodell für
// audio_generation_manifest.json.
//
// Das bisherige Manifest (Entwicklungsauftrag 6) kannte nur ein einziges Feld "status"
// ("needs_language_review" | "ready_for_generation") und vermischte damit zwei eigentlich
// unabhängige Dinge: ob ein Wort SPRACHLICH freigegeben ist, und ob für es bereits eine
// Audiodatei ERZEUGT wurde. Für die mit diesem Auftrag vom Nutzer ausdrücklich erlaubte
// technische Vorschau-Audioerzeugung — OHNE dass die Sprachprüfung schon stattgefunden hat —
// braucht es eine echte Trennung in drei unabhängige Achsen:
//
//   language_status      - unverändert der Sprachprüfstand des Wortes selbst
//                           (needs_language_review | reviewed | approved)
//   generation_status    - Stand der rein TECHNISCHEN Audioerzeugung
//                           (pending | preview_generation_authorized | generated_unreviewed |
//                            failed | regeneration_required)
//   audio_review_status  - Ergebnis einer (menschlichen) Anhörprüfung der erzeugten Datei
//                           (not_reviewed | approved | rejected | uncertain)
//
// Das alte "status"-Feld bleibt UNVERÄNDERT bestehen und wird durch dieses Modell nicht
// ersetzt — scripts/validateCourse.js liest z. B. weiterhin `e.status === 'ready_for_generation'`,
// und kein Wort dieses Auftrags wird jemals auf "ready_for_generation" gesetzt (das bleibt der
// spätere, echte Sprachfreigabe-Schritt). Reine additive Erweiterung, kein Bruch.

const LANGUAGE_STATUS_VALUES = ['needs_language_review', 'reviewed', 'approved'];
const GENERATION_STATUS_VALUES = ['pending', 'preview_generation_authorized', 'generated_unreviewed', 'failed', 'regeneration_required'];
const AUDIO_REVIEW_STATUS_VALUES = ['not_reviewed', 'approved', 'rejected', 'uncertain'];

// Abschnitt 9: "Dokumentiere als Grund der vorzeitigen Erzeugung: user_authorized_preview_generation"
const PREVIEW_GENERATION_REASON = 'user_authorized_preview_generation';

function emptyGenerationMeta() {
  return {
    provider: null,
    model: null,
    voice_id: null,
    generated_at: null,
    input_text: null,
    input_text_hash: null,
    checksum_sha256: null,
    reason: null
  };
}

/**
 * Ergänzt ein Manifest-Rohobjekt (aus einer evtl. noch alten Datei) idempotent um die drei neuen
 * Statusfelder, OHNE bereits vorhandene Werte zu überschreiben. Rein in-memory, schreibt nichts.
 */
function normalizeEntry(raw) {
  const languageStatus = raw.language_status || raw.status || 'needs_language_review';
  return {
    ...raw,
    // "status" bewusst NICHT entfernt/verändert -- Rückwärtskompatibilität zu validateCourse.js.
    language_status: languageStatus,
    generation_status: raw.generation_status || 'pending',
    audio_review_status: raw.audio_review_status || 'not_reviewed',
    generation: raw.generation ? { ...emptyGenerationMeta(), ...raw.generation } : emptyGenerationMeta()
  };
}

function normalizeManifest(manifestDoc) {
  return {
    ...manifestDoc,
    entries: (manifestDoc.entries || []).map(normalizeEntry)
  };
}

/**
 * Das Manifest selbst kennt ursprünglich keine unit_id/session_id (Entwicklungsauftrag 6 hat nur
 * id/arabic/german/output_file/status gespeichert) -- für Batch-/Unit-Filter und eine
 * repräsentative Stichprobe (Abschnitt 14: "mindestens ein Wort aus jedem Batch") braucht die
 * Pipeline diese Zuordnung aber. Ergänzt sie idempotent aus der aktuellen vocabulary.json, ohne
 * vorhandene Werte zu überschreiben.
 */
function enrichEntryWithWordMeta(entry, word) {
  if (!word) return entry;
  return {
    ...entry,
    unit_id: entry.unit_id || word.unit_id || null,
    session_id: entry.session_id || word.session_id || null
  };
}

function enrichManifestWithWordMeta(manifestDoc, wordsById) {
  return {
    ...manifestDoc,
    entries: manifestDoc.entries.map((e) => enrichEntryWithWordMeta(e, wordsById.get(e.id)))
  };
}

module.exports = {
  LANGUAGE_STATUS_VALUES,
  GENERATION_STATUS_VALUES,
  AUDIO_REVIEW_STATUS_VALUES,
  PREVIEW_GENERATION_REASON,
  emptyGenerationMeta,
  normalizeEntry,
  normalizeManifest,
  enrichEntryWithWordMeta,
  enrichManifestWithWordMeta
};
