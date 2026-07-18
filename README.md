# Learning Arabic Tool (FH Aachen)

Ein modularer, lokal laufender Vokabel- und Sprachtrainer. Erstes Sprachmodul: **Arabisch**
(modernes Hocharabisch / MSA). Läuft als eigenständige Desktop-App (Electron) unter Windows,
macOS und Linux — ohne dass Nutzer:innen Python, Java oder eine Datenbank installieren müssen.
Alle Lerninhalte und der persönliche Fortschritt werden vollständig lokal gespeichert.

## Für Nutzer:innen (fertige App)

Sobald Installer über GitHub Actions gebaut wurden (siehe unten), reicht:

1. Passende Datei für dein Betriebssystem herunterladen (`.exe` für Windows, `.dmg` für macOS,
   `.AppImage` für Linux).
2. Installieren bzw. entpacken und starten.
3. Fertig — kein Internetzugang, kein Python/Node, keine weitere Installation nötig.

## Für die Entwicklung

Zum Entwickeln/Testen wird **Node.js** (Version 18 oder neuer) benötigt — ausschließlich auf dem
Entwicklungsrechner, nicht bei den späteren Nutzer:innen der fertigen App.

```bash
npm install     # installiert Electron + electron-builder
npm start       # startet die App im Entwicklungsmodus
```

### Fertige Pakete lokal bauen

```bash
npm run build:win     # Windows-Installer (.exe)
npm run build:mac     # macOS-Image (.dmg) — funktioniert zuverlässig nur auf einem echten Mac
npm run build:linux   # Linux (.AppImage)
npm run build         # alle drei Plattformen
```

Ergebnisse landen im Ordner `dist/`.

### Automatischer Multi-Plattform-Build (GitHub Actions)

`.github/workflows/build.yml` baut bei jedem Push automatisch auf gehosteten Windows-, macOS- und
Linux-Runnern und lädt die fertigen Installer als Workflow-Artifacts hoch — ohne dass dafür lokal
ein Windows- oder Mac-Rechner nötig ist. Bei einem Git-Tag (z. B. `v0.1.0`) wird zusätzlich
automatisch ein GitHub-Release-Entwurf mit allen drei Installern angelegt.

## Architektur

- **Electron** mit `contextIsolation` + `sandbox` (kein `nodeIntegration`) — der Renderer (die
  Oberfläche) hat keinen direkten Dateisystemzugriff, sondern nur die über `preload.js`
  freigegebene API (`window.api.*`).
- **Speicherorte:** Fortschritt/Einstellungen liegen unter dem vom Betriebssystem vorgegebenen
  Nutzerdatenverzeichnis (`app.getPath('userData')/user_data/*.json`), getrennt von den
  Sprachinhalten in `language-packs/`.
- **Sprachpakete:** Jede Sprache liegt als eigenständiger Ordner unter `language-packs/<sprache>/`
  (`language.json`, `lessons.json`, `vocabulary.json`, `keyboard.json`, `grammar.json`,
  `grammar_2.json`, `grammar_3.json`, `reading.json`, `tutorials/`). Weitere Sprachen lassen sich
  später ergänzen, ohne die Hauptanwendung umzubauen.
- **RTL/Bidi:** Kein selbstgebauter Algorithmus — Chromium implementiert den Unicode
  Bidirectional Algorithm sowie die arabische Zeichenverbindung (isoliert/Anfang/Mitte/Ende)
  nativ. In den Sprachdaten werden nur normale Unicode-Grundbuchstaben gespeichert, nie
  getrennte Kontextform-Zeichen.
- **Aussprache:** Echte, mit der App ausgelieferte Audiodateien (`language-packs/arabic/audio/`,
  je Wort/Buchstaben-Beispielwort in normaler und langsamer Geschwindigkeit). Das entspricht
  Stufe 2 ("im Sprachpaket enthaltene Aufnahme") aus der Systembeschreibung und funktioniert
  garantiert auf jedem Gerät, unabhängig davon, ob das Betriebssystem eine arabische TTS-Stimme
  mitbringt. Zwei Wege, die Dateien zu erzeugen (siehe unten): kostenlos/offline mit `espeak-ng`
  (klingt synthetisch) oder über die ElevenLabs-API (deutlich natürlicher, kostenloses
  Kontingent reicht für diesen Wortschatz). Web Speech API (`speechSynthesis`) bleibt als
  Rückfallebene für Inhalte ohne generierte Audiodatei (`src/js/audioPlayer.js`); ob diese
  Rückfallebene klingt, hängt vom Betriebssystem ab.
- **Schwierigkeitsanpassung:** pro Karte und pro Fähigkeit getrennt (`arabic_to_german`,
  `german_to_arabic`, `pronunciation`, ...). Richtige Antworten senken die Schwierigkeit,
  Tippfehler/fehlende Vokalzeichen erhöhen sie leicht, falsche Antworten stärker; nach
  mehrfach falscher Antwort wird eine Karte für eine Intensivwiederholung markiert.

## Umfang dieser Version

**Alle 12 Lektionen der ursprünglichen Roadmap (0-11) sind jetzt vorhanden**, aber nicht alle im
vollen dort beschriebenen Umfang — bei linguistisch riskanteren Themen wurde bewusst gekürzt,
statt Inhalte ohne muttersprachliche Prüfung zu raten. Details je Lektion:

| # | Lektion | Umfang |
|---|---|---|
| 0 | Einführung | Vollständig |
| 1 | Tastatur-Tutorial | Vollständig (virtuelle Tastatur; physische Arabic-101-Belegung fehlt, siehe unten) |
| 2 | Alphabet | Alle 28 Buchstaben, Kontextformen, 2 von 6 Übungstypen |
| 3 | Grundwortschatz I | ~38 Wörter, 5 Themen, Karteikarten beide Richtungen |
| 4 | Grundgrammatik I | Nur 4 Themen (Artikel, Pronomen, Demonstrativa, Nominalsatz+Adjektiv) — Präpositionen, Besitzverbindungen, Fragen, Verneinung ausgelassen |
| 5 | Hörverständnis I | 2 von 6 Übungstypen (Übersetzung zuordnen, Diktat); Bild-/Satzaufgaben und Buchstaben-Hörübungen fehlen |
| 6 | Grundwortschatz II | ~32 weitere Wörter, 5 Themen |
| 7 | Grundgrammatik II | Nur reguläre Verbformen EINES Beispielverbs (Gegenwart/Vergangenheit), Präsens-Verneinung, 3 Konjunktionen — unregelmäßige/schwache Verben ausgelassen |
| 8 | Erweiterter Wortschatz | 2 Themen (Hochschule, Technik), ~12 Wörter — kein installierbares Fachwortpaket-System |
| 9 | Erweiterte Grammatik | **Nur** Relativpronomen (الذي/التي) — Verbstämme II-X, Passiv, Partizipien, Bedingungssätze, komplexe Besitzverbindungen, unregelmäßige/schwache/Hamza-Verben bewusst NICHT enthalten (zu hohes Fehlerrisiko ohne Prüfung) |
| 10 | Lesen und Schreiben | 1 kurzer Text (nur bereits geprüfter Wortschatz + 1 neue, sehr einfache Präposition في), 2 von 6 Übungstypen (Leseverständnis, Wortreihenfolge) — Diktat, Fehlerkorrektur, Übersetzung, freie Textproduktion fehlen (ohne echte Sprachprüfung nicht sinnvoll automatisch bewertbar) |
| 11 | Wiederholung & Prüfung | Gemischtes Quiz aus Buchstaben/Vokabular/Grammatik-Pronomen, gewichtet nach Schwierigkeit — reine Rekombination, keine neuen Inhalte |

Zusätzlich vorhanden: echte ausgelieferte Aussprache-Audiodateien (espeak-ng oder ElevenLabs, s.
Architektur-Abschnitt), Statistik-Ansicht (📊), pro Fähigkeit getrennte Schwierigkeitsanpassung,
lokale JSON-Speicherung.

**Weiterhin nicht enthalten** (siehe Roadmap "Version 2/3/4" in der ursprünglichen
Systembeschreibung): physische Arabic-(101)-Tastaturübersicht/-umschaltung, Transliterationsmodus
als echte Eingabemethode, installierbare Fachwortpakete, weitere Dialekte, weitere Sprachen
außer Arabisch, Editor für eigene Sprachpakete.

### Audiodateien neu erzeugen/erweitern

Beide Skripte lesen `vocabulary.json`/`keyboard.json` und **überspringen standardmäßig bereits
vorhandene Dateien** (spart Zeit bzw. API-Kontingent, überschreibt keine bereits ersetzten
besseren Aufnahmen versehentlich) — mit `--force` alle neu erzeugen.

**Kostenlos/offline (espeak-ng, synthetisch):**
```bash
sudo apt-get install -y espeak-ng   # einmalig, nur für dieses Skript
python3 scripts/generate_audio.py [--force]
```

**Natürlicher klingend (ElevenLabs-API, kostenloses Kontingent reicht für diesen Wortschatz):**
```bash
export ELEVENLABS_API_KEY="dein-api-key"      # elevenlabs.io → Profil → API Keys
python3 scripts/generate_audio_elevenlabs.py [--force]
```
Der Free-Tier darf über die API nur Stimmen aus "My Voices" nutzen (nicht jede Stimme aus der
Voice Library) — nutzbare Voice-IDs abfragen mit:
```bash
python3 -c "import requests,os; r=requests.get('https://api.elevenlabs.io/v1/voices', headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY']}); [print(v['voice_id'],'-',v['name']) for v in r.json()['voices']]"
```

Einfach erneut ausführen, wenn Vokabular ergänzt wird. Vorhandene Dateien können auch jederzeit
manuell 1:1 durch bessere Aufnahmen (z. B. echte Sprecher:innen) mit demselben Dateinamen
ersetzt werden, ohne Code zu ändern.

## Wichtiger Hinweis zu den Inhalten

Vokabular, Buchstaben-Beispielwörter und Pluralformen in `language-packs/arabic/` wurden von
einer KI anhand von gängigem Standardwissen zu modernem Hocharabisch zusammengestellt, **nicht
von einer Person mit Arabischkenntnissen gegengelesen**. Diakritika, Genus und insbesondere
Pluralformen (im Arabischen oft unregelmäßige "gebrochene Plurale") sind fehleranfällig, wenn
sie ohne muttersprachliche Prüfung erstellt werden. Vor dem produktiven Einsatz (z. B. im
Unterricht) sollte der Inhalt von jemandem mit Arabischkenntnissen gegengelesen werden.

## Bekannte Einschränkungen

- Für Vokabeln/Buchstaben ohne generierte Audiodatei (z. B. neu hinzugefügte Inhalte vor dem
  nächsten `generate_audio.py`-Lauf) greift die App auf `speechSynthesis` zurück — ob das
  hörbar ist, hängt dann wieder vom Betriebssystem ab.
- macOS-Installer (`.dmg`) lassen sich zuverlässig nur auf einem echten Mac oder über den
  GitHub-Actions-Workflow bauen, nicht direkt unter Windows/Linux.
