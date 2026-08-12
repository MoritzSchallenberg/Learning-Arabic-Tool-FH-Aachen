# Lizenzübersicht

Dieses Projekt enthält mehrere unterschiedliche Arten von Inhalten, die **nicht** alle
unter derselben Lizenz stehen. Diese Datei dokumentiert bewusst getrennt, was für Code,
Kursinhalte, Audio und Bilder gilt — siehe auch [`LICENSE`](LICENSE) für den vollständigen
Lizenztext des Codes.

## 1. Anwendungscode

**Lizenz: MIT** (siehe [`LICENSE`](LICENSE)).

Betrifft: `main.js`, `preload.js`, `src/**/*.js`, `src/**/*.html`, `src/**/*.css`,
`scripts/*.js`, `scripts/*.py`, `test/**/*`. Diese Dateien enthalten keine
Lerninhalte, nur Anwendungslogik.

## 2. Kursinhalte (Vokabeln, Grammatik, Lesetexte, Kurs-/Unit-Struktur)

**Lizenz: CC BY-SA 4.0** (Creative Commons Namensnennung – Weitergabe unter gleichen
Bedingungen 4.0 International).

Betrifft: alle JSON-Dateien unter `language-packs/arabic/` mit Ausnahme von Audio (siehe
unten), also u. a. `vocabulary.json`, `grammar*.json`, `reading.json`, `courses.json`,
`lessons.json`, `keyboard.json`, `tutorials/*.json`.

**Wichtiger Vorbehalt:** Diese Inhalte wurden von einer KI anhand von allgemeinem
Wissen über modernes Hocharabisch erstellt, **nicht von einer Person mit
Arabischkenntnissen gegengelesen**. Jeder Eintrag, der das erweiterte Datenmodell nutzt
(ab Meilenstein D/E, siehe [`ROADMAP.md`](ROADMAP.md) Abschnitt 7), trägt dafür ein
`content_status`-Feld (`needs_language_review` / `reviewed` / `approved` / `rejected`).
**Die CC-BY-SA-4.0-Lizenzierung ändert nichts an diesem Prüfstatus** — eine Lizenz
regelt Nutzungsrechte, keine inhaltliche Richtigkeit. Vor produktivem Einsatz (z. B. im
Unterricht) sollten die Inhalte von einer Person mit Arabischkenntnissen geprüft werden.

## 3. Audiodateien (`language-packs/arabic/audio/`)

Zwei unterschiedliche Erzeugungswege, unterschiedlich zu behandeln:

### 3.1 espeak-ng-Aufnahmen (`scripts/generate_audio.py`)

espeak-ng selbst ist unter der GPL-3.0 lizenziert; die von diesem Tool **erzeugte
Audioausgabe** (synthetische Sprachaufnahmen) wird von den espeak-ng-Maintainern nicht als
lizenzpflichtiges Werk im Sinne der GPL behandelt (vergleichbar mit der Ausgabe eines
Compilers). Wir stufen diese generierten WAV-Dateien daher wie den Kursinhalt selbst als
**CC BY-SA 4.0** ein. Falls eine Weiterverwendung außerhalb dieses Projekts strengere
Klarheit braucht: die espeak-ng-Lizenz selbst (GPL-3.0) gilt für das Werkzeug, nicht
automatisch für jede damit erzeugte Datei.

### 3.2 ElevenLabs-Aufnahmen (`scripts/generate_audio_elevenlabs.py`) — geklärt seit Entwicklungsauftrag 19

759 Vokabel-Audiodateien wurden über die ElevenLabs-Text-to-Speech-API erzeugt, **während für
diesen Account der kostenlose ElevenLabs-Tarif aktiv war**. Damit ist die zuvor offene Frage
geklärt: **Lizenz: NICHT MIT, NICHT CC BY-SA — eigenständige, striktere Bedingungen.**

- Nutzung **ausschließlich nichtkommerziell** (Bedingung des kostenlosen ElevenLabs-Tarifs).
- Sichtbare Namensnennung erforderlich: *"Audio generated with ElevenLabs (elevenlabs.io)."*
- Unterliegt zusätzlich den jeweils aktuellen ElevenLabs-Nutzungsbedingungen (elevenlabs.io).
- Vollständige Details, Begründung und eine Kurzfassungstabelle: siehe
  [`NOTICE-AUDIO.md`](NOTICE-AUDIO.md) — dort auch der genaue Wortlaut für eine etwaige
  kommerzielle Weiterverwendung des (MIT-lizenzierten) Anwendungscodes ohne diese Audios.

Welche konkrete Datei über welchen Weg erzeugt wurde, ist seit Entwicklungsauftrag 19
maschinenlesbar dokumentiert in
[`language-packs/arabic/audio-provenance.json`](language-packs/arabic/audio-provenance.json)
(erzeugt von `scripts/generateAudioProvenance.js`, keine geratene Herkunft) — nicht mehr nur am
Dateinamen ablesbar. Bei Bedarf weiterhin per erneutem Lauf von `scripts/generate_audio.py --force`
gezielt durch espeak-ng-Aufnahmen ersetzbar, falls Klarheit/Kommerzialisierbarkeit wichtiger als
Klangqualität ist.

## 4. Bilder

Aktuell werden **keine Bilder** ausgeliefert (siehe ROADMAP, "Bekannte Lücken" — Bild-
/Wortfamilien-Aufgaben sind mangels Bilddaten nicht umgesetzt). Sobald Bilder ergänzt
werden, muss dieser Abschnitt vor der ersten Veröffentlichung um deren Quelle und Lizenz
ergänzt werden.

## 5. Zusammenfassung

| Inhaltstyp | Lizenz | Ort |
|---|---|---|
| Anwendungscode | MIT | `main.js`, `preload.js`, `src/`, `scripts/*.js`, `test/` |
| Kursinhalte (JSON) | CC BY-SA 4.0 | `language-packs/arabic/*.json` |
| Audio (espeak-ng, 338 Dateien) | CC BY-SA 4.0 (siehe Vorbehalt oben) | `language-packs/arabic/audio/` |
| Audio (ElevenLabs, kostenloser Tarif, 759 Dateien) | **Nicht MIT, nicht CC BY-SA** — nur nichtkommerziell, ElevenLabs-Nennung erforderlich, siehe [`NOTICE-AUDIO.md`](NOTICE-AUDIO.md) | `language-packs/arabic/audio/vocabulary/` |
| Bilder | Noch nicht vorhanden | — |

Welche konkrete Audiodatei zu welcher Zeile gehört: maschinenlesbar in
[`language-packs/arabic/audio-provenance.json`](language-packs/arabic/audio-provenance.json).

**Wichtig für Weiterverwender:** Der Anwendungscode (MIT) und die ausgelieferten Audiodateien
unterliegen unterschiedlichen Nutzungsbedingungen. Eine kommerzielle Nutzung des Codes kann nach
MIT-Lizenz möglich sein — die veröffentlichte App-Version mit den enthaltenen ElevenLabs-Audios
(kostenloser Tarif) darf jedoch nicht kommerziell verwendet werden, solange diese Audios nicht
entfernt oder ersetzt wurden. Details: [`NOTICE-AUDIO.md`](NOTICE-AUDIO.md).

Diese Übersicht wird bei jeder größeren Content-Änderung aktualisiert (siehe
[`ROADMAP.md`](ROADMAP.md), Abschnitt 5 "Hinweise für die Weiterarbeit").
