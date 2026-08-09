# Learning Arabic Tool (FH Aachen)

Ein modularer, lokal laufender Vokabel- und Sprachtrainer. Erstes Sprachmodul: **Arabisch**
(modernes Hocharabisch / MSA). Läuft als eigenständige Desktop-App (Electron) unter Windows,
macOS und Linux — ohne dass Nutzer:innen Python, Java oder eine Datenbank installieren müssen.
Alle Lerninhalte und der persönliche Fortschritt werden vollständig lokal gespeichert.

**Für die Weiterarbeit an diesem Projekt:** siehe [`ROADMAP.md`](ROADMAP.md) — Zielvision,
aktueller Stand und priorisierte nächste Schritte an einem Ort.

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

### Lokaler Sprachprüf-Arbeitsbereich (Entwicklungsauftrag 12)

```bash
npm run review:start   # eigenes, getrenntes Prüfprogramm für die Sprachprüfung von Kurs 1
```

Startet ein eigenständiges Electron-Fenster (eigener Hauptprozess `reviewMain.js`/
`reviewPreload.js`, eigene Oberfläche unter `src/review/`) für eine Person mit Arabischkenntnissen
— siehe `REVIEWER_QUICKSTART.md` für die Bedienung und `LANGUAGE_REVIEW_GUIDE.md` für die
inhaltlichen Prüfkriterien. Verändert die normale Lernoberfläche (`npm start`) nicht.

### Audio-Erzeugungspipeline (Entwicklungsauftrag 12)

```bash
npm run audio:plan              # nur lesen: Plan-Vorschau (Dateien, Zeichen, API-Aufrufe)
npm run audio:generate:sample   # 20-Wörter-Stichprobe erzeugen
npm run audio:generate          # alle noch fehlenden Vokabelaudios erzeugen
npm run audio:verify            # rein lesende Konsistenzprüfung
```

Siehe `AUDIO_GENERATION_GUIDE.md` für Details (Statusmodell, Kostenschutz, Provider-Einrichtung).

### Fertige Pakete lokal bauen

```bash
npm run build:win     # Windows-Installer (.exe)
npm run build:mac     # macOS-Image (.dmg) — funktioniert zuverlässig nur auf einem echten Mac
npm run build:linux   # Linux (.AppImage)
npm run build         # alle drei Plattformen
```

Ergebnisse landen im Ordner `dist/`.

### Tests und Lint

```bash
npm test                  # alle Tests (Unit + Integration)
npm run test:unit         # nur Unit-Tests (test/unit/*.test.js)
npm run test:integration  # nur Integrationstests (test/integration/*.test.js)
npm run lint              # JS-Syntax, JSON-Validität, globale Namenskollisionen
npm run validate:course   # Kursdaten-Konsistenz: doppelte IDs, fehlende Audios, Querverweise
```

Läuft komplett offline mit dem in Node eingebauten Test-Runner (`node:test`/`node:assert`) —
keine zusätzlichen Test-Abhängigkeiten, kein `npm install` über die ohnehin für Electron/
electron-builder nötigen Pakete hinaus. Ein fehlgeschlagener Test/eine fehlgeschlagene
Validierung liefert einen Exit-Code ungleich 0 (z. B. für CI). Getestet werden u. a.: arabische
Normalisierung und Antwortbewertungsprofile (`test/unit/srs.test.js`, ≥30 arabische
Vergleichsfälle), Unicode-sicheres Tastatur-Löschen (`test/unit/textEditing.test.js`), die
virtuelle Tastatur End-zu-Ende inkl. Tastenzuordnung und Tastatur-Lernstufen 1-4
(`test/unit/virtualKeyboard.test.js`), die Antwortsperre/Timer-Aufräumung
(`test/unit/exerciseGuard.test.js` sowie End-zu-Ende-Tests gegen die echte
`letterGroupLesson.js`/`connectionTrainer.js`/`freePractice.js`-Logik), atomare/versionierte
Fortschrittsspeicherung inkl. Migration realer Nutzerdaten (`test/unit/progressStore.test.js`,
`test/integration/progressMigration.test.js`), Hilfestufen A-E (`test/unit/helpLevel.test.js`),
die echte Review Queue (`test/unit/reviewScheduler.test.js`), TheoryRenderer
(`test/unit/theoryRenderer.test.js`) und die Fortschritts-/Kompetenzbalken inkl. Regressionstest
für den behobenen Anzeigefehler (`test/unit/progressStats.test.js`, `test/unit/statistics.test.js`).
`test/helpers/domStub.js` stellt dafür einen kleinen, abhängigkeitsfreien DOM-Stub mit echtem
(wenn auch minimalem) HTML-Parser und CSS-Selektor-Matching bereit — bewusst kein jsdom, damit
`npm test` ohne zusätzliche Downloads läuft.

### Automatischer Multi-Plattform-Build (GitHub Actions)

`.github/workflows/build.yml` (im Repository vorhanden, nicht nur geplant) läuft bei jedem Push
in zwei Stufen: zuerst `npm ci` + `npm run lint` + `npm run validate:course` + `npm test` auf
einem Linux-Runner (der Build startet nur, wenn das grün ist), danach der eigentliche Build auf
gehosteten Windows-, macOS- und Linux-Runnern, deren Installer als Workflow-Artifacts hochgeladen
werden — ohne dass dafür lokal ein Windows- oder Mac-Rechner nötig ist. Bei einem Git-Tag (z. B.
`v0.1.0`) wird zusätzlich automatisch ein GitHub-Release-Entwurf mit allen drei Installern
angelegt.

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
  nur für Wörter aus den 28 arabischen Grundbuchstaben (kein ة/ء/لا). Deckt alle 10 im
  Pflichtenheft genannten Aufgabentypen über 9 konkrete Übungsmechaniken ab (Kontextform per
  Multiple-Choice wählen, Buchstabenname erkennen, Verbindungen/Trennstellen markieren,
  Kontextform bestimmen, Wort zusammensetzen, falsche Reihenfolge erkennen, fehlenden Buchstaben
  ergänzen, mit der Tastatur nachschreiben — "Wort zerlegen" und "Wort animiert zusammensetzen"
  sind in der Zusammensetzen-Übung vereint).
- **Virtuelle Tastatur (`src/js/keyboardData.js` + `src/js/views/virtualKeyboard.js`):** alle 28
  Grundbuchstaben inkl. ذ (vorher versehentlich gefehlt), optisch an der physischen Arabic-101-
  Tastatur orientiert (Zeilen in physischer Links-nach-rechts-Reihenfolge, `direction: ltr` auf
  dem Tastatur-Container statt `rtl` — Letzteres hätte die Reihenfolge visuell gespiegelt).
  Funktionstasten: Leertaste, Unicode-graphem-sicheres Löschen (`src/js/textEditing.js` — löscht
  Buchstabe+Vokalzeichen als eine Einheit statt nur eine UTF-16-Codeeinheit), gesamtes Feld
  löschen, Bestätigen, Shift/Sonderzeichen-Umschaltung (أ إ آ, vorher doppelt mit dem Grundlayout
  angezeigt), Vokalzeichen-Umschaltung, arabische Satzzeichen und Ziffern. ARIA-Labels und
  sichtbarer Tastaturfokus vorhanden.
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
- **Antwortauswertung (`srs.js`):** aufgabenspezifische Bewertungsprofile (`arabic_letter_strict`,
  `arabic_word_strict`, `arabic_word_ignore_diacritics`, `arabic_word_require_diacritics`,
  `arabic_sentence_flexible`, `german_translation_flexible`) statt eines einzigen festen
  Levenshtein-Grenzwerts — die Tippfehler-Toleranz hängt von der normalisierten Antwortlänge ab
  (einzelne Buchstaben: keine Toleranz; kurze Wörter: sehr wenig; längere Sätze: proportional
  mehr). Normalisierung ist konfigurierbar (NFC, Tatweel, unsichtbare Steuerzeichen, Vokalzeichen,
  Alif-/Hamza-Formen, Satzzeichen, deutsche Groß-/Kleinschreibung).
- **Zentrale Antwortsperre + Timer-Aufräumung (`src/js/exerciseGuard.js`):** jede Übungsaufgabe
  läuft über einen `ExerciseGuard` (`idle → submitted → showing_feedback → transitioning →
  completed`) — verhindert Mehrfachbewertung bei Doppelklick und bricht laufende
  Weiterschalt-Timer ab, sobald die Ansicht verlassen wird (`App.registerCleanup`), damit kein
  Callback mehr auf eine nicht mehr sichtbare Aufgabe feuert.
- **Fortschrittsspeicherung (`src/js/progressStore.js`, von `main.js` genutzt):** atomares
  Schreiben (temporäre Datei + Umbenennen), automatisches Backup der zuletzt gültigen Version vor
  jedem Überschreiben, Wiederherstellung aus dem Backup bei kaputter Hauptdatei, ein
  Versionsfeld (`_version`) mit transparenter Migration aus dem alten, unversionierten Format,
  sowie eine zentrale Speicherwarteschlange pro Datei (`enqueueWrite`) gegen unkontrollierte
  parallele Schreibvorgänge.

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
| 8 | Kurze Vokale | Fatha, Kasra, Damma, Sukun, Schadda, Tanwin Fath/Kasr/Damm (alle 8) |
| 9 | Lange Vokale & Sonderformen | ا/و/ي als Langvokal, Tāʾ marbūṭa, Hamza-Formen |
| 10 | Konsolidierung | gemischte Übung über alle 28 Buchstaben + Verbindungstrainer |

Units 1-7 laufen alle über dieselbe wiederverwendbare View (`letterGroupLesson.js`, Buchstaben-IDs
als Parameter) mit allen 9 im Pflichtenheft beschriebenen Lesson-Phasen: Einführung,
Wiedererkennen, Zuordnen (Klick-Paare Buchstabe↔Name), Unterscheiden (Multiple-Choice mit
Distraktoren nur aus derselben, formähnlichen Unit-Gruppe), Rekonstruieren (Verbindungstrainer),
Geführte Eingabe, Selbstständige Produktion, Anwendung (welches Vokabelwort enthält diesen
Buchstaben?) und Abschlussprüfung (gemischtes Mini-Quiz nur über die Unit-Buchstaben). In der
Selbstständigen Produktion und der Abschlussprüfung ist der Buchstaben-Hinweis zunächst
ausgeblendet und wird erst nach zwei Fehlversuchen in Folge automatisch eingeblendet — eine
leichtgewichtige Umsetzung des Pflichtenheft-Prinzips "Hilfestufe bei Fehlern zurücksetzen"
(keine vollständige 5-stufige A-E-Zustandsmaschine, aber dasselbe Grundprinzip). Kurs 2-5 aus dem
Pflichtenheft existieren als Navigations-Gruppierung (`courses.json`), verweisen aber inhaltlich
noch auf die bestehenden Lektionen 3-11 unverändert.

## Umfang dieser Version

**Alle 12 (Kurs-2-5-)Lektionen sowie Kurs 1 (Units 0-10) sind vorhanden**, aber nicht alles im
vollen im Pflichtenheft beschriebenen Umfang — bei linguistisch riskanteren Themen wurde bewusst
gekürzt, statt Inhalte ohne muttersprachliche Prüfung zu raten. Details je Bereich:

| # | Lektion | Umfang |
|---|---|---|
| 0 | Einführung | Vollständig |
| 1 | Tastatur-Tutorial | Vollständig (virtuelle Tastatur; physische Arabic-101-Belegung fehlt, siehe unten) |
| 1-10 | Kurs 1: Buchstaben-Units | Siehe Tabelle oben — volle 9-Phasen-Engine, alle 10 Verbindungstrainer-Aufgabentypen umgesetzt |
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
Lektion geht. Jede Lektion/Unit zeigt außerdem einen **Fortschritts-Farbpunkt** in der
Seitenleiste: grau = noch nicht begonnen, gelb = in Bearbeitung, grün = bestanden (Ø-Schwierigkeit
über alle zugehörigen Karten ≤ 3,5), rot = schwierig/eher falsch beantwortet (Ø ≥ 6,5) —
`src/js/lessonProgress.js`.

Der Wortschatz umfasste ursprünglich 141 Wörter (Lektionen 3/6/8 zusammen); Kurs 1 wird seit
Entwicklungsauftrag 6 schrittweise (Batch für Batch, jeweils inkl. Sprachprüfdatei) auf 900
Wörter in 30 thematischen Vokabel-Units ausgebaut — Details im Abschnitt "Kurs 1 auf 900 Vokabeln
ausgebaut" weiter unten. Diese ältere "Grundwortschatz I/II"-Kartenansicht bleibt als
zusätzlicher freier Übungsmodus bestehen, ist aber nicht die primäre Lernroute (die läuft über
die Vokabel-Units/-Sessions, siehe CourseView).

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

## Meilenstein 1: Stabilisierung (Entwicklungsauftrag "Veröffentlichungsfähigkeit")

