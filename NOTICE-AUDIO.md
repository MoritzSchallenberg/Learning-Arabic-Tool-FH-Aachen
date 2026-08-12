# Audiohinweis (NOTICE-AUDIO)

> **Audio generated with ElevenLabs (elevenlabs.io).**

Diese Datei ist der zentrale, eigenständige Hinweis zu den Audiodateien in diesem Projekt —
verlinkt aus README.md, LICENSES.md, dem Info-/Einstellungsbereich der App und (bei Veröffentlichung
über GitHub) aus dem Release-Titel und der Release-Beschreibung, wie in Entwicklungsauftrag 19
gefordert.

## Zwei unterschiedliche Erzeugungswege

Dieses Projekt liefert **1097 Audiodateien** unter `language-packs/arabic/audio/` aus. Sie stammen
aus zwei technisch und rechtlich unterschiedlichen Quellen. Welche Datei zu welcher Quelle gehört,
ist maschinenlesbar in [`language-packs/arabic/audio-provenance.json`](language-packs/arabic/audio-provenance.json)
dokumentiert (erzeugt von `scripts/generateAudioProvenance.js`, keine geratene Herkunft).

### 1. ElevenLabs, kostenloser Tarif — 759 Dateien

759 Vokabel-Audiodateien (nur normale Geschwindigkeit, keine `_slow`-Varianten) wurden über die
Text-to-Speech-API von **ElevenLabs** erzeugt, während für diesen Account der **KOSTENLOSE
ElevenLabs-Tarif** aktiv war (Entwicklungsauftrag 19, Abschnitt 1). Daraus folgt verbindlich:

- **Nichtkommerzielle Nutzung:** Diese 759 Audiodateien — und jede App-Veröffentlichung, die sie
  enthält — dürfen **nur nichtkommerziell** verwendet, verbreitet und veröffentlicht werden.
- **Keine MIT-Lizenz, keine CC-BY-SA-Lizenz:** Diese Dateien werden **nicht** unter die MIT-Lizenz
  des Anwendungscodes und **nicht** unter die CC-BY-SA-4.0-Lizenz der übrigen Kursinhalte gestellt.
  Sie unterliegen stattdessen den zum Erzeugungszeitpunkt geltenden Nutzungsbedingungen von
  ElevenLabs für den kostenlosen Tarif (siehe elevenlabs.io für den aktuellen Wortlaut).
- **Namensnennung erforderlich:** *"Audio generated with ElevenLabs (elevenlabs.io)."*
- **Kommerzielle Weiterverwendung:** Wer den Anwendungscode (MIT-lizenziert) kommerziell
  weiterverwenden möchte, muss diese 759 Audiodateien vorher entfernen oder durch rechtlich
  entsprechend freigegebene Aufnahmen ersetzen (z. B. über einen kostenpflichtigen ElevenLabs-Tarif
  mit passenden Nutzungsrechten oder eine andere Aufnahmequelle).
- Keine ElevenLabs-Marken oder -Logos werden verwendet — nur die reine Textnennung, wie von
  ElevenLabs für die Namensnennung vorausgesetzt.

### 2. Lokaler Generator (espeak-ng) — 338 Dateien

Die übrigen 338 Dateien (die 141 ursprünglichen Bestands-Vokabelwörter samt ihrer 141
`_slow`-Varianten sowie alle 56 Buchstaben-Dateien) wurden **lokal, offline, kostenlos** mit dem
quelloffenen Sprachsynthese-Werkzeug **espeak-ng** erzeugt (`scripts/generate_audio.py`). Diese
Dateien werden — wie der übrige Kursinhalt — unter **CC BY-SA 4.0** bereitgestellt; siehe
[`LICENSES.md`](LICENSES.md) Abschnitt 3.1 für die Begründung.

## Kurzfassung für Weiterverwender

| | ElevenLabs-Audios (759) | espeak-ng-Audios (338) | Anwendungscode |
|---|---|---|---|
| Lizenz | ElevenLabs-Nutzungsbedingungen (kostenloser Tarif) | CC BY-SA 4.0 | MIT |
| Kommerzielle Nutzung | **Nein** | Ja (mit Namensnennung) | Ja |
| Namensnennung nötig | **Ja** — "Audio generated with ElevenLabs (elevenlabs.io)." | Ja (CC BY-SA) | Nein (MIT-Hinweis genügt) |

**Der Quellcode und die gebündelten Audiodateien unterliegen unterschiedlichen
Nutzungsbedingungen.** Eine kommerzielle Nutzung des Anwendungscodes kann nach Maßgabe der
MIT-Lizenz möglich sein. Die öffentlich bereitgestellte App-Version mit den enthaltenen, im
kostenlosen ElevenLabs-Tarif erzeugten Audiodateien darf jedoch **nicht kommerziell** verwendet
werden. Für eine kommerzielle Weiterverwendung müssen diese Audiodateien entfernt oder durch
rechtlich entsprechend freigegebene Aufnahmen ersetzt werden.

## Beta-Status (unabhängig von der Lizenzfrage)

Zusätzlich zur Lizenzeinschränkung gilt: Kurs 1 ist **technisch vollständig**, aber **sprachlich
noch nicht** von einer Person mit Arabischkenntnissen freigegeben — auch die ElevenLabs- und
espeak-ng-Audios wurden **technisch integriert, aber noch nicht vollständig akustisch geprüft**
(siehe README, Abschnitt "Beta-Status" und `LANGUAGE_REVIEW_GUIDE.md`). Bis zur Sprachprüfung
sollte diese App nicht als verbindliches Unterrichtsmaterial betrachtet werden.
