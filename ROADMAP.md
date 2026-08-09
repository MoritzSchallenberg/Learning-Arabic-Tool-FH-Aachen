# ROADMAP — Learning Arabic Tool

**Zweck dieses Dokuments:** dauerhafte Referenz über einzelne Arbeitssitzungen hinweg — was das
Zielsystem ist, wo wir gerade stehen, was als Nächstes ansteht. Bei jeder neuen Session zuerst
dieses Dokument (+ `README.md`) lesen, am Ende einer Session den Abschnitt "Aktueller Stand"
aktualisieren.

---

## 1. Zielsystem (finale Vision)

Ein modularer, vollständig offline nutzbarer Desktop-Sprachtrainer für deutschsprachige
Nutzer:innen, die Arabisch (Modernes Hocharabisch) lernen wollen — im Stil von Duolingo, aber auf
die Besonderheiten der arabischen Schrift zugeschnitten (Rechts-nach-links, Buchstabenverbindung,
Vokalzeichen). Leitprinzipien für alle künftigen Erweiterungen:

- **Kein Setup für Endnutzer:** herunterladen, entpacken/installieren, starten — kein Python,
  Node, keine Pakete, kein Benutzerkonto, keine Internetpflicht.
- **App und Lerninhalt getrennt:** die Anwendung stellt Oberfläche, Lesson-/Exercise-Engine,
  virtuelle Tastatur, Fortschrittsverwaltung und Antwortauswertung bereit; die eigentlichen
  Inhalte liegen in einem austauschbaren Sprachpaket (`language-packs/<sprache>/`).
- **Kurs → Unit → Lesson-Struktur:** Kurse bestehen aus Units, Units aus Lessons/Übungen.
  Buchstaben werden in Gruppen mit didaktischer Logik gelernt (zuerst nicht-verbindende
  Buchstaben, dann ähnliche Formen usw.), mit einem eigenen Verbindungstrainer als Kernstück.
- **Adaptives Lernen:** Schwierigkeit wird pro Fähigkeit (nicht nur pro Wort) getrackt, Spaced
  Repetition steuert Wiederholungen, Hilfen bauen sich mit steigendem Können ab.
- **Korrekte RTL-/Unicode-Darstellung**, keine gespeicherten Buchstaben-Kontextformen — die
  Rendering-Engine übernimmt die Zeichenverbindung, wir berechnen Kontextformen nur für
  pädagogische Zwecke (Verbindungstrainer) aus der reinen Buchstabenfolge.
- **Kein Rateraten bei Sprachinhalten ohne Kennzeichnung:** von der KI erstelltes Vokabular/
  Grammatik wird klar als ungeprüft markiert, bis jemand mit Arabischkenntnissen gegengelesen hat.
- **Kein Duolingo-Frust-Design:** keine Werbung, keine Herzen/künstliche Wartezeiten, keine
  erzwungene Registrierung.

## 2. Bewusste Architektur-Entscheidungen

| Entscheidung | Warum |
|---|---|
| **Electron/JS**, nicht Python/PySide6 | Ein zweites, sehr detailliertes Pflichtenheft schlug Python/PySide6/SQLite vor — der Nutzer hat sich explizit entschieden, den bereits gebauten Electron/JS-Stack zu behalten und nur das **Kurs/Unit/Lesson-Konstrukt** daraus zu übernehmen, nicht den Technologie-Stack. |
| **Lokale JSON-Dateien**, nicht SQLite | Funktional gleichwertig für die aktuelle Datenmenge, einfacher zu debuggen ohne DB-Tooling. |
| **Sprachpakete als Ordner**, nicht als `.arabiccourse`-ZIP | Reicht für ein einzelnes mitgeliefertes Sprachmodul; ZIP-Import wäre nötig, sobald Kurse unabhängig von der App aktualisiert werden sollen. |
| **espeak-ng + optional ElevenLabs** für Audio | Einzige Optionen ohne Cloud-KI-Pflicht bzw. mit vom Nutzer selbst verwaltetem API-Key; TTS zur Laufzeit (`speechSynthesis`) bleibt nur Rückfallebene, da auf Linux oft keine arabische Stimme installiert ist. |
| **Sprachinhalte von der KI erstellt** | Schneller Fortschritt möglich, aber mit realem Fehlerrisiko bei Diakritika/Genus/Pluralformen — deshalb überall klar gekennzeichnet und Themen mit hohem Risiko (z. B. Verbstämme II-X, Passiv) bewusst ausgelassen statt geraten. |

## 3. Aktueller Stand

*(Letzte Aktualisierung: siehe letzter Commit in diesem Repo — Branch `feature/arabic-v1`)*

### Fertig
- **12 Lektionen (0-11)**, davon Kurs 1 (~ alte Lektionen 0-2) zu **11 Units** (0-10) umgebaut,
  Kurs 2-5 als Navigations-Gruppierung um die bestehenden Lektionen 3-11.
- **900 Vokabeln in Kurs 1** über 30 Vokabel-Units / 90 Sessions (Entwicklungsauftrag 6-10,
  Details Abschnitt 10-14) — davon 141 Wörter mit vorhandener Audiodatei (die ursprünglichen
  21 Themenkategorien aus Lektionen 3/6/8, jetzt zusätzlich mit Unit-/Session-Zuordnung; seit der
  Nachtrag-Runde direkt nach Entwicklungsauftrag 9 auch mit eigenem Sprachprüfeintrag in
  `language-review/batch_00.json` — die tatsächliche Prüfung durch eine Person mit
  Arabischkenntnissen steht aber weiterhin aus). **783/900** Wörter (Units 1-25, 75/90 Sessions)
  mit vollem Lernmodell + echter Theorie, sprachlich aber weiterhin ungeprüft
  (`content_status: needs_language_review`); die restlichen 117 Wörter (Units 26-30) vorerst als
  Struktur-Gerüst. Kein Wort hat bereits eine Audiodatei außer den ursprünglichen 141. Damit sind
  jetzt alle 783 vollständig modellierten Wörter (642 neue + 141 Bestand) in einer der sechs
  Sprachprüfdateien (`batch_00.json` bis `batch_05.json`) erfasst.
- **Alphabet:** alle 28 Buchstaben, Kontextformen live berechnet (`wordShaping.js`), 2 Übungstypen
  in der Alt-Ansicht + **volle 9-Phasen-Lessons** pro Buchstaben-Unit (Units 1-7): Einführung,
  Wiedererkennen, Zuordnen, Unterscheiden, Rekonstruieren (Verbindungstrainer), Geführte Eingabe,
  Selbstständige Produktion (mit Zwei-Fehler-Hinweis-Regression), Anwendung (Vokabelbezug),
  Abschlussprüfung.
- **Verbindungstrainer:** alle 10 im Pflichtenheft genannten Aufgabentypen über 9 konkrete
  Mechaniken abgedeckt, gegen mehrere Wörter verifiziert.
- **Grammatik:** bestimmter Artikel, Personalpronomen, Demonstrativa, Nominalsatz+Adjektiv,
  Verbformen (1 Beispielverb, Gegenwart/Vergangenheit), Präsens-Verneinung, Konjunktionen,
  Relativpronomen.
- **Hörverständnis, Lesen & Schreiben, gemischte Abschlussprüfung** (gewichtet nach Schwierigkeit).
- **Audio** für alle Wörter/Buchstaben-Beispiele (espeak-ng, teils ElevenLabs), idempotente
  Erzeugungs-Skripte (`scripts/generate_audio*.py`).
- **Statistik-Dashboard** sowie **Fortschritts-Farbpunkte je Lektion/Unit** in der Seitenleiste
  (grau = nicht begonnen, gelb = in Bearbeitung, grün = bestanden, rot = schwierig/falsch —
  `lessonProgress.js`, berechnet aus Schwierigkeitswerten bzw. Abschluss-Flags).
- **Lektions-Intro-Screens** ("Los geht's"), einheitliches "nur virtuelle Tastatur"-Messaging
  (keine Platzhalter mehr für nicht gebaute Eingabemodi).
- **Spaced Repetition** (sofort/1/3/7/14/30 Tage) zusätzlich zur Schwierigkeitsanpassung.
- **GitHub-Actions-Workflow** für automatische Windows/macOS/Linux-Builds.
- **Meilenstein 1 (Stabilisierung) abgeschlossen:** virtuelle Tastatur korrigiert (ذ, keine
  Spiegelung/Duplikate mehr, alle Funktionstasten), Unicode-sicheres Löschen, zentrale
  Antwortsperre + Timer-Aufräumung in allen 13 Übungs-Views, längenabhängige
  Bewertungsprofile statt festem Levenshtein-Grenzwert, atomare/versionierte
  Fortschrittsspeicherung mit Migration, 115 automatisierte Tests (`npm test`/`npm run lint`,
  komplett offline). Details: Abschnitt 6.
- **Meilenstein A+B aus Entwicklungsauftrag 3 größtenteils abgeschlossen:** Release-Dateien
  (LICENSE/LICENSES.md/CONTRIBUTING/CODE_OF_CONDUCT/SECURITY), CI-Workflow mit vorgeschaltetem
  Test-Job, `npm run validate:course`, generisches Hilfestufen-A-E-System, Tastatur-Lernstufen
  1-4, echte Review Queue (Tageslimit einstellbar), TheoryRenderer (blockbasiert, textContent-
  only), freier Übungsmodus mit Filtern/Schnellzugriffen, Startseite mit Fortschritts-/
  Wiederholungs-Übersicht, Fortschritts-/Kompetenzbalken (dabei einen bestehenden Anzeigefehler
  behoben: Schwierigkeits-Meter sahen vorher wie Fortschrittsbalken aus, obwohl höher=schlechter
  bedeutete). 173 automatisierte Tests insgesamt. Details + bewusst zurückgestellte Punkte
  (generische Session Engine, Session-Wiederaufnahme mit echtem Verbraucher, u. a.):
  Abschnitt 7.

### Bekannte Lücken (bewusst vertagt, nicht vergessen)
- Datenbasierte generische Session Engine + Session-Wiederaufnahme mit echtem Verbraucher
  (Bausteine fertig: TheoryRenderer, HelpLevel, Tastaturstufen, ReviewScheduler — Zusammenbau
  bewusst auf Meilenstein D verschoben, siehe Abschnitt 7).
- Kurs 2-5 im vollen Unit-Detail (aktuell nur Navigations-Wrapper um bestehende Lektionen).
- Physische Arabic-(101)-Tastaturbelegung/-umschaltung, Transliterationsmodus als echte Eingabe.
- Kurspakete als eigenständig installier-/aktualisierbare `.arabiccourse`-ZIP-Dateien.
- Verbindungstrainer: echte visuelle Verbindungsfehler statt reiner Buchstaben-Umsortierung.
- `evaluateAgainstAny()` noch nicht in echten Aufgaben verwendet (nur in Tests) — sinnvoll erst
  mit den neuen `accepted_arabic_answers`/`german_answers`-Feldern (Meilenstein D).
- Weiterführende Grammatik (Verbstämme II-X, Passiv, Partizipien, Bedingungssätze, unregelmäßige/
  schwache Verben) — bewusst ausgelassen, zu hohes Fehlerrisiko ohne Prüfung.
- Bild-/Wortfamilien-/Minimalpaar-Aufgaben (keine Bilddaten vorhanden).
- **Inhaltliche Prüfung durch eine Person mit Arabischkenntnissen** — bislang nicht erfolgt (gilt
  für alle 900 Wörter, `content_status` weiterhin durchgängig `needs_language_review`; **783**
  davon bereits in Sprachprüfdateien aufbereitet — `language-review/batch_00.json` (141
  ursprüngliche Bestandswörter, siehe unten) bis `batch_05.json`, Batch 1-5 jeweils inkl.
  `theory_review`-Metadaten (75 Theorie-Prüfeinträge insgesamt, korrekt über alle fünf Batches
  erfasst — siehe Entwicklungsauftrag 9, Abschnitt 2, zur zuvor fehlerhaften Behauptung in dieser
  ROADMAP) — die übrigen 117 folgen mit dem nächsten Batch).
- ~~"Batch 0" — die 141 ursprünglichen Bestandswörter formal sprachprüfen~~ — die
  **Erfassung** ist erledigt (direkt im Anschluss an Entwicklungsauftrag 9, auf Nutzerwunsch):
  `scripts/build-batch0-legacy-review.js` erzeugt `language-review/batch_00.json` mit allen 141
  Wörtern (bereits vollständig modelliert, nur nie in einer Review-Datei erfasst). Die
  **tatsächliche Prüfung** durch eine Person mit Arabischkenntnissen steht für diese 141 Wörter
  — wie für alle anderen 642 vorbereiteten Wörter auch — weiterhin aus.
- Units 26-30 (117 Wörter) haben noch das Meilenstein-2-Minimalmodell (keine Vokalisierung,
  Umschrift, Grammatikangaben, application_prompts) und nur Platzhalter-Theorie (15 von 90
  Sessions) — folgt in Batch 6 (Entwicklungsauftrag 10, Abschnitt 14). Units 1-25 (783 Wörter,
  75 Sessions) sind bereits vollständig (Entwicklungsauftrag 6 Batch 1 + Entwicklungsauftrag 7
  Batch 2 + Entwicklungsauftrag 8 Batch 3 + Entwicklungsauftrag 9 Batch 4 + Entwicklungsauftrag
  10 Batch 5).
- Audioerzeugung für alle 759 neuen Wörter (bewusst noch nicht ausgeführt, siehe
  `audio_generation_manifest.json` — 642 Einträge, alle Status `needs_language_review`, nicht
  `ready_for_generation`).
- ~~"76 Gegensatzpaare" ungenau formuliert~~ — in Entwicklungsauftrag 10 präzisiert: 76 war die
  Anzahl der `opposite_id`-**Verweise** (38 gegenseitige Paare); nach Batch 5 sind es 98 Verweise
  (49 Paare). Beide Begriffe werden jetzt konsequent unterschieden.
- ~~part_of_speech-Vokabular nicht zentral festgeschrieben~~ — in Entwicklungsauftrag 8 als
  geschlossene, deutschsprachige 12-Werte-Liste in `scripts/validateCourse.js` festgeschrieben.
- `opposite_id`/`confusion_group` erst für Units 11-25 vergeben (98 Verweise/49 Paare bzw. 25
  Gruppen über 96 Wörter) — für Units 1-10 rückwirkend zu ergänzen bleibt optional (kein harter
  Fehler, nur Hinweis bei fehlender Nutzung).
- ~~Schrift-Theorie fehlt für die Buchstabengruppen-Units 3-7~~ — nachträglich in
  Entwicklungsauftrag 7 ergänzt (`scripts/apply-script-theory-units3to5.js`,
  `scripts/apply-script-theory-units6to7.js`); alle 8/8 Schrift-Units haben jetzt Theorie.
- ~~"Deine schwierigen Wörter" hatte nur eine Sammelaktion~~ — nachträglich in
  Entwicklungsauftrag 7 ergänzt: alle fünf vorgeschlagenen Einzelaktionen pro Wort sind jetzt
  umgesetzt (Noch einmal lernen/Audio anhören/Schreibweise ansehen/Verbindung ansehen/Beispiele
  ansehen), siehe Abschnitt 11 unten für Details (`onlyWordIds`-Filter in `freePractice.js`).
- 3 Wortpaare mit identischer erster deutscher Übersetzung bleiben bewusst so (siehe
  `npm run report:language-review`) — "gern geschehen" (zwei gültige Synonyme) sowie "über"/"vor"
  (Präpositionen mit mehreren Bedeutungen, bereits im Wortplan mit "/" notiert). Die übrigen 12
  Kollisionen aus der ersten Fassung von Entwicklungsauftrag 7 wurden aufgelöst.
- Noch nie in einer laufenden Electron-Instanz von der KI selbst getestet (Sandbox-Einschränkung
  in früheren Sessions) — der Nutzer verifiziert jeweils per `npm start`.
- Der zuvor bekannte flakige Test (`test/unit/sessionEngine.test.js`, „Fehlerwiederholung …“) ist
  seit Entwicklungsauftrag 7 behoben (injizierbarer `RandomProvider`, siehe Abschnitt 11) —
  `npm test` wurde zehnmal hintereinander mit 10/10 Erfolg verifiziert.

## 4. Nächste Schritte (priorisiert)

**Aktueller Stand (nach Entwicklungsauftrag 10, Abschnitt 3): Units 1-25 vollständig (783/900
Lernfähig/Vollständig, 75/90 Sessions mit echter Theorie, 783/900 Wörter — Batch 0 bis Batch 5 —
zur Sprachprüfung vorbereitet, inkl. der 141 ursprünglichen Bestandswörter aus "Batch 0", das seit
der Nachtrag-Runde direkt nach Entwicklungsauftrag 9 technisch erstellt ist). Zwei mögliche
nächste Schritte laut Nutzer, noch nicht priorisiert entschieden: (a) Batch 6 (Units 26-30) nach
demselben Muster wie Batches 1-5, oder (b) eine echte Sprachprüfung durch eine Person mit
Arabischkenntnissen (783 Wörter liegen dafür bereits vorbereitet vor) — beides NICHT eigenständig
vorgezogen, sondern wartet auf den nächsten Entwicklungsauftrag. Der Rest dieses Abschnitts ist
die ursprüngliche, vor Entwicklungsauftrag 6 verfasste Planung und historisch zu lesen.**

**Abgeschlossen: Entwicklungsauftrag 5 "Lernfluss fertigstellen, Interface verbessern und
Pilotkurs vervollständigen" (Abschnitt 9) — alle drei Pilot-Units (Begrüßung, Familie, Zuhause)
funktionieren vollständig mit dem überarbeiteten Session Engine. Nächster Schritt laut Auftrag 5,
Abschnitt 32: erst wenn diese drei Pilot-Units sich im echten Gebrauch bewährt haben, Migration
der restlichen 116 vorhandenen Wörter auf das neue Session-/Theory-System — NICHT die 759 neuen
Wörter (die bleiben explizit zurückgestellt, bis auch diese Migration steht).**

1. **Migration der restlichen 116 vorhandenen Wörter** auf das Session-/Theory-Modell (eigene
   Vokabel-Units + Theorietexte), mit denselben Engine-Mechanismen wie die drei Pilot-Units.
2. Theorie für die verbleibenden 5 Schrift-Units (3-7) nach demselben Muster wie Unit 1/2/8.
3. **Inhaltliche Prüfung durch jemanden mit Arabischkenntnissen** (alle `needs_language_review`-
   Theorietexte und die erweiterten Vokabelfelder).
4. Erst danach: Wortschatz auf ~900 ausbauen (759 neue Wörter), weiterhin in geprüften Schritten.
5. Physische Arabic-101-Tastaturbelegung, Transliterationsmodus, Kurspakete als ZIP.

## 5. Hinweise für die Weiterarbeit

- Neue Arbeitssitzung: erst `README.md` + dieses `ROADMAP.md` lesen, dann loslegen.
- Sprachinhalte (Vokabeln/Grammatik) immer in kleinen, sorgfältig geprüften Schritten erweitern —
  nicht in einem großen ungeprüften Sprung.
- Nach JSON-/JS-Änderungen: JSON mit `python3 -c "import json; json.load(open(...))"`, JS mit
  `node --check` validieren (siehe Commit-Historie für das übliche Vorgehen).
- Lokal committen ist Standard; **Push macht der Nutzer selbst**, nicht automatisch.
- Diesen Abschnitt "Aktueller Stand" am Ende jeder umfangreicheren Session aktualisieren, damit
  das Dokument seinen Zweck als Startpunkt für die nächste Runde erfüllt.

---

## 6. Entwicklungsauftrag: Veröffentlichungsfähigkeit (vom Nutzer, 2026-08-05)

Nach dem ersten ausgiebigen Testen von Kurs 1 hat der Nutzer einen zweiten, sehr detaillierten
Entwicklungsauftrag geliefert: Stack bleibt (Electron/JS/HTML/CSS/JSON, lokale Speicherung),
kein Neubau, bestehende funktionierende Inhalte bleiben erhalten. Ziel: Kurs 1 wirklich
veröffentlichungsfähig machen, Kurse 2-5 später unabhängig installierbar, datenbasierte
Lesson-Architektur, funktionierender Fortschritt/Wiederholungen, automatisierte Tests, Paketierung.