Nach dem ersten ausgiebigen Testen von Kurs 1 wurde ein zweiter Entwicklungsauftrag umgesetzt,
der auf Stabilität und Testbarkeit statt neuer Inhalte zielt (Details und Fortschritt je
Meilenstein: [`ROADMAP.md`](ROADMAP.md), Abschnitt 6). In dieser Runde umgesetzt und getestet:

- **Virtuelle Tastatur korrigiert:** ذ ergänzt, Spiegelung durch `direction: rtl` behoben,
  doppelt angezeigte Sonderzeichen entfernt, fehlende Funktionstasten (Alles löschen, Bestätigen,
  Shift/Sonderzeichen- und Vokalzeichen-Umschaltung, Satzzeichen, Ziffern) ergänzt.
- **Unicode-sicheres Löschen:** Rücktaste löscht ein vollständiges Graphem (Buchstabe +
  Vokalzeichen) statt nur eine UTF-16-Codeeinheit.
- **Zentrale Antwortsperre + Timer-Aufräumung:** in allen 13 Übungs-Views (`ExerciseGuard`) —
  Doppelklick erzeugt nur noch einen Versuch, Timer werden beim Verlassen einer Ansicht
  abgebrochen.
- **Antwortauswertung überarbeitet:** aufgabenspezifische Bewertungsprofile statt festem
  Levenshtein-Grenzwert 2 — der Kernfehler (ein einzelner falscher Buchstabe wurde als
  Tippfehler durchgewunken) ist behoben.
- **Fortschritt atomar + versioniert gespeichert:** temp+rename-Schreiben, automatisches Backup,
  Wiederherstellung bei kaputter Datei, Migration alter Fortschrittsdateien (gegen eine
  Sicherheitskopie der echten Nutzerdaten getestet, ohne Datenverlust).
- **Automatisierte Tests eingerichtet:** `npm test`/`npm run lint`, komplett offline mit dem in
  Node eingebauten Test-Runner (siehe Abschnitt "Tests und Lint" oben).

## Meilenstein A+B: Bestand korrigieren + Lernarchitektur (Entwicklungsauftrag 3)

Dritter Entwicklungsauftrag: Kurs 1 zu einem vollständigen Grundkurs mit ~900 Vokabeln
ausbauen. Diese Runde deckt ausschließlich Meilenstein A (Bestand korrigieren) und Meilenstein B
(Lernarchitektur) ab — die Vokabel-Migration/-Erweiterung folgt erst danach (siehe
[`ROADMAP.md`](ROADMAP.md), Abschnitt 7, für den vollständigen Stand je Meilenstein A-G).

**Meilenstein A:**
- `npm test`/`npm run test:unit`/`test:integration` laufen jetzt über konkrete Dateimuster
  (`test/unit/*.test.js`) statt Verzeichnispfade.
- `.github/workflows/build.yml` existierte bereits im Repository (die Behauptung, sie fehle,
  ließ sich nicht nachvollziehen — vermutlich stammte sie aus einem Export ohne Punktordner);
  um einen vorgeschalteten Test-Job erweitert: `npm ci` → `npm run lint` →
  `npm run validate:course` → `npm test`, erst danach die Build-Matrix (Windows/Linux/macOS).
