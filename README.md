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
`test/integration/realProgressMigration.test.js`), Hilfestufen A-E (`test/unit/helpLevel.test.js`),
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