Arbeitsweise laut Auftrag (gilt für jeden Meilenstein): betroffene Dateien zuerst analysieren,
Probleme benennen, nur notwendige Komponenten ändern, vollständige Dateien liefern, automatisierte
Tests ergänzen und ausführen, README/ROADMAP aktualisieren, nur tatsächlich Getestetes als
funktionierend bezeichnen.

Fortschritt wird hier je Meilenstein als Checkliste geführt (☐ offen, ☑ erledigt+getestet,
☒ teilweise/mit bekannter Einschränkung — Details dann im Fließtext darunter).

### Meilenstein 1 — Stabilisierung ✅ abgeschlossen (2026-08-05)

Ziel: stabile Version des bisherigen Funktionsumfangs.

- ☑ Teststruktur (`node:test`, `npm test`/`test:unit`/`test:integration`/`lint`) — 115 Tests,
  alle grün, komplett offline (kein zusätzliches `npm install`)
- ☑ Virtuelle Tastatur: ذ ergänzt, Spiegelung durch `direction: rtl` → `ltr` behoben, doppelte
  Sonderzeichen (أ إ آ vs. Grundlayout) entfernt, fehlende Funktionstasten ergänzt (Alles
  löschen, Bestätigen, Shift/Sonderzeichen- und Vokalzeichen-Umschaltung, Satzzeichen, Ziffern)
- ☑ Unicode-sicheres Löschen (Graphem-Cluster via `Intl.Segmenter`, `src/js/textEditing.js`,
  Fallback ohne Segmenter vorhanden)
- ☑ Zentrale Antwortsperre (`idle/submitted/showing_feedback/transitioning/completed`,
  `src/js/exerciseGuard.js`) — in **allen 13 Übungs-Views** eingebaut (letterGroupLesson,
  unit10, connectionTrainer, vocalization [Unit 8+9], grammar, grammar2, grammar3, vocabulary,
  listening, reading, exam, alphabet, keyboardTutorial), inkl. `App.registerCleanup()`-
  Mechanismus, der beim Verlassen einer Ansicht offene Timer abbricht
- ☑ Aufgabenspezifische Antwortprofile (`arabic_letter_strict`, `arabic_word_strict`,
  `arabic_word_ignore_diacritics`, `arabic_word_require_diacritics`, `arabic_sentence_flexible`,
  `german_translation_flexible`) statt festem Levenshtein-Grenzwert 2 — Toleranz jetzt
  längenabhängig; konfigurierbare Normalisierung (NFC, Tatweel, unsichtbare Steuerzeichen,
  Vokalzeichen, Alif-/Hamza-Formen, Satzzeichen, Groß/Klein)
- ☑ Fortschritt atomar + versioniert speichern (`src/js/progressStore.js`: temp+rename, Backup,
  Migrationsmechanismus, zentrale Speicherwarteschlange pro Datei) — Migration gegen eine
  Sicherheitskopie der echten Nutzer-Fortschrittsdatei getestet (221 Karten, 2 Lesson-Flags,
  keine Datenverluste)
- ☑ Offene Timer beim Ansichtswechsel abbrechen (Teil des ExerciseGuard/`registerCleanup`-Systems)
- ☑ README/ROADMAP an tatsächlichen Stand angepasst

**Bewusst noch nicht in dieser Runde:** eine physische Arabic-101-Tastenbelegung (weiterhin nur
virtuelle Tastatur, siehe Abschnitt 3 "Bekannte Lücken"); die restlichen, in Abschnitt 3 des
Entwicklungsauftrags erwähnten P0-nahen Punkte, die nicht Teil der expliziten 10-Punkte-Liste in
Abschnitt 20 des Auftrags waren (z. B. ein dediziertes E2E-Testsystem über `node:test` hinaus).

### Meilenstein 2 — Kursarchitektur

Ziel: Kurs 1 als separates, unabhängig installierbares Paket, ohne Kurs 2-5.

- ☐ Eigenständiges Kursformat (`courses/<kurs>/`, `.arabiccourse` als ZIP mit Manifest,
  `course.json`, `units/`, `lessons/`, `vocabulary/`, `grammar/`, `audio/`, `images/`,
  `licenses/`, `schemas/`, `checksum.json`)
- ☐ Kursmanifest + Validierung beim Import (ID, Version, App-Kompatibilität, Pfade, Checksummen,
  Schutz gegen ZIP Slip/`../`/absolute Pfade/übergroße Dateien/ausführbare Dateien)
- ☐ Kursbibliothek (installierte/verfügbare Kurse, Import, Deinstallation, Update ohne
  Fortschrittsverlust)

### Meilenstein 3 — Lesson- und Lernsystem

Ziel: neue Standard-Lessons rein datenbasiert erstellbar, ohne Änderung an `VIEW_BY_KEY`.

- ☐ Generische Engine (CourseManager, LessonEngine, ExerciseEngine, LearningEngine,
  AnswerEvaluator, ProgressManager, ReviewScheduler, AudioManager) mit registrierten
  Exercise-Typen statt harter View-Zuordnung
- ☐ Hilfestufen A-E als allgemeines System (bisher: einfache Zwei-Fehler-Regression nur in den
  Buchstaben-Units, siehe Abschnitt 3)
- ☐ Tastatur-Lernstufen 1-4 (stark geführt → selbstständig, physische Tastatur im Vordergrund)
- ☐ "Erst verstehen, dann produzieren" (9-Phasen-Reihenfolge) konsequent auch für Vokabel-/
  Grammatik-/Hör-Lessons, nicht nur Buchstaben-Units
- ☐ Flexible Antwortprofile mit `accepted_answers`/`required_concepts` tatsächlich in den
  Lerninhalten genutzt, nicht nur als ungenutzte Funktion vorhanden
- ☐ Korrekter Lesson-Abschluss (Pflichtaufgaben, Mindestpunktzahl, "Weiter" überspringt keine
  Pflichtaufgabe unbemerkt)

### Meilenstein 4 — Lernfortschritt

Ziel: sinnvolle Wiederholungsauswahl, echter sichtbarer Lernfortschritt.

- ☐ Review Queue (fällige zuerst, dann häufig falsch beantwortete, dann niedrige Beherrschung,
  dann neue Inhalte im Tageslimit), Fähigkeiten weiterhin getrennt bewertet
- ☐ Freier Übungsmodus mit Filtern/Einstellungen/Schnellzugriffen (Abschnitt 9 des Auftrags)
- ☐ Fortschrittsbalken (Kurs/Unit/Lesson/Aufgabe), basierend auf abgeschlossenen Lernzielen statt
  nur geöffneten Seiten oder Ø-Schwierigkeit
- ☐ Statistikseite: Beherrschung (höher = besser) klar von Schwierigkeit (höher = schwieriger)
  getrennt, alle tatsächlich verwendeten Skill-IDs abgebildet

### Meilenstein 5 — Kurs 1 veröffentlichen

Ziel: veröffentlichungsfähiger Kurs 1 mit separat installierbarem Kurspaket.

- ☐ Kurs 1 auf 50-80 sorgfältig geprüfte Wörter ausgebaut, vollständig isoliert von späteren
  Kursen (keine Wörter aus nicht eingeführten Buchstaben/späteren Kursen)
- ☐ Units 8-10 mit echten Übungen statt Tabellen/einfachem Mischen ausgebaut
- ☐ Verbindungstrainer: "richtige Form wählen"/"falsche Verbindung finden" mit echten visuellen
  Verbindungsfehlern statt reiner Buchstaben-Umsortierung
- ☐ Zentraler AudioManager (nur eine aktive Wiedergabe, Wort-für-Wort bei Sätzen klar als solches
  gekennzeichnet, TTS klar von kuratierter Aufnahme unterschieden)
- ☐ Einstellungen vollständig angeschlossen oder entfernt, wenn tot
- ☐ Sicherheit externer Kursinhalte (`textContent` statt `innerHTML` wo möglich, Sanitizing,
  Pfad-/Größenprüfung) vor Einführung herunterladbarer Kurse
