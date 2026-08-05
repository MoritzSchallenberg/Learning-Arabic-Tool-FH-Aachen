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
  (`language.json`, `lessons.json`, `courses.json`, `vocabulary.json`, `keyboard.json`,
  `grammar.json`, `grammar_2.json`, `grammar_3.json`, `reading.json`, `tutorials/`). Weitere
  Sprachen lassen sich später ergänzen, ohne die Hauptanwendung umzubauen.
- **Kurs/Unit/Lesson-Struktur:** `courses.json` gruppiert die navigierbaren Inhalte in Kurse und
  Units (nach dem vom Nutzer gelieferten Pflichtenheft), `lessons.json` bleibt die Registry für
  Titel/Intro-Text/Status jedes einzelnen navigierbaren Schlüssels — auch für die neuen
  Unit-Schlüssel (`unit_1` … `unit_10`). Details im Abschnitt "Kurs 1" weiter unten.
- **Verbindungstrainer (`src/js/wordShaping.js` + `src/js/views/connectionTrainer.js`):**
  berechnet die Kontextform (isoliert/Anfang/Mitte/Ende) jedes Buchstabens in einem Wort rein aus
  der Buchstabenfolge und dem `joining`-Typ (`dual`/`right`, schon in `keyboard.json` vorhanden) —
  keine gespeicherten Formen, keine Sprachannahmen, nur Unicode-Verbindungsregeln. Funktioniert
  nur für Wörter aus den 28 arabischen Grundbuchstaben (kein ة/ء/لا).
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
- **Spaced Repetition (leichtgewichtig):** jede Karte bekommt zusätzlich pro Fähigkeit einen
  `nextReview`-Zeitstempel nach der Intervall-Tabelle sofort/1/3/7/14/30 Tage (`srs.js`,
  `scheduleNextReview`) — bei falscher Antwort fällt die Karte auf Stufe 0 zurück (frühere
  Wiederholung), bei richtiger steigt sie eine Stufe. Reine JSON-Speicherung, keine SQLite-
  Migration (der Stack wurde bewusst nicht gewechselt, siehe Kurs-1-Abschnitt unten).

## Kurs 1: Arabische Schrift und erste Wörter (neue Kurs/Unit-Struktur)