- `.gitignore` erweitert, `LICENSE` (MIT), [`LICENSES.md`](LICENSES.md) (Code/Kursinhalte/Audio
  getrennt dokumentiert, inkl. offenem Klärungsbedarf bei ElevenLabs-Audiolizenzen),
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` neu erstellt.
- `npm run validate:course` (`scripts/validateCourse.js`) neu: prüft doppelte IDs, fehlende
  Audiodateien, Buchstaben-/Lesson-Querverweise; unterscheidet harte Fehler (Exit-Code 1) von
  informativen Hinweisen zu noch nicht begonnenen späteren Meilensteinen.

**Meilenstein B** (Details siehe ROADMAP):
- **TheoryRenderer** (`src/js/theoryRenderer.js`): blockbasierte Theorieseiten (11 Blocktypen),
  ausschließlich über `textContent`/`createElement` gerendert — nie `innerHTML` mit Kursdaten,
  wichtig für später importierbare Kurspakete. Zwei Darstellungsstufen ("Kurz erklärt"/"Mehr
  erfahren"), Theoriefortschritt wird gespeichert.
- **Hilfestufen A-E** (`src/js/helpLevel.js`) als generisches System: 2 Fehler in Folge → mehr
  Hilfe, 3 richtige in Folge → weniger Hilfe.
- **Tastatur-Lernstufen 1-4** in `virtualKeyboard.js`: die nächste erwartete Taste wird optisch
  hervorgehoben (aus der Zielantwort + Cursorposition berechnet, nie zur automatischen
  Auswertung verwendet), reagiert auch auf physische Tastatureingabe; Stufe 4 blendet die
  virtuelle Tastatur aus, jederzeit wieder einblendbar.
- **Echte Review Queue** (`src/js/reviewScheduler.js`): nutzt die vorhandenen SRS-Felder
  tatsächlich zur Auswahl (fällig → häufig falsch → niedrige Beherrschung → neue Wörter im
  einstellbaren Tageslimit 5/10/15/20) — treibt den neuen **freien Übungsmodus**
  (`src/js/views/freePractice.js`, Sidebar "🎯 Frei üben") und die neue **Startseite**
  (`src/js/views/dashboard.js`, Sidebar "🏠 Start") an, beide bereits jetzt mit den
  vorhandenen 28 Buchstaben + 141 Vokabeln nutzbar.
- **Fortschritts-/Kompetenzbalken** (`src/js/progressStats.js`): behebt dabei einen
  bestehenden Anzeigefehler in der Statistik-Ansicht — die Schwierigkeits-Meter füllten sich
  bisher mit steigender Schwierigkeit, was optisch wie Fortschritt aussah, obwohl höhere
  Schwierigkeit schlechter bedeutet. Beherrschung (grün, höher = besser) und Schwierigkeit
  (rot, höher = schwieriger) sind jetzt klar getrennte Balken; ein Wort zählt nur anteilig als
  beherrscht, wenn nur eine von mehreren Fähigkeiten trainiert wurde.

**Bewusst zurückgestellt** (Begründung siehe ROADMAP Abschnitt 7): die generische,
datenbasierte Session Engine sowie Session-Wiederaufnahme mit einem echten Verbraucher — beide
benötigten Bausteine (TheoryRenderer, HelpLevel, Tastaturstufen, ReviewScheduler,
Speicherschicht in `state.js`) sind fertig, ihr Zusammenbau zu einer vollständigen 9-Phasen-
Session-Orchestrierung wird auf Meilenstein D verschoben, sobald reale Session-Inhalte im
neuen Vokabel-Datenmodell existieren, statt gegen erfundene Beispieldaten zu entwerfen.
Ebenfalls offen: `evaluateAgainstAny()` in echten Aufgaben (erst mit den neuen
`accepted_arabic_answers`-Feldern sinnvoll), Verbindungstrainer mit echten visuellen
Verbindungsfehlern, weiterer Ausbau von Units 8-10, vollständige Einstellungs-Prüfung.

## Schritt 1-4: neues Interface + echte Session Engine (Entwicklungsauftrag 4)

Vierter Entwicklungsauftrag: vollständig überarbeitetes Interface (Navigation, Kurs-/
Unit-Ansichten, Designsystem) und die im vorigen Auftrag bewusst zurückgestellte generische
Session Engine — diesmal gegen eine echte Pilot-Session gebaut, nicht gegen erfundene
Beispieldaten. Diese Runde deckt ausschließlich Schritt 1-4 des Gesamtauftrags ab, demonstriert
an genau einer Session ("Begrüßung und Höflichkeit", 9 vorhandene Wörter aus der
`greetings`-Kategorie); die zwei weiteren Pilot-Units sowie Schritt 5-8 folgen in einer
späteren Runde (siehe [`ROADMAP.md`](ROADMAP.md), Abschnitt 8, für den vollständigen Stand).

- **Neue Hauptnavigation** (`src/index.html`, `src/js/app.js`): nur noch 6 Bereiche (Start/
  Kurs/Wiederholen/Frei üben/Fortschritt/Einstellungen) statt einer dauerhaft ausgeklappten
  Liste aller Units/Lektionen — ein-/ausklappbare Seitenleiste (`sidebarCollapsed`-Einstellung,
  bleibt nach Neustart erhalten), lokale SVG-Symbole statt Emoji. Bestehende Kurs-1-Inhalte
  (Buchstaben-Units, Lektionen 3-11) bleiben technisch unverändert und weiterhin über
  `App.navigateTo(key)` erreichbar, nur nicht mehr direkt in der Seitenleiste sichtbar, sondern
  über die neue Kursansicht.
- **Kopfzeile mit Breadcrumbs** (`App.renderHeader`): Seitentitel, optionaler Zurück-Button,
  kompakter Fortschritt — ausschließlich über `createElement`/`textContent` gerendert, nie
  `innerHTML` mit dynamischen Titeln/Breadcrumb-Texten (wichtig für später importierbare
  Kurspakete, siehe Sicherheits-Hinweis im Architekturabschnitt).
- **Designsystem** (`src/css/style.css`): semantische CSS-Variablen mit Hell-/Dunkel-/
  Systemmodus (tatsächlich angewendet über `App.applyTheme`, in den Einstellungen wählbar und
  persistent), größere Typografie-Skala für arabische Haupt-/Beispielwörter, ~30 neue
  wiederverwendbare Komponentenklassen (Kurs-/Unit-/Session-Karten, Status-Badges,
  Wort-/Theoriekarten, feste Aktionsleiste, Dialog, Leer-/Lade-/Fehlerzustand).
- **Kursansicht** (`src/js/views/courseView.js`) und **Unit-Detailansicht**
  (`src/js/views/unitDetailView.js`): ersetzen die frühere dauerhaft ausgeklappte Lesson-Liste.
  Units erscheinen als Karten/Lernroute mit Status (verfügbar/begonnen/abgeschlossen), eine
  Unit-Detailseite zeigt ihre Sessions als eigene Karten mit Phasen-Tags (Theorie/Lernen/Üben)
  und passendem Button ("Session starten"/"Fortsetzen"/"Erneut üben").
- **Session Engine** (neues Verzeichnis `src/js/session/`: `sessionState.js`,
  `phaseRegistry.js`, `sessionQueue.js`, `exerciseRegistry.js`, `sessionEngine.js`,
  `sessionRenderer.js`, `sessionController.js`) — erzwingt die verlangte Reihenfolge Theorie
  (beim ersten Durchlauf verpflichtend) → Wörter kennenlernen → Wiedererkennen → Rekonstruieren
  → Geführte Produktion → Selbstständige Produktion → Anwendung → Abschluss: kein neues Wort
  erscheint zuerst in einer Produktionsaufgabe. Falsch beantwortete Aufgaben erscheinen erst
  nach 3-5 anderen Aufgaben erneut (`sessionQueue.scheduleRepeat`). Feedback verschwindet nie
  automatisch — jede Aufgabe endet mit einem manuellen "Weiter"-Klick, kein Auto-Advance nach
  900/1400ms. Session-Zustand (Phase, Aufgabenindex, gezeigte Wörter, Theoriefortschritt,
  Hilfestufe, richtige/falsche Antworten) wird nach jeder Aufgabe gespeichert — nach einem
  Neustart setzt die Session an derselben Stelle fort, statt neu bei der Theorie zu beginnen.
- **TheoryRenderer tatsächlich angeschlossen**: war im vorigen Auftrag fertig gebaut, aber vom
  normalen Kursablauf nie aufgerufen — die Session Engine ruft ihn jetzt für jede Session real
  auf, inklusive eines jederzeit erreichbaren "Theorie ansehen"-Buttons während der laufenden
  Session (ohne Sessionfortschritt zu verlieren) und eines gespeicherten Mini-Check-Ergebnisses.
  Neuer Pilot-Theorietext "Begrüßung und Höflichkeit"
  (`language-packs/arabic/theory.json`, `content_status: needs_language_review`): echte
  Erklärung statt reiner Aufgabenankündigung.
- **Pilot-Sessiondaten** (`language-packs/arabic/vocabSessions.json`): eine Vokabel-Unit
  ("Begrüßung und Höflichkeit") mit einer Session aus den 9 vorhandenen `greetings`-Wörtern —
  bewusst keine erfundenen Wörter, wie vom Auftrag verlangt.

**Bei der Verifikation gefundene und behobene Fehler** (Ende-zu-Ende-Test gegen die reale
Pilot-Session, `test/unit/sessionController.e2e.test.js`):
1. `test/helpers/domStub.js`s `FakeElement` hatte kein `firstChild`/`removeChild` — das
   Standard-Muster `while (el.firstChild) el.removeChild(el.firstChild)` lief dadurch im Test
   ins Leere (reiner Test-Infrastruktur-Fehler, kein App-Fehler).
2. Echter Fehler in `sessionController.js`: die Prüfung, ob eine Aufgaben-Warteschlange neu
   gestartet werden muss, war mehrdeutig zwischen "noch nie gestartet" und "gerade fertig
   geworden" — dadurch startete die letzte Aufgabe einer Übungsphase (z. B. Wiedererkennen) die
   komplette Phase erneut, statt zur nächsten Phase weiterzuschalten. Behoben durch eine neue,
   eindeutige `sessionEngine.hasStartedQueue()`.

**Getestet:** `npm test` (199 Unit- + 1 Integrationstest, alle grün, inkl. dreier neuer
End-zu-Ende-Tests für die komplette Pilot-Session, Wiederaufnahme und "Theorie ansehen"
mitten in der Session), `npm run lint` (0 Kollisionen), `npm run validate:course` (0 Fehler,
inkl. neuer Prüfungen für Sessions/Theorie-Dokumente).

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP Abschnitt 8): die zwei weiteren Pilot-Units
(Familie und Personen; Zuhause und Räume), Schritt 5-8 (Übungsoberflächen-Feinschliff, freies
Üben neu gestalten), 759 neue Vokabeln, volle 900er-Erweiterung, Kurs-2-Inhalte.

## Lernfluss fertiggestellt, drei Pilot-Units vollständig (Entwicklungsauftrag 5)

Fünfter Entwicklungsauftrag, direkt auf den vorigen aufbauend: die Session Engine funktionierte
zwar, hatte aber mehrere inhaltliche Schwächen — zu lange Sessions (potenziell über 50 Aufgaben
bei zehn Wörtern), eine Wortvorschau, die "exposed" allein durchs Rendern setzte statt durch
echtes aktives Wiedererkennen, ungenaue Session-Wiederaufnahme, ein Dashboard-Hauptbutton, der
trotz aktiver Session immer in den freien Übungsmodus führte, und nur eine von drei geplanten
Pilot-Units. Diese Runde stellt den Lernablauf mit den vorhandenen 141 Wörtern fertig, **ohne**
die 759 neuen Vokabeln zu erzeugen (siehe [`ROADMAP.md`](ROADMAP.md), Abschnitt 9, für den
vollständigen Stand).

- **Session Engine grundlegend überarbeitet**: jede Übungsphase bekommt jetzt nur noch eine
  anhand einer empfohlenen Verteilung berechnete Wortauswahl (bei zehn Wörtern 28 Kernaufgaben
  statt potenziell über 50), geführte und selbstständige Produktion garantieren gemeinsam
  trotzdem die volle Wortabdeckung. Falsche Antworten dürfen jetzt bis zu dreimal wiederholt
  werden (vorher nur einmal). Aufgaben-Warteschlangen werden je Phase einmal gebaut und exakt im
  Sessionzustand gespeichert — eine Wiederaufnahme nach Neustart stellt exakt dieselbe
  Reihenfolge/Position/geplante Wiederholung wieder her (mit einem eigenen Test verifiziert).
  Fällige Wiederholungswörter aus früheren Sessions werden automatisch eingemischt
  (`review_count` wird jetzt tatsächlich verwendet). Die Bewertung ist jetzt gewichtet (frühe
  Übungsphasen zählen weniger als die abschließende selbstständige Produktion). Das Tageslimit
  für neue Wörter wird jetzt tatsächlich hochgezählt.
- **Neue Wortlernphase**: Einzelansicht ("Wort X von N") statt Kartenraster als Standard, Wörter
  werden in Dreiergruppen gelernt, jede Gruppe endet mit einem leichten Mini-Check, der
  garantiert jedes Wort der Gruppe abfragt (vier zufällige Varianten: Arabisch→Deutsch,
  Deutsch→Arabisch, Audio→Wort, Wort→Audio).
- **Theorie-Mini-Check überarbeitet**: kein automatischer 600-ms-Wechsel mehr, erklärendes
  Feedback nach jeder Antwort, manuelles "Weiter", eine Zusammenfassung am Ende. Beim ersten
  Sessiondurchlauf muss der Mini-Check vollständig (nicht zwingend richtig) bearbeitet werden,
  bevor "Session starten" nutzbar wird.
- **Dashboard korrigiert**: die Hauptaktion führt bei einer aktiven Session jetzt direkt zur
  Session statt immer in den freien Übungsmodus; ohne aktive Session wird die nächste noch nicht
  abgeschlossene Session vorgeschlagen.
- **Neue Sessionübersicht** vor der Theorie, **erweitertes Abschlussbild** (sicher erkannte vs.
  noch zu übende Wörter mit Fehleranzahl und "Noch einmal anhören").
- **Zwei weitere Pilot-Units**: Familie und Personen (8 Wörter) und Zuhause und Räume (8 Wörter),
  je mit vollständiger Theorie — bewusst keine künstlichen Wörter nur um zehn zu erreichen. Dabei
  einen echten Fehler gefunden und behoben: vier Familienwörter enthalten Hamza-Formen (أ/أُ), die
  nicht zu den 28 Grundbuchstaben der virtuellen Tastatur gehören — die Rekonstruktionsaufgabe
  degenerierte dafür zu einer sinnlosen Ein-Kachel-Aufgabe, jetzt behoben durch zeichenweise statt
  wortweise Zerlegung als Fallback.
- **Theorie für die Schrift-Units 1, 2 und 8** ergänzt (TheoryRenderer wird jetzt auch dort vor
  der bestehenden Übungsphasenfolge angezeigt).
- **AudioPlayer**: verhindert jetzt überlagerte Wiedergabe, langsame Wiedergabe fällt ohne eigene
  `*_slow.wav`-Datei auf die normale Aufnahme mit reduziertem `playbackRate` zurück statt sofort
  auf eine Computerstimme.
- **Freier Übungsmodus neu gestaltet**: Schnellstartkarten statt langer Checkboxlisten, Chips
  statt Checkboxen in der erweiterten Auswahl.
- **Kursansicht**: Lernroute jetzt sichtbar in "Teil A — Arabische Schrift"/"Teil B —
  Grundwortschatz" getrennt, statt eines einzigen unstrukturierten Blocks.
- **Anwendungsaufgaben vollständig datenbasiert**: die hart codierte Wort-ID-Map wurde entfernt,
  Anwendungsaufgaben nutzen jetzt `application_prompts` aus den Kursdaten — funktioniert dadurch
  auch für die neuen Pilot-Units.
- **Repository-Zustand geprüft**: `.gitignore`/`.github/workflows/build.yml` waren bereits
  vorhanden und korrekt, `node_modules` ist nachweislich nicht im Git-Repository enthalten — für
  eine saubere Quellcode-ZIP `git archive --format=zip -o release.zip HEAD` verwenden.

**Getestet:** `npm test` (239 Unit-Tests grün, + 1 bedingt übersprungener Integrationstest),
`npm run lint` (0 Kollisionen), `npm run validate:course` (0 Fehler). Neue Testdateien für
SessionEngine/SessionCoverageTracker/SessionQueue (reine Logik, synthetische Daten), einen
komplett neu geschriebenen Ende-zu-Ende-Test aller drei Pilot-Units (inkl. exakter
Wiederaufnahme-Prüfung), sowie aktualisierte Tests für Dashboard/CourseView/FreePractice/
TheoryRenderer/AudioPlayer.

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP Abschnitt 9): 759 neue Vokabeln, volle
900er-Erweiterung, Migration der restlichen 116 vorhandenen Wörter, Theorie für Schrift-Units
3-7, inhaltliche Prüfung durch eine Person mit Arabischkenntnissen.

## Kurs 1 auf 900 Vokabeln ausgebaut — Meilenstein 1-3 (Entwicklungsauftrag 6)

Sechster Entwicklungsauftrag: Kurs 1 von 141 auf die geplanten 900 Vokabeln ausbauen (30
Vokabel-Units à 30 Wörter / 3 Sessions à 10 Wörter) und dafür vollständige Lerninhalte
(Datenmodell, Theorie, Sprachprüfung, Audio-Vorbereitung) aufbauen. Umgesetzt wurden in dieser
Runde **Meilenstein 1-3** (restliche Wort-Migration, volle 30-Unit-/90-Session-Struktur, Units
1-5 vollständig inkl. Theorie) — Units 6-30 folgen als Batches 2-6 in weiteren Runden.

**Wichtiger Hinweis zur Herkunft der arabischen Inhalte dieser Runde:** Die vom Nutzer gelieferten
Quelldateien (`neue_vokabeln_759.md/.json`, `kurs1_900_wortplan.json`) kamen mit einem
Zeichenkodierungsfehler an — die arabischen Textteile waren beim Empfang bereits irreversibel
beschädigt (mehrere Bytes pro Wort verloren, nicht nur ein einfacher Mojibake-Effekt). Deutsche
Bedeutungen, Wort-IDs, Unit-Titel und die Session-Struktur ließen sich dagegen zuverlässig
rekonstruieren und wurden 1:1 übernommen. Die arabischen Formen (unvokalisiert, bei Units 1-5
zusätzlich vokalisiert + Umschrift + Grammatikangaben) wurden auf dieser Basis **neu erstellt**
(Standard-MSA-Wortschatz), nicht aus den beschädigten Dateien rekonstruiert. Sie tragen deshalb
konsequent `content_status: "needs_language_review"` und müssen wie im Auftrag gefordert vor
Audioerzeugung von einer Person mit Arabischkenntnissen geprüft werden — siehe
`language-review/batch_01.json`. Details und die genaue Datenherkunft stehen im Kommentarkopf von
`scripts/data/kurs1UnitPlan.js`.

**Meilenstein 1 — restliche 116 Bestandswörter migriert:** Alle 141 bestehenden Wort-IDs (unverändert)
tragen jetzt `arabic_vocalized`, `arabic_unvocalized`, `german_answers`, `accepted_arabic_answers`,
`application_prompts`, `content_status`, `unit_id`, `session_id`, `audio_key` und
`difficulty_level`. Bestehender Audio- und Fortschrittsbezug (Wort-ID, Audiodatei) bleibt
unverändert erhalten — 25 Wörter hatten das erweiterte Antwort-Modell bereits, die restlichen 116
wurden ergänzt, ohne vorhandene Angaben (Genus/Plural/Umschrift) zu überschreiben.

**Meilenstein 2 — volle 30-Unit-/90-Session-Struktur:** `vocabSessions.json` enthält jetzt alle 30
Vokabel-Units mit je 3 Sessions à 10 Wörtern (90 Sessions insgesamt), aufgebaut aus
`kurs1_900_wortplan.json`. Die drei bisherigen Pilot-Units (Begrüßung, Familie, Zuhause) behalten
ihre Unit-IDs und ihre erste Session (`_a`) unverändert in der Wortreihenfolge — die 759 neuen
Wörter wurden in Kategorien in `vocabulary.json` ergänzt (Units 1-5 mit vollem Datenmodell, Units
6-30 zunächst mit den für diesen Meilenstein geforderten Minimalfeldern: ID, deutsche Bedeutung,
unvokalisierte arabische Form, `content_status`, Unit-/Session-Zuordnung). Für jede der 90
Sessions existiert ein Theoriedokument — für Units 6-30 vorerst als klar gekennzeichneter
Platzhalter, der in den folgenden Batches durch echte Theorie ersetzt wird.

**Meilenstein 3 (Batch 1) — Units 1-5 vollständig:** Alle 115 neuen Wörter dieser fünf Units haben
das volle Datenmodell (Vokalisierung, Umschrift, Wortart, Genus/Plural wo sinnvoll,
`application_prompts`). Für alle 15 Sessions dieser Units gibt es echte, auf die jeweils 10 Wörter
zugeschnittene Theorie (Lernziele, "Kurz erklärt", "Mehr erfahren", Merke-Hinweis, typischer
Fehler, 3-4 Beispiele nur mit bereits bekanntem oder klar markiertem Wortschatz, Mini-Check). Die
drei bestehenden Pilot-Theoriedokumente (Unit 1/2/3, Session A) wurden um das jeweils zehnte
(neue) Wort ergänzt, ohne den bestehenden Text zu ersetzen.

**Validierung erweitert:** `scripts/validateCourse.js` prüft jetzt zusätzlich die
900-Wort-/30-Unit-/90-Session-Zielstruktur (jede Unit exakt 30 Wörter, jedes Wort genau einer
Session zugeordnet) als harten Fehler, sobald die Struktur existiert. Fehlende Audiodateien sind
für Wörter mit `content_status: "needs_language_review"` nur noch ein Hinweis, kein harter Fehler
mehr (Abschnitt 15 des Auftrags: keine Audioerzeugung vor Sprachprüfung) — für bereits geprüfte
Wörter bleibt eine fehlende Audiodatei weiterhin ein harter Fehler.

**Neu erzeugte Dateien:** `language-review/batch_01.json` (Sprachprüfdatei für die 115 neuen
Wörter aus Units 1-5), `audio_generation_manifest.json` (dieselben 115 Wörter, Status
`pending_language_review` — explizit NICHT `ready_for_generation`, da noch keine Sprachprüfung
stattgefunden hat), sowie die Aufbau-Skripte `scripts/build-kurs1-batch.js`,
`scripts/apply-kurs1-theory-batch1.js` und `scripts/build-language-review-and-manifest.js`
(wiederholbar/idempotent, Grundlage für die Batches 2-6 der Units 6-30).

**Bestehende Tests angepasst statt gebrochen:** Die drei Pilot-Sessions haben jetzt je 10 statt
9/8/8 neue Wörter (Session `_a` jeder Unit enthält weiterhin zuerst die alten, dann das erste neue
Wort) — `test/unit/courseView.test.js` und `test/unit/sessionController.e2e.test.js` wurden
entsprechend aktualisiert (Wortanzahl, Sessionanzahl pro Unit, erweiterte Unit-Titel). Kein
bestehender Sessionfortschritt wird durch diese Erweiterung ungültig, da IDs unverändert bleiben.

```text
npm test:            238/239 Unit-Tests bestanden (1 bekannter, von dieser Runde unabhängiger
                      flakiger Test in sessionEngine.test.js — bereits vor dieser Runde
                      gelegentlich fehlschlagend, siehe ROADMAP), Integrationstest weiterhin
                      übersprungen