- ☐ Release-Struktur (`LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  Lizenzübersicht Assets, CI-Workflow, der tatsächlich existiert bevor README ihn erwähnt)
- ☐ Sprachliche Prüfung durch eine Person mit Arabischkenntnissen

### Bewusste Leitplanken (aus dem Auftrag, gelten für alle Meilensteine)

- Kein Wechsel zu Python/anderem Framework, kein Neubau ohne Not.
- Nur Wort-/Buchstaben-/Laut-/Silben-Audio vorhanden — Satz-/Dialog-Audio nie voraussetzen; bei
  Sätzen ist Wort-für-Wort-Wiedergabe vorhandener Audios erlaubt, muss aber als solche benannt
  werden (nicht als natürliche Satzaufnahme ausgeben).
- Arabische Inhalte nicht eigenmächtig umschreiben; unsichere Inhalte als "sprachliche Prüfung
  erforderlich" kennzeichnen statt sie als endgültig zu markieren.
- `node_modules` nie ins Repository/Release; Electron-Sicherheitsoptionen (`contextIsolation`,
  `sandbox`, kein `nodeIntegration`) bleiben bestehen.
- Keine Funktion in README/ROADMAP als fertig markieren ohne Test oder nachvollziehbaren
  manuellen Prüfschritt.

**Hinweis:** Meilenstein 1 dieses Abschnitts ist abgeschlossen (siehe Haken oben). Die
Meilensteine 2-5 werden ab jetzt durch den detaillierteren Entwicklungsauftrag 3 in Abschnitt 7
weitergeführt (dort als Meilenstein A-G, mit denselben Zielen, aber genauer spezifiziert —
z. B. wird aus "Kurs 1 auf 50-80 Wörter ausbauen" jetzt konkret "auf 900 Wörter, in 30
Wortschatz-Units"). Abschnitt 6 bleibt als historischer Kontext stehen, Abschnitt 7 ist die
aktuell führende Aufgabenliste.

---

## 7. Entwicklungsauftrag 3: Vollständiger Kurs 1 mit 900 Vokabeln (vom Nutzer, 2026-08-05)

Nach Meilenstein 1 (Stabilisierung) hat der Nutzer einen dritten, sehr umfangreichen
Entwicklungsauftrag geliefert: Kurs 1 zu einem vollständigen Grundkurs mit ~900 Vokabeln, echten
Theorietexten, adaptivem Hilfestufensystem (A-E), Tastatur-Lernstufen (1-4), einer
funktionierenden Review Queue, Session-Wiederaufnahme, freiem Übungsmodus, Fortschrittsbalken
und modular installierbaren Kurspaketen ausbauen — bei unverändertem Stack (Electron/JS) und
ohne Verlust bestehender Funktionalität. Die bisherigen 141 Vokabeln (samt IDs, damit Fortschritt
erhalten bleibt) werden vollständig übernommen, ~759 neue kommen in kontrollierten,
validierten Batches dazu — **nicht** in dieser Runde (siehe unten, explizit erst nach
Meilenstein A+B).

**Explizite Arbeitsanweisung des Nutzers für diese Runde:** ausschließlich Meilenstein A
(Bestand korrigieren) und Meilenstein B (Lernarchitektur) — NICHT Kurspakete (C), NICHT
Vokabel-Migration/-Erweiterung (D/E), NICHT Audio-Batch-Erzeugung (F), NICHT Kurs-1-Abschluss
(G). Diese Reihenfolge wird strikt eingehalten.

### Meilenstein A — Bestand korrigieren ✅ abgeschlossen (2026-08-05)

- ☑ `npm test`/`npm run test:unit`/`test:integration` auf konkrete Dateimuster umgestellt
  (`test/unit/*.test.js`/`test/integration/*.test.js` statt Verzeichnispfad)
- ☑ `.github/workflows/build.yml` existierte bereits (war fälschlich als fehlend gemeldet —
  vermutlich ein Export/eine ZIP ohne Punktordner) und wurde um einen vorgeschalteten
  `test`-Job erweitert (`npm ci` → `npm run lint` → `npm run validate:course` → `npm test`,
  Build-Matrix läuft erst danach); README-Formulierung präzisiert
- ☑ `.gitignore` erweitert (Backups/Temp-Dateien von `progressStore.js`, Nutzerdaten,
  Audio-Cache, `.arabiccourse`/`.zip`, Editor-/OS-Artefakte) — Repo war bereits frei von
  `node_modules`/`dist`/`__pycache__`
- ☑ `LICENSE` (MIT, Code), `LICENSES.md` (getrennte Übersicht: Code MIT, Kursinhalte
  CC BY-SA 4.0, Audio espeak-ng vs. ElevenLabs mit offenem Klärungsbedarf, Bilder: noch keine),
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` neu erstellt
- ☑ `scripts/validateCourse.js` + `npm run validate:course` neu erstellt (harte Fehler vs.
  informative Hinweise zu noch nicht begonnenen Meilensteinen, siehe Abschnitt 28 des Auftrags)

### Meilenstein B — Lernarchitektur ☒ größtenteils abgeschlossen (2026-08-05), 2 Punkte zurückgestellt

Ziel: neue Standard-Vokabel-Sessions rein datenbasiert erstellbar.

- ☑ TheoryRenderer (`src/js/theoryRenderer.js`): alle 11 Blocktypen, ausschließlich
  `textContent`/`createElement` (kein `innerHTML` mit Kursdaten), "Kurz erklärt"/"Mehr
  erfahren" über `level:"full"`-Blockmarkierung, Theoriefortschritt in `state.js`
  (`markTheoryOpened`/`markTheoryMiniCheckResult`/`markTheoryCompleted`)
- ☑ Hilfestufen A-E als generisches System (`src/js/helpLevel.js`): 2 Fehler in Folge → mehr
  Hilfe, 3 richtige in Folge → weniger Hilfe, Konfiguration je Stufe (Vokalzeichen/Umschrift/
  Audio/Tastaturhilfe/Anwendung)
- ☑ Tastatur-Lernstufen 1-4 in `virtualKeyboard.js`: nächste erwartete Taste wird aus
  `expectedWord` + Cursorposition berechnet und hervorgehoben (Stufe 1 zusätzlich mit
  Abschwächung der übrigen Tasten), Stufe 4 blendet die virtuelle Tastatur standardmäßig aus
  (jederzeit wieder einblendbar) — reagiert auch auf physische Tastatureingabe (natives
  `input`-Event), nicht nur auf virtuelle Klicks
- ☑ Echte Review Queue (`src/js/reviewScheduler.js`): Priorität fällig → häufig falsch →
  niedrige Beherrschung → neue (Tageslimit 5/10/15/20, Standard 10, Zähler in `state.js`
  `getDailyNewCount`/`incrementDailyNewCount`) — **tatsächlich verwendet**, nicht nur getestet:
  treibt den freien Übungsmodus UND die Startseiten-Zusammenfassung an
- ☑ Freier Übungsmodus (`src/js/views/freePractice.js`, Sidebar-Link "🎯 Frei üben"): Filter
  (Kategorien Buchstaben/Vokabeln/Verbindungen, fällig/schwierig/zuletzt falsch/neu/beherrscht),
  Einstellungen (Anzahl, Hilfestufe, Tastaturstufe), 5 Schnellzugriffe; nutzt bereits jetzt die
  vorhandenen 28 Buchstaben + 141 Vokabeln + daraus ableitbare Verbindungswörter
  (`src/js/practicePool.js`) — kein Warten auf die 900er-Erweiterung nötig
- ☑ Fortschrittsbalken (`src/js/progressStats.js`): Gesamtfortschritt + Fortschritt je Bereich
  auf der neuen Startseite (`src/js/views/dashboard.js`), Kompetenzbalken (Lesen/Schreiben/
  Hören/Wortschatz/Verbindungen/Satzanwendung) in `statistics.js` — **behebt dabei einen
  bestehenden Anzeigefehler**: die alten Schwierigkeits-Meter füllten sich mit steigender
  Schwierigkeit, was wie "gut gelernt" aussah, obwohl höhere Schwierigkeit schlechter bedeutet;
  Beherrschung (höher=besser, grün) und Schwierigkeit (höher=schwieriger, rot) sind jetzt klar
  getrennte, unterschiedlich eingefärbte Balken. Ein Wort zählt zudem nur anteilig als
  beherrscht, wenn nur eine von mehreren Fähigkeiten trainiert wurde (Abschnitt 20 des Auftrags)
- ☑ Startseite (`src/js/views/dashboard.js`, Sidebar-Link "🏠 Start", automatisch nach
  abgeschlossenem Onboarding): heute fällige Wiederholungen, verfügbare neue Wörter samt
  Tageslimit, grobe Zeitschätzung, Gesamt-/Bereichsfortschritt, Ein-Klick-Einstieg "Heute
  weiterlernen" (startet den freien Übungsmodus direkt mit `dueOnly`-Filter)
- ☐ **Zurückgestellt: Datenbasierte generische Session Engine** (CourseManager/LessonEngine/
  SessionEngine/ExerciseEngine/TheoryRenderer-Orchestrierung/Exercise Registry für die volle
  9-Phasen-Vokabel-Session). Begründung: alle dafür nötigen Bausteine sind jetzt einzeln fertig
  und getestet (TheoryRenderer, HelpLevel, Tastaturstufen, ReviewScheduler, ExerciseGuard,
  Bewertungsprofile) — sie zu einem generischen Orchestrator zusammenzusetzen, BEVOR es echte
  Session-Inhalte im neuen Datenmodell gibt (Meilenstein D/E), hieße, gegen erfundene
  Beispieldaten zu entwerfen. Das Risiko: eine Struktur, die nach der echten Migration wieder
  verworfen werden muss. Sinnvoller Zeitpunkt: zu Beginn von Meilenstein D, sobald reale
  Session-Definitionen vorliegen, an denen sich der Orchestrator ausrichten kann.
- ☐ **Zurückgestellt: Session-Wiederaufnahme mit echtem Verbraucher.** Die Speicherschicht ist
  fertig und getestet (`state.js`: `saveSessionState`/`getSessionState`/`clearSessionState`/
  `getActiveSessionId`, `AppState.init()` legt den Bereich an), aber es gibt noch keine reale
  Session, die sie befüllt — folgt zusammen mit der Session Engine oben.
- ☐ Jedes Wort in mehr als den aktuell 2 Fähigkeiten (Ar→De, De→Ar) trainieren (Audio→Bedeutung,
  Lesen mit/ohne Vokalzeichen, Satzanwendung, ...) — die INFRASTRUKTUR dafür (getrennte
  Skill-IDs pro Karte) existiert bereits (siehe Card-ID-Konventionen), zusätzliche Fähigkeiten
  pro Wort sind Teil der Session Engine/Migration, nicht separat vorgezogen.
- ☐ `evaluateAgainstAny()` tatsächlich in echten Aufgaben verwenden (bisher nur in Tests) —
  sinnvoll erst mit `accepted_arabic_answers`/`german_answers`-Feldern aus dem neuen
  Vokabel-Datenmodell (Meilenstein D), sonst gäbe es nichts Neues zu akzeptieren
- ☐ Verbindungstrainer: echte visuelle Verbindungsfehler statt reiner Buchstaben-Umsortierung
  — nicht angefasst in dieser Runde (bewusste Priorisierung zugunsten der oben abgeschlossenen
  Punkte; bleibt offen)
- ☐ Units 8-10 weiter ausgebaut (Vokalzeichen hören/eingeben, Sonderformen, echter
  Schrift-Abschlusstest mit Mindestpunktzahl) — nicht angefasst in dieser Runde
- ☐ Einstellungen (`showDiacritics`, `autoPlayWord`, `replayAfterAnswer`, `autoPlaySentence`,
  `slowPlayback`, `inputMode`) vollständig durchgeprüft — nicht angefasst in dieser Runde

### Meilenstein C — Kurspakete (noch nicht begonnen)

`.arabiccourse`-ZIP-Format, Manifest, Schema-/Checksummen-Validierung, Import/Update/
Deinstallation, ZIP-Slip-Schutz. Kurs 1 eigenständig installierbar, Kurs 2 ohne Änderung an
`app.js` ergänzbar.

### Meilenstein D — Bestehende Inhalte migrieren (noch nicht begonnen)

141 bestehende Vokabeln in das erweiterte Datenmodell (siehe unten) übernehmen, IDs erhalten,
neuen Units/Sessions zuordnen, Theorie für bestehende Inhalte schreiben, Fortschritt migrieren.

### Meilenstein E — Wortschatz auf 900 erweitern (noch nicht begonnen)

~759 neue Einträge in 6 Batches à 5 Units, nach jedem Batch Validierung + Inhaltsbericht, alle
neuen Einträge zunächst `content_status: "needs_language_review"`.

### Meilenstein F — Audio: Wiedergabe-Fallback ERLEDIGT, Erzeugung für neue Wörter offen

Die hier ursprünglich geplante Wiedergabelogik ist seit Entwicklungsauftrag 5 implementiert und
getestet (`src/js/audioPlayer.js`, `test/unit/audioPlayer.test.js`): ein Audio pro Wort reicht
aus, langsame Wiedergabe nutzt `HTMLAudioElement.playbackRate` (0.75), bestehende `_slow.wav`-
Dateien werden weiterhin bevorzugt, falls vorhanden — kein separates Slow-File mehr nötig für
neue Wörter. Weiterhin offen: die tatsächliche Audioerzeugung für die 759 neuen Kurs-1-Wörter
selbst (das eigentliche `.wav`-Erzeugen), die erst nach Sprachprüfung erfolgen darf (siehe
Entwicklungsauftrag 6/7, `audio_generation_manifest.json`).

### Meilenstein G — Kurs-1-Abschluss (noch nicht begonnen)

Alle Schrift-Units + 30 Wortschatz-Units (90 Sessions, 30 Wiederholungen, 30 Unit-Tests, 10
Abschnittstests) + finaler Kurs-Test, Fortschritt 0-900 Wörter sichtbar, Release-Builds.

### Neues Vokabel-Datenmodell (Referenz für Meilenstein D/E)

Erweitertes Schema pro Wort (siehe Auftrag Abschnitt 8 für das vollständige Beispiel):
Pflichtfelder `id`, `arabic_vocalized`, `arabic_unvocalized`, `german_answers[]`,
`transliteration`, `part_of_speech`, `unit_id`, `session_id`, `audio_key`, `difficulty_level`,
`content_status`; optionale Felder `gender`, `plural`, `root`, `confusion_group`,
`introduced_letters`, `tags`, Beispielsatz/Verwendungsnotiz. `content_status` durchläuft
`needs_language_review → reviewed → approved` (oder `rejected`) — nie stillschweigend als
geprüft markieren.

### Themenverteilung der 30 Wortschatz-Units (Referenz für Meilenstein D/E)

1 Begrüßung/Höflichkeit · 2 Persönliche Angaben/Länder · 3 Familie/Beziehungen · 4 Zahlen/Mengen ·
5 Zeit/Kalender · 6 Farben/Formen/Materialien · 7 Zuhause/Räume · 8 Möbel/Haushalt · 9 Lebensmittel ·
10 Getränke/Küche · 11 Einkaufen/Geld · 12 Kleidung · 13 Körper/Sinne · 14 Gesundheit · 15 Gefühle/
Eigenschaften · 16 Tagesablauf · 17 Verben I (Bewegung) · 18 Verben II (Denken/Sprechen) ·
19 Adjektive/Gegensätze · 20 Stadt/Gebäude · 21 Position/Präpositionen · 22 Verkehr/Reisen/Hotel ·
23 Schule · 24 Universität · 25 Arbeit/Beruf · 26 Technik/Internet · 27 Natur/Wetter · 28 Tiere/
Pflanzen · 29 Freizeit/Sport/Kultur · 30 Fragewörter/Konnektoren/Funktionswörter.

### Akzeptanzkriterien des Gesamtauftrags (Referenz, 26 Punkte — Details siehe Auftrag Abschnitt 30)

Kern u. a.: `npm test`/`npm run lint`/`npm run validate:course` funktionieren; Kurs 1 als
eigenständiges Paket installierbar und unabhängig von späteren Kursen nutzbar; genau 900
Vokabeleinträge, alle 141 Alt-IDs erhalten, ~759 neue; genau 10 neue Wörter pro Session; echter
Theorieteil vor jeder Session; kein Session-Durchlauf mit allen 900 Wörtern gleichzeitig; jedes
Wort in mehreren Fähigkeiten gelernt; Review Queue funktioniert wirklich; Fehler erscheinen
innerhalb derselben Session erneut; Hilfen passen sich automatisch an; mehrere richtige
Übersetzungen werden akzeptiert; Fortschrittsbalken und Session-Wiederaufnahme funktionieren;
freier Übungsmodus funktioniert; Tastatur-Lernstufen vorhanden; nur Einzelwort-Audio
vorausgesetzt, langsame Wiedergabe ohne zweite Aufnahme möglich; Kursdaten nie unsicher über
`innerHTML`; GitHub Actions/LICENSE/CONTRIBUTING tatsächlich vorhanden; README/ROADMAP führen
nur getestete Funktionen als fertig auf.

---

## 8. Entwicklungsauftrag 4: Neues Interface und echte Lernphase vor jeder Abfrage (vom Nutzer, 2026-08-06)

Nach Meilenstein A+B (Entwicklungsauftrag 3) hat der Nutzer einen vierten Auftrag geliefert:
ein vollständig überarbeitetes Interface (Navigation, Kursansicht, Designsystem) UND die
bisher bewusst zurückgestellte generische Session Engine — diesmal mit dem expliziten Auftrag,
sie tatsächlich zu bauen, TheoryRenderer real anzuschließen und eine echte Lernphase (Wörter
kennenlernen, dann erst abfragen) vor jede Abfrage zu setzen. Grund für das Zurückstellen der
Engine im letzten Auftrag (kein reales Session-Datenmodell, gegen erfundene Beispieldaten
entwerfen) entfällt hiermit explizit: der Nutzer verlangt jetzt den Zusammenbau, zunächst mit
EINER Pilot-Session aus den 9 vorhandenen "Begrüßung"-Vokabeln (`greetings`-Kategorie in
`vocabulary.json`), nicht mit erfundenen Daten.

**Explizite Arbeitsanweisung für diese Runde:** ausschließlich Schritt 1-4 (UI-Grundgerüst,
Kurs-/Unit-Ansichten, Session Engine, Theorie-Integration), demonstriert an GENAU EINER
Pilot-Session ("Begrüßung und Höflichkeit"/`vocab_unit_01_a`, 9 vorhandene Wörter — es gibt in
der `greetings`-Kategorie keine 10, "verbleibende Session darf weniger als zehn Wörter
enthalten" deckt das ab). Die beiden weiteren Pilot-Units (Familie, Zuhause) sowie 759 neue
Vokabeln folgen explizit erst nach erfolgreicher Demonstration dieser einen Session.

### Schritt 1 — UI-Grundgerüst

- ☑ Designsystem: semantische CSS-Variablen (`--bg-primary`/`--bg-secondary`/`--surface`/
  `--surface-hover`/`--border`/`--text-primary`/`--text-secondary`/`--accent`/`--accent-hover`/
  `--success`/`--warning`/`--error`/`--info`), Hell-/Dunkel-/Systemmodus tatsächlich
  angewendet+gespeichert (`App.applyTheme`, geprüft in `test/unit/appShell.test.js`)
- ☑ Typografie-Skala (Seitentitel/Abschnittsüberschrift/Normaltext/Hilfetext/arabisches
  Hauptwort 2.5-3.25rem/arabisches Beispiel 1.7-2.2rem), ausreichende Zeilenhöhe für
  Vokalzeichen
- ☑ Neue Hauptnavigation: nur Start/Kurs/Wiederholen/Frei üben/Fortschritt/Einstellungen,
  ein-/ausklappbare Seitenleiste (eingeklappt nur Symbole), lokale SVG-/CSS-Symbole statt
  Emoji als primäre Navigationssymbole (geprüft: `test/unit/appShell.test.js` liest
  `index.html` statisch aus, prüft genau die 5 Haupteinträge + Einstellungen im Footer)
- ☑ Kopfzeile mit Breadcrumbs, Seitentitel, optionalem Zurück-Button, aktuellem Kurs,
  kompaktem Fortschritt — sicher gerendert (kein `innerHTML` mit dynamischen Texten, geprüft
  inkl. eines absichtlich HTML-artigen Breadcrumb-Labels in `test/unit/appShell.test.js`)
- ☑ Wiederverwendbare Komponentenklassen (Seitenkopf, Breadcrumbs, Kurskarte, Unit-Karte,
  Session-Karte, Statistik-Karte, Status-Badge, Wortkarte, Theoriekarte, Aktionsleiste, Dialog,
  Tooltip, Tab-Leiste, Leer-/Lade-/Fehlerzustand) statt Inline-Styles in JS

### Schritt 2 — Kurs- und Unit-Ansichten

- ☑ Eigenständige Kursansicht (ersetzt die dauerhaft ausgeklappte Lesson-Liste): Kurskopf
  (Titel, Beschreibung, Fortschrittsbalken, gelernte Wörter, abgeschlossene Units, fällige
  Wiederholungen), Units als Karten/Lernroute mit Status (gesperrt/verfügbar/begonnen/
  abgeschlossen/Wiederholung empfohlen) — `src/js/views/courseView.js`, geprüft in
  `test/unit/courseView.test.js`
- ☑ Unit-Detailansicht mit Session-Karten (Theorie/Lernphase/Übungsphase/Abschlussstatus
  getrennt sichtbar) — `src/js/views/unitDetailView.js`, geprüft in
  `test/unit/courseView.test.js`

### Schritt 3 — Session Engine

- ☑ `src/js/session/` mit den vorgeschlagenen Modulen (sessionEngine, sessionController,
  sessionRenderer, sessionQueue, sessionState, phaseRegistry, exerciseRegistry) — nutzt
  vorhandene Bausteine (TheoryRenderer, HelpLevel, VirtualKeyboard, ReviewScheduler,
  ExerciseGuard, AudioPlayer, srs.js, AppState)
- ☑ Sessions rein datenbasiert (siehe Datenschema Auftrag Abschnitt 14: `theory_id`,
  `new_word_ids`, `review_count`, `phases[]`, `completion_rules`) — `vocabSessions.json`
- ☑ Phasenreihenfolge erzwungen: Theorie (beim ersten Durchlauf verpflichtend) → Wortvorschau
  → Wiedererkennen → Rekonstruieren → Geführte Produktion → Selbstständige Produktion →
  Anwendung → Abschluss — kein neues Wort erscheint zuerst in einer Produktionsphase (geprüft
  im vollständigen Durchlauf in `test/unit/sessionController.e2e.test.js`)
- ☑ Manuelles "Weiter" statt automatischem Wechsel nach 900/1400ms bei normalen Lernaufgaben
  (`SessionRenderer.renderContinueButton`, kein `setTimeout`-Auto-Advance)

### Schritt 4 — Theorie integrieren

- ☑ TheoryRenderer wird von der Session Engine tatsächlich aufgerufen (nicht mehr nur
  isoliert getestet) — `SessionController.renderTheoryPhase()`/`renderTheoryReview()`
- ☑ Jederzeit erreichbare "Theorie ansehen"-Schaltfläche während der Session, ohne
  Sessionfortschritt zu verlieren (geprüft: dritter Test in
  `test/unit/sessionController.e2e.test.js`)
- ☑ Pilot-Theorietext "Begrüßung und Höflichkeit" (`content_status: needs_language_review`):
  echte Erklärung (Unterschied Einzelwort/fester Ausdruck, RTL-Lesung, Kontextabhängigkeit,
  kurze Antwortmöglichkeiten) statt reiner Aufgabenankündigung
- ☑ Mini-Check wird gespeichert (`AppState.markTheoryMiniCheckResult`, bereits vorhanden)

**Verifikation der Schritte 1-4 (Ende-zu-Ende-Demo bestanden):** Die geforderte Kette
Startseite → Kurs öffnen → Unit öffnen → Session öffnen → Theorie lesen → Mini-Check → zehn
(hier: neun) Wörter kennenlernen → Erkennungsaufgaben → geführte Eingabe → selbstständige
Eingabe → Abschluss läuft nachweislich vollständig durch (`test/unit/sessionController.e2e.test.js`,
3/3 bestanden). Dabei wurden zwei echte Fehler gefunden und behoben:

1. **Test-Infrastruktur:** `test/helpers/domStub.js`s `FakeElement` hatte kein `firstChild` und
   kein `removeChild` — das überall verwendete Muster
   `while (el.firstChild) el.removeChild(el.firstChild)` war dadurch ein stiller No-op (Klicks
   schienen wirkungslos, weil sich alte und neue Ansicht unbemerkt überlagerten). Behoben durch
   Ergänzung von `firstChild`/`lastChild`/`nextSibling`/`previousSibling`/`removeChild`/`remove()`
   sowie eines `childNodes`-Alias auf `children`.
2. **Echter Anwendungsfehler** in `sessionController.js`s `renderGradedPhase()`: die Prüfung
   `if (!engine.currentTask())` zum Entscheiden "Warteschlange dieser Phase neu starten?" war
   mehrdeutig — `currentTask()` liefert sowohl VOR dem ersten Start als auch NACH dem letzten
   erledigten Task `null`. Dadurch begann die letzte Aufgabe einer "graded" Phase (z. B.
   Wiedererkennen) die komplette Phase von vorn, statt zur nächsten Phase (Rekonstruieren)
   weiterzuschalten. Behoben durch eine neue, eindeutige `engine.hasStartedQueue()`.

Zusätzlich zum e2e-Test wurden `test/unit/courseView.test.js` (CourseView/UnitDetailView),
`test/unit/appShell.test.js` (Hauptnavigation, Breadcrumbs, Sidebar-Ein-/Ausklappen, Theme) und
`test/unit/settings.test.js` (Einstellungen wirken sofort, werden gespeichert, bleiben nach
erneutem Öffnen erhalten) ergänzt. Gesamtstatus: `npm test` 199/199 (+ 1 Integrationstest)
grün, `npm run lint` 0 Kollisionen, `npm run validate:course` 0 Fehler.

### Bewusst nicht Teil dieser Runde (siehe Auftrag Abschnitt 27)

759 neue Vokabeln, volle 900er-Erweiterung, automatische Massen-Audioerzeugung, alle 30
Wortschatz-Units, Kurs-2-Inhalte, komplexe neue Grammatik, Cloud-Dienste. Ebenfalls erst nach
dieser Demonstration: die zwei weiteren Pilot-Units (Familie und Personen; Zuhause und Räume),
Schritt 5-8 (weitere Pilot-Units, Übungsoberflächen-Feinschliff, freies Üben neu gestalten,
vollständige Tests/Doku für den Gesamtauftrag).

### Akzeptanzkriterien dieser Runde (Auszug aus den 24 Punkten in Auftrag Abschnitt 26)

U. a.: Seitenleiste zeigt nicht mehr dauerhaft alle Units; eigenständige Kursansicht
existiert; Units als Karten/Lernroute; Sessions klar getrennt sichtbar; Breadcrumbs vorhanden;
TheoryRenderer tatsächlich im normalen Ablauf verwendet; echter Theorietext vor der Session;
Nutzer lernt die Wörter zuerst kennen, bevor produziert werden muss; kein neues Wort zuerst
frei geschrieben; Feedback verschwindet nicht automatisch vor einem Klick auf "Weiter";
Session-Wiederaufnahme funktioniert; alle bisherigen Tests bestehen weiterhin; neue Tests
bestehen; `npm test`/`npm run lint`/`npm run validate:course` erfolgreich; README/ROADMAP
nennen nur tatsächlich getestete Funktionen als fertig.

---

## 9. Entwicklungsauftrag 5: Lernfluss fertigstellen, Interface verbessern und Pilotkurs vervollständigen (vom Nutzer, 2026-08-07)

Fünfter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 4 aufbauend: die dort gebaute Session
Engine funktionierte zwar durchgehend, aber mit mehreren inhaltlichen Schwächen (Wortvorschau
prüfte nicht wirklich jedes Wort, Sessions konnten weit über 50 Aufgaben erzeugen, Wiederaufnahme
war nicht exakt, Dashboard/Theorie-Mini-Check/Freies-Üben waren nicht fertig überarbeitet, nur
eine von drei geplanten Pilot-Units existierte). Ziel dieser Runde: den Lernablauf mit den
vorhandenen 141 Wörtern so weit fertigstellen, dass er sich anschließend ohne Umbau auf 900
Wörter skalieren lässt — **explizit noch ohne die 759 neuen Vokabeln zu erzeugen.**

### Kernänderungen an der Session Engine (Abschnitte 3-12+26)

- **`src/js/session/sessionCoverageTracker.js`** (neu): verfolgt je Wort `preview_seen`,
  Versuche/Treffer je Phasentyp, Fehler und Hilfeeinsatz. Ein Wort gilt jetzt erst als
  "kennengelernt" (`exposed`), wenn es SOWOHL gezeigt ALS AUCH mindestens einmal aktiv
  wiedererkannt wurde (Mini-Check oder Wiedererkennen-Phase) — reines Rendern eines
  Kartenrasters setzt `exposed` nicht mehr (behebt den in Abschnitt 3 beschriebenen Fehler).
- **`sessionQueue.js`**: ein Wort darf jetzt mehrfach wiederholt werden (`max_repeats_per_word_per_phase`,
  Standard 3), statt nur einmal — mit fester Obergrenze gegen Endlosschleifen.
- **`sessionEngine.js`** (grundlegend erweitert): jede "graded" Phase bekommt nur noch eine anhand
  der empfohlenen Verteilung berechnete Wortauswahl (`recommendedCount()`: bei zehn Wörtern 6
  Wiedererkennen / 5 Rekonstruieren / 5 geführt / 8 selbstständig / 4 Anwendung = 28 Kernaufgaben,
  passend zum geforderten 28-38-Bereich statt vorher >50). Geführte und selbstständige Produktion
  garantieren gemeinsam trotzdem die volle Wortabdeckung über eine feste (nicht-zufällige)
  Baseline-Aufteilung. Aufgaben-Warteschlangen werden je Phase EINMAL gebaut und danach
  unverändert im Snapshot gespeichert (`phaseQueues`) — Wiederaufnahme mischt nicht neu, sondern
  stellt exakt dieselbe Reihenfolge/Position/geplante Wiederholung wieder her (getestet). Fällige
  Wiederholungswörter aus früheren Sessions (`review_count`, über `ReviewScheduler.buildQueue`
  ausgewählt, priorisiert überfällig > häufig falsch > niedrige Beherrschung) werden in
  Wiedererkennen/Anwendung eingemischt. Bewertung ist jetzt gewichtet (`weightedScorePercent()`:
  Theorie/Lernen 0 %, Wiedererkennen 15 %, Rekonstruieren 15 %, geführt 20 %, selbstständig 35 %,
  Anwendung 15 %) statt eines einfachen Verhältnisses — frühe formative Fehler wirken sich dadurch
  weniger stark aus als spätere sichere Produktion.
- **Tageslimit tatsächlich verwendet**: `AppState.incrementDailyNewCount()` wird jetzt beim
  allerersten Zeigen eines neuen Worts aufgerufen (nicht bei Wiederholung/erneutem Öffnen/
  Wiederaufnahme). Bei knappem Tageslimit zeigt `sessionController.js` vor Sessionbeginn eine
  Wahlmöglichkeit ("Dein Tagesziel sind noch N neue Wörter" → "N Wörter lernen" oder "Trotzdem
  alle M lernen") statt eines harten Zwangs.

### Neue Wortlernphase (Abschnitte 4-5)

`sessionController.js`s Wortlernphase wurde komplett ersetzt: Einzelansicht ("Wort X von N") ist
jetzt Standard statt eines Kartenrasters, mit Anhören/Langsam anhören/Schreibweise verbergen/
Übersetzung verbergen/Noch einmal zeigen/Kenne ich schon sowie einem Umschalter "Alle Wörter
anzeigen" für die weiterhin verfügbare Rasteransicht. Wörter werden in Dreiergruppen gelernt,
jede Gruppe endet mit einem leichten Mini-Check (zufällig eine von vier Varianten: Arabisch→
Deutsch, Deutsch→Arabisch, Audio→Wort, Wort→Audio — noch keine freie Tastatureingabe), der
GARANTIERT jedes Wort der Gruppe genau einmal abfragt.

### Theorie-Mini-Check überarbeitet (Abschnitt 15)

`theoryRenderer.js`s `renderMiniCheck()`: kein automatischer 600-ms-Wechsel mehr, nach jeder
Antwort erscheint erklärendes Feedback ("Noch nicht. X bedeutet Y.") und ein manuelles "Weiter".
Am Ende erscheint eine Zusammenfassung ("X von Y richtig") mit "Noch einmal ansehen"/"Mit den
Wörtern starten" statt direkt fortzufahren. Neue Option `requireMiniCheckBeforeStart`: beim
ERSTEN Sessiondurchlauf bleibt "Session starten" deaktiviert, bis der Mini-Check vollständig
(nicht zwingend richtig) bearbeitet wurde; beim erneuten Ansehen mitten in einer Session bleibt
er weiterhin optional.

### Dashboard, Sessionübersicht, Abschlussbild (Abschnitte 13، 14, 25)

- `dashboard.js`: die Hauptaktion führt jetzt bei einer aktiven Session DIREKT zur Session
  (`App.navigateToSession`, mit Unit/Session-Titel, aktueller Phase, Aufgabenfortschritt), statt
  wie vorher immer in den freien Übungsmodus. Ohne aktive Session wird die nächste noch nicht
  abgeschlossene Vokabel-Session vorgeschlagen. "Fällige Wiederholungen"/"Frei üben" bleiben als
  Zusatzaktionen erreichbar. Sicher gerendert (`createElement`/`textContent`).
- `sessionController.js`: neue Sessionübersicht (Titel, Wort-/Wiederholungsanzahl, geschätzte
  Dauer, "Heute lernst du", Ablauf-Übersicht) erscheint jetzt VOR der Theorie, mit "Session
  starten"/"Theorie ansehen"/"Zurück" bzw. bei Wiederaufnahme "Session fortsetzen"/"Von vorne
  beginnen".
- Abschlussbild zeigt jetzt "X von Y Wörtern sicher erkannt", "X von Y selbstständig
  geschrieben", eine Liste schwieriger Wörter mit Fehleranzahl und "Noch einmal anhören", sowie
  "Schwierige Wörter wiederholen"/"Zur Unit"/"Nächste Session"-Buttons.

### Aktionsleiste, Hilfestufen, Anwendung, flexible Antworten (Abschnitte 9/18/19/24)

Die Aktionsleiste ist jetzt vereinheitlicht: während einer Eingabeaufgabe links Hilfe/Audio,
rechts Prüfen (nur wenn die Aufgabe tatsächlich einen Prüfschritt braucht — Multiple-Choice
committet weiterhin per Klick); nach der Antwort links Audio erneut/Fehler erklären, rechts
Weiter. `exerciseRegistry.js`s `APPLICATION_CONTEXT`-Map mit hart codierten Begrüßungs-Wort-IDs
wurde entfernt — Anwendungsaufgaben nutzen jetzt `word.application_prompts` aus den Kursdaten,
funktioniert dadurch auch für Familie/Zuhause und später alle 900 Wörter. `evaluateAgainstAny()`
wird jetzt in echten Sessionaufgaben verwendet (`word.german_answers`/`accepted_arabic_answers`).
Hilfestufen A-E (`helpLevel.js`, bereits vorhanden) steuern jetzt tatsächlich Vokalzeichen/
Umschrift/Übersetzung in den Übungen, nicht mehr nur die Tastaturstufe. Einstellungen
(`showDiacritics`, `showTransliteration`, `autoPlayWord`, `replayAfterAnswer`, `slowPlayback`,
`autoAdvanceAfterFeedback`) werden jetzt tatsächlich in Sessions gelesen — automatisches Weiter
greift dabei NIE bei ausführlichem Fehlerfeedback, nur bei richtigen Antworten.

### AudioPlayer, freier Übungsmodus, Kursansicht (Abschnitte 20/22/27)

- `audioPlayer.js`: `currentAudio` verhindert Überlagerung (neue Wiedergabe stoppt immer zuerst
  eine laufende); langsame Wiedergabe bevorzugt eine eigene `*_slow.wav`, fällt ohne diese auf
  die normale Aufnahme mit `playbackRate=0.75` zurück statt sofort auf TTS auszuweichen —
  spätere 900-Wort-Erweiterung braucht dadurch nur eine Aufnahme pro Wort. `speak()` löst mit
  `{source:'audio'|'tts'}` auf.
- `freePractice.js`: komplett neue Startansicht mit sechs Schnellstartkarten (Fällige
  Wiederholungen/Schwierige Wörter/5 Minuten üben/Schreibtraining/Hörtraining/
  Verbindungstrainer) statt langer Checkboxlisten; "Übung anpassen" öffnet eine einklappbare
  erweiterte Auswahl mit Chips (`.chip`/`.chip-group`, bereits in Auftrag 4 vorbereitet, jetzt
  erstmals genutzt) statt Checkboxen, inkl. sichtbarer Zusammenfassung vor dem Start.
- `courseView.js`: die Lernroute ist jetzt in "Teil A — Arabische Schrift" und "Teil B —
  Grundwortschatz" getrennt, mit je eigenem Fortschritt und Einklappen/Ausklappen-Button, statt
  eines einzigen unstrukturierten Blocks.

### Zwei weitere Pilot-Units (Abschnitt 16)

`language-packs/arabic/vocabulary.json` um `german_answers`/`accepted_arabic_answers`/
`application_prompts` für alle 25 Pilot-Wörter (Begrüßung + Familie + Zuhause) erweitert (`arabic`/
`german` bleiben unverändert für Rückwärtskompatibilität). Neue Vokabel-Units in
`vocabSessions.json`: **Familie und Personen** (`vocab_unit_02`, 8 Wörter — bewusst keine
künstlichen Wörter nur um zehn zu erreichen) und **Zuhause und Räume** (`vocab_unit_03`, 8
Wörter), je mit vollständiger Theorie (`content_status: needs_language_review`) nach den in
Auftrag 5 vorgegebenen Inhalten (Genus/ة-Endung/gebrochene Pluralformen bei Familie; Haus/Raum/
Gegenstand-Unterscheidung, Buchstabenverbindung an بَاب, Vorschau auf هذا/هذه bei Zuhause).

**Beim Testen gefunden und behoben:** vier der 25 Pilot-Wörter (`family_father`, `family_mother`,
`family_brother`, `family_sister`) enthalten Hamza-Formen (أ/أُ), die NICHT zu den 28
Grundbuchstaben in `keyboard.json` gehören (die Hamza-Formen liegen in der separaten
Sonderzeichen-Reihe der virtuellen Tastatur) — `lettersFromWord()` gab dafür `null` zurück, und
die Rekonstruktionsaufgabe degenerierte zu einer sinnlosen Ein-Kachel-Aufgabe. Behoben in
`exerciseRegistry.js`s `tokensForReconstruction()`: bei fehlender Buchstabenzuordnung wird jetzt
zeichenweise statt wortweise zerlegt.

### Theorie für Schrift-Units 1, 2 und 8 (Abschnitt 17)

Neue Theoriedokumente `theory_unit_1` (ا د ذ ر ز و — keine Weiterverbindung nach links),
`theory_unit_2` (ب ت ث ن ي — gemeinsame Grundform, Punkte als Unterscheidungsmerkmal) und
`theory_short_vowels` (Fatḥa/Kasra/Ḍamma/Sukūn/Schadda) in `theory.json`, `content_status:
needs_language_review`. `letterGroupLesson.js`/`vocalization.js` zeigen sie jetzt VOR der
bestehenden Übungsphasenfolge (Suche nach `theory_${unitId}` bzw. `theory_short_vowels`), ohne
die bestehende 9-Phasen-Lesson selbst zu verändern; ohne passendes Theoriedokument bleibt das
bisherige Verhalten (direkter Einstieg) unverändert. `lessons.json`s kurze `intro`-Texte für
diese drei Units waren bereits reine Ablaufbeschreibungen und mussten nicht geändert werden.
Die verbleibenden 5 Schrift-Units (3-7) haben noch keine Theorie — bewusst zurückgestellt.

### Repository-Zustand geprüft (Abschnitt 28)

`.gitignore` und `.github/workflows/build.yml` existieren beide bereits im Repository (aus einer
früheren Runde) und sind korrekt — `node_modules/` ist per `.gitignore` ausgeschlossen und laut
`git ls-files` in keinem Commit enthalten. Eine ZIP-Datei, die dennoch `node_modules` enthält,
kann nur durch direktes Zippen des Arbeitsordners statt eines Git-basierten Exports entstanden
sein. **Korrekte Release-Erstellung:** `git archive --format=zip -o release.zip HEAD` (nimmt
automatisch nur versionierte Dateien) oder, falls doch der komplette Ordner gezippt wird, vorher
`node_modules/`, `dist/`, `.git/` explizit ausschließen.

### Tests

Neue/aktualisierte Testdateien: `sessionEngine.test.js`, `sessionCoverageTracker.test.js`,
`sessionQueue.test.js` (neu, reine Logiktests mit synthetischen Daten), `sessionController.e2e.test.js`
(komplett neu geschrieben: Sessionübersicht, Theorie-Mini-Check-Pflicht, Gruppenlernen mit
Mini-Checks, exakte Wiederaufnahme via Snapshot-Vergleich, Tageslimit-Wahlmöglichkeit, sowie
vollständige Durchläufe aller drei Pilot-Units mit einem korrekt antwortenden Test-Bot),
`theoryRenderer.test.js` (Mini-Check ohne Auto-Advance, erklärendes Feedback,
`requireMiniCheckBeforeStart`-Gating), `dashboard.test.js` (Haupt-Button-Priorisierung),
`courseView.test.js` (Teil-A/Teil-B-Trennung), `freePractice.test.js` (Schnellstartkarten/Chips),
`audioPlayer.test.js` (neu: Überlagerungsschutz, Slow-Fallback), `scriptUnitTheory.test.js` (neu:
Theorie vor Schrift-Units). **Gesamtstatus:** `npm test` 239/239 Unit-Tests grün (+ 1
Integrationstest, bedingt übersprungen ohne Backup-Fixture), `npm run lint` 0 Kollisionen,
`npm run validate:course` 0 Fehler.

### Bewusst nicht Teil dieser Runde (siehe Auftrag Abschnitt 31/32)

759 neue Vokabeln, volle 900er-Erweiterung. Migration der restlichen 116 vorhandenen Wörter auf
das neue Session-/Theory-Modell (folgt erst, wenn die drei Pilot-Units sich bewährt haben).
Theorie für Schrift-Units 3-7. Inhaltliche Prüfung durch eine Person mit Arabischkenntnissen
(alle `needs_language_review`-Texte).

### Akzeptanzkriterien dieser Runde (Auszug aus den 31 Punkten in Auftrag Abschnitt 33)

Alle drei Pilot-Units funktionieren vollständig mit echter Theorie; jedes neue Wort wird vor
einer aktiven Abfrage kennengelernt und erhält mindestens einen leichten Erkennungscheck; zehn
neue Wörter erzeugen nicht mehr automatisch über 50 Aufgaben (Kernsession bei zehn Wörtern genau
28 Kernaufgaben); fällige Wörter werden automatisch eingemischt (`review_count` tatsächlich
verwendet); Tageslimit wird tatsächlich gezählt; aktive Session wird vom Dashboard direkt
fortgesetzt; Sessionresume bewahrt die exakte Warteschlange (getestet); Fehlerwiederholungen
bleiben über Neustarts erhalten und sind auf 3 begrenzt; Hilfestufen A-E beeinflussen mehr als
die Tastatur; flexible Übersetzungen werden in echten Sessionaufgaben benutzt;
Application-Aufgaben sind nicht mehr auf Begrüßungs-IDs hart codiert; Theory-Mini-Check hat
erklärendes Feedback ohne 600-ms-Auto-Advance; freie Übung hat die neue kompakte Oberfläche;
Audio überlagert sich nicht und langsame Wiedergabe funktioniert ohne separate Datei;
Kursansicht trennt Schrift und Wortschatz visuell; `node_modules` ist nicht Teil des
Git-Repositorys; `.gitignore` ist vorhanden; `npm test`/`npm run lint`/`npm run validate:course`
sind erfolgreich.
sind erfolgreich.

---

## 10. Entwicklungsauftrag 6: Kurs 1 von 141 auf 900 Vokabeln ausbauen (vom Nutzer, 2026-08-08)

Sechster Entwicklungsauftrag: den kompletten Grundwortschatz von 141 auf die im ursprünglichen
Pflichtenheft vorgesehenen 900 Vokabeln (30 Vokabel-Units à 30 Wörter / 90 Sessions à 10 Wörter)
ausbauen, inklusive Datenmodell, Theorie, Sprachprüfvorbereitung und Audio-Vorbereitung — in
kontrollierten Batches statt einem einzigen ungeprüften Sprung. Grundlage: die vom Nutzer
gelieferte Datei `kurs1_900_wortplan.json` (30 Units, bestehende + 759 neue Wort-IDs, Session-
Gruppierung).

Auftragsgemäß umgesetzt in dieser Runde: **Meilenstein 1 + 2 + 3 (Batch 1, Units 1-5)** — die
explizit angeforderte "erste konkrete Arbeitsanweisung" aus Auftrag Abschnitt 32. Units 6-30
(Batches 2-6) folgen in weiteren Runden.

### Wichtig: Kodierungsfehler in den Nutzer-Quelldateien

Die vom Nutzer im Chat übergebenen Dateien `neue_vokabeln_759.md`, `neue_vokabeln_759.json` und
`kurs1_900_wortplan.json` kamen mit beschädigter Zeichenkodierung an (UTF-8-Bytes wurden auf dem
Transportweg als Latin-1 fehlinterpretiert — und zwar verlustbehaftet: Bytes im Bereich 0x80-0x9F
gingen dabei komplett verloren, nicht nur "vertauscht"). Ergebnis: deutsche Umlaute (ä/ö/ü) ließen
sich zuverlässig zurückrechnen (`Buffer.from(text, 'latin1').toString('utf8')`), "ß" ging dabei
aber vereinzelt komplett verloren (von Hand anhand des Wortbilds korrigiert, z. B. "Begrüßung").
Die arabischen Textteile waren dagegen NICHT zuverlässig rekonstruierbar — beim Test mit einem
tatsächlich aus der Konversation kopierten Abschnitt blieben nach dem Rückrechnen nur einzelne
Buchstaben übrig, der Rest wurde zu Ersatzzeichen (`�`). Die arabischen Formen wurden deshalb
**nicht** aus den beschädigten Dateien übernommen, sondern für diese Runde komplett neu erstellt
(Standard-MSA-Wortschatz für die jeweilige deutsche Bedeutung). Deutsche Bedeutungen, Wort-IDs,
Unit-Titel/-Reihenfolge und Session-Gruppierung (ASCII, von der Beschädigung nicht betroffen)
wurden dagegen 1:1 aus den Quelldateien übernommen. Details und die genaue Herleitung stehen im
Kommentarkopf von `scripts/data/kurs1UnitPlan.js`. Konsequenz: **alle** arabischen Angaben dieser
Runde (auch die mit vollem Datenmodell für Units 1-5) sind `content_status: "needs_language_review"`
und müssen vor Audioerzeugung von einer Person mit Arabischkenntnissen geprüft werden — siehe
`language-review/batch_01.json`.

### Meilenstein 1: restliche 116 Bestandswörter migriert

`scripts/build-kurs1-batch.js` migriert alle 141 bestehenden Wörter (unverändert IDs, unverändert
Audiobezug) auf das erweiterte Datenmodell aus Auftrag Abschnitt 3: `arabic_vocalized` (aus dem
bereits vokalisierten `arabic`-Feld übernommen), `arabic_unvocalized` (Diakritika programmatisch
entfernt, `scripts/build-kurs1-batch.js#stripDiacritics`), `german_answers`,
`accepted_arabic_answers`, `application_prompts` (die 25 bereits kuratierten Einträge bleiben
unverändert erhalten, nur die restlichen 116 bekommen automatisch generierte, aber inhaltlich
passende Kontext-Sätze je Themenkategorie), `content_status`, `unit_id`, `session_id`,
`audio_key`, `difficulty_level`. Genus/Plural/Umschrift waren im Bestand bereits fast vollständig
vorhanden und wurden nur ergänzt, nie überschrieben.

### Meilenstein 2: volle 30-Unit-/90-Session-Struktur

`vocabSessions.json` wird komplett aus der Wortplan-Struktur neu aufgebaut: 30 `vocab_units`
(Titel aus dem Wortplan) mit je 3 Sessions (`_a`/`_b`/`_c`) zu je 10 Wörtern — berechnet durch
simples Aufteilen von (bestehende Wort-IDs + neue Wort-IDs in Wortplan-Reihenfolge) in 10er-Gruppen.
Das reproduziert exakt die im Wortplan vorgegebene Session-Zuordnung (verifiziert), ohne dass die
90 Wortlisten von Hand abgetippt werden mussten. Die drei bisherigen Pilot-Units behalten ihre
Unit-IDs; Session `_a` jeder dieser drei Units enthält weiterhin zuerst die alten Wörter in
unveränderter Reihenfolge, danach das erste neue Wort — kein bestehender Sessionfortschritt wird
dadurch ungültig. Für alle 759 neuen Wörter wurden Kategorien in `vocabulary.json` ergänzt: Units
1-5 mit vollem Datenmodell (siehe Meilenstein 3), Units 6-30 zunächst mit den für diesen
Meilenstein geforderten Minimalfeldern (ID, deutsche Bedeutung(en), unvokalisierte arabische
Form, `content_status`, Unit-/Session-Zuordnung, `audio_status: "missing"`) — bewusst noch ohne
Vokalisierung/Umschrift/Grammatik, die folgt Batch für Batch. Für jede der 90 Sessions legt das
Skript ein Theoriedokument an; für Units 6-30 zunächst als klar als Platzhalter gekennzeichnetes
Dokument (`content_status: needs_language_review`, Hinweistext + `word_preview`), damit
`validate:course` nicht wegen fehlender Theorie hart fehlschlägt, aber niemand den Platzhalter für
fertige Theorie hält.

### Meilenstein 3 (Batch 1): Units 1-5 vollständig

Alle 115 neuen Wörter aus Units 1-5 (Begrüßung/Familie/Zuhause-Rest, Persönliche Angaben, Zahlen)
haben das volle Datenmodell inkl. Vokalisierung, Umschrift, Wortart, Genus/Plural (wo sinnvoll —
bei Präpositionen/Ländernamen/Verben bewusst nicht erzwungen) und individuell verfasste
`application_prompts`. Für alle 15 Sessions dieser fünf Units gibt es echte Theorie
(`scripts/apply-kurs1-theory-batch1.js`, Struktur laut Auftrag Abschnitt 8): 2-3 Lernziele,
"Kurz erklärt" (ca. 150-250 Wörter, geht auf die tatsächlichen 10 Wörter der Session ein statt
generischer Floskeln), "Mehr erfahren" (100-250 Wörter, oft als bewusste Grammatik-Vorschau ohne
volle Regeln, z. B. Iḍāfa-Konstruktion in Unit 3, nisba-Endung in Unit 4, Zahlen-Genus-Polarität
in Unit 5), ein Merke- und ein Typischer-Fehler-Hinweis, 3-4 Beispielsätze (bevorzugt nur mit
bereits bekanntem Wortschatz — unbekannte Wörter sind im `note`-Feld sichtbar markiert und
übersetzt statt vorausgesetzt), `word_preview` mit den 10 Wort-IDs, Mini-Check mit 3 Fragen. Die
drei bestehenden Pilot-Theoriedokumente (Unit 1/2/3, Session A) wurden idempotent um das jeweils
zehnte (neue) Wort ergänzt (ein zusätzlicher Absatz + ein zusätzliches Beispiel), ohne den
bestehenden, bereits funktionierenden Text zu ersetzen.

### Validierung erweitert

`scripts/validateCourse.js` bekam zwei Änderungen: (1) einen neuen harten Prüfblock für die
900-Wort-Zielstruktur — sobald 30 `vocab_units` existieren, muss jede Unit exakt 30 zugeordnete
Wörter haben und jedes zugeordnete Wort genau einer Session entsprechen (`word.session_id`
konsistent mit der tatsächlichen `new_word_ids`-Zuordnung); (2) fehlende Audiodateien sind für
Wörter mit `content_status: "needs_language_review"` nur noch ein Hinweis statt eines harten
Fehlers (Auftrag Abschnitt 15: keine Audioerzeugung vor Sprachprüfung) — für bereits sprachlich
geprüfte Wörter bleibt eine fehlende Audiodatei weiterhin ein harter Fehler, das Sicherheitsnetz
für den bestehenden Bestand bleibt also erhalten.

### Neue Dateien dieser Runde

- `scripts/data/kurs1UnitPlan.js`, `scripts/data/kurs1Units1to5.js`,
  `scripts/data/kurs1Units6to30.js`: die eigentlichen Wortplan-Daten (Unit-Titel, bestehende
  Wort-ID-Zuordnung, neue Wörter mit deutscher Bedeutung + arabischer Form, für Units 1-5
  zusätzlich das volle Datenmodell) — die "Single Source of Truth" für die Batches 2-6.
- `scripts/build-kurs1-batch.js`: wendet die Plandaten auf `vocabulary.json`/`vocabSessions.json`/
  `theory.json` (Platzhalter) an. Wiederholbar/idempotent.
- `scripts/apply-kurs1-theory-batch1.js`: die 12 vollständigen neuen Theoriedokumente + 3 Patches
  auf die bestehenden Pilot-Theoriedokumente für Units 1-5.
- `scripts/build-language-review-and-manifest.js`: erzeugt `language-review/batch_01.json` und
  aktualisiert `audio_generation_manifest.json` aus dem aktuellen Stand von `vocabulary.json`.
- `language-review/batch_01.json`: Sprachprüfdatei für die 115 neuen Wörter aus Units 1-5 (Format
  laut Auftrag Abschnitt 14).
- `audio_generation_manifest.json`: 115 Einträge, alle mit Status `pending_language_review` —
  bewusst NICHT `ready_for_generation`, da noch keine Sprachprüfung stattgefunden hat (Auftrag
  Abschnitt 16).

### Bestehende Tests angepasst statt gebrochen

Die drei Pilot-Sessions haben jetzt 10 statt 9/8/8 neue Wörter in Session `_a`, plus je zwei
weitere Sessions (`_b`/`_c`). Angepasst wurden ausschließlich Erwartungswerte, die sich direkt
aus dieser gewollten Datenänderung ergeben — keine Produktionslogik wurde für die Tests
verändert: `test/unit/courseView.test.js` (31 statt 4 Unit-Karten, 3 statt 1 Session-Karte für
Unit 1, angepasste Unit-Titel „Begrüßung, Höflichkeit und kurze Antworten“/„Familie, Beziehungen
und Personen“, "completed"-Badge braucht jetzt alle 3 Sessions statt einer) sowie
`test/unit/sessionController.e2e.test.js` (10 statt 9 neue Wörter/Tageslimit-Erhöhungen für Unit
1, 10 statt 8 für Unit 2/3).

```text
npm test:                238/239 Unit-Tests grün (1 bekannter, von dieser Runde unabhängiger
                          flakiger Test in sessionEngine.test.js, siehe "Bekannte Lücken" oben),
                          1 Integrationstest weiterhin übersprungen (unverändert)
npm run lint:             erfolgreich
npm run validate:course:  0 Fehler, 4 Hinweise (Schrift-Theorie Unit 3-7 noch offen, Units 6-30
                          noch Minimalmodell — beides für spätere Batches vorgesehen)
```

### Bewusst nicht Teil dieser Runde (siehe Auftrag Abschnitt 32/13)

Units 6-30 mit vollem Datenmodell und echter Theorie (Batches 2-6), tatsächliche Audioerzeugung
für die 759 neuen Wörter, Sprachprüfung durch eine Person mit Arabischkenntnissen,
Verwechslungsgruppen/Gegensatzpaare/Wortfamilien (`confusion_group`/`opposite_id`/`root`),
"Warum merke ich mir das Wort nicht?"-Funktion, "Deine schwierigen Wörter"-Dashboard-Karte,
dauerhaft erreichbare Theorie außerhalb der Session, Theorie für die restlichen Schrift-Units,
erweiterte Duplikat-/Homonym-Erkennung im Validator, `.arabiccourse`-Paketformat,
`npm run package:source`, reproduzierbarer Migrationstest (`progressMigration.test.js`
weiterhin übersprungen).

### Akzeptanzkriterien dieser Runde (Auszug — bezogen auf Auftrag Abschnitt 31, soweit für
Meilenstein 1-3 relevant)

Alle 141 bestehenden Wort-IDs unverändert und migriert; keine bestehende Wort-ID verloren; 759
neue Wort-IDs vorhanden (davon 115 mit vollem Datenmodell); genau 900 Einträge insgesamt; 30
Vokabel-Units mit je exakt 30 Wörtern; 90 Sessions mit je 10 Wörtern; alle 15 Sessions aus Units
1-5 haben echte, zugeschnittene Theorie statt Boilerplate; Beispiele markieren unbekannten
Wortschatz statt ihn vorauszusetzen; jedes neue Wort trägt `needs_language_review`; kein
ungeprüftes Wort wird als sprachlich endgültig bezeichnet; fehlendes Audio für neue Wörter führt
nicht zum Absturz und nicht zum harten Validierungsfehler; Audio-Generierungsmanifest vorhanden
und korrekt als "noch nicht freigegeben" markiert; `npm test`/`npm run lint`/
`npm run validate:course` erfolgreich (bis auf den dokumentierten, vorbestehenden Flaky-Test).

---

## 11. Entwicklungsauftrag 7: Kurs 1 inhaltlich vervollständigen und technische Restfehler beseitigen (vom Nutzer, 2026-08-08)

Siebter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 6 aufbauend: zwei technische
Restfehler beheben (zufallsabhängiger Test, übersprungener Migrationstest), den Kursvalidator von
einer pauschalen "erweitertes Modell: X/900"-Zahl auf drei klar unterschiedene
Vollständigkeitsstufen umstellen, und **Batch 2** (Units 6-10, 150 Wörter/15 Sessions) auf
dasselbe vollständige Niveau wie Batch 1 (Units 1-5, Entwicklungsauftrag 6) heben — wieder in
kontrollierten Batches, danach stoppen und erst nach erfolgreicher Prüfung mit Units 11-15
fortfahren.

### Schritt 1: technische Restfehler behoben

**Flaky Test.** Ursache war NICHT reiner Zufall, sondern eine echte Kombination aus zwei
Faktoren: `SessionEngine.selectWordsForPhase()` wählt für "graded" Phasen bewusst nur einen Teil
aller Wörter aus (`RECOMMENDED_RATIO`, z. B. 0.6 bei `recognition`) — bei 5 Test-Wörtern also nur
3 von 5, zufällig gemischt. Der Test nahm an, dass `words[0]` (sein "immer falsch beantwortetes"
Zielwort) IMMER in dieser Auswahl landet — tat es aber nur mit ~60 % Wahrscheinlichkeit. Behoben
durch zwei unabhängige Maßnahmen: (1) `src/js/session/randomProvider.js` (neu) — ein
injizierbarer Zufallszahlengenerator (`RandomProvider.create(seed)`, mulberry32-PRNG; ohne Seed
weiterhin `Math.random`, produktives Verhalten unverändert). `SessionQueue.pickRandomOrder()`/
`.create()`/`.scheduleRepeat()` und `SessionEngine.create()` akzeptieren jetzt optional eine
`rng`-Funktion. (2) Der Test selbst wählt sein Zielwort jetzt aus der TATSÄCHLICH gebauten
Warteschlange (`engine.currentTask().wordId`) statt eine feste Annahme zu treffen — das behebt
die Ursache unabhängig vom Seed. Zusätzlicher Regressionstest über 50 verschiedene Seeds.
**Verifiziert:** `npm test` zehnmal hintereinander ausgeführt, 10/10 erfolgreich (vorher:
gelegentliches Fehlschlagen, siehe Abschnitt 3 "Bekannte Lücken" der letzten Runde).

**Migrationstest.** `test/integration/realProgressMigration.test.js` hing von einer lokalen
Sicherheitskopie einer echten `progress.json` ab (`skip`, wenn nicht vorhanden — in CI immer).
Umbenannt zu `test/integration/progressMigration.test.js`, läuft jetzt IMMER gegen anonymisierte,
selbst erstellte Fixtures unter `test/fixtures/` (keine echten Nutzerdaten):
`progress_v1.json` (unversioniertes Alt-Format), `progress_v2.json` (aktuelles Format,
`_version: 1`), `progress_v3.json` (simuliertes KÜNFTIGES Format mit `_version: 2`, testet dass
`migrateProgress()` unbekannte künftige Versionen übernimmt statt zu verwerfen),
`progress_corrupted.json` (absichtlich kaputtes JSON, testet die `.bak`-Fallback-Logik von
`readJsonFileSafe()` inkl. Erzeugung einer echten temporären `.bak`-Datei und Prüfung, dass die
intakte Sicherung statt der beschädigten Hauptdatei geliefert wird). 6 Tests, kein `skip` mehr.

### Schritt 2: Kursvalidator — drei Vollständigkeitsstufen

Die alte Meldung "X von 900 Wörtern nutzen das erweiterte Modell" zählte ein Wort bereits mit,
sobald AUCH NUR EINES der Zusatzfelder vorhanden war — irreführend optimistisch. `scripts/
validateCourse.js` unterscheidet jetzt explizit:

```text
Minimalmodell:  id, arabic_unvocalized, german_answers, unit_id, session_id, content_status
Lernfähig:      + arabic_vocalized, transliteration, part_of_speech, accepted_arabic_answers
Vollständig:    + gender/plural (Feld muss existieren, auch als null, wenn geprüft und bewusst
                  nicht zutreffend — ein komplett fehlender Schlüssel zählt als "nicht bearbeitet"),
                  + mindestens ein application_prompt
```

Zusätzlich neu in `validateCourse.js`:
- **Homonym-/Duplikatbericht**: gruppiert alle Wörter nach `arabic_unvocalized` über die gesamte
  Vokabelliste (nicht nur pro Kategorie wie der bisherige harte Exact-Match-Check). Mehrere
  Wörter mit identischer unvokalisierter Schreibweise, aber OHNE übereinstimmenden
  `homonym_group`-Tag → WARNUNG (informativ). Mit übereinstimmendem Tag → INFO (bewusstes
  Homonym). Aktuell 3 bestätigte Fälle: ذهب (ذَهَبَ "er ging" / ذَهَب "Gold"), ظهر (ظُهْر "Mittag" /
  ظَهْر "Rücken"), من (مَنْ "wer" / مِنْ "von") — alle sechs betroffenen Wörter tragen jetzt ein
  passendes `homonym_group`-Feld.
- **Sprachprüfungs-Übersicht**: zählt alle 900 Wörter nach `content_status`, listet vorhandene
  `language-review/*.json`-Batches mit Wortanzahl, prüft `audio_generation_manifest.json` auf
  gültige Wort-Referenzen und darauf, dass kein Wort dort `ready_for_generation` ist, solange sein
  `content_status` noch `needs_language_review` ist.
- **Veraltete Meldung entfernt**: der Hinweis, langsame Wiedergabe über `playbackRate` sei "noch
  nicht umgesetzt", stimmte nicht mehr (das ist seit Entwicklungsauftrag 5 fertig, siehe
  `audioPlayer.js`/`audioPlayer.test.js`) — durch eine zutreffende Meldung ersetzt. Dieselbe
  Korrektur auch in dieser ROADMAP (Meilenstein F, Abschnitt 7 der alten Planung) und README
  nachgezogen.
- Ein neuer harter Prüfblock: sobald `is_placeholder`-Flag an einem Theoriedokument gesetzt ist
  (siehe unten), zählt der Validator "Session-Theorie (vollständig)" vs. "(Platzhalter)" getrennt
  — aktuell 30/90 vollständig, 60/90 Platzhalter.

### Schritt 3-5: Batch 2 (Units 6-10) vollständig

Gleiches Vorgehen wie Batch 1 (Entwicklungsauftrag 6): `scripts/data/kurs1Units6to10Full.js`
(vokalisierte Form, Umschrift, Wortart, Genus/Plural wo sinnvoll, individuelle
`application_prompts` für alle 132 neuen Wörter) + `scripts/upgrade-kurs1-units6to10.js` (hebt
die bereits als Minimalmodell-Stub angelegten Wörter in `vocabulary.json` an, keine neuen
IDs/Kategorien). 15 vollständige Theoriedokumente (`scripts/apply-kurs1-theory-batch2.js`,
ersetzt die von Entwicklungsauftrag 6 angelegten `is_placeholder: true`-Platzhalter):

- **Unit 6 (Uhrzeit/Kalender):** Uhrzeit (سَاعَة) vs. Tageszeit als getrennte Konzepte, "غَداً
  (morgen)" vs. "غَدَاء (Mittagessen)"-Verwechslungsgefahr, Wochentage 2-5 von den Zahlen
  abgeleitet, internationale vs. traditionelle Monatsnamen.
- **Unit 7 (Farben/Formen/Materialien):** zwei unterschiedliche Farbadjektiv-Baumuster (أَ-Grundfarben
  vs. ي-nisba-Farben von Substantiven abgeleitet), Iḍāfa-Vorschau bei "aus Material X", das
  Homonym ذهب bewusst erklärt statt nur markiert.
- **Unit 8 (Möbel/Haushalt):** produktives Geräte-Wortmuster auf -ة, "Bettdecke" klar von
  "Zimmerdecke" (Unit 3) abgegrenzt, Lehnwörter für neue Technik (دُشّ).
- **Unit 9 (Lebensmittel):** Gattungsname-Muster (بَيْضَة Ei / بَيْض Eier als Gattung), Oberbegriffe
  (فَاكِهَة/خُضْرَوَات) vs. konkrete Früchte, Herkunft des deutschen Lehnworts "Hummus" von حِمَّص.
- **Unit 10 (Getränke/Küche):** Oberbegriffe (مَشْرُوب/وَجْبَة), Wurzel-Verwandtschaft زُجَاجَة/زُجَاج und
  غَلَّايَة/غَلَى, allgemeines vs. spezifische Kochverben.

**Deutsche Mehrdeutigkeiten aufgelöst** (Auftrag Abschnitt 10) — sowohl innerhalb Batch 2 als auch
rückwirkend bei zwei damit kollidierenden Batch-1-Wörtern und zwei noch unbearbeiteten
Minimalmodell-Stubs (nur der deutsche Text korrigiert, ohne die volle Bearbeitung vorzuziehen):
"Decke (Zimmerdecke)" (`c1_u03_14`, rückwirkend) / "Decke (Bettdecke)" (`c1_u08_10`), "Morgen
(Tageszeit)" (`time_morning`, rückwirkend) / "morgen (der nächste Tag)" (`c1_u06_05`), "orange
(Farbe)" (`c1_u07_01`) / "Orange (Frucht)" (`c1_u09_14`), "kochen (zubereiten, allgemein)"
(`c1_u10_21`) / "kochen (sieden, im Wasser)" (`c1_u10_23`), "Arm (Körperteil)" (`c1_u13_08`,
rückwirkend, noch Minimalmodell) / "arm (nicht reich)" (`c1_u19_24`, rückwirkend, noch
Minimalmodell), "Karte (Bankkarte)" (`c1_u11_14`, noch Minimalmodell) / "Landkarte" zuerst
genannt (`c1_u22_19`, noch Minimalmodell), "Rezept (ärztliche Verordnung)" (`c1_u14_25`, noch
Minimalmodell, zur Abgrenzung von "Rezept (Kochrezept)" `c1_u10_17`). 15 weitere Kollisionen
bleiben offen (betreffen fast ausschließlich Units, die noch nicht im vollen Datenmodell
bearbeitet wurden) — sichtbar über `npm run report:language-review`.

### Schritt 6-7: Sprachprüfdatei + Audio-Manifest

`scripts/build-language-review-and-manifest.js` generalisiert (nimmt jetzt Batch-Nummer + Units
als CLI-Argumente statt hart codierter Batch-1-Werte) und für Batch 2 ausgeführt:
`language-review/batch_02.json` (132 Einträge, Format exakt wie Auftrag Abschnitt 18 — ohne
gender/plural, die dort nicht verlangt sind). `audio_generation_manifest.json` um dieselben 132
Wörter erweitert (jetzt 247 Einträge insgesamt) und der Status-Name vereinheitlicht: Batch 1
verwendete noch `pending_language_review` (Entwicklungsauftrag 6), jetzt einheitlich
`needs_language_review` (exakt der in Auftrag Abschnitt 21 vorgegebene Name) — bestehende
Einträge wurden beim Ausführen automatisch migriert. Keine Audiodatei wurde erzeugt (kein
TTS-API-Aufruf im Skript).

### Neue Skripte

- **`npm run report:language-review`** (`scripts/reportLanguageReview.js`, Auftrag Abschnitt 19):
  automatischer Sprachprüfbericht — Gesamtstand nach `content_status`, Batch-Übersicht mit
  Wortanzahl, fehlende Vokalisierung/Umschrift/Wortart, mehrdeutige deutsche Übersetzungen,
  mögliche Homonyme (bestätigt vs. offen). Rein lesend, optional zusätzlich als JSON-Datei
  (`--json <pfad>`).
- **`npm run package:source`** (`scripts/packageSource.js`, Auftrag Abschnitt 26/27): erzeugt
  `dist-source/learning-arabic-source.zip` über eine Allowlist (nicht Blockliste) an
  Top-Level-Pfaden, schließt zusätzlich `node_modules`/`dist`/`.git`/`__pycache__`/Nutzerdaten/
  Logs/temporäre Dateien aus, und verifiziert nach dem Packen selbst per `unzip -Z1`, dass keine
  dieser verbotenen Pfade enthalten sind und dass `.gitignore`/`.github/workflows/` vorhanden
  sind (bricht mit Exit-Code 1 ab, falls doch). Ergebnis aktuell: 10,8 MB, 483 Dateien, keine
  verbotenen Einträge. `.gitignore` um `dist-source/` ergänzt.
- CI-Workflow (`.github/workflows/build.yml`) war bereits vollständig (npm ci → lint →
  validate:course → test, danach erst der Multi-Plattform-Build) — in dieser Runde nur verifiziert,
  keine Änderung nötig.

### "Deine schwierigen Wörter" (Dashboard, Auftrag Abschnitt 23 — Teilumsetzung)

`src/js/views/dashboard.js`: neue Karte, sichtbar sobald mindestens ein Wort mit
`card.consecutiveWrong[skill] >= 3` existiert (derselbe Schwellenwert wie
`srs.js#INTENSIVE_REVIEW_THRESHOLD`, hier bewusst als eigene Konstante dupliziert statt als
impliziter globaler Bezeichner referenziert, damit `dashboard.js` unabhängig von der
Ladereihenfolge in Tests bleibt). Zeigt bis zu 5 Wörter (Arabisch, Deutsch, Fehleranzahl),
sortiert nach Fehleranzahl absteigend, mit einem "Üben"-Button, der über die bereits vorhandene
`App.navigateToFreePractice({ presetFilters: {...} })`-Schnittstelle direkt gefiltert in den
freien Übungsmodus springt (`recentlyWrongOnly`, bereits vorhandener Filter in
`freePractice.js`). **Nicht umgesetzt:** die im Auftrag zusätzlich vorgeschlagenen fünf
Einzelaktionen pro Wort (Noch einmal lernen/Audio anhören/Schreibweise ansehen/Verbindung
ansehen/Beispiele ansehen) — das wäre ein eigenständiges Wort-Detail-Feature (Modal o. ä.) mit
entsprechendem Testaufwand; bewusst als offener Punkt vermerkt statt überstürzt und ungetestet
umgesetzt.

### Nachträgliche Vervollständigung (auf Nutzerwunsch, direkt im Anschluss)

Nach dem ersten Durchlauf durch Schritt 1-10 bat der Nutzer, so viel wie im Rahmen dieses
Auftrags möglich zusätzlich fertigzustellen, bevor der nächste Auftrag kommt. Drei Punkte, die
zuvor bewusst als offen dokumentiert waren, wurden daraufhin zusätzlich abgeschlossen:

1. **Deutsche Mehrdeutigkeiten** von 15 auf 3 reduziert — 11 Wortpaare direkt korrigiert
   (teils rückwirkend auch außerhalb von Units 6-10, z. B. "gehen"/verb_go vs. c1_u16_17,
   "lernen"/verb_study vs. c1_u18_05), 3 bewusst als legitime Mehrdeutigkeit belassen ("gern
   geschehen"-Synonyme, "über"/"vor" als mehrdeutige Präpositionen).
2. **"Deine schwierigen Wörter" vollständig**: alle fünf im Auftrag vorgeschlagenen
   Einzelaktionen pro Wort umgesetzt statt nur einer Sammelaktion. Dafür wurde
   `src/js/views/freePractice.js` um einen neuen Filter `onlyWordIds` erweitert (schränkt den
   Übungspool auf ein einzelnes Wort ein, inkl. korrekter Behandlung sowohl von
   `category: 'vocabulary'`-Einträgen — `item.data` ist direkt das Wort — als auch von
   `category: 'connections'`-Einträgen — `item.data.word` ist das Wort). "Noch einmal lernen"
   und "Verbindung ansehen" nutzen diesen Filter über die bereits vorhandene
   `App.navigateToFreePractice({ presetFilters, autoStart })`-Schnittstelle, "Audio anhören" ruft
   `AudioPlayer.speak()` direkt auf, "Schreibweise ansehen"/"Beispiele ansehen" blenden
   Detail-Panels mit bereits vorhandenen Wortfeldern ein (`arabic_vocalized`/`transliteration`
   bzw. `application_prompts`). "Verbindung ansehen" erscheint nur, wenn für das Wort tatsächlich
   ein Verbindungstrainer-Eintrag existiert. Getestet in `dashboard.test.js` (neue Tests für Bau
   der Aktionsleiste, Navigation mit korrekten Filtern, Audiowiedergabe, Panel-Toggle) und
   `freePractice.test.js` (neuer Test für `onlyWordIds` end-to-end: bestätigt, dass ein
   ausgeschlossenes zweites Wort über die gesamte Session hinweg nie erscheint).
3. **Schrift-Theorie für alle 8 Buchstabengruppen-Units** (vorher 3/8) —
   `scripts/apply-script-theory-units3to5.js` (ج ح خ / س ش ص ض / ط ظ) und
   `scripts/apply-script-theory-units6to7.js` (ع غ / ف ق ك ل م ه), im identischen Blockformat wie
   die bestehende Theorie für Unit 1/2 (Vorlage: `theory_unit_2`). Inhaltlich u. a.: Rachenlaute
   ح/ع als Lautgruppe ohne deutsche Entsprechung, die vollständige Gruppe der vier emphatischen
   Buchstaben (ص ض ط ظ) im Zusammenhang erklärt statt isoliert pro Unit, ق vs. ك, die
   لا-Ligatur (Lām-Alif) als normales statt als Sonderfall erklärtes Verbindungsverhalten.
   `scripts/validateCourse.js` meldet diesen Abschnitt jetzt als "OK" statt als Hinweis, sobald
   alle Schrift-Units abgedeckt sind.

Weiterhin bewusst nicht Teil dieser Runde (siehe Auftrag Abschnitt 24/25 sowie oben): Units 11-30
mit vollem Datenmodell und echter Theorie (Batches 3-6). Tatsächliche Audioerzeugung.
Sprachprüfung durch eine Person mit Arabischkenntnissen. `.arabiccourse`-Paketformat (Auftrag
Abschnitt 25: bewusst erst nach inhaltlicher Fertigstellung).

```text
npm test:                 252/252 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                           ausgeführt: 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich
npm run package:source:    erfolgreich, 10,8 MB, keine node_modules/.git/__pycache__-Einträge
```

Datenstand (von `validate:course` berechnet): 900/900 Minimalmodell, 388/900 Lernfähig/
Vollständig (141 Bestand + 115 Batch 1 + 132 Batch 2), 30/90 Sessions mit vollständiger Theorie
(unverändert — Sessionanzahl ist unabhängig von der neu ergänzten Schrift-Theorie), 8/8
Schrift-Units mit Theorie, 3 bestätigte Homonym-Paare, 3 verbleibende (bewusst akzeptierte)
deutsche Mehrdeutigkeiten, 0 Wörter approved/reviewed (alle weiterhin `needs_language_review`).

### Akzeptanzkriterien dieser Runde (Auszug)

`npm test` zehnmal hintereinander erfolgreich; Migrationstest läuft ohne `skip` gegen Fixtures;
Validator unterscheidet Minimal/Lernfähig/Vollständig; veraltete `playbackRate`-Meldung entfernt;
Units 6-10 vollständig (150 Wörter geprüft/vervollständigt, 15 Theoriedokumente, keine
Wort-ID aus diesem Batch im JavaScript hart codiert); `language-review/batch_02.json` vorhanden;
Audio-Manifest erweitert, ohne tatsächlich Audio zu erzeugen; `npm run package:source` erzeugt
eine ZIP ohne `node_modules`; `.gitignore`/CI verifiziert; alle Zahlen im Bericht vom Validator
berechnet, nicht hart codiert.

## 12. Entwicklungsauftrag 8: Units 11-15 vollständig ausarbeiten und Release-Struktur korrigieren (vom Nutzer, 2026-08-09)

Achter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 7 aufbauend: **Batch 3** (Units 11-15
— Einkaufen/Geld/Preise, Kleidung/Schuhe/Accessoires, Körper/Sinne, Gesundheit/Beschwerden/
Apotheke, Gefühle/Eigenschaften/Zustände; 135 neue Wörter/15 Sessions) auf dasselbe vollständige
Niveau wie Batch 1/2 heben, ein zentrales `part_of_speech`-Vokabular festschreiben,
`opposite_id`/`confusion_group` als neue Felder einführen, und die im Auftrag behauptete
fehlende `.gitignore`/CI-Struktur prüfen/korrigieren. Danach stoppen — Units 16-30, tatsächliche
Audioerzeugung, `.arabiccourse` und Kurs 2 sind explizit nicht Teil dieser Runde.

### Vorab: Auftragsbaseline gegen den echten Repository-Zustand geprüft

Der Auftrag ging von folgender Ausgangslage aus: `.gitignore` und `.github/workflows/build.yml`
fehlen, `npm run package:source` meldet sie als fehlend. Bei Prüfung zu Beginn dieser Runde waren
beide Dateien bereits vorhanden (seit Entwicklungsauftrag 3, Meilenstein A) und
`npm run package:source` meldete bereits korrekt:

```text
.gitignore enthalten: ja
.github/workflows/ enthalten: ja
```

Erneut ausgeführt, unverändert korrekt — keine Änderung nötig. Dieser Widerspruch zur
Auftragsbeschreibung wird hier bewusst dokumentiert (ehrliches Reporten statt stillschweigend
etwas "reparieren", das nicht kaputt war, oder den Widerspruch zu ignorieren). Die übrigen
Baseline-Annahmen des Auftrags (4/5/6/0/0 bereits vollständige Wörter in Units 11-15, 388/900
Lernfähig, 30/90 Theorie, 8/8 Schrift-Theorie) stimmten dagegen exakt.

### Schritt 1: geschlossenes `part_of_speech`-Vokabular festgeschrieben

Der Auftrag schlug ein eigenes, englisches Wortarten-Vokabular vor (noun/verb/adjective/…). Über
die 388 bereits vorher vollständigen Wörter (Units 1-10) hatte sich aber längst ein
deutschsprachiges Vokabular etabliert. Statt disruptiv zwei parallele Vokabulare zu führen oder
388 fertige Wörter rückwirkend umzustellen, schreibt `scripts/validateCourse.js` jetzt genau die
bereits etablierten 12 Werte als EINE zentrale, geschlossene Liste fest
(`Substantiv`/`Substantiv (Dual)`/`Substantiv (Plural)`/`Substantiv (Pluraletantum)`/
`Substantiv/Adjektiv`/`Adjektiv`/`Verb (3. Pers. m. Vergangenheit)`/`Adverb`/`Ausdruck`/
`Zahlwort`/`Fragewort`/`Eigenname`) und meldet jeden abweichenden Wert als Hinweis. Alle 135
neuen Wörter aus Units 11-15 nutzen ausschließlich Werte aus dieser Liste (per Test abgesichert).

### Schritt 2: `opposite_id`/`confusion_group` neu eingeführt und validiert

Zwei neue, optionale Wortfelder: `opposite_id` (Antonympaar, gegenseitig auf beiden Wörtern
gesetzt) und `confusion_group` (String-Tag für didaktisch sinnvoll gemeinsam zu lernende,
leicht verwechselbare Wörter — bewusst NICHT für jedes Wort vergeben). `scripts/
upgrade-kurs1-units11to15.js` setzt beide Felder aus den Vorgaben in
`scripts/data/kurs1Units11to15Full.js` und prüft die Gegenseitigkeit von `opposite_id` bereits
beim Schreiben selbst. `scripts/validateCourse.js` prüft zusätzlich (als harter Fehler bei
Verstoß): jede `opposite_id` zeigt auf ein existierendes Wort, UND die Verknüpfung ist
gegenseitig (A→B impliziert B→A). Ergebnis: **22 Wörter** in **11 Gegensatzpaaren** (u. a.
رَخِيص↔غَالٍ billig/teuer, مَفْتُوح↔مُغْلَق geöffnet/geschlossen, لَبِسَ↔خَلَعَ anziehen/ausziehen,
سَعِيد↔حَزِين glücklich/traurig, قَوِيّ↔ضَعِيف stark/schwach, حَيّ↔مَيِّت lebendig/tot,
سَهْل↔صَعْب einfach/schwierig, مُسْتَيْقِظ↔نَائِم wach/schlafend, هَادِئ↔مُتَوَتِّر ruhig/nervös,
مَشْغُول↔مُتَفَرِّغ beschäftigt/frei, صِحَّة↔مَرَض Gesundheit/Krankheit), **32 Wörter** in **8**
`confusion_group`-Gruppen (u. a. `c1_price_terms`, `c1_payment_methods`, `c1_accessories`,
`c1_senses`, `c1_torso`, `c1_symptoms`, `c1_medical_words`, `c1_muta_adjectives` — Letztere
bündelt die sechs مُتَ-präfigierten Gefühlsadjektive aus Unit 15, die sich optisch stark ähneln).

### Schritt 3-4: Batch 3 (Units 11-15) vollständig

Gleiches Vorgehen wie Batch 1/2: `scripts/data/kurs1Units11to15Full.js` (vokalisierte Form,
Umschrift, Wortart, Genus/Plural wo sinnvoll, individuelle `application_prompts`, `opposite_id`/
`confusion_group` wo zutreffend, für alle 135 neuen Wörter) + `scripts/upgrade-kurs1-units11to15.js`
(hebt die bereits als Minimalmodell-Stub angelegten Wörter in `vocabulary.json` an, keine neuen
IDs/Kategorien — die 15 bereits vorher vollständigen Wörter, z. B. `shop_money`, `clothing_shirt`,
`body_head`, kommen in den Eingabedaten dieses Skripts gar nicht vor und bleiben dadurch
unangetastet). Diakritika-Stripping-Regex diesmal über `String.fromCodePoint`-Zahlenlisten statt
`\uXXXX`-Escapes im Quelltext aufgebaut, nachdem sich beim Schreiben der Datei zeigte, dass ein
Zwischenschritt beim Speichern `\uXXXX`-Escapes in echte Zeichen umwandelt (Codepoints selbst
verifiziert identisch mit der vorherigen Escape-Notation, aber die neue Bauweise ist gegen
diesen Effekt robust — sie enthält gar keine Escapes mehr, die umgewandelt werden könnten).

15 vollständige Theoriedokumente (`scripts/apply-kurs1-theory-batch3.js`):

- **Unit 11 (Einkaufen/Geld/Preise):** die vier Grundverben kaufen/verkaufen/bezahlen/kosten
  auseinandergehalten, Markt vs. Supermarkt, die drei Bezahlwege bar/Karte/Bank/Konto, das
  Passiv-Partizip-Muster hinter مَفْتُوح/مُغْلَق erklärt.
- **Unit 12 (Kleidung/Schuhe/Accessoires):** Kleid (einteilig) vs. Rock (braucht Oberteil), zwei
  arabische Wörter für "Tasche" (جَيْب an der Kleidung vs. حَقِيبَة als separater Gegenstand)
  bewusst gegenübergestellt, die Iḍāfa-Konstruktion سَاعَة يَد als zusammengesetzter Begriff.
- **Unit 13 (Körper/Sinne):** systematischer Aufbau vom Kopf abwärts, das ظَهْر/ظُهْر-Homonym
  (Rücken/Mittag) explizit als bewusstes Homonym statt als Fehler erklärt, die vier
  Sinnesverben rأى/سمع/شمّ/لمس je einem Körperteil zugeordnet.
- **Unit 14 (Gesundheit/Beschwerden/Apotheke):** vom Symptom über Untersuchung zu Behandlung,
  وَصْفَة طِبِّيَّة (ärztliches Rezept) explizit von einem Kochrezept abgegrenzt (beide teilen nur
  das Wort وَصْفَة) — bewusst als reiner Sprachunterricht gehalten, siehe eigener Abschnitt unten.
- **Unit 15 (Gefühle/Eigenschaften/Zustände):** das مُتَ-Wortbildungsmuster bei
  Gefühlsadjektiven als wiederkehrendes Baumuster statt Einzelvokabeln erklärt, vier
  Gegensatzpaare gebündelt in der letzten Session.

### Unit 14 bewusst als reiner Sprachunterricht gehalten

Auftrag Abschnitt (Unit 14) verlangt ausdrücklich, dass die Theorie **keine** medizinische
Beratung/Diagnose/Behandlungsanweisung enthält, sondern ausschließlich Wortschatz für
Alltagssituationen (Arztbesuch, Apotheke) vermittelt. Umgesetzt: alle drei Theoriedokumente
formulieren durchgehend "so sagst du X auf Arabisch", nie "bei Symptom X tue Y".
`theory_vocab_unit_14_a` trägt zusätzlich einen expliziten "Wichtiger Hinweis"-Callout ("Diese
Unit dient ausschließlich dem Wortschatzaufbau … kein medizinischer Ratgeber"), per Test
abgesichert (`test/unit/kurs1Units11to15Content.test.js`, prüft sowohl das Vorhandensein des
Callouts als auch, dass sein Text explizit "keine medizinische …" enthält).

### Schritt 5: Sprachprüfdatei + Audio-Manifest, inkl. neuer Theorie-Prüfmetadaten

`scripts/build-language-review-and-manifest.js` erweitert: erzeugt jetzt zusätzlich zu den
Wort-Prüfeinträgen ein `theory_review`-Array (ein Eintrag pro zur Unit-Auswahl gehörendem
Theoriedokument, aus `vocabSessions.json`/`theory.json` automatisch abgeleitet — nicht manuell
gepflegt) mit `theory_id`, `title`, `review_status` sowie den vier unabhängig abhakbaren Booleans
`arabic_examples_reviewed`/`german_explanation_reviewed`/`mini_check_reviewed`/
`application_prompts_reviewed` (alle initial `false`). Für Batch 3 ausgeführt:
`language-review/batch_03.json` (135 Wort-Einträge + 15 Theorie-Einträge).
`audio_generation_manifest.json` um dieselben 135 Wörter erweitert (jetzt 382 Einträge
insgesamt, weiterhin ausschließlich `status: "needs_language_review"` — kein einziger Eintrag
`ready_for_generation`, wie im Auftrag gefordert; kein TTS-API-Aufruf im Skript).

### Schritt 6: `report:language-review` um Theorie-Prüfstand erweitert

`scripts/reportLanguageReview.js` zeigt jetzt pro Batch (sofern das Batch-File ein
`theory_review`-Feld mitliefert) die Anzahl vorgemerkter und vollständig geprüfter
Theoriedokumente, sowie eine über alle Batches aggregierte Gesamtzeile. Ältere Batch-Dateien ohne
dieses Feld (Batch 1/2, vor dieser Runde erzeugt) werden dabei korrekt ausgelassen statt
fälschlich mit 0 gezählt zu werden.

### Schritt 7: Inhaltstests für Units 11-15

`test/unit/kurs1Units11to15Content.test.js` (15 Tests, analog zu
`kurs1Units6to10Content.test.js`, ergänzt um die in dieser Runde neuen Aspekte): Wort-/Session-/
Unit-Zahlen (150 Wörter, davon 135 neu, 15 Sessions), Unversehrtheit der 15 bereits vorher
vollständigen Wörter (IDs/Zuordnung unverändert), vollständiges Lernfähig-Modell für alle 135
neuen Wörter, `part_of_speech`-Vokabular-Konformität, `opposite_id`-Gegenseitigkeit (≥20 Wörter),
`confusion_group`-Selektivität (vergeben, aber NICHT für jedes Wort), vollständige Theorie ohne
Platzhalter für alle 15 Sessions (Lernziele, Kurz/Mehr-Text, word_preview exakt passend zur
Session, ≥2 Beispiele, Mini-Check mit ≥2 Fragen, Merke-/Hinweis-Callout), der explizite
Unit-14-Sprachunterricht-Hinweis, keine hart codierte Wort-ID aus diesem Batch im JavaScript,
`batch_03.json`- und Manifest-Konsistenz.

### Schritt 8: vollständige Verifikation

```text
npm run lint:              erfolgreich
npm test:                  267/267 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                            ausgeführt: 10/10 erfolgreich (keine Flakiness beobachtet)
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 1/2/3 + Theorie-Prüfstand
npm run package:source:    erfolgreich, 10,9 MB, 490 Dateien, keine node_modules/.git/
                            __pycache__-Einträge, .gitignore/.github/workflows/ enthalten
```

Datenstand (von `validate:course` berechnet, nicht hart codiert): 900/900 Minimalmodell,
**523/900** Lernfähig/Vollständig (141 Bestand + 115 Batch 1 + 132 Batch 2 + 135 Batch 3),
**45/90** Sessions mit vollständiger Theorie (die übrigen 45 weiterhin klar als Platzhalter
markiert), 8/8 Schrift-Units mit Theorie (unverändert), 3 bestätigte Homonym-Paare (unverändert),
**11** neue Gegensatzpaare, **8** neue Verwechslungsgruppen über 32 Wörter, 0 Wörter
approved/reviewed (alle weiterhin `needs_language_review`).

### Akzeptanzkriterien dieser Runde (Auszug)

`npm test` zehnmal hintereinander erfolgreich, keine Flakiness; Units 11-15 vollständig (135
neue Wörter geprüft/vervollständigt, die bereits vorher vollständigen 15 Wörter unverändert, 15
Theoriedokumente, keine Wort-ID aus diesem Batch im JavaScript hart codiert); `opposite_id`
gegenseitig und validiert; `confusion_group` nur selektiv vergeben; `part_of_speech` auf ein
zentrales, geschlossenes Vokabular festgeschrieben; `language-review/batch_03.json` inkl.
`theory_review`-Metadaten vorhanden; Audio-Manifest auf 382 Einträge erweitert, ohne tatsächlich
Audio zu erzeugen; `.gitignore`/`.github/workflows/build.yml` verifiziert (waren bereits korrekt
— Auftragsbaseline hier widerlegt, siehe oben); `npm run package:source` erzeugt weiterhin eine
saubere ZIP; alle Zahlen im Bericht vom Validator berechnet, nicht hart codiert. Units 16-30,
tatsächliche Audioerzeugung, Sprachprüfung durch eine Person mit Arabischkenntnissen,
`.arabiccourse`-Paketformat und Kurs 2 bewusst nicht Teil dieser Runde.

## 13. Entwicklungsauftrag 9: Kurs 1 – Batch 4 (Units 16-20) vervollständigen und Sprachprüfprozess konsolidieren (vom Nutzer, 2026-08-09)

Neunter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 8 aufbauend: **Batch 4** (Units 16-20
— Tagesablauf/Gewohnheiten, häufige Verben I Bewegung/Handlungen, häufige Verben II Denken/
Sprechen/Wahrnehmung, häufige Adjektive/Gegensätze, Stadt/Gebäude/öffentliche Orte; 134 neue
Wörter/15 Sessions) vervollständigen, den Sprachprüfprozess selbst konsolidieren (reichhaltigere
Prüffelder, korrigierte theory_review-Lücke), und zwei vom Nutzer explizit benannte Unstimmigkeiten
untersuchen. Explizit NICHT Teil: Units 21-30, tatsächliche Audioerzeugung, Sprachprüfung durch
eine Person mit Arabischkenntnissen, Kurs-2-5-Neustrukturierung, größerer Session-Engine-Umbau.

### Schritt 1: verpflichtende Bestandsaufnahme — Ist-Stand deckt sich mit der Auftragsbaseline

Alle in Abschnitt 1 des Auftrags genannten Dateien gelesen und der Ist-Stand per Node-Skript
gegen die Auftragsbaseline geprüft: 900 Wörter, 30 Units, 90 Sessions, 523 lernfähige Wörter in
Units 1-15, 377 Minimalmodell-Wörter in Units 16-30, 45 vollständige/45 Platzhalter-Theorien, 900
Wörter `needs_language_review`, 382 Wörter in batch_01-03.json, 759 Wörter ohne Audiodatei, 267
Unit-Tests + 6 Integrationstests, 0 Validierungsfehler — **alle Werte stimmten exakt überein**,
keine Abweichung zu dokumentieren (anders als bei Entwicklungsauftrag 8, wo die .gitignore/CI-
Baseline nicht stimmte). Zusätzlich festgestellt: Units 16-20 hatten bereits **16** vorher
vollständige Wörter (1 in Unit 16, 5 in Unit 17, 2 in Unit 18, 0 in Unit 19, 8 in Unit 20 — z. B.
`verb_live`, `verb_go`, `place_city`), nicht 0 — Batch 4 hebt deshalb **134** statt 150 Wörter an.
Die vom Auftrag als Orientierung genannte Zielzahl "673 vollständige Wörter, falls alle 150 Wörter
vorher minimal waren" wird dadurch korrekt auf **657** (523 + 134) angepasst — im Abschlussbericht
transparent erklärt, wie schon bei Units 11-15 in Entwicklungsauftrag 8.

### Schritt 2: Untersuchung der ersten Unstimmigkeit (Abschnitt 6) — ROADMAP hatte unrecht

Befund: `batch_01.json` und `batch_02.json` hatten **tatsächlich kein** `theory_review`-Feld —
kein Fehler im Berichtsskript, sondern eine echte Datenlücke, weil beide Dateien vor der
Einführung dieses Feldes (Entwicklungsauftrag 8, Batch 3) erzeugt wurden. Die ROADMAP-Formulierung
in Entwicklungsauftrag 8 ("inkl. theory_review-Metadaten für alle 45 vollständigen
Theoriedokumente") war also schlicht ungenau/falsch. Behoben durch ein neues, gezieltes Skript
`scripts/backfill-theory-review.js`: ergänzt nur das fehlende `theory_review`-Array (15 Einträge
je Batch, aus `vocabSessions.json`/`theory.json` automatisch abgeleitet, alle vier Prüf-Booleans
`false`), lässt die bestehenden `entries` (Wort-Prüfeinträge) unverändert — vorab verifiziert, dass
dort noch keine menschlichen Prüfnotizen standen (0 nicht-leere `notes`, 0 abweichende
`review_status`). Für Batch 1 (Units 1-5) und Batch 2 (Units 6-10) ausgeführt. Ergebnis: Report,
Batch-Dateien und diese ROADMAP zeigen jetzt übereinstimmend **60** Theorie-Prüfeinträge (45 aus
Batch 1-3 + 15 aus Batch 4) — keine Sprachprüfung wird dabei behauptet, die nicht stattgefunden
hat (alle Booleans bleiben `false`, `review_status` bleibt `needs_language_review`).

### Schritt 3: Untersuchung der zweiten Unstimmigkeit (Abschnitt 7) — die 141 ursprünglichen Wörter

Befund: Die vom Nutzer vermutete Erklärung war korrekt. Von 900 Wörtern sind nach Batch 3 (382
erfasste + 377 Minimalmodell-Wörter in Units 16-30 = 759) genau **141** Wörter in keiner
Review-Datei — und diese 141 sind exakt die Wörter mit einer bereits vorhandenen echten
Audiodatei (verifiziert per Dateisystem-Abgleich: alle 141 Wörter mit `.wav`-Datei sind
unbatched, und kein batched Wort hat eine `.wav`-Datei — 1:1-Deckung). Ursache: Die
Batch-Erzeugungsskripte (`build-language-review-and-manifest.js`) filtern seit Entwicklungsauftrag
6 bewusst nur auf neue `c1_`-IDs, weil die ursprünglichen Wörter aus Lektionen 3/6/8 bereits eine
Audiodatei UND einen funktionierenden Session-/Progress-Bezug haben. Eine vorhandene Audiodatei
ist aber KEINE Sprachprüfung — diese 141 Wörter bleiben deshalb auch weiterhin
`content_status: needs_language_review`. Diese Runde vervollständigt sie bewusst NICHT (würde den
Batch-4-Rahmen sprengen), macht die Lücke aber automatisch nachvollziehbar:
`scripts/reportLanguageReview.js` und `scripts/validateCourse.js` zeigen jetzt beide einen eigenen
Abschnitt mit der vollständigen ID-Liste. Neuer ROADMAP-Folgepunkt ("Batch 0") unten.

### Schritt 4-5: Batch 4 (Units 16-20) vollständig

Gleiches Vorgehen wie Batch 1-3: `scripts/data/kurs1Units16to20Full.js` (vokalisierte Form,
Umschrift, Wortart, Genus/Plural wo sinnvoll, individuelle `application_prompts`, `opposite_id`/
`confusion_group` wo zutreffend, für alle 134 neuen Wörter) + `scripts/upgrade-kurs1-units16to20.js`
(hebt die bereits als Minimalmodell-Stub angelegten Wörter in `vocabulary.json` an, keine neuen
IDs/Kategorien — die 16 bereits vorher vollständigen Wörter bleiben unangetastet, weil sie in den
Eingabedaten dieses Skripts gar nicht vorkommen). Neu gegenüber den Vorgänger-Skripten: eine
eingebaute Konsistenzprüfung, dass die neu vokalisierte Form exakt zur bereits bestehenden
`arabic_unvocalized`-Grundform strippt — fand dabei eine einzige Abweichung
(`c1_u19_22`, "schlecht"): der Minimalmodell-Stub hatte `سيء` (Hamza auf der Zeile), die
MSA-übliche Schreibweise mit Ya-Träger ist aber `سَيِّئ` (strippt zu `سيئ`). Nach Prüfung als
Orthographie-Korrektur übernommen (nicht als stillschweigende Ersetzung, sondern hier und im
README dokumentiert) — analog zur `تنفس`-Korrektur in Entwicklungsauftrag 8.

15 vollständige Theoriedokumente (`scripts/apply-kurs1-theory-batch4.js`):

- **Unit 16 (Tagesablauf/Gewohnheiten):** die Morgenroutine als Verbkette (اِسْتَيْقَظَ→نَهَضَ→
  غَسَلَ/اِسْتَحَمَّ→اِرْتَدَى), فَرَّشَ أَسْنَانَهُ als feste Verb-Objekt-Wendung statt Einzelverb erklärt,
  drei neue Gegensatzpaare (بَدَأَ/اِنْتَهَى, فَتَحَ/أَغْلَقَ, وَصَلَ/غَادَرَ).
- **Unit 17 (häufige Verben I, Bewegung):** جَاءَ als Gegenstück zum bereits bekannten ذَهَبَ,
  das اِسْتَ-Verbmuster (Verbstamm X) als wiederkehrende Bauform erklärt, eine Kette verwandter
  Ein-/Ausstiegs-Verben über mehrere Units hinweg (دَخَلَ/خَرَجَ, صَعِدَ/نَزَلَ, وَصَلَ/غَادَرَ).
- **Unit 18 (häufige Verben II, Denken/Sprechen):** تَعَلَّمَ/عَلَّمَ als Verbstamm-Paar (Lernen vs.
  Lehren) erklärt, drei ähnliche Modalverben أَرَادَ/اِحْتَاجَ/اِسْتَطَاعَ (Wollen/Brauchen/Können)
  bewusst gegenübergestellt statt vermischt.
- **Unit 19 (häufige Adjektive/Gegensätze):** bewusst als dichtes Gegensatzpaar-Netzwerk gestaltet
  — 13 vollständige Paare über die drei Sessions, mehr als in jeder anderen Unit dieses Kurses;
  خَطَأ als Substantiv/Adjektiv-Grenzfall erklärt (analog zu مَرِيض aus Unit 14).
- **Unit 20 (Stadt/Gebäude/öffentliche Orte):** mehrere Iḍāfa-Genitivverbindungen (مَكْتَب بَرِيد,
  مَرْكَز الشُّرْطَة, إِشَارَة مُرُور/حَرَكَة الْمُرُور — teilen sich das Wort مُرُور), das مَفْعَل-Ortsmuster
  bei مَتْحَف/مَسْرَح/مَقْهَى erklärt.

Ergebnis: **76** `opposite_id`-Verweise insgesamt, das sind **38** gegenseitige Gegensatzpaare
(54 neue Verweise/27 neue Paare in diesem Batch — davon 13 Paare allein in Unit 19; Terminologie
hier bewusst präzisiert: „Verweise" = Anzahl Wörter mit gesetztem `opposite_id`-Feld, „Paare" =
Verweise geteilt durch zwei, siehe Entwicklungsauftrag 10, Abschnitt 2, zur zuvor ungenauen
Formulierung „76 Gegensatzpaare"), **14** Verwechslungsgruppen über 55 Wörter (`confusion_group`,
8 neu, u. a.
`c1_morning_routine`, `c1_exchange_verbs`, `c1_direction_verbs`, `c1_learn_teach`,
`c1_communication_verbs`, `c1_leisure_venues`). Zweimal hintereinander ausgeführt und per
Byte-für-Byte-Vergleich der resultierenden `vocabulary.json` als idempotent verifiziert (Auftrag
Abschnitt 9/11) — zusätzlich in `kurs1Units16to20Content.test.js` als echter Regressionstest
verankert (führt das Skript im Test tatsächlich ein zweites Mal aus, statt Idempotenz nur zu
behaupten).

### Schritt 6: Application-Prompts — expected_word_id vs. expected_meaning

Der Auftrag verlangt explizit, dass jeder `application_prompt` eine gültige `expected_word_id`
referenziert (anders als die bisherige Konvention mit `expected_meaning`). Prüfung des
tatsächlichen Übungscodes (`renderContextualChoice` in `src/js/session/exerciseRegistry.js`)
ergab: die Korrektheit wird dort über "die angeklickte Option ist dasselbe Wortobjekt wie das
gefragte Wort" bestimmt (`opt.id === word.id`) — der Prompt-Text wird nur angezeigt, aber
`expected_word_id`/`expected_meaning` werden vom Renderer selbst nicht ausgewertet. Die einzige
`expected_word_id`, die zur tatsächlichen Übungslogik passt, ist deshalb die ID des Wortes selbst.
Alle 134 neuen `application_prompts` setzen deshalb `expected_word_id: <eigene ID>` UND zusätzlich
`expected_meaning` (Abwärtskompatibilität/Sprachprüfung) — diese Designentscheidung ist im
Abschlussbericht und README dokumentiert, keine der bestehenden Prompt-Auswertungen wurde
verändert.

### Schritt 7: Sprachprüfprozess konsolidiert

`scripts/build-language-review-and-manifest.js` erweitert: jeder Wort-Eintrag in
`language-review/batch_NN.json` enthält jetzt zusätzlich Genus, Plural,
`accepted_arabic_answers`, `application_prompts`, `homonym_group`/`opposite_id`/
`confusion_group` (jeweils `null`, wenn nicht zutreffend) sowie ein `review`-Objekt mit vier
unabhängig abhakbaren Booleans (`arabic_vocalization_reviewed`, `transliteration_reviewed`,
`german_translation_reviewed`, `application_prompts_reviewed`) statt nur eines einzigen
`review_status` — wie vom Auftrag Abschnitt 5 gefordert ("getrennte Prüffelder für die sprachlich
relevanten Aspekte"). Rückwirkend für Batch 1-3 neu erzeugt (verlustfrei, da keine bestehenden
Prüfnotizen vorhanden waren, vorab verifiziert). `scripts/validateCourse.js` um einen
Presentation-Forms-Check erweitert (Auftrag Abschnitt 2, Punkt 8): keine arabischen Felder dürfen
Codepoints aus U+FB50-FDFF/U+FE70-FEFF (vorgerenderte Glyphenformen) enthalten — Bereich per
Zahlen statt `\uXXXX`-Escapes oder roher Zeichen im Quelltext aufgebaut, nachdem sich beim
Batch-3-Diakritika-Stripper zeigte, dass ein Tooling-Schritt `\uXXXX`-Escapes beim Speichern in
echte Zeichen umwandeln kann.

### Schritt 8: Content-Tests

`test/unit/kurs1Units16to20Content.test.js` — 20 Tests, exakt die 20 im Auftrag (Abschnitt 10)
genannten Prüfpunkte abdeckend, plus ein zusätzlicher Konsistenztest für `theory_review` über alle
vier Batches (Abschnitt 11). Deckt u. a. ab: Wort-/Session-/Unit-Zahlen, Unversehrtheit der 16
bereits vorher vollständigen Wörter, vollständiges Lernmodell, `expected_word_id`-Gültigkeit,
Genus/Plural-Pflichtfelder, zentrales `part_of_speech`-Vokabular, vollständige Theorie ohne
Platzhalter, Batch-4-Review-Struktur samt Prüf-Booleans, Audio-Manifest-Konsistenz, keine hart
codierten Wort-IDs, `opposite_id`-Gegenseitigkeit, `confusion_group`-Selektivität, keine
Presentation-Forms, echte Idempotenz-Verifikation des Upgrade-Skripts.

### Schritt 9: vollständige Verifikation

```text
npm run lint:              erfolgreich
npm test:                  287/287 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                            ausgeführt: 10/10 erfolgreich (keine Flakiness beobachtet)
npm run validate:course:   0 Fehler, 3 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 1-4 + Theorie-Prüfstand + 141
                            ursprüngliche Bestandswörter ohne Sprachprüfeintrag
npm run package:source:    erfolgreich, 11,0 MB, 496 Dateien, keine node_modules/.git/
                            __pycache__-Einträge
```

Alle bearbeiteten JSON-Dateien zusätzlich mit einem echten JSON-Parser (Python `json.load`)
geprüft. Batch-Erzeugung (`upgrade-kurs1-units16to20.js` UND
`build-language-review-and-manifest.js`) je zweimal hintereinander ausgeführt und per
Datei-Diff als idempotent belegt.

Datenstand (von `validate:course`/`report:language-review` berechnet, nicht hart codiert):
900/900 Minimalmodell, **657/900** Lernfähig/Vollständig (523 vorher + 134 Batch 4), **60/90**
Sessions mit vollständiger Theorie, **516/900** Wörter zur Sprachprüfung vorbereitet (382 vorher +
134 Batch 4), **60** Theorie-Prüfeinträge, **0/900** durch eine arabischkundige Person tatsächlich
geprüft, **0** Wörter für Audio freigegeben, weiterhin **141** Wörter mit echter Audiodatei
(unverändert), **76** `opposite_id`-Verweise (**38** gegenseitige Paare), **14** Verwechslungsgruppen
über 55 Wörter, 3 bestätigte Homonym-Paare (unverändert).

### Manuelle Prüfliste für `npm start` (Auftrag Abschnitt 13 — noch nicht von der KI ausgeführt)

Die KI hat die App in dieser Runde NICHT selbst in einer laufenden Electron-Instanz geöffnet
(dieselbe Einschränkung wie in allen vorigen Runden, siehe Abschnitt 3 "Bekannte Lücken"). Eine
konkrete Prüfliste für den Nutzer steht im Abschlussbericht dieser Runde; die Ergebnisse dieser
manuellen Prüfung sind hier nicht dokumentiert, weil sie nicht durchgeführt wurde.

### Neuer ROADMAP-Folgepunkt: "Batch 0" — die 141 ursprünglichen Bestandswörter formal sprachprüfen

Die 141 ursprünglichen Wörter (Lektionen 3/6/8, bereits mit Audiodatei) sind bislang in keiner
`language-review/batch_NN.json` erfasst. Ein künftiger, kleiner Auftrag sollte für sie — analog zu
den Batches 1-4 — eine `language-review/batch_00.json` erzeugen (inkl. der bereits vollständigen
Vokalisierung/Umschrift/Grammatik, die für diese Wörter zum großen Teil schon vorhanden ist) und
sie einer echten Sprachprüfung zuführen, BEVOR ihre bereits vorhandenen Audiodateien als
"sprachlich geprüft" gelten dürfen.

### Akzeptanzkriterien dieser Runde (Auszug)

`npm test` zehnmal hintereinander erfolgreich, keine Flakiness; Units 16-20 vollständig (134 neue
Wörter geprüft/vervollständigt, die bereits vorher vollständigen 16 Wörter unverändert, 15
Theoriedokumente, keine Wort-ID aus diesem Batch im JavaScript hart codiert); Batch-Erzeugung
zweimal ausgeführt und als idempotent belegt; beide vom Nutzer benannten Unstimmigkeiten
untersucht und mit klarem Befund dokumentiert (nicht nur behauptet); `language-review/batch_04.json`
mit angereicherten Prüffeldern vorhanden, Batch 1-3 rückwirkend konsolidiert; Audio-Manifest auf
516 Einträge erweitert, ohne tatsächlich Audio zu erzeugen, keine bestehende Audiodatei verändert;
`part_of_speech`/`opposite_id`/`confusion_group`-Regeln eingehalten; keine Arabic-Presentation-
Forms; alle Zahlen im Bericht vom Validator berechnet, nicht hart codiert; Abweichungen von den
Auftrags-Schätzwerten (657 statt 673 vollständige Wörter) präzise erklärt. Units 21-30,
tatsächliche Audioerzeugung, Sprachprüfung durch eine Person mit Arabischkenntnissen,
`.arabiccourse`-Paketformat und Kurs-2-5-Neustrukturierung bewusst nicht Teil dieser Runde.

### Nachträgliche Vervollständigung (auf Nutzerwunsch, direkt im Anschluss)

Nach Entwicklungsauftrag 9 bat der Nutzer, offene Punkte so weit wie sinnvoll möglich zusätzlich
zu schließen, bevor der nächste Auftrag kommt — **ausdrücklich ohne** die in Auftrag 9 Abschnitt
14 explizit ausgeschlossenen Punkte (Units 21-30, Audioerzeugung, Sprachprüfung markieren, Kurs
2-5, `.arabiccourse`, Session-Engine-Umbau u. a.) vorzuziehen. Zwei Punkte wurden geschlossen:

1. **"Batch 0" — Erfassung erledigt** (nicht die Prüfung selbst, die bleibt einer qualifizierten
   Person vorbehalten): neues Skript `scripts/build-batch0-legacy-review.js` erzeugt
   `language-review/batch_00.json` mit allen 141 ursprünglichen Bestandswörtern. Da diese Wörter
   bereits das volle "Vollständig"-Datenmodell erfüllten (verifiziert: 0/141 fehlt irgendein
   Feld), war hier kein Datenmodell-Upgrade nötig, nur das Nachliefern eines Sprachprüfeintrags im
   selben angereicherten Format wie Batch 1-4 (Genus/Plural/akzeptierte Formen/Application-
   Prompts/Homonym-Gegensatz-Verwechslungs-Hinweise/vier getrennte Prüf-Booleans). Bewusst NICHT
   im `audio_generation_manifest.json` (das Manifest steuert nur die Erzeugung NEUER
   Audiodateien) und ohne `theory_review`-Feld (ihre Sessions sind entweder schon über Batch 1-4
   abgedeckt oder haben noch keine echte Theorie). Dabei einen echten Bug in
   `scripts/reportLanguageReview.js` gefunden und behoben: die Berechnung "noch nicht erfasste
   Wörter" war eine einfache Subtraktion (`Gesamtzahl neuer Wörter minus Summe aller
   Batch-Wortzahlen`), die mit Batch 0 (kein "neues" Wort, sondern Bestand) einen falschen,
   zu niedrigen Wert ergeben hätte — jetzt korrekt aus den tatsächlichen Wort-IDs aller Batches
   berechnet. Neuer Test `test/unit/legacyBatch0Review.test.js` (5 Tests, inkl. echter
   Zwei-Läufe-Idempotenzprüfung des neuen Skripts).
2. **Electron-Startfähigkeit erneut untersucht:** ein Startversuch zeigte zunächst denselben
   Fehler wie in früheren Runden dokumentiert — Ursache jetzt genauer identifiziert: die
   Umgebungsvariable `ELECTRON_RUN_AS_NODE=1` ist in dieser Sandbox gesetzt und zwingt den
   Electron-Prozess, als reines Node auszuführen (wodurch `require('electron').app` undefined
   ist). Ohne diese Variable startet der Prozess tatsächlich (kein Absturz mehr, nur die
   erwarteten GPU-Sandbox-Fehlermeldungen einer Container-Umgebung ohne echte GPU). Trotzdem
   bleibt eine **visuelle** Prüfung durch die KI weiterhin nicht möglich (kein Screenshot-/
   Bildschirm-Werkzeug in diesem Toolset) — die manuelle Prüfliste aus Entwicklungsauftrag 9,
   Abschnitt 13, muss weiterhin vom Nutzer selbst durchgeführt werden.

```text
npm test:                 292/292 Unit-Tests + 6/6 Integrationstests — 10× hintereinander
                           ausgeführt, 10/10 erfolgreich
npm run lint:              erfolgreich
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt jetzt Batch 0-4 (657 vorbereitete Wörter)
npm run package:source:    erfolgreich, keine node_modules/.git/__pycache__-Einträge
```

Datenstand danach: 900/900 Minimalmodell, 657/900 Lernfähig/Vollständig (unverändert gegenüber
Batch 4 — kein neues Datenmodell-Upgrade in diesem Nachtrag), aber jetzt **657/657** vollständig
modellierte Wörter auch tatsächlich in einer Sprachprüfdatei erfasst (vorher 516/657, die 141
Bestandswörter fehlten). 0 Wörter tatsächlich geprüft, 0 für Audio freigegeben — unverändert.

**Weiterhin bewusst nicht Teil dieser Runde:** Units 21-30, tatsächliche Audioerzeugung/
Sprachprüfung durch eine qualifizierte Person, alle in Auftrag 9 Abschnitt 14 genannten Punkte.

## 14. Entwicklungsauftrag 10: Kurs 1 – Konsistenzkorrektur und Batch 5 für Units 21-25 (vom Nutzer, 2026-08-09)

Zehnter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 9 aufbauend: zwei Dokumentationsfehler
korrigieren, die Application-Prompt-/Grading-Semantik systematisch untersuchen und absichern, und
**Batch 5** (Units 21-25 — Position/Richtung/Präpositionen, Verkehr/Reisen/Hotel, Schule/
Unterricht/Schulsachen, Universität/Studium/Prüfungen, Arbeit/Berufe/Büro; 126 neue Wörter, 15
Sessions) vervollständigen. Explizit NICHT Teil: Units 26-30, echte Sprachfreigabe,
Audioerzeugung, Kurs-2-5-Neustrukturierung und alle übrigen in Auftrag 10 Abschnitt 12 genannten
Punkte.

### Schritt 1: Bestandsaufnahme — Ist-Stand deckt sich exakt mit der Auftragsbaseline

Alle in Abschnitt 1 genannten Dateien gelesen und der Ist-Stand per Node-Skripten geprüft: 900
Wörter, 657 vollständig/lernfähig, 243 unvollständig, 60 vollständige + 30 Platzhalter-Theorien,
Batch 0 mit 141 Wörtern + Batches 1-4 mit 516 Wörtern = 657 in Review-Dateien, 60
Theorie-Prüfeinträge, 900× `needs_language_review`, 0 sprachlich freigegeben, 0 für Audio
freigegeben, Manifest mit 516 Einträgen, 141 Bestandswörter mit Audiodatei, 292 Unit-Tests + 6
Integrationstests — **alle Werte stimmten exakt überein**, keine Abweichung zur Auftragsbaseline.
Auch die genaue Batch-5-Aufteilung (Unit 21: 30/0, Unit 22: 24/6, Unit 23: 26/4, Unit 24: 23/7,
Unit 25: 23/7 = 126 neue + 24 Bestandswörter) wurde vorab verifiziert und deckte sich exakt mit
den Auftragsangaben — anders als bei früheren Batches gab es diesmal keine Korrektur der
Ausgangszahlen nötig.

### Schritt 2: Dokumentationsfehler zu Batch 0 korrigiert

Untersuchung ergab: die meisten README-/ROADMAP-Stellen zu Batch 0 waren durch die
Nachtrag-Runde direkt nach Entwicklungsauftrag 9 bereits korrekt aktualisiert (Batch 0 korrekt
als "technisch erstellt", 657 statt 516 korrekt genannt). Eine echte, übersehene Ausnahme wurde
gefunden: **ROADMAP.md, Abschnitt 4 ("Nächste Schritte")** enthielt noch die alte Formulierung
"516/900 Wörter zur Sprachprüfung vorbereitet" und beschrieb Batch 0 weiterhin als "neu
identifiziert", also implizit als noch nicht erledigt — dieser Absatz war beim Batch-0-Nachtrag
schlicht nicht mitaktualisiert worden. Korrigiert auf den tatsächlichen, aktuellen Stand (siehe
Abschnitt 3 dieser ROADMAP). Danach stimmen README, ROADMAP, `validate:course` und
`report:language-review` durchgängig überein: Batch 0 ist technisch erstellt, enthält 141
Bestandswörter, diese sind nur zur Prüfung vorbereitet (nicht geprüft), vor Batch 5 waren genau
657 Wörter in Review-Dateien erfasst, 60 Theoriedokumente waren zur Prüfung vorbereitet, die
vorhandenen Audiodateien der 141 Wörter stellen keine Sprachfreigabe dar, und für Batch 0 ist
keine erneute Audioerzeugung vorgesehen (bestätigt: `batch_00.json`-Wörter tauchen nicht im
Audio-Generierungsmanifest auf, per Test abgesichert).

Zusätzlich korrigiert: die Formulierung **"76 Gegensatzpaare"** aus dem letzten Bericht war
ungenau. 76 ist die Zahl der `opposite_id`-**Verweise** (ein Wert pro Wort mit gesetztem Feld) —
da jedes Paar auf BEIDEN beteiligten Wörtern steht, ergeben 76 Verweise **38** gegenseitige
Paare, nicht 76 Paare. Alle betroffenen Stellen in README.md und ROADMAP.md wurden präzisiert
(„X Verweise (Y Paare)" statt nur „X Gegensatzpaare").

### Schritt 3: Application-Prompt-/Grading-Semantik untersucht und abgesichert

Analyse des tatsächlichen Codes (`renderContextualChoice`, `applicationPromptFor` in
`src/js/session/exerciseRegistry.js`) bestätigte den bereits in Entwicklungsauftrag 9
dokumentierten Befund im Detail:

- Korrektheit wird ausschließlich über **Objektidentität** bestimmt: `correct = opt.id === word.id`,
  wobei `word` das gerade abgefragte `ctx.word` ist (von der Session-Steuerung vorgegeben, siehe
  `sessionController.js#renderGradedPhase`/`runGroupMiniCheck`) — NICHT über einen Vergleich mit
  `expected_word_id`/`expected_meaning`.
- `promptData.prompt` (der angezeigte Text) kommt aus `word.application_prompts` — dieser wird
  tatsächlich angezeigt. `expected_word_id`/`expected_meaning` werden dagegen von der Renderfunktion
  selbst NIRGENDS gelesen — reine Dokumentations-/Sprachprüf-Felder.
- Distraktoren kommen aus `ctx.allWords` — in der echten Session-Steuerung ist das immer der Pool
  der ~10 neuen Wörter der aktuellen Session (`words` in `sessionController.js`), nicht der ganze
  900-Wort-Bestand — Distraktoren bleiben dadurch thematisch passend und nicht trivial ausschließbar.

Da dieses Verhalten in sich korrekt und konsistent ist (die angezeigte Situation gehört immer zum
tatsächlich abgefragten Wort), wurde **nichts am Produktivcode geändert** — stattdessen mit einem
neuen Test `test/unit/applicationPromptGrading.test.js` (8 Tests, gegen den ECHTEN Code über einen
VM-Kontext + DOM-Stub, keine Mock-Renderfunktion) fest abgesichert: je ein Fall für ein Verb
(`c1_u16_12`), ein Substantiv (`c1_u23_03`), eine Präposition (`c1_u21_01`), ein mehrdeutig
übersetzbares Wort (`c1_u21_25`, "über"), ein Bestandswort (`job_doctor`) und ein neues
Batch-5-Wort (`c1_u25_01`) — jeweils mit einem Klick auf die richtige UND einen Klick auf eine
falsche Option. Ein zusätzlicher Test verwendet ein künstliches Wortpaar mit absichtlich
IRREFÜHRENDEN `expected_word_id`/`expected_meaning`-Werten, um zu beweisen, dass die Bewertung
sich davon nicht beeinflussen lässt. Ein letzter Test prüft die Datenkonsistenz: für alle neuen
Wörter aus Units 16-25 verweist `expected_word_id` immer auf das eigene Wort (die einzige
`expected_word_id`, die zur tatsächlichen Grading-Logik passt) und widerspricht nie
`expected_meaning`.

### Schritt 4-5: Batch 5 (Units 21-25) vollständig

Gleiches Vorgehen wie Batch 1-4: `scripts/data/kurs1Units21to25Full.js` (vokalisierte Form,
Umschrift, Wortart, Genus/Plural wo sinnvoll, individuelle `application_prompts` mit
selbstreferenzierender `expected_word_id`, `opposite_id`/`confusion_group`/`homonym_group` wo
zutreffend, für alle 126 neuen Wörter) + `scripts/upgrade-kurs1-units21to25.js` (hebt die bereits
als Minimalmodell-Stub angelegten Wörter in `vocabulary.json` an, keine neuen IDs/Kategorien — die
24 bereits vorher vollständigen Bestandswörter bleiben unangetastet). Dieselbe Konsistenzprüfung
wie bei Batch 4 (vokalisierte Form muss exakt zur bestehenden `arabic_unvocalized`-Grundform
strippen) fand eine Abweichung bei `c1_u21_10` (بعيد عن, "weit entfernt von") — meine erste
Vokalisierung nutzte den grammatisch korrekten Akkusativ-Tanwin (بَعِيداً), der Minimalmodell-Stub
hatte aber die Zitierform ohne Tanwin (بعيد) — auf die bestehende Zitierform angeglichen (بَعِيد),
keine Änderung der Grundform.

**Neu in `scripts/validateCourse.js`:** die Wortart **„Präposition"** als 13. Wert im zentralen
`part_of_speech`-Vokabular ergänzt. Unit 21 ist die erste Unit mit einer nennenswerten Zahl echter
Präpositionen (23 von 30 Wörtern) — sie unter „Ausdruck" zu führen wäre grammatisch ungenau
gewesen. Eine einzige, durchdachte Ergänzung der zentralen Liste (dokumentiert im Code-Kommentar),
kein zweites/paralleles Vokabular.

15 vollständige Theoriedokumente (`scripts/apply-kurs1-theory-batch5.js`):

- **Unit 21 (Position/Richtung/Präpositionen) — besondere Sorgfalt wie vom Auftrag Abschnitt 4
  verlangt:** فَوْقَ (räumlich "über") und عَنْ (nicht-räumlich "über", ein Gesprächsthema) sowie
  أَمَامَ (räumlich "vor") und قَبْلَ (zeitlich "vor") behalten bewusst dieselbe erste deutsche
  Übersetzung — dies wird in der Theorie zu Session A UND Session C explizit als legitime,
  NICHT künstlich aufgelöste Mehrdeutigkeit erklärt (räumlich vs. nicht-räumlich/zeitlich) und
  zusätzlich über `confusion_group` (`c1_prep_ueber`, `c1_prep_vor`) markiert. مِنْ (von/aus) ist
  als bewusstes Homonym mit dem bereits bekannten مَنْ (wer, `q_who`) über `homonym_group`
  verknüpft (bereits im Minimalmodell-Stub vorbereitet, hier bestätigt). Die bereits erkannten
  Übersetzungskollisionen "über" (`c1_u21_04`/`c1_u21_25`) und "vor" (`c1_u21_05`/`c1_u21_26`) aus
  `report:language-review` bleiben bewusst bestehen, nicht künstlich entfernt.
- **Unit 22 (Verkehr/Reisen/Hotel):** drei Reisedokumente (تَذْكِرَة/جَوَاز سَفَر/تَأْشِيرَة) klar nach
  Zweck unterschieden, der Hotel-Ablauf حَجْز→اِسْتِقْبَال→مِفْتَاح الْغُرْفَة, خَرِيطَة (Landkarte) klar von
  بِطَاقَة (Bankkarte, Unit 11) abgegrenzt — beide im Deutschen "Karte", im Arabischen unterschiedlich.
- **Unit 23 (Schule/Unterricht/Schulsachen):** تِلْمِيذ (Schule) klar von طَالِب/طَالِبَة (Universität,
  Unit 24) abgegrenzt, رِيَاضِيَّات/عُلُوم als Pluraletantum-Fächernamen erklärt, دَرَجَة (Note, Schule)
  als Vorbereitung auf عَلَامَة (Note, Universität, Unit 24) angekündigt.
- **Unit 24 (Universität/Studium/Prüfungen):** die Struktur جَامِعَة→كُلِّيَّة→قِسْم, die drei
  akademischen Abschlüsse بَكَالُورْيُوس→مَاجِسْتِير→دُكْتُورَاه in Reihenfolge, بَحْث (Prozess) klar von
  أُطْرُوحَة (Ergebnis) unterschieden, عَلَامَة (Note, Universität) als Gegenstück zu دَرَجَة (Note,
  Schule, Unit 23) aufgelöst.
- **Unit 25 (Arbeit/Berufe/Büro):** مُوَظَّف↔صَاحِب عَمَل als Gegensatzpaar, der vollständige
  Bewerbungsablauf طَلَب تَوْظِيف+سِيرَة ذَاتِيَّة→مُقَابَلَة عَمَل→عَقْد, مُهِمَّة (Aufgabe, Arbeit) als
  Gegenstück zu تَكْلِيف (Aufgabe, Studium, Unit 24) aufgelöst, مِهْنَة (Beruf allgemein) von وَظِيفَة
  (konkrete Stelle, Session A) abgegrenzt.

Ergebnis: **98** `opposite_id`-Verweise insgesamt (= **49** gegenseitige Paare, 22 neue
Verweise/11 neue Paare in diesem Batch) und **25** Verwechslungsgruppen über 96 Wörter
(`confusion_group`, 11 neu: `c1_prep_ueber`, `c1_prep_vor`, `c1_compass_directions`,
`c1_travel_documents`, `c1_hotel_vocab`, `c1_writing_tools`, `c1_school_subjects`,
`c1_academic_degrees`, `c1_uni_grading`, `c1_workplace_people`, `c1_job_application`). Zweimal
hintereinander ausgeführt und per Byte-für-Byte-Vergleich als idempotent verifiziert — zusätzlich
in `kurs1Units21to25Content.test.js` als echter Regressionstest verankert (führt das Upgrade- UND
das Batch/Manifest-Skript im Test tatsächlich ein zweites Mal aus).

### Schritt 6: language-review/batch_05.json + Audio-Manifest

`scripts/build-language-review-and-manifest.js` unverändert (bereits in Entwicklungsauftrag 9 auf
das angereicherte Format mit Genus/Plural/akzeptierten Formen/Application-Prompts/
Homonym-Gegensatz-Verwechslungs-Hinweisen/vier getrennten Prüf-Booleans erweitert) für Batch 5
ausgeführt: `language-review/batch_05.json` (126 Wort-Einträge + 15 Theorie-Einträge, alle
Prüffelder `false`). `audio_generation_manifest.json` um dieselben 126 Wörter erweitert (jetzt
**642** Einträge insgesamt, weiterhin ausschließlich `status: "needs_language_review"`). Verifiziert:
Batch 0 (141 Einträge) sowie Batch 1-4 (115/132/135/134 Einträge, je 15 theory_review) bleiben
durch die Batch-5-Erzeugung vollständig unverändert — kein bestehender Review-Status oder
Prüfvermerk wurde zurückgesetzt (per Test abgesichert).

### Schritt 7: Content-Tests + Render-/Ablauftest

`test/unit/kurs1Units21to25Content.test.js` (22 Tests, deckt alle 25 im Auftrag Abschnitt 9
genannten Prüfpunkte ab) — u. a. Wort-/Session-/Unit-Zahlen, Unversehrtheit der 24 bereits vorher
vollständigen Wörter, vollständiges Lernmodell, zentrales `part_of_speech`-Vokabular inkl.
„Präposition", `opposite_id`-Gegenseitigkeit, das مِنْ/مَنْ-Homonym, die legitim erhaltenen
"über"/"vor"-Kollisionen, vollständige Theorie exakt passend zum Wortbestand, Batch-5-Struktur
samt Prüf-Booleans, Audio-Manifest-Konsistenz, keine hart codierten Wort-IDs, echte
Zwei-Läufe-Idempotenzprüfung beider Erzeugungsskripte, Unversehrtheit von Batch 0 und Batch 1-4.
Zusätzlich (Auftrag Abschnitt 9, letzter Absatz): ein datenbasierter Render-/Ablauftest, der alle
15 neuen Theoriedokumente über den echten `TheoryRenderer` + einen DOM-Stub (`test/helpers/
domStub.js`, KEINE echte Electron-Oberfläche) mountet, Titel/Lernziele prüft und jeden Mini-Check
mit der jeweils richtigen Antwort bis zum vollständigen Ergebnis (`correct === total`) durchklickt.

### Schritt 8: vollständige Verifikation

```text
npm run lint:              erfolgreich
npm test:                  322/322 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                            ausgeführt: 10/10 erfolgreich (keine Flakiness beobachtet)
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 0-5 (783 vorbereitete Wörter) + 141
                            unbatchte Bestandswörter korrekt auf 0 gefallen
npm run package:source:    erst NACH allen Dokumentationskorrekturen ausgeführt (Auftrag
                            Abschnitt 11), enthält Batch 0-5, alle neuen Skripte/Tests,
                            aktualisierte README/ROADMAP/Sprachpakete
```

Alle bearbeiteten JSON-Dateien zusätzlich mit einem echten JSON-Parser (Python `json.load`)
geprüft. Beide neuen Erzeugungsskripte (`upgrade-kurs1-units21to25.js` und
`build-language-review-and-manifest.js` für Batch 5) je zweimal hintereinander ausgeführt und per
Datei-Diff als idempotent belegt.

Datenstand (von `validate:course`/`report:language-review` berechnet, nicht hart codiert):
**900/900** Minimalmodell, **783/900** Lernfähig/Vollständig (657 vorher + 126 Batch 5),
**75/90** Sessions mit vollständiger Theorie (die übrigen 15 weiterhin klar als Platzhalter
markiert), **783/900** Wörter zur Sprachprüfung vorbereitet (Batch 0-5), **75**
Theorie-Prüfeinträge, **0/900** durch eine arabischkundige Person tatsächlich geprüft, **642**
Einträge im Audio-Generierungsmanifest (0 `ready_for_generation`), weiterhin nur die
ursprünglichen **141** Wörter mit echter Audiodatei, **98** `opposite_id`-Verweise (49 Paare),
**25** Verwechslungsgruppen über 96 Wörter, 3 bestätigte Homonym-Paare (unverändert).

### Manuelle Prüfliste für `npm start` (noch nicht von der KI ausgeführt)

Wie in allen vorigen Runden hat die KI die App nicht selbst visuell in einer laufenden
Electron-Instanz geprüft (kein Screenshot-/Bildschirm-Werkzeug in dieser Umgebung, siehe
Entwicklungsauftrag 9, Nachtrag-Abschnitt, zur genaueren Ursachenanalyse). Die konkrete Prüfliste
für den Nutzer steht im Abschlussbericht dieser Runde.

### Akzeptanzkriterien dieser Runde (Auszug)

`npm test` zehnmal hintereinander erfolgreich, keine Flakiness; Units 21-25 vollständig (126 neue
Wörter geprüft/vervollständigt, die bereits vorher vollständigen 24 Wörter unverändert, 15
Theoriedokumente exakt passend zum Wortbestand, keine Wort-ID aus diesem Batch im JavaScript hart
codiert); beide Erzeugungsskripte zweimal ausgeführt und als idempotent belegt, keine
Prüfvermerke aus Batch 0-4 zurückgesetzt; Application-Prompt-/Grading-Semantik untersucht und mit
8 zusätzlichen Tests gegen den echten Code abgesichert, ohne unnötige Codeänderung; beide
Dokumentationsfehler (Batch-0-Status in Abschnitt 4, "76 Gegensatzpaare"-Ungenauigkeit) behoben;
`language-review/batch_05.json` mit vollständigem Prüf-Format vorhanden; Audio-Manifest auf 642
Einträge erweitert, ohne tatsächlich Audio zu erzeugen; `part_of_speech`/`opposite_id`/
`confusion_group`-Regeln eingehalten (inkl. neuer Wortart „Präposition"); keine
Arabic-Presentation-Forms; Unit-21-Mehrdeutigkeiten bewusst erhalten und erklärt statt entfernt;
alle Zahlen im Bericht vom Validator berechnet, nicht hart codiert; `package:source` erst nach
allen Dokumentationskorrekturen ausgeführt. Units 26-30, tatsächliche Audioerzeugung,
Sprachprüfung durch eine Person mit Arabischkenntnissen und alle in Auftrag 10 Abschnitt 12
genannten Punkte bewusst nicht Teil dieser Runde.
