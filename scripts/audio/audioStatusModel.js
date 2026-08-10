// Entwicklungsauftrag 13, Abschnitt 3.2 — eindeutiges Statusmodell für das `audio_status`-Feld
// auf jedem WORT in vocabulary.json (getrennt vom, aber abgeleitet aus dem, feingranularen
// Manifest-Statusmodell aus Entwicklungsauftrag 12 -- scripts/audio/audioManifestModel.js).
//
// Ursprünglicher Fehler (gefunden bei der Baseline-Prüfung dieses Auftrags): scripts/build-
// kurs1-batch.js setzte beim Erzeugen der 759 neuen Wörter ein Feld `audio_status: "missing"`,
// das seitdem nie wieder aktualisiert wurde -- auch nicht, als Entwicklungsauftrag 12 für genau
// diese 759 Wörter tatsächlich Audiodateien erzeugt hat. Die ursprünglichen 141 Bestandswörter
// hatten dieses Feld nie. Beides ist jetzt behoben: ALLE 900 Wörter bekommen das Feld, mit einem
// klar definierten, aus dem tatsächlichen Dateisystem + Manifest ABGELEITETEN Wert (kein manuell
// gepflegter Zweitstand, der wieder veralten könnte).
//
// WICHTIG (Abschnitt 3.2/17): dieses Feld beschreibt AUSSCHLIESSLICH die technische Verfügbarkeit
// und Herkunft der Audiodatei -- es ist NICHT die sprachliche Prüfung des Wortes (dafür bleibt
// weiterhin ausschließlich `content_status` zuständig) und wird NIE automatisch auf "reviewed"
// gesetzt (das darf ausschließlich ein Mensch über den Review-Modus, Entwicklungsauftrag 12).

const AUDIO_STATUS_VALUES = [
  'available_legacy_unreviewed', // Datei existiert, stammt aus der Zeit vor dem Manifest-System (Batch 0)
  'generated_unreviewed', // Datei existiert, technisch über die Entwicklungsauftrag-12-Pipeline erzeugt
  'reviewed', // ausschließlich von einem Menschen über den Review-Modus gesetzt (Audioaussprache "korrekt")
  'missing', // keine Datei vorhanden
  'generation_failed' // Erzeugung wurde versucht, aber technisch nicht erfolgreich (siehe Manifest "failed")
];

/**
 * Leitet den korrekten audio_status für ein Wort ab. Rein funktional (keine Seiteneffekte,
 * kein Dateizugriff selbst) -- der Aufrufer übergibt bereits ermittelte Fakten.
 *
 * @param {{fileExists: boolean, manifestEntry: object|null, audioReviewApproved: boolean}} facts
 */
function computeAudioStatus({ fileExists, manifestEntry, audioReviewApproved }) {
  if (audioReviewApproved) return 'reviewed';
  if (!fileExists) {
    // Ein Manifest-Eintrag mit generation_status "failed" ohne vorhandene Datei ist ein
    // dokumentierter Fehlschlag, kein bloßes "noch nicht versucht".
    if (manifestEntry && manifestEntry.generation_status === 'failed') return 'generation_failed';
    return 'missing';
  }
  if (manifestEntry) return 'generated_unreviewed'; // Datei + Manifest-Eintrag = über die Pipeline erzeugt
  return 'available_legacy_unreviewed'; // Datei ohne Manifest-Eintrag = Bestand aus der Zeit davor
}

module.exports = { AUDIO_STATUS_VALUES, computeAudioStatus };