npm run lint:         erfolgreich
npm run validate:course: 0 Fehler, 4 Hinweise (alle zu bewusst zurückgestellten Folge-Meilensteinen)
```

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP für den vollständigen Plan): Units 6-30 mit
vollem Datenmodell/Theorie (Batches 2-6), tatsächliche Audioerzeugung, Sprachprüfung durch eine
Person mit Arabischkenntnissen, Verwechslungsgruppen/Gegensatzpaare/Wortfamilien,
"Problemwörter"-Dashboard-Karte, `.arabiccourse`-Paketformat, saubere Source-ZIP.

## Kurs 1 inhaltlich vervollständigen, Batch 2 (Units 6-10) — Entwicklungsauftrag 7

Siebter Entwicklungsauftrag: zwei technische Restfehler aus Entwicklungsauftrag 6 beheben
(zufallsabhängiger Test, übersprungener Migrationstest), den Kursvalidator ehrlicher machen
(drei klar unterschiedene Vollständigkeitsstufen statt einer pauschalen Zahl) und **Batch 2**
(Units 6-10, 150 Wörter / 15 Sessions) auf dasselbe vollständige Niveau wie Batch 1 (Units 1-5)
aus Entwicklungsauftrag 6 heben — in derselben kontrollierten Batch-für-Batch-Vorgehensweise.

**Technische Restfehler behoben:**
- **Flaky Test korrigiert** statt nur dokumentiert: `src/js/session/randomProvider.js` (neu) —
  ein injizierbarer Zufallszahlengenerator (`RandomProvider.create(seed)`, produktiv weiterhin
  `Math.random`). `SessionQueue`/`SessionEngine` akzeptieren jetzt optional eine `rng`-Funktion.
  Der betroffene Test in `sessionEngine.test.js` nutzt jetzt einen festen Seed UND wählt sein
  Test-Zielwort aus der tatsächlich gebauten Warteschlange (statt eine zufällige Wortauswahl
  anzunehmen) — behebt die Ursache, nicht nur das Symptom. Zusätzlicher Regressionstest über 50
  Seeds. **Verifiziert: `npm test` zehnmal hintereinander ausgeführt, 10/10 erfolgreich.**
- **Migrationstest aktiviert:** `test/integration/realProgressMigration.test.js` (hing von einer
  lokalen Backup-Datei ab, in CI immer übersprungen) → umbenannt zu
  `test/integration/progressMigration.test.js`, läuft jetzt immer gegen anonymisierte,
  reproduzierbare Fixtures (`test/fixtures/progress_v1/v2/v3.json`, `progress_corrupted.json`) —
  keine echten Nutzerdaten, kein `skip` mehr, testet alle drei realen Zustände von
  `migrateProgress()` (Alt-Format, aktuelle Version, unbekannte künftige Version) sowie die
  Backup-Fallback-Logik von `readJsonFileSafe()` bei beschädigter Hauptdatei.

**Kursvalidator: drei Vollständigkeitsstufen statt einer Zahl.** Die frühere Meldung "X von 900
Wörtern nutzen das erweiterte Modell" zählte ein Wort schon bei einem einzigen Zusatzfeld mit.
`npm run validate:course` unterscheidet jetzt: **Minimalmodell** (id/arabic_unvocalized/
german_answers/unit_id/session_id/content_status — aktuell 900/900), **Lernfähig** (zusätzlich
arabic_vocalized/transliteration/part_of_speech/accepted_arabic_answers) und **Vollständig**
(zusätzlich gender/plural-Felder, sofern bearbeitet, plus application_prompts). Zusätzlich neu:
ein **Homonym-/Duplikatbericht** (ERROR bei echten ID-Duplikaten, WARNUNG bei identischer
unvokalisierter Schreibweise ohne `homonym_group`-Tag, INFO bei bestätigten Homonymen — z. B.
ذهب als "Gold" vs. "er ging", jetzt beide mit `homonym_group: "ذهب"` markiert), eine
**Sprachprüfungs-Übersicht** (Zählung nach `content_status`, gegen `language-review/*.json`
und `audio_generation_manifest.json` geprüft) sowie die veraltete Meldung zur
Wiedergabegeschwindigkeit entfernt (langsame Wiedergabe über `playbackRate=0.75` ist seit
Entwicklungsauftrag 5 umgesetzt, keine fehlende Funktion mehr).

**Batch 2 (Units 6-10) vollständig:** 132 neue Wörter (plus 18 bereits bestehende) auf das volle
Datenmodell gehoben (`scripts/data/kurs1Units6to10Full.js` + `scripts/upgrade-kurs1-units6to10.js`,
analog zu Batch 1). 15 vollständige, themenspezifische Theoriedokumente
(`scripts/apply-kurs1-theory-batch2.js`) — u. a. Uhrzeit vs. Tageszeit (Unit 6), das
Farbadjektiv-Bauprinzip ي vs. أ-Grundfarben (Unit 7), Geräte-Wortmuster auf -ة (Unit 8),
Gattungsnamen بيضة/بيض (Unit 9), das Iḍāfa-Muster bei Küchenbegriffen (Unit 10).
**Deutsche Mehrdeutigkeiten aufgelöst** (Entwicklungsauftrag 7, Abschnitt 10), u. a. "Decke
(Zimmerdecke)" vs. "Decke (Bettdecke)", "Morgen (Tageszeit)" vs. "morgen (der nächste Tag)",
"orange (Farbe)" vs. "Orange (Frucht)", "kochen (zubereiten, allgemein)" vs. "kochen (sieden, im
Wasser)", "Arm (Körperteil)" vs. "arm (nicht reich)", "Karte (Bankkarte)" vs. "Landkarte".

**Neue Skripte:**
- `npm run report:language-review` (`scripts/reportLanguageReview.js`): automatischer
  Sprachprüfbericht — Gesamtstand nach `content_status`, Batch-Übersicht, fehlende
  Vokalisierung/Umschrift/Wortart, mehrdeutige deutsche Übersetzungen, mögliche Homonyme. Rein
  lesend, optional zusätzlich als JSON (`--json <pfad>`).
- `npm run package:source` (`scripts/packageSource.js`): erzeugt
  `dist-source/learning-arabic-source.zip` per Allowlist (src/, language-packs/, test/, scripts/,
  package.json, README/ROADMAP/LICENSE\*, .gitignore, .github/ — explizit OHNE `node_modules`,
  `.git`, `__pycache__`), verifiziert danach selbst, dass keine dieser verbotenen Pfade in der
  erzeugten ZIP gelandet sind, und dass `.gitignore`/`.github/workflows/` enthalten sind. Behebt
  das in Entwicklungsauftrag 7 gemeldete Problem, dass frühere Übergabe-ZIPs `node_modules`
  enthielten. `.gitignore` ergänzt um `dist-source/`.
- `language-review/batch_02.json` (132 Einträge), `audio_generation_manifest.json` um dieselben
  Wörter erweitert (jetzt 247 Einträge, alle `status: "needs_language_review"` — einheitlicher
  Status-Name für beide Batches, vorher hieß es in Batch 1 uneinheitlich noch
  `pending_language_review`).

**"Deine schwierigen Wörter" (Dashboard, Entwicklungsauftrag 7, Abschnitt 23) — vollständig
umgesetzt:** Karte auf der Startseite zeigt bis zu fünf Wörter mit mindestens drei
aufeinanderfolgenden Fehlversuchen (`card.consecutiveWrong`, bereits vorhandene SRS-
Datenstruktur), sortiert nach Fehleranzahl. Jedes Wort hat jetzt alle fünf im Auftrag
vorgeschlagenen Einzelaktionen: **"Noch einmal lernen"** und **"Verbindung ansehen"** nutzen eine
neue `onlyWordIds`-Filteroption in `FreePracticeView` (schränkt den Übungspool auf genau ein
Wort ein, statt wie zuvor nur grob nach Kategorie/Fälligkeit zu filtern), **"Audio anhören"** ruft
`AudioPlayer.speak()` direkt für das Wort auf, **"Schreibweise ansehen"** und **"Beispiele
ansehen"** blenden ein Detail-Panel mit Vokalisierung/Umschrift bzw. den `application_prompts`
des Wortes ein/aus. "Verbindung ansehen" erscheint nur, wenn für das Wort tatsächlich ein
Verbindungstrainer-Eintrag existiert (nicht jedes Wort ist dafür geeignet). Eine
Sammel-Aktion "Alle üben" bleibt zusätzlich am Kartenende erhalten.

**Deutsche Mehrdeutigkeiten:** von ursprünglich 15 auf 3 verbleibende reduziert (siehe
`npm run report:language-review`) — die verbliebenen 3 sind bewusst als legitime Mehrdeutigkeit
belassen ("gern geschehen" als zwei gültige Synonyme; "über"/"vor" als Präpositionen mit
mehreren Bedeutungen, bereits im ursprünglichen Wortplan mit "/" notiert).

**Schrift-Theorie für alle 8 Buchstabengruppen-Units komplettiert** (vorher nur 3/8: Unit 1,
Unit 2, "Kurze Vokale") — die in Auftrag Abschnitt 24 als optional zurückstellbar markierten
Units 3-7 (ج ح خ / س ش ص ض / ط ظ / ع غ / ف ق ك ل م ه) wurden zusätzlich vollständig ausgearbeitet,
im selben Blockformat wie die bestehende Theorie (`scripts/apply-script-theory-units3to5.js`,
`scripts/apply-script-theory-units6to7.js`) — u. a. Rachenlaute (ح/ع) ohne deutsche Entsprechung,
die vier emphatischen Buchstaben (ص ض ط ظ) als zusammenhängende Lautgruppe, ق vs. ك, die
لا-Verbindung (Lām-Alif).

```text
npm test:                 252/252 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: läuft erfolgreich (siehe Abschlussbericht für Zahlen)
npm run package:source:    läuft erfolgreich, dist-source/learning-arabic-source.zip ohne
                           node_modules/.git/__pycache__, mit .gitignore/.github/workflows/
```

Aktueller Datenstand nach diesem Batch (von `validate:course` berechnet, nicht hart codiert):
**900/900** Wörter strukturell vorhanden (Minimalmodell), **388/900** davon mit vollem
Lernmodell (141 ursprünglicher Bestand + 115 Batch 1 + 132 Batch 2), **30/90** Sessions mit
vollständiger Theorie (die übrigen 60 sind weiterhin klar als Platzhalter markiert,
`is_placeholder: true`), **3** bestätigte Homonym-Paare, alle 900 Wörter weiterhin
`content_status: "needs_language_review"` (noch keine Sprachprüfung durch eine Person mit
Arabischkenntnissen erfolgt).

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP für den vollständigen Plan): Units 11-30 mit
vollem Datenmodell/Theorie (Batches 3-6), tatsächliche Audioerzeugung, Sprachprüfung durch eine
Person mit Arabischkenntnissen, `.arabiccourse`-Paketformat. (Ursprünglich hier ebenfalls
zurückgestellt: Schrift-Theorie Units 3-7 und die volle Problemwörter-Aktionsleiste — beides
wurde in dieser Runde zusätzlich nachgeliefert, siehe oben.)

## Kurs 1 inhaltlich vervollständigen, Batch 3 (Units 11-15) — Entwicklungsauftrag 8

Achter Entwicklungsauftrag: **Batch 3** (Units 11-15 — Einkaufen/Geld, Kleidung/Accessoires,
Körper/Sinne, Gesundheit/Apotheke, Gefühle/Eigenschaften; 150 Wörter, 15 Sessions) auf dasselbe
vollständige Niveau wie Batch 1 (Units 1-5) und Batch 2 (Units 6-10) heben, plus zwei neue
Datenmodell-Felder (`opposite_id`, `confusion_group`) einführen und in `validateCourse.js`
absichern. Dieselbe kontrollierte Batch-für-Batch-Vorgehensweise wie zuvor: nur die noch nicht
vollständigen Wörter angehoben, bereits vorhandene vollständige Wörter (4 in Unit 11, 5 in Unit
12, 6 in Unit 13, 0 in Unit 14, 0 in Unit 15 — insgesamt 15) unverändert gelassen.

**Vorab geprüfte, in der Auftragsbeschreibung falsch angenommene Ausgangslage:** Der Auftrag
ging davon aus, `.gitignore` und `.github/workflows/build.yml` fehlten im Repository und
`npm run package:source` melde sie als fehlend. Beide Dateien waren bei Prüfung zu Beginn dieser
Runde bereits vorhanden (seit Meilenstein A/Entwicklungsauftrag 3) und `package:source` meldete
bereits korrekt `.gitignore enthalten: ja` / `.github/workflows/ enthalten: ja` — erneut
verifiziert, keine Änderung nötig. Dieser Punkt wird hier bewusst dokumentiert, statt stillschweigend
etwas zu "reparieren", das nicht kaputt war.

**Geschlossenes `part_of_speech`-Vokabular festgeschrieben:** Der Auftrag schlug ein eigenes
(englisches) Wortarten-Vokabular vor. Über die 388 bereits vorher vollständigen Wörter (Units
1-10) hatte sich aber längst ein deutschsprachiges Vokabular etabliert (`Substantiv`, `Adjektiv`,
`Verb (3. Pers. m. Vergangenheit)`, `Ausdruck`, `Zahlwort`, `Fragewort`, `Adverb`, `Eigenname`,
`Substantiv/Adjektiv`, `Substantiv (Dual)`, `Substantiv (Plural)`, `Substantiv
(Pluraletantum)`). Statt disruptiv umzustellen, schreibt `scripts/validateCourse.js` jetzt genau
diese 12 Werte als die eine zentrale, geschlossene Liste fest und meldet jeden abweichenden Wert
als Hinweis (Tippfehler oder bewusste Erweiterung). Alle 135 neuen Wörter dieses Batches nutzen
ausschließlich Werte aus dieser Liste.

**`opposite_id`/`confusion_group` neu eingeführt und validiert:** 22 Wörter dieses Batches bilden
11 gegenseitig verknüpfte Gegensatzpaare (u. a. رخيص↔غالٍ, مفتوح↔مغلق, لبس↔خلع, سعيد↔حزين,
قوي↔ضعيف, حي↔ميت, سهل↔صعب). `scripts/validateCourse.js` prüft jetzt, dass jede `opposite_id` auf
ein existierendes Wort zeigt UND dass die Verknüpfung gegenseitig ist (A→B impliziert B→A) — beides
als harter Fehler bei Verstoß. 32 Wörter sind zusätzlich acht `confusion_group`-Gruppen zugeordnet,
bewusst nur dort, wo didaktisch sinnvoll (z. B. `c1_muta_adjectives` für die sechs
مُتَ-präfigierten Gefühlsadjektive aus Unit 15) — nicht für jedes Wort.

**Batch 3 (Units 11-15) vollständig:** 135 neue Wörter auf das volle Datenmodell gehoben
(`scripts/data/kurs1Units11to15Full.js` + `scripts/upgrade-kurs1-units11to15.js`, analog zu
Batch 1/2). 15 vollständige, themenspezifische Theoriedokumente
(`scripts/apply-kurs1-theory-batch3.js`) — u. a. die vier Bezahlwege und das Rabatt/Sonderangebot-
Begriffspaar (Unit 11), die iḍāfa-Konstruktion سَاعَة يَد/سَيَّارَة إِسْعَاف (Unit 12), das
ظَهْر/ظُهْر-Homonym Rücken/Mittag (Unit 13), die vier klassischen Sinne den passenden Körperteilen
zugeordnet (Unit 13), وَصْفَة طِبِّيَّة (ärztliches Rezept) explizit vom Kochrezept abgegrenzt
(Unit 14), das مُتَ-Wortbildungsmuster bei Gefühlsadjektiven (Unit 15).

**Unit 14 (Gesundheit, Beschwerden und Apotheke) bewusst als reiner Sprachunterricht gehalten:**
alle drei Theoriedokumente vermitteln ausschließlich Wortschatz für Alltagssituationen (Arztbesuch,
Apotheke) — an keiner Stelle werden Diagnosen gestellt, Medikamente empfohlen oder
Behandlungsanweisungen gegeben. Das erste Theoriedokument (`theory_vocab_unit_14_a`) enthält dazu
einen expliziten "Wichtiger Hinweis"-Callout, per Test abgesichert
(`test/unit/kurs1Units11to15Content.test.js`).

**Sprachprüfung: `theory_review`-Metadaten neu eingeführt.** `language-review/batch_03.json`
enthält zusätzlich zu den 135 Wort-Prüfeinträgen (wie in Batch 1/2) ein neues `theory_review`-Feld
mit 15 Einträgen (`theory_id`, `title`, `review_status`, sowie die vier unabhängig abhakbaren
Booleans `arabic_examples_reviewed`, `german_explanation_reviewed`, `mini_check_reviewed`,
`application_prompts_reviewed`, alle initial `false`) — `scripts/build-language-review-and-
manifest.js` erzeugt dieses Feld jetzt automatisch aus den zur jeweiligen Unit gehörenden
Sessions/Theoriedokumenten. `npm run report:language-review` zeigt den Theorie-Prüfstand jetzt
pro Batch UND aggregiert über alle Batches.

**Neue/erweiterte Skripte:**
- `scripts/data/kurs1Units11to15Full.js`, `scripts/upgrade-kurs1-units11to15.js`: wie bei Batch
  1/2, zusätzlich mit gegenseitiger `opposite_id`-Zuweisung und `confusion_group`-Tagging sowie
  einer eigenen Gegenseitigkeitsprüfung im Skript selbst (zusätzlich zur Validator-Prüfung).
- `scripts/apply-kurs1-theory-batch3.js`: 15 neue Theoriedokumente, gleiches Blockformat wie
  Batch 1/2.
- `scripts/build-language-review-and-manifest.js`: um die `theory_review`-Erzeugung erweitert
  (Abschnitt oben), Aufruf unverändert (`node scripts/build-language-review-and-manifest.js 3 11
  12 13 14 15`).
- `scripts/reportLanguageReview.js`: zeigt jetzt zusätzlich den Theorie-Prüfstand pro Batch und
  aggregiert.
- `language-review/batch_03.json` (135 Wort-Einträge + 15 Theorie-Einträge),
  `audio_generation_manifest.json` um dieselben 135 Wörter erweitert (jetzt 382 Einträge
  insgesamt, weiterhin alle `status: "needs_language_review"`, keines `ready_for_generation`).

**Neue Tests:** `test/unit/kurs1Units11to15Content.test.js` (15 Tests) — Wort-/Session-/
Unit-Zahlen, Unversehrtheit der 15 bereits vorher vollständigen Wörter, Lernfähig-Modell-
Feldprüfung, `part_of_speech`-Vokabular-Konformität, `opposite_id`-Gegenseitigkeit,
`confusion_group`-Selektivität, vollständige Theorie ohne Platzhalter für alle 15 Sessions, der
explizite Unit-14-Sprachunterricht-Hinweis, keine hart codierten Wort-IDs im Quellcode,
`batch_03.json`- und Manifest-Konsistenz.

```text
npm test:                 267/267 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: läuft erfolgreich, zeigt Batch 1/2/3 + Theorie-Prüfstand
npm run package:source:    läuft erfolgreich, dist-source/learning-arabic-source.zip ohne
                           node_modules/.git/__pycache__, mit .gitignore/.github/workflows/
```

Aktueller Datenstand nach diesem Batch (von `validate:course` berechnet, nicht hart codiert):
**900/900** Wörter strukturell vorhanden (Minimalmodell), **523/900** davon mit vollem
Lernmodell (141 ursprünglicher Bestand + 115 Batch 1 + 132 Batch 2 + 135 Batch 3), **45/90**
Sessions mit vollständiger Theorie (die übrigen 45 sind weiterhin klar als Platzhalter markiert,
`is_placeholder: true`), **3** bestätigte Homonym-Paare, **11** Gegensatzpaare
(`opposite_id`), **8** Verwechslungsgruppen (`confusion_group`) über 32 Wörter, alle 900 Wörter
weiterhin `content_status: "needs_language_review"` (noch keine Sprachprüfung durch eine Person
mit Arabischkenntnissen erfolgt).

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP für den vollständigen Plan): Units 16-30 mit
vollem Datenmodell/Theorie (Batches 4-6), tatsächliche Audioerzeugung (bleibt bei 382
vorbereiteten, keinem generierten Eintrag), Sprachprüfung durch eine Person mit
Arabischkenntnissen, `.arabiccourse`-Paketformat, Entwicklung von Kurs 2.

## Kurs 1 inhaltlich vervollständigen, Batch 4 (Units 16-20) — Entwicklungsauftrag 9

Neunter Entwicklungsauftrag: **Batch 4** (Units 16-20 — Tagesablauf/Gewohnheiten, häufige Verben I
Bewegung/Handlungen, häufige Verben II Denken/Sprechen/Wahrnehmung, häufige Adjektive/Gegensätze,
Stadt/Gebäude/öffentliche Orte; 134 neue Wörter, 15 Sessions) auf dasselbe vollständige Niveau
heben, den Sprachprüfprozess selbst konsolidieren (reichhaltigere Prüffelder je Wort, korrigierte
Theorie-Review-Lücke aus Batch 1/2) und zwei explizit angeforderte Unstimmigkeiten aufklären.

**Unterscheidung der Reifegrade (auf Wunsch des Nutzers explizit dokumentiert):** Ein Wort
durchläuft in diesem Projekt sechs klar getrennte Zustände — **strukturell vorhanden**
(Minimalmodell, 900/900), **lernfähig/vollständig modelliert** (Vokalisierung, Umschrift,
Wortart, Genus/Plural, Application-Prompts — 657/900 nach diesem Batch), **zur Sprachprüfung
vorbereitet** (in einer `language-review/batch_NN.json` erfasst — 516/900), **durch eine
arabischkundige Person geprüft** (bislang **0/900** — `content_status` ist für alle 900 Wörter
weiterhin `needs_language_review`), **für Audio freigegeben** (bislang **0/900**,
`ready_for_generation`) und **Audio tatsächlich vorhanden** (weiterhin nur die ursprünglichen
141 Wörter). Diese sechs Stufen sind bewusst NICHT dasselbe — eine vorhandene Audiodatei
bedeutet z. B. nicht, dass ein Wort sprachlich geprüft wurde (siehe die 141 ursprünglichen
Wörter unten).

**Zwei Unstimmigkeiten untersucht, statt ungeprüft übernommen:**
1. *"report:language-review zeigt nur 15 statt 45 Theorie-Prüfeinträge"* — die ROADMAP-Aussage
   war schlicht **falsch**, kein Skriptfehler: `batch_01.json`/`batch_02.json` (Entwicklungsauftrag
   6/7) wurden vor der Einführung des `theory_review`-Feldes (Entwicklungsauftrag 8) erzeugt und
   hatten es deshalb komplett nicht. Neues Skript `scripts/backfill-theory-review.js` ergänzt das
   fehlende Feld nachträglich (15 Einträge je Batch, alle Prüf-Booleans `false`, bestehende
   Wort-Einträge unverändert) — jetzt zeigen Report/Dateien/ROADMAP übereinstimmend 60
   Theorie-Prüfeinträge (45 aus Batch 1-3 + 15 aus Batch 4).
2. *"518 Wörter in keiner Review-Datei, obwohl Units 16-30 nur 377 Minimalmodell-Wörter haben"* —
   die Differenz von **141** entspricht exakt den ursprünglichen Bestandswörtern mit vorhandener
   Audiodatei (verifiziert: alle 141 Wörter mit einer echten `.wav`-Datei sind in keinem Batch,
   und umgekehrt), weil die Batch-Skripte bislang bewusst nur auf neue `c1_`-IDs filtern. Diese
   141 Wörter bleiben in diesem Auftrag unangetastet (außerhalb des Batch-4-Rahmens), sind aber
   jetzt automatisch nachvollziehbar über `npm run report:language-review` (neuer Abschnitt
   "Ursprüngliche Bestandswörter mit vorhandener Audiodatei, aber noch in keiner Sprachprüfdatei")
   sowie als Hinweis in `npm run validate:course` — und als eigener Folgepunkt in der ROADMAP
   festgehalten ("Batch 0").

**Batch 4 (Units 16-20) vollständig:** 134 neue Wörter auf das volle Datenmodell gehoben
(`scripts/data/kurs1Units16to20Full.js` + `scripts/upgrade-kurs1-units16to20.js`, analog zu
Batch 1-3, zusätzlich mit einer eingebauten Konsistenzprüfung: die neu vokalisierte Form muss
exakt zur bereits bestehenden `arabic_unvocalized`-Grundform strippen — bei einer einzigen
Abweichung, `سيء`/`سيئ` ("schlecht"), wurde die Orthographie auf die im MSA übliche Schreibweise
mit ya-Träger-Hamza (`سَيِّئ` → `سيئ`) korrigiert und hier transparent dokumentiert, nicht
stillschweigend übernommen). 15 vollständige, themenspezifische Theoriedokumente
(`scripts/apply-kurs1-theory-batch4.js`) — u. a. die Morgenroutine als Verbkette (Unit 16), das
Gegensatzpaar-Netzwerk mit 13 Paaren allein in Unit 19, mehrere Iḍāfa-Ortsbezeichnungen wie
`مَكْتَب بَرِيد`/`مَرْكَز الشُّرْطَة` (Unit 20). Insgesamt **76 `opposite_id`-Verweise** (= **38**
gegenseitige Gegensatzpaare, 54 neue Verweise/27 neue Paare in diesem Batch) und
**14 Verwechslungsgruppen** über 55 Wörter (`confusion_group`, 8 neu).

**Sprachprüfprozess konsolidiert:** `language-review/batch_NN.json`-Einträge enthalten jetzt pro
Wort zusätzlich Genus, Plural, `accepted_arabic_answers`, `application_prompts`, Hinweise auf
Homonyme/Gegensätze/Verwechslungsgruppen sowie **vier getrennte Prüf-Booleans**
(`arabic_vocalization_reviewed`, `transliteration_reviewed`, `german_translation_reviewed`,
`application_prompts_reviewed`) statt nur eines einzigen `review_status` — rückwirkend auch für
Batch 1-3 nachgezogen (keine bestehenden Prüfnotizen vorhanden, daher verlustfrei). Neuer
Presentation-Forms-Check in `scripts/validateCourse.js`: keine arabischen Wörter dürfen
vorgerenderte Glyphenformen (U+FB50-FDFF/U+FE70-FEFF) statt normaler Unicode-Grundbuchstaben
enthalten.

**Application-Prompts — Designentscheidung dokumentiert:** die tatsächliche Anwendungsübung
(`renderContextualChoice` in `exerciseRegistry.js`) wertet Korrektheit über "die angeklickte
Option ist dasselbe Wortobjekt wie das gefragte" aus, nicht über einen Datenvergleich mit dem
Prompt selbst — die einzige `expected_word_id`, die für ein Wort tatsächlich sinnvoll ist, ist
deshalb seine eigene ID. Alle 134 neuen `application_prompts` setzen deshalb sowohl
`expected_word_id` (die eigene ID, wie vom Auftrag verlangt) als auch `expected_meaning` (für
Sprachprüfung/Anzeige) — keine Wendung ist doppelt verwendet, jeder Prompt beschreibt eine
eigene, plausible Alltagssituation.

**Neue/erweiterte Skripte:**
- `scripts/data/kurs1Units16to20Full.js`, `scripts/upgrade-kurs1-units16to20.js`: wie Batch 1-3,
  mit zusätzlicher Konsistenzprüfung gegen die bestehende `arabic_unvocalized`-Grundform.
  Zweimal hintereinander ausgeführt und per Byte-Vergleich als idempotent verifiziert.
- `scripts/apply-kurs1-theory-batch4.js`: 15 neue Theoriedokumente.
- `scripts/backfill-theory-review.js` (neu): ergänzt fehlende `theory_review`-Metadaten in
  bereits bestehenden `batch_NN.json`-Dateien, ohne die Wort-Einträge zu verändern.
- `scripts/build-language-review-and-manifest.js`: Wort-Einträge um Genus/Plural/akzeptierte
  arabische Formen/Application-Prompts/Homonym-Gegensatz-Verwechslungs-Hinweise/vier getrennte
  Prüf-Booleans erweitert; für alle vier Batches neu ausgeführt (keine bestehenden Prüfnotizen
  verloren, da noch keine vorhanden waren).
- `scripts/reportLanguageReview.js`: neuer Abschnitt für ursprüngliche Bestandswörter mit Audio,
  aber ohne Sprachprüfeintrag.
- `language-review/batch_04.json` (134 Wort-Einträge + 15 Theorie-Einträge),
  `audio_generation_manifest.json` um dieselben 134 Wörter erweitert (jetzt 516 Einträge
  insgesamt, weiterhin alle `status: "needs_language_review"`, keines `ready_for_generation`).

**Neue Tests:** `test/unit/kurs1Units16to20Content.test.js` (20 Tests, deckt exakt die 20 im
Auftrag genannten Prüfpunkte ab plus einen theory_review-Konsistenztest über alle 4 Batches) —
u. a. Wort-/Session-/Unit-Zahlen, Unversehrtheit der 16 bereits vorher vollständigen Wörter,
`opposite_id`-Gegenseitigkeit, `confusion_group`-Selektivität, keine Arabic-Presentation-Forms,
Idempotenz des Upgrade-Skripts (per tatsächlichem zweiten Skriptlauf im Test, nicht nur
behauptet), Konsistenz der Prüf-Booleans.

```text
npm test:                 287/287 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 3 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 1-4 + Theorie-Prüfstand + 141
                           ursprüngliche Bestandswörter ohne Sprachprüfeintrag
npm run package:source:    erfolgreich, dist-source/learning-arabic-source.zip ohne
                           node_modules/.git/__pycache__, mit .gitignore/.github/workflows/
```

Aktueller Datenstand nach diesem Batch (von `validate:course` berechnet, nicht hart codiert):
**900/900** Wörter strukturell vorhanden (Minimalmodell), **657/900** davon mit vollem
Lernmodell (141 ursprünglicher Bestand + 115 Batch 1 + 132 Batch 2 + 135 Batch 3 + 134 Batch 4),
**60/90** Sessions mit vollständiger Theorie (die übrigen 30 weiterhin klar als Platzhalter
markiert), **516/900** Wörter zur Sprachprüfung vorbereitet (382 vorher + 134 neu), **60**
Theorie-Prüfeinträge, **0/900** durch eine arabischkundige Person tatsächlich geprüft, **0**
Wörter für Audio freigegeben, weiterhin nur die ursprünglichen 141 Wörter mit echter Audiodatei.

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP für den vollständigen Plan): Units 21-30 mit
vollem Datenmodell/Theorie (Batches 5-6), die formale Sprachprüfung der 141 ursprünglichen
Bestandswörter ("Batch 0"), tatsächliche Audioerzeugung, Sprachprüfung durch eine Person mit
Arabischkenntnissen, `.arabiccourse`-Paketformat, Kurs-2-5-Neustrukturierung, weiterführende
Grammatik, Redesign der Oberfläche.

### Nachträgliche Vervollständigung (auf Nutzerwunsch, direkt im Anschluss)

Nach Entwicklungsauftrag 9 bat der Nutzer, offene Punkte so weit wie sinnvoll möglich zusätzlich
zu schließen, bevor der nächste Auftrag kommt — **ausdrücklich ohne** die in Auftrag 9 explizit
zurückgestellten Units 21-30 vorzuziehen (bleibt weiterhin dem nächsten Auftrag vorbehalten).
Zwei Punkte wurden daraufhin geschlossen:

- **"Batch 0" erledigt:** `language-review/batch_00.json` (neues Skript
  `scripts/build-batch0-legacy-review.js`) erfasst jetzt alle 141 ursprünglichen Bestandswörter
  mit vorhandener Audiodatei — sie waren bereits vollständig modelliert, hatten aber schlicht nie
  einen Sprachprüfeintrag. Bewusst NICHT im `audio_generation_manifest.json` (das steuert nur die
  Erzeugung NEUER Audiodateien, diese Wörter haben bereits eine) und ohne `theory_review`-Feld
  (ihre Sessions sind entweder schon über Batch 1-4 abgedeckt oder haben noch gar keine echte
  Theorie). Damit sind jetzt **alle 657 vollständig modellierten Wörter** (516 neue + 141
  Bestand) in einer Sprachprüfdatei erfasst — 0 davon als geprüft markiert. Ein Bug in
  `report:language-review` wurde dabei gefunden und behoben: die Zählung "noch nicht erfasste
  Wörter" verwechselte vorher Wort-Zahlen unterschiedlicher Batch-Typen (neue vs. Bestandswörter)
  und hätte mit Batch 0 einen falschen (zu niedrigen) Wert gemeldet — jetzt berechnet aus den
  tatsächlichen Batch-IDs statt einer einfachen Subtraktion. Neuer Test:
  `test/unit/legacyBatch0Review.test.js` (5 Tests, inkl. echter Idempotenz-Verifikation).
- **Electron-Startfähigkeit erneut geprüft:** ein kurzer Startversuch (`npm start`-Äquivalent)
  zeigt, dass die App in dieser Sandbox grundsätzlich startet (kein Absturz mehr, wenn die
  Umgebungsvariable `ELECTRON_RUN_AS_NODE` entfernt wird — vorher schlug der Start mit einem
  irreführenden Fehler in `main.js` fehl, weil Electron dadurch als reines Node ausgeführt wurde).
  Trotzdem bleibt eine echte **visuelle** Prüfung weiterhin nicht möglich (kein Screenshot-/
  Bildschirm-Werkzeug in dieser Umgebung) — die manuelle Prüfliste aus dem letzten
  Entwicklungsauftrag muss weiterhin vom Nutzer selbst per `npm start` durchgeführt werden.

```text
npm test:                 292/292 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt jetzt Batch 0-4 (657 vorbereitete Wörter)
npm run package:source:    erfolgreich, keine node_modules/.git/__pycache__-Einträge
```

## Kurs 1 – Konsistenzkorrektur und Batch 5 für Units 21-25 (Entwicklungsauftrag 10)

Zehnter Entwicklungsauftrag: zwei Dokumentationsfehler korrigieren (Batch-0-Status in einer
Sammel-Übersicht war stellenweise veraltet; die Zählweise "Gegensatzpaare" war ungenau), die
Application-Prompt-/Grading-Semantik systematisch untersuchen und absichern, und **Batch 5**
(Units 21-25 — Position/Richtung/Präpositionen, Verkehr/Reisen/Hotel, Schule/Unterricht/
Schulsachen, Universität/Studium/Prüfungen, Arbeit/Berufe/Büro; 126 neue Wörter, 15 Sessions) auf
dasselbe vollständige Niveau wie die Batches 1-4 heben.

**Dokumentationsfehler behoben:** In `ROADMAP.md` Abschnitt 4 ("Nächste Schritte") stand nach
Entwicklungsauftrag 9 noch "516/900 Wörter zur Sprachprüfung vorbereitet" und Batch 0 wurde dort
weiterhin als etwas Zukünftiges ("neu identifizierte … Bestandswörter") beschrieben — dieser
Absatz war schlicht nicht mit dem Batch-0-Nachtrag aktualisiert worden, der direkt im Anschluss an
Entwicklungsauftrag 9 bereits 657/657 Wörter erfasst hatte. Korrigiert auf den tatsächlichen,
aktuellen Stand. Außerdem: die vorherige Formulierung "76 Gegensatzpaare" war ungenau — 76 ist die
Anzahl der `opposite_id`-**Verweise** (ein Wert pro Wort mit gesetztem Feld), nicht die Anzahl der
Paare selbst; da jedes Paar auf beiden beteiligten Wörtern gesetzt wird, ergeben 76 Verweise **38**
gegenseitige Paare. Beide Begriffe werden ab jetzt konsequent unterschieden.

**Application-Prompt-/Grading-Semantik untersucht (nicht verändert):** Analyse des tatsächlichen
Codes (`renderContextualChoice` in `src/js/session/exerciseRegistry.js`) bestätigt den bereits in
Entwicklungsauftrag 9 dokumentierten Befund: Korrektheit wird ausschließlich über Objektidentität
bestimmt (`angeklickte Option === ctx.word`) — `expected_word_id`/`expected_meaning` im
`application_prompt` werden vom Renderer selbst nirgends gelesen, nur der `prompt`-Text wird
angezeigt. Distraktoren kommen aus `ctx.allWords`, das in der echten Session-Steuerung immer die
~10 Wörter der aktuellen Session sind (nicht der ganze 900-Wort-Bestand) — Distraktoren bleiben
dadurch thematisch passend statt trivial ausschließbar. Da dieses Verhalten korrekt und in sich
konsistent ist, wurde **nichts am Produktivcode geändert** — stattdessen wurde es mit
`test/unit/applicationPromptGrading.test.js` (8 Tests gegen den echten Code, u. a. je ein Fall für
Verb/Substantiv/Präposition/mehrdeutiges Wort/Bestandswort/Batch-5-Wort, plus ein Test mit
absichtlich irreführenden `expected_word_id`/`expected_meaning`-Werten) fest abgesichert.

**Batch 5 (Units 21-25) vollständig:** 126 neue Wörter auf das volle Datenmodell gehoben
(`scripts/data/kurs1Units21to25Full.js` + `scripts/upgrade-kurs1-units21to25.js`, analog zu
Batch 1-4). Neu in `validateCourse.js`: die Wortart **„Präposition"** als 13. Wert im zentralen
`part_of_speech`-Vokabular ergänzt (Unit 21 ist die erste Unit mit einer nennenswerten Zahl
echter Präpositionen — sie unter „Ausdruck" zu führen wäre grammatisch ungenau gewesen; eine
einzige durchdachte Ergänzung, kein zweites Vokabular). 15 vollständige, themenspezifische
Theoriedokumente (`scripts/apply-kurs1-theory-batch5.js`).

**Unit 21 (Position/Richtung/Präpositionen) — besondere Sorgfalt bei Mehrdeutigkeit, wie vom
Auftrag verlangt:** فَوْقَ (räumlich "über") und عَنْ (nicht-räumlich "über", ein Gesprächsthema)
sowie أَمَامَ (räumlich "vor") und قَبْلَ (zeitlich "vor") behalten bewusst dieselbe erste deutsche
Übersetzung — das ist keine Unschärfe, sondern eine legitime Eigenschaft der deutschen Sprache
(zwei unterschiedliche arabische Wörter, zufällig gleich übersetzt). Diese Mehrdeutigkeit wurde
NICHT künstlich aufgelöst, sondern in der Theorie zu Session A/C explizit erklärt und zusätzlich
über `confusion_group` (`c1_prep_ueber`, `c1_prep_vor`) markiert. مِنْ (von/aus) ist als
bewusstes Homonym mit dem bereits bekannten مَنْ (wer, `q_who`) über `homonym_group` verknüpft.

**Ergebnis:** **98** `opposite_id`-Verweise insgesamt (= **49** gegenseitige Paare, 22 neue
Verweise/11 neue Paare in diesem Batch) und **25** Verwechslungsgruppen über 96 Wörter
(`confusion_group`, 11 neu, u. a. `c1_prep_ueber`, `c1_prep_vor`, `c1_compass_directions`,
`c1_travel_documents`, `c1_hotel_vocab`, `c1_writing_tools`, `c1_school_subjects`,
`c1_academic_degrees`, `c1_uni_grading`, `c1_workplace_people`, `c1_job_application`).

**Neue/erweiterte Skripte:**
- `scripts/data/kurs1Units21to25Full.js`, `scripts/upgrade-kurs1-units21to25.js`: wie Batch 1-4,
  zweimal hintereinander ausgeführt und per Byte-Vergleich als idempotent verifiziert.
- `scripts/apply-kurs1-theory-batch5.js`: 15 neue Theoriedokumente.
- `language-review/batch_05.json` (126 Wort-Einträge + 15 Theorie-Einträge, im seit
  Entwicklungsauftrag 9 etablierten angereicherten Format), `audio_generation_manifest.json` um
  dieselben 126 Wörter erweitert (jetzt 642 Einträge insgesamt, weiterhin alle
  `status: "needs_language_review"`, keines `ready_for_generation"`).

**Neue Tests:** `test/unit/kurs1Units21to25Content.test.js` (22 Tests, deckt alle 25 im Auftrag
genannten Prüfpunkte ab, u. a. Wort-/Session-/Unit-Zahlen, Unversehrtheit der 24 bereits vorher
vollständigen Wörter, `opposite_id`-Gegenseitigkeit, das مِنْ/مَنْ-Homonym, die legitim erhaltenen
"über"/"vor"-Kollisionen, Idempotenz der Batch-5-Skripte, Unversehrtheit von Batch 0 und Batch
1-4 — plus ein datenbasierter Render-/Ablauftest, der alle 15 neuen Theoriedokumente über den
echten `TheoryRenderer` + einen DOM-Stub mountet und jeden Mini-Check mit der richtigen Antwort
bis zum Ergebnis durchklickt, ohne eine echte Electron-Oberfläche vorzutäuschen).
`test/unit/applicationPromptGrading.test.js` (8 Tests, siehe oben).

```text
npm test:                 322/322 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 0-5 (783 vorbereitete Wörter)
npm run package:source:    erfolgreich (nach allen Dokumentationskorrekturen ausgeführt)
```

Aktueller Datenstand nach diesem Batch (von `validate:course`/`report:language-review` berechnet,
nicht hart codiert): **900/900** Wörter strukturell vorhanden (Minimalmodell), **783/900** davon
mit vollem Lernmodell (657 vorher + 126 Batch 5), **75/90** Sessions mit vollständiger Theorie
(die übrigen 15 weiterhin klar als Platzhalter markiert), **783/900** Wörter in Batch 0-5 zur
Sprachprüfung vorbereitet, **75** Theorie-Prüfeinträge, **0/900** durch eine arabischkundige
Person tatsächlich geprüft, **642** Einträge im Audio-Generierungsmanifest (0
`ready_for_generation`), weiterhin nur die ursprünglichen **141** Wörter mit echter Audiodatei.

**Bewusst nicht Teil dieser Runde** (siehe ROADMAP für den vollständigen Plan): Units 26-30 mit
vollem Datenmodell/Theorie (Batch 6), echte menschliche Sprachfreigabe, tatsächliche
Audioerzeugung, Kurs-2-5-Neustrukturierung, `.arabiccourse`-Paketformat, physische
Arabic-101-Tastatur, neuer Transliterations-Eingabemodus, Bildaufgaben, größerer Umbau der
Session Engine, umfassendes Oberflächen-Redesign, weiterführende Grammatiklektionen.

## Kurs 1 abschließen – Batch 6 für Units 26-30 und Kurs-1-Gesamtaudit (Entwicklungsauftrag 11)

Elfter Entwicklungsauftrag: **Batch 6** (Units 26-30 — Technik/Internet/Medien, Natur/Wetter/
Umwelt, Tiere/Pflanzen, Freizeit/Sport/Kultur, Fragewörter/Konnektoren/Funktionswörter; 117 neue
Wörter, 15 Sessions) vervollständigen — der letzte inhaltliche Batch. **Kurs 1 ist damit
strukturell vollständig: 900/900 Wörter im vollen Lernmodell, 90/90 Sessions mit echter Theorie,
0 Platzhalter mehr.**

**Wichtige Klarstellung, die in diesem gesamten Abschnitt gilt:** "Strukturell vollständig"
bedeutet NICHT "sprachlich freigegeben". Alle 900 Wörter tragen weiterhin
`content_status: "needs_language_review"`, kein einziges Wort wurde von einer Person mit
Arabischkenntnissen geprüft, und **eine KI-Vervollständigung ist keine echte Sprachprüfung** —
dieser Satz gilt für den gesamten Kursinhalt, nicht nur für Batch 6.

**Wortartenmodell sinnvoll erweitert:** Unit 30 (Funktionswörter) brauchte vier neue Kategorien im
zentralen `part_of_speech`-Vokabular: **Konjunktion** (وَ/أَوْ/لَكِنْ/ثُمَّ/لِأَنَّ/إِذَا),
**Partikel** (هَلْ, die Ja/Nein-Fragepartikel), **Pronomen (Demonstrativ)** (هَذَا/هَذِهِ) und
**Pronomen (Indefinit)** (كُلّ/بَعْض/لَا أَحَد/شَيْء/لَا شَيْء) — Funktionswörter wurden bewusst NICHT
unter "Ausdruck"/"Adverb" gezwängt, nur weil vorher keine passendere Kategorie existierte. Das
gesamte Vokabular (jetzt 17 Werte) lebt seitdem in **einer einzigen zentralen Quelle**,
`scripts/partOfSpeechVocabulary.js` — `scripts/validateCourse.js` und alle Content-Tests
importieren dieselbe Datei, statt eigene (potenziell abweichende) Kopien zu pflegen.

**Verbindliche Application-Prompt-Semantik festgelegt und global validiert:** ein
`application_prompt` gehört immer zu dem Wort, in dessen `application_prompts`-Array er
gespeichert ist ("Besitzerwort") — dieses Besitzerwort ist die richtige Lösung. `scripts/
validateCourse.js` prüft das jetzt für **alle 900 Wörter** hart: Fehler, wenn `expected_word_id`
auf ein anderes Wort zeigt oder unbekannt ist, wenn `expected_meaning` keiner akzeptierten
deutschen Antwort des Besitzerwortes entspricht, oder wenn Prompt/Lösung leer sind. Dabei wurden
**12 ältere application_prompts** (10 ursprüngliche Bestandswörter + 2 frühe Batch-1-Wörter)
gefunden und korrigiert, deren `expected_meaning` nicht exakt zu `german_answers` passte (z. B.
"Professor / Lehrer" statt exakt "Professor") — einzeln dokumentiert in
`scripts/fix-legacy-application-prompt-meanings.js`. Der tatsächliche Renderer
(`renderContextualChoice`) bleibt unverändert (er wertet weiterhin über Objektidentität aus,
nicht über diese Metadatenfelder) — der bisherige "Irreführungstest" wurde präzisiert: er prüft
jetzt ausdrücklich nur das *Laufzeitverhalten* (Fallback-Toleranz), während ein neuer,
separater Test den echten Validator gegen absichtlich inkonsistente Daten laufen lässt und
bestätigt, dass er sie als Fehler zurückweist.

**Distraktorauswahl qualitativ abgesichert:** `pickDistractors()`/`isAcceptableDistractor()` (neu
in `src/js/session/exerciseRegistry.js`, an allen 5 Stellen mit Multiple-Choice-artigen Aufgaben
verwendet) schließen jetzt Distraktoren aus, die dieselbe Wort-ID, dieselbe angezeigte oder
unvokalisierte arabische Form, dieselbe `homonym_group` oder eine vollständig überlappende Menge
deutscher Bedeutungen wie das Zielwort haben. Bei einem zu kleinen/ungeeigneten Pool wird
kontrolliert auf weniger strenge Kriterien bzw. weniger Optionen zurückgefallen, statt
abzustürzen — rückwärtskompatibel, kein Verhalten für bestehende Aufgaben geändert.

**Kurs-1-Gesamtaudit (25 Punkte) durchgeführt — 0 Probleme gefunden.** `test/unit/
kurs1GlobalAudit.test.js` prüft jetzt automatisiert und dauerhaft u. a.: exakt 900 eindeutige
IDs, 30×30 Wörter, 90×10 Sessions, vollständiges Datenmodell für alle 900 Wörter, zentrales
`part_of_speech`-Vokabular, gegenseitige `opposite_id`, ausschließlich bewusst markierte
Homonyme, nur die 3 dokumentierten deutschen Übersetzungskollisionen, keine Presentation Forms,
0 Platzhalter-Theorien, exakte word_preview-Übereinstimmung je Session, genau eine richtige
Mini-Check-Lösung pro Frage, gültige Application-Prompts, alle 900 Wörter in genau einer
Sprachprüfdatei (keine Lücken, keine Duplikate), alle 90 Theorien in genau einem `theory_review`,
kein vorgetäuschter Review-Status, Manifest/Review-Konsistenz, alle 141 ursprünglichen
Audiodateien weiterhin vorhanden und keine neuen erzeugt — **plus ein Render-/Ablauftest, der
alle 90 Vokabel-Theoriedokumente über den echten `TheoryRenderer` mountet und jeden Mini-Check
mit der richtigen Antwort durchklickt.**

**Echte Testflakiness gefunden und behoben (nicht nur wegretestet):** bei einem von 10
aufeinanderfolgenden `npm test`-Läufen schlug ein Test mit `Unexpected end of JSON input` fehl.
Ursache: `node --test` führt mehrere Testdateien standardmäßig **parallel** aus — mehrere neue
Idempotenz-Tests schreiben dabei dieselben, von anderen Testdateien gleichzeitig gelesenen
JSON-Dateien (`vocabulary.json`, `batch_NN.json`, `audio_generation_manifest.json`) nicht atomar,
sodass ein gleichzeitiger Leser einen unvollständig geschriebenen Zwischenstand erwischen konnte.
Behoben durch `scripts/writeJsonAtomic.js` (Schreiben in eine temporäre Datei + atomares
Umbenennen, analog zum bereits etablierten Muster in `progressStore.js`) in allen betroffenen
Skripten, sowie durch eine isolierte temporäre Kopie statt Mutation der echten `vocabulary.json`
im überarbeiteten Validierungstest (`COURSE_VALIDATE_ROOT`-Override in `validateCourse.js`).
**Verifiziert: `npm test` 20× (2×10) hintereinander ausgeführt, 20/20 erfolgreich.**

**`LANGUAGE_REVIEW_GUIDE.md` (neu, im Projekt-Wurzelverzeichnis):** ein Leitfaden für eine
Person mit Arabischkenntnissen — erklärt, welche Dateien geprüft werden, was die einzelnen
Prüffelder bedeuten, wie Korrekturen einzutragen sind, welche Statuswerte zulässig sind, dass
Audiofreigabe erst nach abgeschlossener Prüfung erfolgt, und wie mit unsicheren Einträgen
umzugehen ist. In dieser Runde wurde selbst kein einziges Prüffeld auf `true` gesetzt.

**Neue/erweiterte Skripte:**
- `scripts/data/kurs1Units26to30Full.js`, `scripts/upgrade-kurs1-units26to30.js`: wie Batch 1-5,
  zweimal hintereinander ausgeführt und per Byte-Vergleich als idempotent verifiziert.
- `scripts/apply-kurs1-theory-batch6.js`: die letzten 15 neuen Theoriedokumente.
- `scripts/partOfSpeechVocabulary.js` (neu): zentrale, einzige Quelle für das
  `part_of_speech`-Vokabular.
- `scripts/fix-legacy-application-prompt-meanings.js` (neu, Einmalkorrektur): behebt 12 ältere
  inkonsistente `expected_meaning`-Werte, einzeln dokumentiert.
- `scripts/writeJsonAtomic.js` (neu): atomares Schreiben für alle Batch-Erzeugungsskripte.
- `language-review/batch_06.json` (117 Wort-Einträge + 15 Theorie-Einträge),
  `audio_generation_manifest.json` um dieselben 117 Wörter erweitert (jetzt **759** Einträge
  insgesamt — alle 759 neuen Wörter, `batch_00.json` bewusst weiterhin ausgeschlossen, da diese
  141 Wörter bereits eine Audiodatei haben).

**Neue Tests:** `test/unit/kurs1Units26to30Content.test.js` (17 Tests), `test/unit/
kurs1GlobalAudit.test.js` (23 Tests, der eigentliche Gesamtaudit als dauerhafter Regressionstest),
`test/unit/distractorSelection.test.js` (9 Tests: normaler Pool, Synonym, identische
unvokalisierte Form, Homonym, kleiner Pool, ausschließlich ungeeignete Kandidaten, leerer Pool,
Einzelprüfung, echtes Rendering mit genau einer richtigen Option). `test/unit/
applicationPromptGrading.test.js` um den überarbeiteten Validierungstest erweitert.

```text
npm test:                 372/372 Unit-Tests + 6/6 Integrationstests — 20× hintereinander
                           ausgeführt, 20/20 erfolgreich (echte Race Condition gefunden+behoben)
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 0-6 (900 vorbereitete Wörter, 90
                           Theorie-Prüfeinträge)
npm run package:source:    erfolgreich (nach allen Änderungen/Dokumentationskorrekturen
                           ausgeführt), enthält Batch 0-6, LANGUAGE_REVIEW_GUIDE.md
```

**Endstand (von `validate:course`/`report:language-review` berechnet, nicht hart codiert):
900/900 Wörter vollständig/lernfähig, 0 unvollständig. 90/90 Theorien vollständig, 0
Platzhalter. 900/900 Wörter in Batch 0-6 zur Sprachprüfung vorbereitet, 90 Theorie-Prüfeinträge.
Weiterhin 900/900 Wörter `needs_language_review`, 0 tatsächlich sprachlich freigegeben. 759
Einträge im Audio-Generierungsmanifest, 0 `ready_for_generation`, weiterhin genau 141 Wörter mit
vorhandener (unveränderter) Audiodatei — 759 Wörter weiterhin ohne erzeugte Audiodatei.**

**Der nächste zwingende inhaltliche Schritt ist die echte Sprachprüfung durch eine oder mehrere
Personen mit Arabischkenntnissen** (siehe `LANGUAGE_REVIEW_GUIDE.md`) — erst danach kann Audio
für geprüfte Wörter erzeugt werden. Größere, weiterhin offene Architektur-/Kursthemen: Kurs 2-5
im vollen Unit-Detail (aktuell nur Navigations-Wrapper um die alten Lektionen), `.arabiccourse`-
Paketformat, physische Arabic-101-Tastatur, Transliterations-Eingabemodus, Bild-/Wortfamilien-/
Minimalpaar-Aufgaben, die generische datenbasierte Session Engine (Bausteine fertig, größerer
Umbau nicht Teil dieser Runde), weiterführende Grammatik (Verbstämme II-X, Passiv, Partizipien,
Bedingungssätze, unregelmäßige/schwache Verben).

**Bewusst nicht Teil dieser Runde:** Wörter als menschlich geprüft markieren, Audio erzeugen oder
vorhandene Audiodateien neu generieren, Kurs 2-5 umbauen, `.arabiccourse`-Format, physische
Arabic-101-Tastatur, Transliterations-Eingabemodus, Bildaufgaben, größerer Umbau der Session
Engine, umfassendes Interface-Redesign, weiterführende Grammatiklektionen, Cloud-Dienste/neue
Online-Abhängigkeiten.

## Lokaler Sprachprüf-Arbeitsbereich und technisch freigegebene Vorschau-Audioerzeugung (Entwicklungsauftrag 12)

Zwei Ziele: (1) ein sicheres lokales Prüfwerkzeug für eine Person mit Arabischkenntnissen, (2) die
vom Nutzer ausdrücklich erlaubte technische Erzeugung der fehlenden Vokabelaudios als
**ausdrücklich ungeprüfte Vorschauaufnahmen** — Audioerzeugung ist dabei nicht gleich
Audiofreigabe.

**Review-Modus** (`npm run review:start`, eigener Electron-Prozess `reviewMain.js`/
`reviewPreload.js`, eigene Oberfläche `src/review/`, komplett getrennt von der normalen
Lernoberfläche): Dashboard mit ausschließlich berechneten Zählungen (nie hart codiert), filterbare
Wort-/Theorieliste (Batch/Unit/Session/Wortart/Prüfstatus/Audiozustand/Suche), Wort- und
Theoriedetailansicht mit nebeneinander sichtbarem Original- und Korrekturvorschlag, neun getrennte
Prüfaspekte je Wort/Theorie mit fünf möglichen Ergebnissen, ein Statusmodell
(`needs_language_review` → `in_review`/`corrections_required` → `reviewed` → `approved`, mit
verbindlichen Regeln: Öffnen ändert nie den Status, `approved` verlangt eine explizite
Bestätigung nach Anzeige der vollständigen Änderungsübersicht, unsichere Einträge sind nicht
freigebbar), Audioabspielung mit Anhörprüfung, und ein Export des Arbeitsstands ohne API-Schlüssel/
Quellcode/Lernfortschritt/Audio-Rohdaten. Speicherung über `scripts/review/reviewWorkspaceStore.js`
(wiederverwendet die bereits etablierten atomaren Schreib-/Backup-/Warteschlangen-Bausteine aus
`src/js/progressStore.js`), inkl. vollständigem Änderungsverlauf und Konflikterkennung bei
zwischenzeitlich extern geänderten Einträgen. `vocabulary.json`/`theory.json` bleiben dabei
unverändert — Korrekturen landen ausschließlich in `language-review/workspace/`.

**Audio-Erzeugungspipeline** (`scripts/audio/`, CLI `scripts/audioCli.js`, Befehle `audio:plan`/
`audio:generate:sample`/`audio:generate`/`audio:verify`, Details in
`AUDIO_GENERATION_GUIDE.md`): manifest-gesteuert (verarbeitet ausschließlich die 759 im
Audio-Manifest gelisteten fehlenden Wörter, nie pauschal das ganze Vokabular), liest
`arabic_vocalized` live aus `vocabulary.json`, erzeugt standardmäßig NUR die normale Datei (keine
`_slow.wav` — der bestehende `playbackRate`-Fallback in `audioPlayer.js` deckt die langsame
Wiedergabe bereits ab), mit Staging + technischer WAV-Prüfung + atomarer Übernahme, begrenztem
Backoff-Retry, Prüfsummen/Text-Hash/Provider/Modell/Zeitpunkt in den Metadaten, und einem
erweiterten, rückwärtskompatiblen Manifest-Statusmodell (`language_status`/`generation_status`/
`audio_review_status` zusätzlich zum unverändert erhaltenen alten `status`-Feld). Kein `--force`
für den Gesamtlauf — die 141 vorhandenen normalen und 141 vorhandenen langsamen Aufnahmen werden
dadurch strukturell nie überschrieben (zusätzlich durch eine eigene Laufzeitprüfung abgesichert).

**Ergebnis dieser Runde:** In dieser Entwicklungsumgebung war kein `ELEVENLABS_API_KEY` gesetzt —
die Pipeline ist vollständig fertiggestellt und automatisiert getestet, hat aber beim Versuch,
die 20-Wörter-Stichprobe zu erzeugen, sauber und ohne jede Manifest-Änderung abgebrochen (Fail-
Fast-Prüfung vor dem ersten Wort). **0 von 759 Audiodateien wurden in dieser Runde tatsächlich
erzeugt** — das ist keine verschwiegene Einschränkung, sondern exakt das im Auftrag für diesen
Fall vorgesehene Verhalten ("keine falsche Erfolgsmeldung, Pipeline und Review-Modus trotzdem
fertigstellen"). Sobald `ELEVENLABS_API_KEY` gesetzt ist, sind alle Befehle unverändert
einsatzbereit. Details, Zahlen und die vollständige Abgrenzung zwischen technisch erzeugt/
technisch validiert/manuell angehört/sprachlich geprüft/endgültig freigegeben stehen im
Abschlussbericht zu diesem Auftrag (siehe Commit-Historie) sowie in `AUDIO_GENERATION_GUIDE.md`.

Neue Tests: `test/unit/audioWavValidation.test.js`, `test/unit/ttsProviders.test.js`,
`test/unit/audioManifestModel.test.js`, `test/unit/audioPipeline.test.js`,
`test/unit/audioCli.test.js`, `test/unit/reviewWorkspaceStore.test.js`,
`test/unit/reviewDataLoader.test.js`, `test/unit/reviewModeUi.test.js` — alle gegen isolierte
temporäre Verzeichnisse bzw. mit eingeschleusten Mocks, kein einziger echter API-Aufruf in einem
automatisierten Test.

**Bewusst nicht Teil dieser Runde:** Sprachprüfung durch Claude, endgültige Audiofreigabe, Kauf
bezahlter Credits, Überschreiben vorhandener Audios mit `--force`, automatische Übernahme von
Review-Korrekturen in `vocabulary.json`/`theory.json` (das bleibt ein eigener, späterer Auftrag
mit Dry-Run/Diff/Backup/Rollback), Kurs 2-5, `.arabiccourse`-Format, Cloud-Synchronisierung,
Benutzerkonten, großes Interface-Redesign.

## Bekannte Einschränkungen

- Für Vokabeln/Buchstaben ohne generierte Audiodatei (z. B. neu hinzugefügte Inhalte vor dem
  nächsten `generate_audio.py`-Lauf) greift die App auf `speechSynthesis` zurück — ob das
  hörbar ist, hängt dann wieder vom Betriebssystem ab.
- macOS-Installer (`.dmg`) lassen sich zuverlässig nur auf einem echten Mac oder über den
  GitHub-Actions-Workflow bauen, nicht direkt unter Windows/Linux.
- Bewusst zurückgestellt (spätere Runden, siehe ROADMAP für Details): physische
  Arabic-(101)-Tastaturbelegung/-umschaltung (Datenlage beim Nachrecherchieren zu unzuverlässig
  — bleibt bewusst auf die virtuelle Tastatur beschränkt, die dafür jetzt 4 Lernstufen
  unterstützt), Kurs 2-5 im vollen Unit-Detail (bleiben vorerst die bestehenden Lektionen 3-11,
  nur umbenannt/gruppiert), Kurspakete als eigenständig installierbare `.arabiccourse`-
  ZIP-Dateien (bleibt Ordnerstruktur), Bilder/Wortfamilien/Minimalpaar-Audio-Aufgaben, die
  generische datenbasierte Session Engine (Bausteine fertig, Zusammenbau folgt mit der
  Vokabel-Migration), Verbindungstrainer mit echten visuellen Verbindungsfehlern statt reiner
  Buchstaben-Umsortierung.
- **Kurs 1 ist seit Entwicklungsauftrag 11 strukturell vollständig** (900/900 Wörter, 90/90
  Theorien) — die **inhaltliche Sprachprüfung** durch eine oder mehrere Personen mit
  Arabischkenntnissen steht aber für alle 900 Wörter weiterhin aus (`content_status` durchgängig
  `needs_language_review`, 0 tatsächlich geprüft, 0 Audios endgültig freigegeben). Ein eigenes
  lokales Prüfprogramm dafür existiert seit Entwicklungsauftrag 12 (`npm run review:start`, siehe
  `REVIEWER_QUICKSTART.md` und `LANGUAGE_REVIEW_GUIDE.md`).
- Für die 759 zuvor fehlenden Vokabelaudios wurde mit Entwicklungsauftrag 12 die technische
  Vorschau-Audioerzeugung ausdrücklich erlaubt (siehe eigener Abschnitt oben und
  `AUDIO_GENERATION_GUIDE.md`) — in dieser Entwicklungsumgebung fehlte jedoch ein
  `ELEVENLABS_API_KEY`, weshalb bislang **0 dieser 759 Dateien tatsächlich erzeugt wurden**. Die
  141 ursprünglichen Wörter haben weiterhin ihre unveränderten Bestandsaufnahmen. Sobald ein
  gültiger Schlüssel gesetzt ist, genügt `npm run audio:generate:sample` gefolgt von
  `npm run audio:generate`.