Auf Wunsch des Nutzers wurde ein zweites, sehr ausführliches Pflichtenheft ("Arabischlern-App
Entwicklungsauftrag", ursprünglich für einen Python/PySide6/SQLite-Stack geschrieben) als
Vorlage für die **Kurs/Unit/Lesson-Struktur** übernommen — der Electron/JS-Stack selbst bleibt
unverändert, nur dieses Konstrukt sowie Buchstaben-Gruppierung, Verbindungstrainer,
Lesson-Phasen und Spaced-Repetition-Intervalle wurden daraus adaptiert (Details siehe
`.claude/plans/`-Verlauf bzw. Commit-Historie). Kurs 1 ersetzt inhaltlich die bisherige
Lektion 2 ("Alphabet", bleibt als eigenständige, kompakte Alternativ-Ansicht erhalten, nur
nicht mehr in der Seitenleiste verlinkt) durch 11 kleinteiligere Units:

| Unit | Inhalt | Buchstaben |
|---|---|---|
| 0 | Einführung (= bisherige Lektion 0+1) | — |
| 1 | Nicht weiterverbindende Buchstaben | ا د ذ ر ز و |
| 2 | Ähnliche Grundformen | ب ت ث ن ي |
| 3 | Drei ähnliche Formen | ج ح خ |
| 4 | Punktunterschiede | س ش ص ض |
| 5 | Emphatische Buchstaben | ط ظ |
| 6 | Kehllaute | ع غ |
| 7 | Restliche Buchstaben | ف ق ك ل م ه |
| 8 | Kurze Vokale | Fatha, Kasra, Damma, Sukun, Schadda |
| 9 | Lange Vokale & Sonderformen | ا/و/ي als Langvokal, Tāʾ marbūṭa, Hamza-Formen |
| 10 | Konsolidierung | gemischte Übung über alle 28 Buchstaben + Verbindungstrainer |

Units 1-7 laufen alle über dieselbe wiederverwendbare View (`letterGroupLesson.js`, Buchstaben-IDs
als Parameter) mit 5 Phasen (Einführung, Wiedererkennen, Verbindungstrainer, Geführte Eingabe,
Selbstständige Eingabe) — eine konkrete, vereinfachte Version der im Pflichtenheft beschriebenen
9-Phasen-/5-Hilfestufen-Engine. Die volle generische Engine ist eine spätere Ausbaustufe. Kurs 2-5
aus dem Pflichtenheft existieren als Navigations-Gruppierung (`courses.json`), verweisen aber
inhaltlich noch auf die bestehenden Lektionen 3-11 unverändert.

## Umfang dieser Version

**Alle 12 (Kurs-2-5-)Lektionen sowie Kurs 1 (Units 0-10) sind vorhanden**, aber nicht alles im
vollen im Pflichtenheft beschriebenen Umfang — bei linguistisch riskanteren Themen wurde bewusst
gekürzt, statt Inhalte ohne muttersprachliche Prüfung zu raten. Details je Bereich:

| # | Lektion | Umfang |
|---|---|---|
| 0 | Einführung | Vollständig |
| 1 | Tastatur-Tutorial | Vollständig (virtuelle Tastatur; physische Arabic-101-Belegung fehlt, siehe unten) |
| 1-10 | Kurs 1: Buchstaben-Units | Siehe Tabelle oben — 4 von 10 Verbindungstrainer-Aufgabentypen umgesetzt |
| (2) | Alphabet (Alt-Ansicht) | Weiterhin vorhanden, aber nicht mehr in der Seitenleiste — durch Kurs-1-Units ersetzt |
| 3 | Grundwortschatz I | ~90 Wörter, 10 Themen, Karteikarten beide Richtungen |
| 4 | Grundgrammatik I | Nur 4 Themen (Artikel, Pronomen, Demonstrativa, Nominalsatz+Adjektiv) — Präpositionen, Besitzverbindungen, Fragen, Verneinung ausgelassen |
| 5 | Hörverständnis I | 2 von 6 Übungstypen (Übersetzung zuordnen, Diktat); Bild-/Satzaufgaben und Buchstaben-Hörübungen fehlen |
| 6 | Grundwortschatz II | ~44 weitere Wörter, 9 Themen |
| 7 | Grundgrammatik II | Nur reguläre Verbformen EINES Beispielverbs (Gegenwart/Vergangenheit), Präsens-Verneinung, 3 Konjunktionen — unregelmäßige/schwache Verben ausgelassen |
| 8 | Erweiterter Wortschatz | 2 Themen (Hochschule, Technik), ~12 Wörter — kein installierbares Fachwortpaket-System |
| 9 | Erweiterte Grammatik | **Nur** Relativpronomen (الذي/التي) — Verbstämme II-X, Passiv, Partizipien, Bedingungssätze, komplexe Besitzverbindungen, unregelmäßige/schwache/Hamza-Verben bewusst NICHT enthalten (zu hohes Fehlerrisiko ohne Prüfung) |
| 10 | Lesen und Schreiben | 1 kurzer Text (nur bereits geprüfter Wortschatz + 1 neue, sehr einfache Präposition في), 2 von 6 Übungstypen (Leseverständnis, Wortreihenfolge) — Diktat, Fehlerkorrektur, Übersetzung, freie Textproduktion fehlen (ohne echte Sprachprüfung nicht sinnvoll automatisch bewertbar) |
| 11 | Wiederholung & Prüfung | Gemischtes Quiz aus Buchstaben/Vokabular/Grammatik-Pronomen, gewichtet nach Schwierigkeit — reine Rekombination, keine neuen Inhalte |

Zusätzlich vorhanden: echte ausgelieferte Aussprache-Audiodateien (espeak-ng oder ElevenLabs, s.
Architektur-Abschnitt), Statistik-Ansicht (📊), pro Fähigkeit getrennte Schwierigkeitsanpassung,
lokale JSON-Speicherung, sowie ein kurzer **Info-Screen vor jeder Lektion** (Titel + Ablauf, z. B.
"zuerst Vokabeln lernen, danach Aussprache einschätzen"), bevor es mit "Los geht's" zur eigentlichen
Lektion geht.

Der Wortschatz umfasst aktuell **141 Wörter** (Lektionen 3/6/8 zusammen) — geplant ist eine
schrittweise Erweiterung auf 200-300, in weiteren, jeweils sorgfältig geprüften Schritten statt
in einem großen, ungeprüften Sprung.

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
- Aus dem "Arabischlern-App Entwicklungsauftrag"-Pflichtenheft bewusst zurückgestellt (spätere
  Runden): volle generische 9-Phasen-/5-Hilfestufen-Lesson-Engine (nur konkrete ~5-Phasen-Version
  für Kurs-1-Units), alle 10 Verbindungstrainer-Aufgabentypen (nur 4 umgesetzt), Kurs 2-5 im
  vollen Unit-Detail (bleiben vorerst die bestehenden Lektionen 3-11, nur umbenannt/gruppiert),
  Kurspakete als eigenständig installierbare `.arabiccourse`-ZIP-Dateien (bleibt Ordnerstruktur),
  Bilder/Wortfamilien/Minimalpaar-Audio-Aufgaben.
