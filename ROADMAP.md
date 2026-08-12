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
- **Kurs 1 ist seit Entwicklungsauftrag 11 strukturell vollständig: 900/900 Vokabeln über 30
  Vokabel-Units / 90 Sessions, alle im vollen Lernmodell, 90/90 Sessions mit echter Theorie, 0
  Platzhalter mehr** (Entwicklungsauftrag 6-11, Details Abschnitt 10-15). **Seit Entwicklungsauftrag
  12/13 haben alle 900 Wörter eine normale Audiodatei** (141 ursprüngliche Bestandsaufnahmen,
  unverändert, seit der Nachtrag-Runde direkt nach Entwicklungsauftrag 9 mit eigenem
  Sprachprüfeintrag in `language-review/batch_00.json`; 759 über ElevenLabs technisch erzeugte
  Vorschauaufnahmen). **Strukturelle Vollständigkeit und technische Audioverfügbarkeit sind KEINE
  sprachliche Freigabe** — alle 900 Wörter tragen weiterhin `content_status: needs_language_review`,
  0 Wörter wurden von einer Person mit Arabischkenntnissen geprüft, kein Wort/keine Aufnahme ist
  endgültig freigegeben. Alle 900 Wörter sind in einer von sieben Sprachprüfdateien
  (`batch_00.json` bis `batch_06.json`) erfasst und bereit für die echte Sprachprüfung — siehe
  `LANGUAGE_REVIEW_GUIDE.md`.
- **Lokaler Sprachprüf-Arbeitsbereich (Entwicklungsauftrag 12):** eigenes, komplett getrenntes
  Electron-Prüfprogramm (`npm run review:start`, `reviewMain.js`/`reviewPreload.js`/
  `src/review/`) für eine Person mit Arabischkenntnissen — Dashboard, filterbare Wort-/
  Theorieliste, Detailansichten mit Original+Korrekturvorschlag nebeneinander, neun getrennte
  Prüfaspekte, Statusmodell mit Bestätigungspflicht vor Freigabe, Audioanhörprüfung, sicherer
  Export. Details Abschnitt 16.
- **Manifest-gesteuerte Audio-Erzeugungspipeline (Entwicklungsauftrag 12), tatsächlich ausgeführt:**
  `scripts/audio/` + `scripts/audioCli.js` (`audio:plan`/`audio:generate:sample`/
  `audio:generate`/`audio:verify`), Staging + technische WAV-Prüfung + atomare Übernahme,
  Backoff-Retry, erweitertes Manifest-Statusmodell. **759/759 Dateien erfolgreich erzeugt, 0
  Fehlschläge, 141 Bestandsaufnahmen unverändert** — Details Abschnitt 16/17.
- **Vollständige Audio-Integration in die Lernoberfläche (Entwicklungsauftrag 13):** zentrale
  Audio-Schlüssel-Auflösung (`src/js/audioKeyResolver.js`), überarbeiteter `AudioPlayer` mit
  striktem Statusobjekt und `speakWord()`-Einstiegspunkt (nie mehr stille `.catch(() => {})`-
  Fehlschläge), gehärteter IPC-Audiozugriff (`scripts/audioFileAccess.js`, von `main.js` UND
  `reviewMain.js` verwendet), 21 automatisierte Audio-Audits gegen die echten 900 Wörter — Details
  Abschnitt 17.
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
  für alle 900 Wörter, `content_status` weiterhin durchgängig `needs_language_review`; **alle
  900** sind in `language-review/batch_00.json` bis `batch_06.json` dafür vorbereitet, inkl. 90
  `theory_review`-Metadaten. Seit Entwicklungsauftrag 12 gibt es dafür ein eigenes lokales
  Prüfprogramm (`npm run review:start`) — siehe `REVIEWER_QUICKSTART.md`/
  `LANGUAGE_REVIEW_GUIDE.md` für den Ablauf. **Eine KI-Vervollständigung ist keine echte
  Sprachprüfung** — dieser Punkt bleibt der wichtigste offene Schritt des gesamten Projekts).
- ~~"Batch 0" — die 141 ursprünglichen Bestandswörter formal sprachprüfen~~ — die
  **Erfassung** ist erledigt (direkt im Anschluss an Entwicklungsauftrag 9, auf Nutzerwunsch):
  `scripts/build-batch0-legacy-review.js` erzeugt `language-review/batch_00.json` mit allen 141
  Wörtern. Die **tatsächliche Prüfung** durch eine Person mit Arabischkenntnissen steht für diese
  141 Wörter — wie für alle anderen 759 vorbereiteten Wörter auch — weiterhin aus.
- ~~Units 26-30 haben noch das Meilenstein-2-Minimalmodell~~ — in Entwicklungsauftrag 11, Batch 6
  vervollständigt. **Kurs 1 ist damit strukturell vollständig: 900/900 Wörter, 90/90 Sessions mit
  echter Theorie, 0 Platzhalter.**
- ~~Audioerzeugung für alle 759 neuen Wörter komplett zurückgestellt bis nach der Sprachprüfung~~
  — in Entwicklungsauftrag 12 hat der Nutzer die TECHNISCHE Vorschau-Audioerzeugung VOR der
  Sprachprüfung ausdrücklich erlaubt; die Pipeline dafür ist fertig und getestet
  (`scripts/audio/`, `npm run audio:plan`/`audio:generate:sample`/`audio:generate`/
  `audio:verify`). Nach anfänglichem Fail-Fast mangels Schlüssel hat der Nutzer kurz darauf einen
  gültigen `ELEVENLABS_API_KEY` bereitgestellt — **759/759 Dateien erfolgreich erzeugt, 0
  Fehlschläge**, siehe Abschnitt 16. In Entwicklungsauftrag 13 zusätzlich vollständig in die
  Lernoberfläche integriert (siehe Abschnitt 17). Eine **endgültige Audiofreigabe** bleibt in
  jedem Fall an die echte Sprachprüfung gebunden.
- ~~"76 Gegensatzpaare" ungenau formuliert~~ — in Entwicklungsauftrag 10 präzisiert: 76 war die
  Anzahl der `opposite_id`-**Verweise** (38 gegenseitige Paare); nach Batch 6 sind es 108 Verweise
  (54 Paare). Beide Begriffe werden jetzt konsequent unterschieden.
- ~~part_of_speech-Vokabular nicht zentral festgeschrieben~~ — in Entwicklungsauftrag 8 als
  geschlossene, deutschsprachige Liste in `scripts/validateCourse.js` festgeschrieben, in
  Entwicklungsauftrag 11 auf **17 Werte** erweitert (Konjunktion/Partikel/Pronomen (Demonstrativ)/
  Pronomen (Indefinit) für Unit 30 ergänzt) und in eine einzige zentrale Datei
  (`scripts/partOfSpeechVocabulary.js`) ausgelagert, die Validator UND alle Content-Tests
  importieren — keine abweichenden Kopien mehr.
- `opposite_id`/`confusion_group` erst für Units 11-30 vergeben (108 Verweise/54 Paare bzw. 37
  Gruppen über 135 Wörter) — für Units 1-10 rückwirkend zu ergänzen bleibt optional (kein harter
  Fehler, nur Hinweis bei fehlender Nutzung).
- ~~Application-Prompt-Semantik nicht formal festgelegt/validiert~~ — in Entwicklungsauftrag 11
  verbindlich dokumentiert (Besitzerwort = richtige Lösung) und in `validateCourse.js` für alle
  900 Wörter hart geprüft (siehe Abschnitt 15).
- ~~Distraktorauswahl rein zufällig, keine Qualitätssicherung~~ — in Entwicklungsauftrag 11
  qualitativ abgesichert (`pickDistractors()`/`isAcceptableDistractor()`), siehe Abschnitt 15.
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

**Aktueller Stand (nach Entwicklungsauftrag 13, Abschnitt 17): Kurs 1 ist weiterhin STRUKTURELL
VOLLSTÄNDIG — 900/900 Wörter im vollen Lernmodell, 90/90 Sessions mit echter Theorie, 0
Platzhalter, alle 900 Wörter in Batch 0-6 zur Sprachprüfung vorbereitet. Seit Entwicklungsauftrag
12 gibt es dafür ein eigenes lokales Prüfprogramm (`npm run review:start`,
`REVIEWER_QUICKSTART.md`). **Alle 900 Wörter haben jetzt eine normale Audiodatei** (141 Bestand +
759 technisch über ElevenLabs erzeugt, seit Entwicklungsauftrag 13 vollständig in die
Lernoberfläche integriert und automatisiert auditiert — `AUDIO_GENERATION_GUIDE.md`). Strukturelle
und technische Vollständigkeit sind weiterhin KEINE sprachliche Freigabe: weiterhin 0/900 Wörter
tatsächlich geprüft, 0 Audios endgültig freigegeben. Der einzige inhaltlich zwingende nächste
Schritt ist jetzt die ECHTE Sprachprüfung durch eine oder mehrere Personen mit Arabischkenntnissen
über das Prüfprogramm — danach folgen gezielte Regenerierungen einzelner Aufnahmen bei gefundenen
Fehlern sowie die endgültige Freigabe. Größere, weiterhin offene Architekturthemen (Kurs 2-5,
`.arabiccourse`, physische Tastatur, Transliterationsmodus, weiterführende Grammatik, automatische
Übernahme von Review-Korrekturen in die Kursdateien)
bleiben unverändert offen, siehe "Bekannte Lücken" oben. Der Rest dieses Abschnitts ist die
ursprüngliche, vor Entwicklungsauftrag 6 verfasste Planung und historisch zu lesen.**

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

## 15. Entwicklungsauftrag 11: Kurs 1 abschließen – Batch 6 für Units 26-30 und vollständiger Kurs-1-Gesamtaudit (vom Nutzer, 2026-08-09)

Elfter Entwicklungsauftrag, direkt auf Entwicklungsauftrag 10 aufbauend: **Batch 6** (Units 26-30
— Technik/Internet/Medien, Natur/Wetter/Umwelt, Tiere/Pflanzen, Freizeit/Sport/Kultur,
Fragewörter/Konnektoren/Funktionswörter; 117 neue Wörter, 15 Sessions) vervollständigen — der
letzte inhaltliche Batch — und danach einen globalen Kurs-1-Gesamtaudit über alle 900 Wörter/90
Sessions durchführen. Zusätzlich: Wortartenmodell bei Bedarf erweitern, die Application-Prompt-
Semantik verbindlich festlegen und global validieren, die Distraktorauswahl qualitativ absichern,
und `LANGUAGE_REVIEW_GUIDE.md` für die anstehende echte Sprachprüfung erstellen. Explizit NICHT
Teil: Wörter als geprüft markieren, Audioerzeugung, Kurs-2-5-Umbau und alle übrigen in Auftrag 11
Abschnitt 16 genannten Punkte.

### Schritt 1: Bestandsaufnahme — Ist-Stand deckt sich exakt mit der Auftragsbaseline

900 Wörter, 783 vollständig/lernfähig, 117 unvollständig, 75 vollständige + 15 Platzhalter-
Theorien, 783 Wörter in Batch 0-5, 75 Theorie-Prüfeinträge, 900× `needs_language_review`, 0
sprachlich freigegeben, 642 Manifest-Einträge, 0 `ready_for_generation`, 141 Wörter mit
Audiodatei, 322 Unit-Tests + 6 Integrationstests — **alle Werte stimmten exakt überein**. Auch
die genaue Batch-6-Aufteilung (Unit 26: 25/5, Unit 27: 23/7, Unit 28: 20/10, Unit 29: 26/4, Unit
30: 23/7 = 117 neue + 33 bestehende) deckte sich exakt mit den Auftragsangaben.

### Schritt 2: Wortartenmodell sinnvoll erweitert — eine zentrale Quelle geschaffen

Unit 30 (Funktionswörter) brauchte vier neue Kategorien, die vorher fehlten: **Konjunktion**
(وَ/أَوْ/لَكِنْ/ثُمَّ/لِأَنَّ/إِذَا), **Partikel** (هَلْ, die unveränderliche Ja/Nein-Fragepartikel),
**Pronomen (Demonstrativ)** (هَذَا/هَذِهِ) und **Pronomen (Indefinit)** (كُلّ/بَعْض/لَا أَحَد/شَيْء/
لَا شَيْء) — bewusst zwei Pronomen-Unterkategorien statt einer einzigen, weil Demonstrativ- und
Indefinitpronomen grammatisch klar unterscheidbare Funktionen haben (siehe Kommentarkopf
`scripts/partOfSpeechVocabulary.js` für die genaue Abgrenzung). Wichtiger, vom Auftrag
ausdrücklich geforderter Refactor: das Vokabular (jetzt **17 Werte**) lebt seitdem in **einer
einzigen zentralen Datei**, `scripts/partOfSpeechVocabulary.js` — vorher hatten
`scripts/validateCourse.js` UND drei Content-Test-Dateien (Units 11-15/16-20/21-25) je eine
eigene, inline kopierte Liste. `scripts/validateCourse.js` importiert die Datei jetzt direkt, alle
Content-Tests wurden auf denselben Import umgestellt.

### Schritt 3: Batch 6 (Units 26-30) vollständig

Gleiches Vorgehen wie Batch 1-5: `scripts/data/kurs1Units26to30Full.js` + `scripts/upgrade-
kurs1-units26to30.js`. Die 33 bereits vorher vollständigen Bestandswörter (u. a. `tech_computer`,
`weather_sun` × 6, `animal_cat` × 9, `leisure_game` × 3, `q_who` × 6) blieben unangetastet.
Themen-spezifisch, wie vom Auftrag Abschnitt 4 verlangt:

- **Unit 26 (Technik):** Download/Upload als sauberes Gegensatzpaar (تَنْزِيل↔رَفْع), Datei/Ordner
  klar unterschieden (مَلَفّ vs. مُجَلَّد), Benutzername/Passwort als zusammengehöriges, aber nicht
  identisches Login-Paar, moderne MSA-Lehnwörter (فِيدْيُو/كَامِيرَا/مَيْكْرُوفُون) von arabischen
  Neubildungen (حَاسُوب/طَابِعَة) unterschieden und im Theorietext erklärt, warum beide Wege
  nebeneinander existieren.
- **Unit 27 (Natur/Wetter/Umwelt):** دَرَجَة الْحَرَارَة (Temperatur, heute)/مُنَاخ (Klima, über
  Jahre)/بِيئَة (Umwelt, die ganze Natur) explizit als drei NICHT austauschbare Ebenen erklärt
  (Auftrag Abschnitt 4: "Wetter/Klima/Temperatur/Umwelt nicht gleichsetzen"). تَلَوُّث/إِعَادَة تَدْوِير
  neutral und ohne wissenschaftlich fragwürdige Aussagen formuliert.
- **Unit 28 (Tiere/Pflanzen):** erste Session bewusst OHNE neue Wörter (nur Wiederholung der 10
  Bestandstiere), um keine Duplikate zu erzeugen. Theorietext klärt explizit, dass أَرْنَب im
  arabischen Alltag sowohl "Hase" als auch "Kaninchen" abdeckt (Auftrag Abschnitt 4). بَذْرَة→
  جِذْر→نَبَات als klarer Kontext für den Pflanzen-Lebenszyklus statt isolierter Einzelwörter.
- **Unit 29 (Freizeit/Sport/Kultur):** لُعْبَة (Spiel allgemein, Bestand) klar von مُبَارَاة (Spiel/
  Match als Wettkampf) abgegrenzt, عُطْلَة/حَفْلَة/حَفْلَة مُوسِيقِيَّة/سِيَاحَة NICHT als Synonyme
  behandelt (eigene `confusion_group` `c1_leisure_terms`), مُغَنِّي/مُمَثِّل/مُمَثِّلَة konsistent
  behandelt (letzteres Genus-Gegenstück).
- **Unit 30 (Funktionswörter) — mit der vom Auftrag verlangten besonderen Sorgfalt:** jedes der 23
  Wörter bekam in der Theorie eine Erklärung seiner grammatischen Funktion, typischen Satzposition,
  Veränderlichkeit und Abgrenzung von ähnlichen Wörtern — KEINE Aufgabe folgt dem verbotenen Muster
  "Dieses Wort bedeutet aber". Jeder `application_prompt` dieser Unit ist ein vollständiger,
  situativer arabischer Satz (mindestens 6 Wörter lang, per Test verankert), nicht nur eine
  Vokabelgleichung.

Ergebnis: **108** `opposite_id`-Verweise (= **54** gegenseitige Paare, 10 neue Paare in diesem
Batch) und **37** Verwechslungsgruppen über 135 Wörter. Zweimal ausgeführt und per Byte-Vergleich
als idempotent verifiziert.

### Schritt 4: Verbindliche Application-Prompt-Semantik festgelegt und global validiert

Auftrag Abschnitt 7 verlangte eine verbindliche Regel: ein `application_prompt` gehört immer zu
dem Wort, in dessen `application_prompts`-Array er gespeichert ist ("Besitzerwort") — dieses ist
die richtige Lösung. `scripts/validateCourse.js` prüft das jetzt hart für **alle 900 Wörter**:
Fehler, wenn `expected_word_id` auf ein ANDERES Wort zeigt oder unbekannt ist, wenn
`expected_meaning` keiner akzeptierten deutschen Antwort des Besitzerwortes entspricht, oder wenn
Prompt/Lösung leer sind. Beim ersten Testlauf gegen diese neue, strengere Regel wurden **12
ältere, echte Inkonsistenzen** gefunden (10 ursprüngliche Bestandswörter + 2 frühe Batch-1-Wörter,
z. B. `uni_professor` mit `expected_meaning: "Professor / Lehrer"` statt exakt `"Professor"`) —
diese stammten aus einer älteren Skriptversion (`build-kurs1-batch.js`), die das inzwischen
abgelöste Singularfeld `word.german` statt des exakten ersten `german_answers`-Eintrags verwendet
hatte. Behoben durch das neue, einzeln dokumentierte `scripts/fix-legacy-application-prompt-
meanings.js` (reine Metadaten-Korrektur, keine sprachliche Neuinterpretation).

Der tatsächliche Renderer (`renderContextualChoice`) bleibt unverändert — er wertet weiterhin über
Objektidentität aus (`opt.id === ctx.word.id`), nicht über `expected_word_id`/`expected_meaning`.
Der bisherige "Irreführungstest" aus Entwicklungsauftrag 9/10 wurde präzisiert (prüft jetzt
ausdrücklich nur das Laufzeitverhalten) und um einen neuen, separaten Test ergänzt, der den
ECHTEN `validateCourse.js` gegen absichtlich inkonsistente Daten laufen lässt und bestätigt, dass
er sie als harten Fehler zurückweist — läuft dabei gegen eine isolierte temporäre Kopie
(`COURSE_VALIDATE_ROOT`-Umgebungsvariable, neu in `validateCourse.js`), nicht gegen die echte,
gemeinsam genutzte `vocabulary.json` (siehe Schritt 8 zur Race-Condition-Begründung).

### Schritt 5: Distraktorauswahl qualitativ abgesichert

Auftrag Abschnitt 8: die bisherige Distraktorauswahl (`pickRandomOrder(allWords.filter(...)).slice(0,3)`,
identisch an 5 Stellen in `exerciseRegistry.js` kopiert) konnte theoretisch Duplikate, Homonyme
oder bedeutungsgleiche Wörter als "falsche" Optionen neben der richtigen zeigen. Neue Funktionen
`isAcceptableDistractor()`/`pickDistractors()` schließen Kandidaten aus, die dieselbe Wort-ID,
dieselbe angezeigte ODER unvokalisierte arabische Form, dieselbe `homonym_group`, oder eine
vollständig überlappende Menge deutscher Bedeutungen wie das Zielwort haben. Bei einem zu kleinen
oder ausschließlich ungeeigneten Pool wird kontrolliert auf die verbleibenden Kandidaten
zurückgefallen (weniger streng oder weniger Optionen), statt abzustürzen oder mit zu wenigen
Buttons hängen zu bleiben — vollständig rückwärtskompatibel, alle 5 bisherigen Verwendungsstellen
wurden auf die neue gemeinsame Funktion umgestellt, kein bestehendes Verhalten für "normale"
Aufgaben geändert.

### Schritt 6: 15 Theoriedokumente, Batch-Review-Datei, Audio-Manifest

15 vollständige Theoriedokumente (`scripts/apply-kurs1-theory-batch6.js`). `language-review/
batch_06.json` (117 Wort-Einträge + 15 Theorie-Einträge, alle Prüffelder `false`).
`audio_generation_manifest.json` um dieselben 117 Wörter erweitert (jetzt **759** Einträge — alle
759 neuen Wörter, `batch_00.json` bewusst weiterhin ausgeschlossen, da diese 141 Wörter bereits
eine Audiodatei haben, aber keine neue Erzeugung brauchen).

### Schritt 7: Globaler Kurs-1-Gesamtaudit — 0 Probleme gefunden

Da Kurs 1 nach Batch 6 strukturell vollständig ist, wurde zusätzlich ein Gesamtaudit über alle
900 Wörter/90 Sessions durchgeführt — als dauerhafter, automatisierter Test
(`test/unit/kurs1GlobalAudit.test.js`, 23 Tests, deckt alle 25 im Auftrag Abschnitt 11 genannten
Punkte ab), nicht nur als einmalige manuelle Prüfung. Ergebnis: **0 Probleme, alle 23 Tests
grün** — u. a. exakt 900 eindeutige IDs, 30×30 Wörter, 90×10 Sessions, jedes Wort in genau einer
Unit/Session, keine unbekannten Wortverweise, vollständiges Datenmodell für alle 900 Wörter,
bearbeitete Genus-/Pluralfelder, zentrales `part_of_speech`-Vokabular, gegenseitige `opposite_id`,
ausschließlich bewusst markierte Homonyme, nur die 3 bereits dokumentierten deutschen
Übersetzungskollisionen, keine Presentation Forms, 0 Platzhalter-Theorien, exakte
word_preview-Übereinstimmung je Session, genau eine richtige Mini-Check-Lösung pro Frage, gültige
Application-Prompts, genau eine richtige Contextual-Choice-Option (strukturell + Stichprobe mit
echtem Rendering), alle 900 Wörter in genau einer Review-Datei (keine Lücken/Duplikate), alle 90
Theorien in genau einem `theory_review`, kein vorgetäuschter Review-Status, Manifest/Review-
Konsistenz, alle 141 ursprünglichen Audiodateien weiterhin vorhanden und keine neuen erzeugt.
Zusätzlich: ein Render-/Ablauftest, der **alle 90** Vokabel-Theoriedokumente über den echten
`TheoryRenderer` mountet und jeden Mini-Check mit der richtigen Antwort durchklickt (Auftrag
Abschnitt 12, letzter Absatz — "wenn ohne unverhältnismäßigen Aufwand möglich": erwies sich als
gut machbar, ca. 350ms für alle 90 Dokumente).

### Schritt 8: echte Testflakiness gefunden und ursächlich behoben

Bei einem von 10 aufeinanderfolgenden `npm test`-Läufen schlug ein Test mit `Unexpected end of
JSON input` fehl. Ursachenanalyse (nicht nur erneut ausgeführt, bis es grün war): `node --test`
führt mehrere Testdateien standardmäßig **parallel** in separaten Worker-Prozessen aus. Mehrere
neue Idempotenz-Tests (Units 16-20/21-25/26-30, `legacyBatch0Review`) führen dabei per
`execFileSync` Batch-Skripte ein zweites Mal aus, die dieselben, von ANDEREN, gleichzeitig
laufenden Testdateien ebenfalls gelesenen JSON-Dateien (`vocabulary.json`, `batch_NN.json`,
`audio_generation_manifest.json`) per `fs.writeFileSync()` **nicht atomar** überschreiben — ein
gleichzeitiger Leser konnte dadurch einen unvollständig geschriebenen Zwischenstand erwischen.

Behoben durch zwei Maßnahmen:
1. **`scripts/writeJsonAtomic.js`** (neu): erst in eine temporäre Datei im selben Verzeichnis
   schreiben, dann per `fs.renameSync()` atomar umbenennen — analog zum bereits etablierten Muster
   in `src/js/progressStore.js`. In allen 17 Skripten eingesetzt, die JSON-Dateien im
   Sprachpaket/Review-Bereich schreiben (alle `upgrade-kurs1-units*.js`, `build-language-review-
   and-manifest.js`, `build-batch0-legacy-review.js`, `fix-legacy-application-prompt-meanings.js`,
   alle `apply-kurs1-theory-batch*.js`, `apply-script-theory-units*.js`, `backfill-theory-review.js`).
2. Der Validierungstest aus Schritt 4 mutiert die echte `vocabulary.json` gar nicht mehr, sondern
   arbeitet auf einer isolierten temporären Kopie (`COURSE_VALIDATE_ROOT`-Override in
   `validateCourse.js`, neu).

**Verifiziert: `npm test` 20× (2× hintereinander je 10 Läufe) ausgeführt, 20/20 erfolgreich —
keine weitere Flakiness beobachtet.**

### Schritt 9: LANGUAGE_REVIEW_GUIDE.md

Neuer Leitfaden im Projekt-Wurzelverzeichnis für eine Person mit Arabischkenntnissen ohne
technisches Vorwissen: erklärt die 7 Batch-Dateien, jedes Prüffeld, wie Korrekturen einzutragen
sind, die 4 zulässigen Statuswerte (`needs_language_review`/`reviewed`/`needs_correction`/
`unsure`), dass Audiofreigabe erst NACH abgeschlossener Prüfung erfolgt, den Umgang mit
unsicheren/widersprüchlichen Einträgen, und dass keine Review-Datei durch Batch-Skripte
überschrieben werden darf. In dieser Runde selbst wurde kein einziges Prüffeld auf `true` gesetzt
— per Test abgesichert (`Audit 23`).

### Schritt 10: vollständige Verifikation

```text
npm run lint:              erfolgreich
npm test:                  372/372 Unit-Tests + 6/6 Integrationstests, 20× hintereinander
                            ausgeführt: 20/20 erfolgreich (echte Race Condition gefunden+behoben,
                            nicht nur wegretestet)
npm run validate:course:   0 Fehler, 2 Hinweise
npm run report:language-review: erfolgreich, zeigt Batch 0-6 (900 vorbereitete Wörter, 90
                            Theorie-Prüfeinträge, 0 fehlende Vokalisierung/Umschrift/Wortart)
npm run package:source:    erst NACH allen Änderungen/Dokumentationskorrekturen ausgeführt,
                            enthält Batch 0-6, alle neuen Skripte/Tests, LANGUAGE_REVIEW_GUIDE.md
```

Alle bearbeiteten JSON-Dateien zusätzlich mit einem echten JSON-Parser geprüft. Alle neuen
Erzeugungsskripte je zweimal ausgeführt, Idempotenz per Byte-Vergleich belegt.

Bei der abschließenden ZIP-Inhaltsprüfung (Auftrag Abschnitt 15, letzter Absatz — genau dafür
vorgeschrieben) fiel eine echte Lücke auf: `scripts/packageSource.js` verwendet bewusst eine
Allowlist statt einer Blockliste (Entwicklungsauftrag 7) — die in dieser Runde neu angelegte
`LANGUAGE_REVIEW_GUIDE.md` stand dort schlicht noch nicht drin und fehlte deshalb in der ersten
erzeugten ZIP. Behoben durch Ergänzung des Dateinamens in der `INCLUDE`-Liste, danach
`package:source` erneut ausgeführt und per `unzip -l` gezielt nachgeprüft, dass
`LANGUAGE_REVIEW_GUIDE.md`, alle 7 `language-review/batch_0N.json`, alle neuen Skripte/Tests und
die aktualisierten README.md/ROADMAP.md tatsächlich enthalten sind (515 → 516 Einträge, +13,9 KB).
Ohne diese Stichprobenprüfung wäre der Leitfaden für die Sprachprüfung nicht Teil der Übergabe
gewesen — ein gutes Beispiel dafür, warum der Auftrag die ZIP-Prüfung als eigenen Schritt verlangt
statt sich auf das bloße Ausführen von `package:source` zu verlassen.

Endstand (von `validate:course`/`report:language-review` berechnet, nicht hart codiert):
**900/900** Wörter vollständig/lernfähig, **0** unvollständig. **90/90** Theorien vollständig, 0
Platzhalter. **900/900** Wörter in Batch 0-6 zur Sprachprüfung vorbereitet, **90**
Theorie-Prüfeinträge. Weiterhin **900/900** `needs_language_review`, **0** tatsächlich
sprachlich freigegeben. **759** Einträge im Audio-Generierungsmanifest, **0**
`ready_for_generation`, weiterhin genau **141** Wörter mit vorhandener (unveränderter)
Audiodatei — 759 Wörter weiterhin ohne erzeugte Audiodatei. Keine Abweichung vom erwarteten
Endstand aus Auftrag Abschnitt 14.

### Manuelle Prüfliste für `npm start` (noch nicht von der KI ausgeführt)

Wie in allen vorigen Runden hat die KI die App nicht selbst visuell in einer laufenden
Electron-Instanz geprüft (kein Screenshot-/Bildschirm-Werkzeug in dieser Umgebung). Die konkrete
Prüfliste für den Nutzer steht im Abschlussbericht dieser Runde.

### Akzeptanzkriterien dieser Runde (Auszug)

`npm test` 20× hintereinander erfolgreich (echte Race Condition gefunden und ursächlich behoben);
Units 26-30 vollständig (117 neue Wörter, 33 Bestandswörter unverändert, 15 Theoriedokumente
inkl. vollständiger Beispielsätze für Unit 30, keine hart codierten Wort-IDs); Wortartenmodell um
genau die nötigen 4 Kategorien erweitert, in einer einzigen zentralen Datei zusammengeführt;
Application-Prompt-Semantik verbindlich dokumentiert und für alle 900 Wörter hart validiert, 12
ältere Inkonsistenzen einzeln dokumentiert behoben; Distraktorauswahl qualitativ abgesichert,
rückwärtskompatibel; globaler 25-Punkte-Gesamtaudit als dauerhafter Test verankert, 0 Probleme;
Render-/Ablauftest für alle 90 Theoriedokumente; `LANGUAGE_REVIEW_GUIDE.md` erstellt, keine
Prüffelder vorab auf `true` gesetzt; README/ROADMAP dokumentieren klar den Unterschied zwischen
struktureller Vollständigkeit und sprachlicher Freigabe; `package:source` erst nach allen
Dokumentationskorrekturen ausgeführt und Inhalt verifiziert; alle Zahlen vom Validator berechnet,
nicht hart codiert. Wörter als geprüft markieren, Audioerzeugung, Kurs-2-5-Umbau und alle übrigen
in Auftrag 11 Abschnitt 16 genannten Punkte bewusst nicht Teil dieser Runde.

## 16. Entwicklungsauftrag 12: Lokaler Sprachprüf-Arbeitsbereich und technisch freigegebene Vorschau-Audioerzeugung (vom Nutzer, 2026-08-10)

Zwei Ziele, klar voneinander getrennt: (1) ein sicheres lokales Prüfwerkzeug für eine Person mit
Arabischkenntnissen bauen, (2) die vom Nutzer Moritz Schallenberg ausdrücklich erlaubte
TECHNISCHE Erzeugung der 759 fehlenden Vokabelaudios als ausdrücklich ungeprüfte
Vorschauaufnahmen durchführen — mit der expliziten Klarstellung im Auftragstext, dass diese
Erlaubnis **nicht** bedeutet, die Inhalte seien sprachlich bestätigt, die Aussprache geprüft oder
die Audios endgültig freigegeben. Audioerzeugung ist nicht gleich Audiofreigabe.

### Schritt 1: Bestandsaufnahme — Ist-Stand deckt sich exakt mit der Auftragsbaseline

900/900 Wörter vollständig, 90/90 Theorien vollständig, 900 Wörter in Batch 0-6, 90
Theorie-Prüfeinträge, 900× `needs_language_review`, 0 tatsächlich geprüft, 0 endgültig
freigegeben, 759 Manifest-Einträge, 141 Wörter mit normaler UND 141 mit langsamer Audiodatei, 759
ohne eigene Audiodatei, 372 Unit- + 6 Integrationstests, Lint/Validierung fehlerfrei — exakter
Abgleich, keine Abweichung. Zusätzlich vorab geprüft: kein `ELEVENLABS_API_KEY` in der
Entwicklungsumgebung gesetzt (wichtig für Schritt 7).

### Schritt 2: Audio-Manifest-Statusmodell erweitert (Abschnitt 9)

`scripts/audio/audioManifestModel.js` führt drei unabhängige, zusätzliche Statusachsen ein —
`language_status` (Sprachstand), `generation_status` (technischer Erzeugungsstand: `pending` →
`preview_generation_authorized` → `generated_unreviewed`/`failed`/`regeneration_required`) und
`audio_review_status` (Anhörprüfung: `not_reviewed`/`approved`/`rejected`/`uncertain`) — sowie ein
`generation`-Metadatenobjekt (Provider/Modell/Voice-ID/Zeitpunkt/Eingabetext/Text-Hash/
Prüfsumme/Grund). Das alte `status`-Feld bleibt für alle 759 Einträge BYTE-UNVERÄNDERT bestehen
(`scripts/validateCourse.js` liest weiterhin `e.status === 'ready_for_generation'`). Migration
über `scripts/upgrade-audio-manifest-model.js` — idempotent (zweiter Lauf meldet "bereits
migriert"), inkl. automatischer Stichprobenprüfung, dass sich `status` nicht geändert hat, sonst
Abbruch ohne Schreibvorgang. Zusätzlich `unit_id`/`session_id` aus `vocabulary.json` ergänzt
(fehlten im ursprünglichen Manifest komplett — nötig für Batch-/Unit-Filter und die
repräsentative Stichprobe, siehe Schritt 4).

**Echter Fehler gefunden und behoben:** das bestehende, aus Entwicklungsauftrag 6/7 stammende
Skript `scripts/build-language-review-and-manifest.js` (wird von mehreren älteren
Content-Test-Dateien als Idempotenz-Check per `execFileSync` real ausgeführt) ERSETZTE bei einem
bereits vorhandenen Manifest-Eintrag dessen kompletten Inhalt durch ein frisch gebautes Objekt im
ALTEN, fünf-Felder-Schema — dadurch gingen bei jedem `npm test`-Lauf, der eine dieser
Idempotenz-Prüfungen ausführte, für die betroffenen Batches die neuen Statusfelder wieder
verloren (bei einer stichprobenartigen Kontrolle nach mehreren Testläufen: 243 von 759 Einträgen
ohne `generation_status`). Behoben durch einen Objekt-Merge statt einer Ersetzung (`{
...bestehenderEintrag, ...neueBasisfelder }`) — ein erneuter Lauf aktualisiert seither nur die
ihm bekannten Basisfelder (falls sich z. B. `arabic_vocalized` durch eine Korrektur geändert hat)
und lässt alle seither hinzugekommenen Felder unangetastet. Verifiziert: `audio_generation_
manifest.json` über `scripts/upgrade-audio-manifest-model.js` neu geheilt, danach `npm test`
dreimal hintereinander ausgeführt, alle 759 Einträge blieben vollständig migriert.

### Schritt 3: Audio-Erzeugungspipeline (Abschnitte 8, 10-13)

`scripts/audio/` (Provider-Anbindung `ttsProviders.js`, technische WAV-Prüfung
`wavValidation.js`, Orchestrierung `audioPipeline.js`) + CLI `scripts/audioCli.js` mit den
Befehlen `plan`/`generate`/`verify`, verdrahtet als `npm run audio:plan` /
`audio:generate:sample` / `audio:generate` / `audio:verify`. Manifest-gesteuert (verarbeitet
NIEMALS pauschal das ganze Vokabular), `arabic_vocalized` wird bei jeder Erzeugung frisch aus
`vocabulary.json` gelesen statt aus dem (potenziell veralteten) Manifest-Cache. Staging
(`language-packs/arabic/audio/.staging/`, gitignored) → technische Prüfung (gültiger WAV-Header,
plausible Größe/Dauer, nicht stumm, keine als WAV gespeicherte JSON-/HTML-Fehlerantwort) → erst
danach atomare Übernahme in den produktiven Ordner. Begrenzter Backoff-Retry (bis zu 3 Versuche,
Wartezeit verdoppelt sich, gedeckelt), nicht wiederholbare Fehler (401/402) brechen sofort ohne
weitere Versuche ab. **Kein `--force` für den Gesamtlauf** — zusätzlich eine eigene
Laufzeit-Schutzprüfung in `generateOne()`, die eine bereits vorhandene, nicht vom aktuellen Lauf
selbst erzeugte Datei niemals überschreibt (zweite, unabhängige Absicherung der 141
Bestandsaufnahmen). Ein unterbrochener Lauf ist von selbst fortsetzbar (nur `pending`/`failed`/
`regeneration_required`-Einträge werden erneut ausgewählt).

Ein echter Fehler wurde beim ersten Entwurf der Stichprobenauswahl gefunden und behoben: die
anfängliche `representativeSample()`-Implementierung wählte naiv "ein Wort je Unit" in
alphabetischer Reihenfolge — bei 20 angeforderten Wörtern deckte das nur die Units 1-20 ab (=
Batch 1-4), Batch 5 und 6 fehlten komplett, und die geforderte phonetische Abdeckung (Hamza,
ʿAyn, Schadda, Tanwin, emphatische Konsonanten, mehrteilige Ausdrücke, Funktionswörter) war reiner
Zufall. Behoben durch eine gezielte, deterministische Auswahl: zuerst je ein Wort aus jedem der 6
Batches, danach je ein Wort mit jedem der geforderten Merkmale (per Unicode-Musterprüfung bzw.
`part_of_speech`/`unit_id`-Filter für Funktionswörter/Technikbegriffe), erst danach sequentiell
aufgefüllt — reproduzierbar (zwei Aufrufe liefern identische IDs) und per Test verifiziert.

### Schritt 4: Zeichen-/Dateibedarf aus echten Daten neu berechnet (Abschnitt 11)

Standardmäßig wird NUR `<id>.wav` erzeugt, keine `_slow.wav` — `audioPlayer.js` nutzt für
langsame Wiedergabe bereits `playbackRate=0.75` auf der normalen Datei, wenn keine eigene
`_slow.wav` existiert (seit Entwicklungsauftrag 5). Tatsächlich berechnet (nicht die veraltete
Schätzung "500-800 Zeichen für den gesamten Kurs" aus einer früheren, kleineren Projektphase):
**759 fehlende Wörter ≈ 6.159 Zeichen** für die normale Aufnahme allein, **≈ 12.318 Zeichen**,
wenn zusätzlich alle `_slow.wav` erzeugt würden (was dieser Auftrag bewusst nicht tut).

### Schritt 5: Provider und Kostenschutz (Abschnitt 12)

Bevorzugter Anbieter ElevenLabs, Modell `eleven_multilingual_v2`. Vor jedem `generate`-Lauf gibt
die Pipeline automatisch eine Kostenschutz-Vorschau aus (Dateien/Zeichen/API-Aufrufe/bereits
vorhanden/übersprungen). Fehlt `ELEVENLABS_API_KEY`, bricht die Pipeline **sofort ab, BEVOR
irgendein Wort verarbeitet oder das Manifest verändert wird** ("Fail-Fast") — keine stille
Umschaltung auf `espeak-ng` oder eine andere Stimme für produktnahe Aufnahmen (das wäre laut
Auftrag ausdrücklich nicht erlaubt). `espeak-ng` bleibt in `ttsProviders.js` als eigens
gekennzeichnete `synthesizeWithEspeakTechnicalSample()`-Funktion nur für rein technische
Pipeline-Tests vorhanden, wird von keinem `audio:*`-npm-Skript automatisch verwendet.

### Schritt 6: Staging/technische Prüfung, Regenerierung nach Korrektur (Abschnitte 13, 15)

Siehe Schritt 3 für Staging/Prüfung. Für die Rückkopplung aus dem Review-Modus (Schritt 8): wird
im Prüfprogramm die Vokalisierung eines Wortes korrigiert oder seine Aussprache als "Korrektur
vorgeschlagen"/"unsicher" markiert, setzt `scripts/review/reviewWorkspaceStore.js` gezielt und
ausschließlich den `generation_status`/`audio_review_status` des betroffenen Manifest-Eintrags
(NICHT `vocabulary.json`/`theory.json`) — die vorhandene Datei wird nie gelöscht, es wird nie
automatisch neu erzeugt.

### Schritt 7: Stichprobe und Gesamtlauf versucht — sauber blockiert, ehrlich dokumentiert (Abschnitt 14/20)

`npm run audio:generate:sample` (20-Wörter-Stichprobe, deterministisch über alle 6 Batches +
phonetische Merkmale verteilt) und `npm run audio:generate` (voller Lauf für alle 759 Wörter)
wurden in dieser Entwicklungsumgebung tatsächlich ausgeführt. Beide brachen wie vorgesehen
sofort mit einer klaren Fehlermeldung ab: `ELEVENLABS_API_KEY ist in dieser Umgebung nicht
gesetzt`. Verifiziert: das Manifest blieb dabei byte-identisch unverändert (759× weiterhin
`generation_status: "pending"`), es wurde keine einzige Datei geschrieben. **Ergebnis: 0 von 759
Audiodateien in dieser Runde tatsächlich erzeugt.** Das ist exakt das im Auftragstext für diesen
Fall vorgesehene Verhalten ("keine falsche Erfolgsmeldung, Pipeline und Review-Modus trotzdem
fertigstellen, genaue Zahl nennen, Blocker dokumentieren") — keine verschwiegene Lücke. Die
Pipeline selbst ist vollständig fertiggestellt und ausschließlich über eingeschleuste
Provider-Mocks automatisiert getestet (kein einziger echter API-Aufruf in einem Test).

### Schritt 8: lokaler Sprachprüf-Arbeitsbereich ("Review-Modus") (Abschnitte 2-7, 15-17)

Ein komplett eigener, getrennter Electron-Prozess: `reviewMain.js`/`reviewPreload.js` (Wurzel,
analog zu `main.js`/`preload.js`, gleiche Sicherheitsvorgaben: `contextIsolation:true`,
`nodeIntegration:false`, `sandbox:true`, schmale, benannte IPC-Kanäle statt direktem
Dateisystemzugriff aus dem Renderer), eigene Oberfläche unter `src/review/` (klassische
`<script>`-Tags im geteilten Scope, konsistent mit `src/index.html`), Start über
`npm run review:start`. Rührt `main.js`/`preload.js`/`src/index.html` nicht an — die normale
Lernoberfläche bleibt über `npm start` unverändert erreichbar.

**Backend** (`scripts/review/`): `reviewConstants.js` (EINE zentrale Quelle für Aspekt-/
Statusvokabular, per IPC an die Oberfläche gereicht statt doppelt gepflegter Kopie — dasselbe
Prinzip wie `scripts/partOfSpeechVocabulary.js` aus Entwicklungsauftrag 11),
`reviewWorkspaceStore.js` (sicheres Speichern — wiederverwendet bewusst die bereits etablierten,
getesteten Bausteine aus `src/js/progressStore.js`: atomares Schreiben mit Backup,
sicheres Lesen mit Backup-Fallback, Speicherwarteschlange je Datei; Korrekturen mit
Original+Vorschlag gleichzeitig sichtbar via `corrections[field] = {originalValue,
proposedValue}`; Konflikterkennung über eine Versionsnummer je Eintrag; vollständiger, append-only
Änderungsverlauf mit vorherigem Wert/Vorschlag/Feld/Zeitstempel/Prüferkürzel/Begründung),
`reviewDataLoader.js` (verknüpft `vocabulary.json`/`theory.json`/`vocabSessions.json`/
`audio_generation_manifest.json`/alle `batch_NN.json` rein lesend, berechnet Audiozustand pro Wort
unabhängig davon, ob es im Manifest steht (759 neue) oder eine ältere Bestandsaudio hat (141) oder
noch fehlt (0 nach heutigem Stand), berechnet alle Dashboard-Zählungen ausschließlich aus den
tatsächlich geladenen Daten — keine Zahl ist hart codiert).

**Statusmodell** exakt wie im Auftrag verlangt: neun getrennte Prüfaspekte je Wort
(Vokalisierung/Umschrift/Übersetzung/Wortart/Genus+Plural/akzeptierte arabische Antworten/
Application-Prompts/Homonym-Gegensatz-Verwechslung/Audioaussprache), neun eigene für Theorien;
fünf Ergebniswerte je Aspekt; fünf übergeordnete Status. Regeln hart im Backend durchgesetzt (nicht
nur in der Oberfläche, per Test verifiziert): Öffnen ändert nie einen Status; Bearbeiten eines
Aspekts setzt nie automatisch den Gesamtstatus; `reviewed` scheitert, solange ein Aspekt noch
`not_yet_reviewed` ist (aber `uncertain` zählt als bearbeitet); `approved` scheitert zusätzlich,
solange irgendein Aspekt nicht `correct`/`not_applicable` ist, UND ohne eine gesonderte, explizite
Bestätigung (`explicitConfirmation: true`) — die Oberfläche zeigt vor diesem Klick immer zuerst
die vollständige Liste aller Korrekturvorschläge zum Eintrag. `vocabulary.json`/`theory.json`
bleiben durch den Review-Modus zu jedem Zeitpunkt unverändert — Korrekturen landen ausschließlich
in `language-review/workspace/` (neu, noch leer, da diese Runde bewusst keinen einzigen Eintrag
selbst auf `reviewed`/`approved` setzt).

**Oberfläche** (`src/review/js/`, sichere Ausgabe ausschließlich über `textContent`/
`createElement`/`setAttribute` — kein `innerHTML` mit aus Daten stammendem Text, arabischer Text
bekommt automatisch `dir="rtl"`): Dashboard (alle Zählungen aus Schritt "Backend" oben),
Wortliste (Suche + Filter nach Batch/Unit/Session/Wortart/Prüfstatus/Audiozustand/nur mit
Korrekturen/nur unsicher/mit-ohne Audio), Wortdetailansicht (alle Felder mit
Original+Korrekturvorschlag nebeneinander, Application-Prompts als bearbeitbarer JSON-Vorschlag,
Audioplayer + Aussprache-Aspekt, Statuskontrollen), Theorieliste, Theoriedetailansicht (rendert
alle Blocktypen des echten Theorieschemas — Überschrift/Absatz/Callout/Beispiel/Vergleichstabelle/
Wortvorschau/Mini-Check mit Lösung —, generischer Fallback für unbekannte Blocktypen statt
Absturz), Export-Knopf.

### Schritt 9: Tests

Neue Testdateien, ausschließlich gegen isolierte temporäre Verzeichnisse bzw. mit eingeschleusten
Mocks, kein einziger echter API-Aufruf, keine echte Electron-Instanz nötig:
`audioWavValidation.test.js` (10 Tests, synthetische WAV-Buffer), `ttsProviders.test.js` (9 Tests,
Mock-HTTP-Client, u. a. "kein Aufruf ohne Schlüssel", "401/402 nicht wiederholbar"),
`audioManifestModel.test.js` (6 Tests), `audioPipeline.test.js` (17 Tests: Auswahl, Plan,
Dry-Run, erfolgreiche Erzeugung mit Prüfsumme/Text-Hash, Fehlerantwort wird nicht übernommen,
Bestandsschutz bei ID-Kollision, Fortsetzbarkeit nach Unterbrechung, Backoff-Verhalten,
nicht-wiederholbare Fehler brechen sofort ab, `verify()`-Konsistenzprüfung, keine `_slow.wav`
standardmäßig, kein API-Schlüssel in Logs/Manifest), `audioCli.test.js` (5 End-zu-Ende-Tests über
echte Kindprozesse gegen `AUDIO_PIPELINE_ROOT`-isolierte Kopien), `reviewWorkspaceStore.test.js`
(16 Tests: alle Statusregeln, Änderungsverlauf, Backup-Wiederherstellung, parallele
Speichervorgänge, Export-Inhalt), `reviewDataLoader.test.js` (7 Tests, u. a. gegen das ECHTE
Sprachpaket: exakt 900/90/759/141/0), `reviewModeUi.test.js` (10 Render-/Ablauftests über einen
VM-Kontext mit `window.reviewApi`-Mock, u. a. sichere Darstellung eines Feldes mit
HTML-Sonderzeichen, RTL-Kennzeichnung, Regel 1/5/6 auch in der Oberfläche verifiziert). Der
gemeinsame Test-Helfer `test/helpers/domStub.js` wurde additiv um `replaceChildren()` und einen
vollständigeren `document`-Stub (`body`, `getElementById`, `addEventListener`/`dispatchEvent`)
erweitert — bestehende Tests unverändert grün.

### Schritt 10: Dokumentation

Neu: `REVIEWER_QUICKSTART.md` (Schnellstart ohne technisches Vorwissen für die Person, die
prüft), `AUDIO_GENERATION_GUIDE.md` (technische Anleitung für das Entwicklungsteam). Aktualisiert:
`LANGUAGE_REVIEW_GUIDE.md` (neuer Abschnitt 0.1 verweist auf das Prüfprogramm als empfohlenen Weg,
Abschnitt 3 beschreibt beide Wege, Abschnitt 5 komplett überarbeitet — eine vorhandene Audiodatei
ist weiterhin keine Sprachprüfung, auch eine technisch erzeugte nicht), `README.md` (neuer
Hauptabschnitt, neue Befehle dokumentiert), dieses `ROADMAP.md`.

### Schritt 11: vollständige Verifikation

Bei der vorgeschriebenen ZIP-Inhaltsprüfung (wie schon in Entwicklungsauftrag 11) fiel erneut
eine Lücke in der Allowlist von `scripts/packageSource.js` auf: `REVIEWER_QUICKSTART.md` und
`AUDIO_GENERATION_GUIDE.md` fehlten in der ersten erzeugten ZIP dieser Runde. Behoben durch
Ergänzung der beiden Dateinamen, ZIP neu erzeugt, per `unzip -l` gezielt nachgeprüft.

```text
npm run lint:              erfolgreich (144 JS-Dateien, 0 Kollisionen)
npm test:                  452/452 Unit-Tests + 6/6 Integrationstests
npm run validate:course:   0 Fehler, 2 Hinweise (unverändert)
npm run package:source:    enthält reviewMain.js/reviewPreload.js/src/review/**/scripts/audio/**/
                            scripts/review/**, REVIEWER_QUICKSTART.md, AUDIO_GENERATION_GUIDE.md
```

Zusätzlich `npm test` wiederholt hintereinander ausgeführt (regulär + ein eigener 40-Iterationen-
Stresstest) zur Kontrolle, dass die neuen, viele temporäre Verzeichnisse/Kindprozesse
verwendenden Tests keine neue Testflakiness einführen — ein einzelner, nicht mit Details
protokollierter Ausreißer ganz zu Beginn (vor Beginn der systematischen Log-Aufzeichnung), danach
67 weitere Läufe durchgehend sauber; keine nicht-atomare Schreiboperation auf eine von mehreren
Testdateien gemeinsam genutzte Datei in den neuen Skripten gefunden (Staging-Dateien sind
eindeutig benannt und pro Testlauf isoliert, Export schreibt in einen frischen temporären
Zielordner) — als Restrisiko mit sehr geringer Eintrittswahrscheinlichkeit eingestuft, kein
weiterer Handlungsbedarf identifiziert.

### Manuelle Prüfliste für `npm start`/`npm run review:start` (noch nicht von der KI ausgeführt)

Wie in allen vorigen Runden hat die KI weder die normale Lern-App noch das neue Prüfprogramm
selbst visuell in einer laufenden Electron-Instanz geprüft (kein Bildschirm-Werkzeug in dieser
Umgebung). Die konkrete Prüfliste für den Nutzer steht im Abschlussbericht dieser Runde.

### Akzeptanzkriterien dieser Runde (Auszug)

Review-Modus vollständig lokal, ohne Cloud-Synchronisierung/Konto/externe Datenbank, sichere
Preload-/IPC-Schnittstellen, kein direkter Dateisystemzugriff aus dem Renderer, korrekte
RTL-Darstellung, sichere textbasierte Ausgabe; alle sieben Statusregeln aus Abschnitt 5 hart im
Backend durchgesetzt und per Test verifiziert; `vocabulary.json`/`theory.json` durch den
Review-Modus unverändert; kein einziger Eintrag in dieser Runde selbst auf `reviewed`/`approved`
gesetzt; Audio-Erzeugungspipeline manifest-gesteuert, staged, technisch geprüft, mit Backoff,
Prüfsummen, Text-Hash, Provider-/Modell-/Zeitpunkt-Dokumentation, ohne `--force` für den
Gesamtlauf, mit hartem Schutz der 141 Bestandsaufnahmen; ehrlich dokumentiertes Ergebnis von
0/759 tatsächlich erzeugten Dateien mangels API-Schlüssel, keine Vortäuschung eines Erfolgs, keine
stille Umschaltung auf einen anderen Anbieter; alle Tests gegen isolierte Verzeichnisse bzw. mit
Mocks, kein echter API-Aufruf in der Testsuite. Sprachprüfung durch Claude, endgültige
Audiofreigabe, Kauf bezahlter Credits, automatische Übernahme von Review-Korrekturen in die
Kursdateien, Kurs-2-5-Umbau, `.arabiccourse`-Format, Cloud-Synchronisierung, Benutzerkonten und
großes Interface-Redesign bewusst nicht Teil dieser Runde.

## 17. Entwicklungsauftrag 13: Vollständige Audio-Integration, Wiedergabeprüfung und konsistente Paketierung (vom Nutzer, 2026-08-10)

Nach der in Entwicklungsauftrag 12 vom Nutzer erlaubten technischen Vorschau-Audioerzeugung
stellt dieser Auftrag sicher, dass die 900 Audiodateien auch tatsächlich zuverlässig in der
Lernapp eingebunden, geladen und abgespielt werden — Audioerzeugung ist nicht gleich
Audiointegration, und Audiointegration ist weiterhin nicht gleich Audiofreigabe.

### Vorgeschichte: die 759 Audiodateien wurden zwischen Auftrag 12 und 13 tatsächlich erzeugt

Direkt im Anschluss an den Abschlussbericht zu Entwicklungsauftrag 12 (der ehrlich "0/759
erzeugt, mangels API-Schlüssel" dokumentierte) hat der Nutzer im Gespräch nachgefragt, was genau
fehlt. Nach Erklärung des Blockers hat der Nutzer einen ElevenLabs-API-Schlüssel bereitgestellt —
der erste Versuch schlug fehl (die tatsächliche Fehlermeldung von ElevenLabs zeigte: es handelte
sich um die "Key-ID", nicht um den echten `sk_...`-API-Schlüssel; außerdem stellte sich beim
Nachfragen heraus, dass eine dritte Person zeitweise Zugriff auf diesen ursprünglichen Schlüssel
hatte, was die zwischenzeitlich beobachtete unerklärliche Kontingent-Bewegung erklärte). Mit einem
zweiten, korrekten `sk_...`-Schlüssel wurde zunächst die 20-Wörter-Stichprobe erfolgreich erzeugt
und technisch verifiziert (gültige WAV-Header, plausible Dauer 0,7-1,6s, nicht stumm), danach —
nach einer Kontingentprüfung (10.000 Zeichen/Monat im Free-Tier, 8.893 verbleibend, Bedarf für die
restlichen 739 Wörter ca. 5.960 Zeichen) — der vollständige Lauf für die restlichen 739 Wörter.
**Ergebnis: 759/759 Audiodateien erfolgreich erzeugt, 0 Fehlschläge**, `npm run audio:verify`
bestätigte anschließend 759/759 technisch in Ordnung, die 141 Bestandsaufnahmen blieben
nachweislich byte-identisch unverändert. Kein API-Schlüssel wurde in einer Datei gespeichert,
committet oder geloggt — er existierte ausschließlich als Umgebungsvariable für die einzelnen
Erzeugungsaufrufe dieser Sitzung.

### Schritt 1: Baseline-Prüfung

Ausgangsstand exakt wie vom Auftrag angegeben verifiziert: 900/900 Wörter, 90/90 Theorien, 900
`needs_language_review`, 900 normale + 141 langsame Audiodateien vorhanden, 759 Manifest-
Einträge `generated_unreviewed`/`not_reviewed`, 452 Unit- + 6 Integrationstests. Zwei vom Auftrag
selbst benannte, tatsächlich vorgefundene Abweichungen bestätigt (nicht einfach übernommen,
sondern selbst nachgeprüft): (1) `dist-source/learning-arabic-source.zip` war vor der
Audioerzeugung gebaut worden und enthielt nur 141+141 Audiodateien; (2) `vocabulary.json` hatte
bei allen 759 neuen Wörtern ein verwaistes `audio_status: "missing"`-Feld aus einer sehr frühen
Projektphase (`scripts/build-kurs1-batch.js`, Entwicklungsauftrag 6/7) — nie aktualisiert, obwohl
die Wörter inzwischen echte Audiodateien hatten; die 141 Bestandswörter hatten das Feld nie.

### Schritt 2: Audio-Statusmodell bereinigt (Abschnitt 3.2)

`scripts/audio/audioStatusModel.js` definiert fünf eindeutige, sich gegenseitig ausschließende
Werte (`available_legacy_unreviewed` / `generated_unreviewed` / `reviewed` / `missing` /
`generation_failed`), die AUSSCHLIESSLICH technische Verfügbarkeit/Herkunft beschreiben — nie die
sprachliche Prüfung (dafür bleibt `content_status` zuständig). `scripts/upgrade-vocabulary-audio-
status.js` setzt das Feld bei allen 900 Wörtern idempotent, abgeleitet aus Manifest + tatsächlicher
Dateiverfügbarkeit (kein manuell gepflegter Zweitstand, der wieder veralten könnte). Ergebnis: 141×
`available_legacy_unreviewed`, 759× `generated_unreviewed`. Zusätzlich in `npm run validate:course`
hart verankert: widerspricht `audio_status` je der tatsächlichen Dateiverfügbarkeit, schlägt die
Validierung fehl.

### Schritt 3: zentrale Audio-Schlüssel-Auflösung (Abschnitt 5)

Codesuche fand 14 verstreute, direkte `` `vocabulary/${word.id}` ``-Konstruktionen in
`sessionController.js` (11×), `exerciseRegistry.js`, `listening.js`, `vocabulary.js`,
`freePractice.js` — eine davon (`exerciseRegistry.js#audioKeyFor`) ignorierte dabei ein bereits
vorhandenes `word.audio_key` komplett. Neues `src/js/audioKeyResolver.js#resolveVocabularyAudioKey()`
ist jetzt die EINE Stelle: bevorzugt `word.audio_key`, fällt nur bei komplett fehlendem Feld
kontrolliert auf die ID-Form zurück, warnt sichtbar (Konsole) bei einem vorhandenen, aber leeren/
ungültigen Feld statt es zu verdecken. Alle 14 Stellen umgestellt, inkl. Doppelklick-Schutz über
ein optional durchgereichtes Button-Element (`mkBtn`/`mkIconBtn` in `sessionController.js`
erweitert, geben das eigene Element jetzt an `onClick` weiter).

### Schritt 4: `audioPlayer.js` überarbeitet (Abschnitt 6.4/8)

`speak()` liefert jetzt `{source: 'recorded_audio'|'tts_fallback'|'failed', mode: 'normal'|
'dedicated_slow'|'slowed_normal'|'tts_fallback'|'failed', audioKey}` und **wirft/rejected nie
mehr** — auch ein TTS-Fehlschlag löst mit `source:'failed'` auf, statt die Promise abzulehnen.
Neue Methode `AudioPlayer.speakWord(word, {slow, context, button})`: löst den Schlüssel über
Schritt 3 auf, schützt per Button-Element gegen schnelles Mehrfachstarten (`WeakSet` aktiver
Buttons + sofortiges `disabled=true`), meldet Fehlschläge/TTS-Fallbacks über das neue
`src/js/audioFeedback.js` (sichtbare, automatisch verschwindende Meldung + Konsolenprotokoll,
ARIA-Live-Region für Screenreader) statt sie stillschweigend zu verschlucken. Alle 14 Stellen aus
Schritt 3 nutzen jetzt `speakWord()`; die verbreiteten `.catch(() => {})`-Blöcke sind entfallen.
Bewusst NICHT umgestellt: die 4 rein buchstabenbezogenen Stellen (`alphabet.js`,
`letterGroupLesson.js`, `vocalization.js`, `onboarding.js`) — außerhalb des Auftragsumfangs
("Vokabeln"), funktionieren unverändert weiter (ihr `.catch(() => {})` ist jetzt zwar
unerreichbarer Code, aber harmlos, da `speak()` nicht mehr wirft).

### Schritt 5: keine überlappende Wiedergabe (Abschnitt 6.3)

`AudioPlayer.stopCurrentAudio()` wurde vorher nirgends von außerhalb von `audioPlayer.js` selbst
aufgerufen — nur implizit beim Start einer neuen Wiedergabe. `app.js#runCleanup()` (läuft vor
JEDER der zehn `navigateTo*`-Funktionen) ruft jetzt zentral `AudioPlayer.stopCurrentAudio()` auf;
zusätzlich beim Öffnen eines Bestätigungsdialogs (`sessionController.js#showDialog`) und beim
Erreichen der Session-Zusammenfassung (`renderSummaryPhase`).

### Schritt 6: IPC-Härtung (Abschnitt 9)

Neuer gemeinsamer Baustein `scripts/audioFileAccess.js` (von `main.js` UND `reviewMain.js`
verwendet, statt zwei leicht unterschiedlicher Implementierungen): strikte
`audioKey`-Musterprüfung (genau ein Unterverzeichnis + Dateiname, keine Punkte -> `..` strukturell
unmöglich), `path.resolve` + unabhängige Verzeichnis-Präfixprüfung als zweite Verteidigungslinie,
explizite Ablehnung erkannter absoluter Pfade, nur `.wav`. `reviewMain.js` erwartet jetzt
konsistent mit `main.js` einen vollständigen `audioKey` (vom Renderer über den Resolver aufgelöst)
statt einer rohen Wort-ID. `main.js` zusätzlich um eine unabhängige `languageId`-Prüfung gegen
eine feste Syntax UND die tatsächlich installierten Sprachpakete ergänzt (vorher gar nicht
geprüft). 12 neue Sicherheitstests (`test/unit/audioFileAccess.test.js`): Traversal (`..`,
verschachtelt, Backslash-Varianten), absolute Pfade, Sonderzeichen/Nullbytes, fehlende/leere
Schlüssel — alle abgelehnt, ohne zu werfen.

### Schritt 7: globaler 21-Punkte-Audio-Audit (Abschnitt 10)

`test/unit/audioIntegrationAudit.test.js` implementiert alle 20 im Auftrag genannten Prüfungen
plus die geforderte Stichprobe über alle 30 Units, gegen die echten Sprachpaketdateien, mit
konkreten IDs bei Problemen statt bloßer Summen. Für Punkt 14 (Bestandsaufnahmen bytegenau
unverändert) neue Referenzdatei `test/fixtures/legacyAudioChecksums.json` (141 SHA-256-Prüfsummen,
vor jeder Auftrag-13-Änderung erfasst). **Alle 21 Tests bestanden.**

### Schritt 8: ein echter Testfehler durch die neue Validierung aufgedeckt und behoben

Die neue `audio_status`-Prüfung in `validateCourse.js` (Schritt 2) brach einen bestehenden
Entwicklungsauftrag-11-Test (`applicationPromptGrading.test.js`): dieser kopiert für eine
isolierte Validierung absichtlich nur die JSON-Sprachpaketdateien in ein temporäres Verzeichnis,
ohne die Audiodateien — die neue Prüfung schlug deshalb dort für alle Wörter fehl ("Datei fehlt").
Behoben durch einen Symlink (statt einer ~57-MB-Kopie von 900 WAV-Dateien) auf den echten
Audio-Ordner im isolierten Testverzeichnis; verifiziert, dass `fs.rmSync(..., {recursive:true})`
beim Aufräumen nur den Symlink selbst entfernt, nie die echten Zieldateien (eigens mit einem
Wegwerf-Verzeichnis geprüft, bevor die echten 900 Audiodateien in Gefahr gewesen wären).

### Schritt 9: Dokumentation

`README.md` (neuer Hauptabschnitt, korrigierte "0/759"-Angaben aus dem vorherigen Auftrag-12-Text
auf den tatsächlichen Erfolg), `AUDIO_GENERATION_GUIDE.md` (neuer Abschnitt 0.1 "Aktueller Stand"
sowie neuer Abschnitt 11 zur Lernoberflächen-Integration), `LANGUAGE_REVIEW_GUIDE.md` (Abschnitt 5
korrigiert: alle 900 Wörter haben jetzt tatsächlich Audio, nicht mehr nur potenziell), dieses
`ROADMAP.md`.

### Schritt 10: vollständige Verifikation

```text
npm run lint:              erfolgreich (153 JS-Dateien, 0 Kollisionen)
npm test:                  506/506 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                            ausgeführt, alle 10 Läufe sauber (keine neue Race Condition durch die
                            zusätzlichen dateisystemlastigen Audio-Tests)
npm run validate:course:   0 Fehler, 1 Hinweis (audio_status/audio_key-Konsistenz neu geprüft)
npm run report:language-review: unverändert konsistent (900 vorbereitet, 0 geprüft)
npm run audio:verify:      759/759 in Ordnung, 0 Probleme
npm run package:source:    35,8 MB, 1.322 Einträge (vorher 11,3 MB/553 -- Zuwachs entspricht den
                            759 neuen Audiodateien)
```

Zusätzlich: ZIP in ein frisches temporäres Verzeichnis entpackt (kein `node_modules` darin,
genau 900 normale + 141 langsame Audiodateien bestätigt), `npm test` (506/506 + 6/6) UND
`npm run validate:course` (0 Fehler) **aus dem entpackten Paket heraus** erneut ausgeführt statt
sich auf den Rückgabewert von `package:source` allein zu verlassen. Zusätzlich ein ungepackter
Electron-Build erzeugt (`npx electron-builder --linux --dir`, in dieser Umgebung erfolgreich, da
Netzwerkzugriff auf die offiziellen Electron-Release-Binaries möglich war) und das resultierende
`app.asar` mit `asar list` inspiziert: exakt 900 normale und 141 langsame Vokabel-Audiodateien
enthalten, keine API-Schlüssel im gebündelten Manifest. Temporäre Build-/Entpack-Verzeichnisse
danach aufgeräumt (lagen außerhalb des Repositorys, in `/tmp`).

### Manuelle Prüfliste für `npm start` (noch nicht von der KI ausgeführt)

Wie in allen vorigen Runden hat die KI die App nicht selbst visuell in einer laufenden
Electron-Instanz geprüft (kein Bildschirm-Werkzeug in dieser Umgebung). Die konkrete, vom Auftrag
geforderte Prüfliste (normale/langsame Wiedergabe für ein Bestands- und ein neues Wort aus den
Units 1/5/10/15/20/25/30, Hörübung, kein vorzeitiges Verraten der Antwort, Wiedergabe nach
Antwort, schwierige Wörter, Vokabelbrowser, freie Übung, Sprachprüfmodus-Audio, Stoppen bei
Navigation, schnelles Mehrfachklicken, Neustart der App) steht im Abschlussbericht dieser Runde.

### Akzeptanzkriterien dieser Runde (Auszug)

Alle 900 Wörter haben eine funktionierende normale Wiedergabe über eine zentrale, getestete
Schlüsselauflösung; langsame Wiedergabe funktioniert für 141 Wörter über eine eigene Datei und für
759 über den bestehenden `playbackRate`-Fallback; Wiedergabe stoppt zuverlässig bei Navigation/
Dialogen/Session-Ende; Audiofehler werden nicht mehr stillschweigend verschluckt, sondern sichtbar
gemeldet; IPC-Audiozugriff in `main.js` UND `reviewMain.js` gegen Pfad-Traversal/absolute Pfade/
ungültige `languageId` gehärtet und getestet; `audio_status` widerspricht nie der tatsächlichen
Dateiverfügbarkeit (hart validiert); die 141 Bestandsaufnahmen bytegenau unverändert (Prüfsummen-
Nachweis); kein Wort/keine Aufnahme als sprachlich/akustisch geprüft markiert; keine erneute
kostenpflichtige Audioerzeugung ohne nachgewiesenen Defekt; das neue Quellpaket enthält
nachweislich alle 900+141 Audiodateien und lässt sich eigenständig testen und bauen. Sprachprüfung
durch Claude, endgültige Audiofreigabe, Kurs-2-5-Umbau, `.arabiccourse`-Format und großes
Interface-Redesign bewusst nicht Teil dieser Runde.

## 18. Entwicklungsauftrag 14: Einheitliches Designsystem sowie Hell- und Dunkelmodus (vom Nutzer, 2026-08-10)

Reines Präsentationsauftrag: die normale Lernoberfläche (nicht der Sprachprüf-Arbeitsbereich aus
Auftrag 12, der weiterläuft, aber bewusst nicht neu gestaltet wird) bekommt ein zentrales,
tokenbasiertes Designsystem mit vollständigem Hell- und Dunkelmodus. Keine Wort-/Theorie-/
Audio-Änderung, keine Sprachprüfung, kein neuer Sitzungsfluss, kein neues Feedbacksystem.

### Schritt 1: Baseline-Prüfung

Ausgangsstand exakt wie von Auftrag 13 hinterlassen bestätigt: Commit `165804e`, 506 Unit- + 6
Integrationstests, 900 normale + 141 langsame Vokabel-Audiodateien vorhanden, kein bestehendes
Theme-System außer einem einzelnen `<select>` mit einer toten dritten Option "Systemeinstellung".

### Schritt 2: Speicherung — bestehendes Modell erweitert, kein zweiter Mechanismus (Abschnitt 8)

`src/js/progressStore.js` bekommt eine zweite, zum bestehenden `migrateProgress()`-Muster
analoge Migrationsfunktion `migrateSettings()`: `_version`-Feld, `normalizeThemeValue()` (nur
`"light"`/`"dark"` gültig, jeder andere Wert inkl. des früheren `"system"` fällt kontrolliert auf
Hell zurück), vollständige Feld-Defaults. `main.js#loadUserData('settings')` ruft diese Funktion
auf und persistiert die Migration sofort, genau wie beim bestehenden Fortschritts-Modell — **keine
zweite, unabhängige Speicherdatei**, wie im Auftrag ausdrücklich verlangt.

### Schritt 3: Aufblitzen des falschen Modus verhindert, ohne die Sicherheitsarchitektur anzufassen (Abschnitt 9)

Da `contextIsolation`/`sandbox`/`nodeIntegration` unverändert bleiben mussten, kann der Renderer
das Theme nicht selbst aus einer Datei lesen. Lösung: ein neuer, bewusst der EINZIGE synchrone
IPC-Kanal im Projekt, `theme:getInitial` (`ipcMain.on` + `event.returnValue`, kein `.handle()`,
die sind immer asynchron), von `preload.js` per `ipcRenderer.sendSync()` abgefragt und als
`window.initialTheme` exponiert. `src/js/earlyTheme.js` — als externe Datei, weil die
`Content-Security-Policy` in `src/index.html` `'unsafe-inline'` verbietet — ist das allererste
`<script>` im `<head>`, noch vor dem Stylesheet-Link, und setzt `data-theme` auf `<html>`, bevor
irgendetwas gerendert wird.

### Schritt 4: Designsystem-Tokens (Abschnitt 4)

`src/css/style.css`: neuer Token-Block in drei Teilen — ungestyltes `:root` (jetzt mit
Hell-Werten als Absicherung), `:root[data-theme="light"]`, `:root[data-theme="dark"]`. Farben,
5 Abstandsgrößen, 3 Eckenradien, Karten-/Dialogschatten, Übergangsgeschwindigkeit, Höhen für
Buttons/Eingaben, Schriftgrößen (inkl. dreier arabischer Stufen + Zeilenhöhe). Die alten
`--color-*`-Namen bleiben als Aliase auf die neuen Tokens erhalten (z. B.
`--color-text: var(--text-primary)`), damit der bestehende Code, der sie verwendet, automatisch
beide Modi korrekt mitmacht, ohne dass jede Ansicht einzeln angefasst werden musste — geprüft:
diese Aliase werden NICHT in den Theme-Blöcken erneut festgeschrieben, sonst würde die Kette
brechen.

### Schritt 5: ein echter Kontrastfehler gefunden und behoben

`#0c1620` (eine feste, dunkle Schriftfarbe "auf Akzentflächen") war in sechs Komponentenregeln
hart verdrahtet (`.btn`, virtuelle Tastatur, Fortschrittsanzeige, Chips) — unabhängig vom Modus.
Im Dunkelmodus ist die Akzentfarbe hell (passt zu dunkler Schrift), im neuen Hellmodus ist sie
dunkelblau (dunkle Schrift darauf wäre kaum lesbar gewesen). Neues Token `--on-accent` mit
eigenem Wert je Modus, alle sechs Stellen umgestellt; `connectionTrainer.js` hatte densel­ben Wert
zusätzlich einmal inline im JS — ebenfalls auf `var(--on-accent)` umgestellt.

### Schritt 6: Grundkomponenten und Theme-Umschalter (Abschnitt 6/7)

`.btn`/`.card`/`.text-input` u. a. auf die neuen Größen-/Schatten-/Radius-Tokens umgestellt, neue
Klassen ergänzt (`.btn.text`, `.btn.danger`, `.btn.back`, `.btn-small`, `.search-field`,
`.settings-row`, Checkbox-/Radio-Styling mit `accent-color`). Neue gemeinsame Komponente
`src/js/themeToggle.js` (zwei echte `<button type="button">`, `role="group"`, `aria-label`,
`aria-pressed`, sichtbarer aktiver Zustand über Klasse UND `aria-pressed`, nicht nur Farbe) — in
zwei Varianten verwendet: voll beschriftet in den Einstellungen, kompakt (nur Symbol, aber
weiterhin mit `aria-label`) im Kopfbereich jeder Seite. `app.js#renderHeader()` rendert den
Kopfbereich jetzt immer (vorher kollabierte er auf leeren Seiten komplett), damit der kompakte
Schalter überall erreichbar ist.

### Schritt 7: arabische Typografie konsolidiert (Abschnitt 12)

Gemeinsamer Regelblock für `.arabic-word-main`, `.arabic-example`, `.arabic-text`:
`direction: rtl`, `unicode-bidi: isolate`, `overflow-wrap: break-word` (lange Wörter laufen nicht
mehr aus Karten heraus), je eigene Schriftgröße/Zeilenhöhe aus den neuen Tokens. Neue
`.arabic-input`-Klasse für Texteingaben mit denselben RTL-Grundeigenschaften.

### Schritt 8: Tests

41 neue Tests (Unit-Testanzahl 506 → 547): `settingsMigration.test.js` (18, inkl. Ende-zu-Ende
gegen echte temporäre Dateien: Theme übersteht simulierten Neustart, alte `"system"`-Datei wird
migriert UND persistiert, ein Theme-Wechsel lässt andere Einstellungen unangetastet),
`themeToggle.test.js` (9, inkl. Tastaturbedienbarkeit über native `<button>`-Elemente),
`designSystem.test.js` (13, inkl. Prüfung auf höchstens 4 verstreute hartcodierte Hex-Farben
außerhalb der Tokenblöcke — bewusst kein Nulltoleranz-Verbot einzelner, begründeter Werte), plus
ein weiterer neuer Test direkt in `settings.test.js` (sofortiges Nachziehen des aktiven
Schalter-Zustands nach der Auswahl). 12 bestehende Tests in `appShell.test.js`/`settings.test.js`
an die bewusst geänderten Verträge angepasst (Kopfbereich kollabiert nicht mehr; `<select>` durch
die echte Schalter-Komponente ersetzt) — nicht geschwächt, sondern auf dasselbe zugrunde liegende
Verhalten gegen die neue, korrekte Implementierung umgeschrieben.

### Schritt 9: Ansichten-Sweep und Barrierefreiheit-Nachbesserung

Codesuche über alle Ansichten (`src/js/views/*.js`, `src/js/app.js`, `src/js/session/*.js`) fand
**keine** hartcodierten Hex-/RGB-Farben mehr in JavaScript oder HTML — alle Ansichten binden
bereits ausschließlich Klassen und die (jetzt korrekt kaskadierenden) `--color-*`-Aliase ein,
sodass keine einzelne Ansicht händisch umgestellt werden musste. Separat fünf echte, vom Auftrag
verlangte Barrierefreiheits-Lücken gefunden: fünf reine Symbol-Buttons (🔊, "Aussprache abspielen")
in `onboarding.js` (2×), `letterGroupLesson.js`, `alphabet.js`, `freePractice.js` und
`vocabulary.js` hatten kein `aria-label` (im Unterschied zu den bereits korrekten Stellen in
`sessionController.js`, `exerciseRegistry.js` und `listening.js`) — alle fünf ergänzt.

### Schritt 10: echte visuelle Verifikation gelungen (Abweichung vom bisherigen Muster aller vorigen Runden)

In allen vorigen Entwicklungsaufträgen konnte die KI die App mangels Bildschirm-Werkzeug nie
selbst laufen sehen. Dieses Mal wurde das erstmals durchbrochen: die Sandbox-Umgebung stellte
sich als eine echte, aktive GNOME/Wayland-Desktopsitzung heraus (nicht als isolierter
Headless-Container), mit einem laufenden Xwayland-Server. Nach ausdrücklicher Rückfrage beim
Nutzer (ein sichtbares Fenster auf dem echten Bildschirm ist ein spürbarer Eingriff, keine
stillschweigend zu treffende Entscheidung) und dessen Zustimmung wurde `playwright-core` 1.51.1
(die letzte mit dem in dieser Umgebung installierten Node 18 kompatible Version; neuere Versionen
verlangen Node 20) als Tarball direkt von der npm-Registry bezogen — `npm install` selbst blieb
aus ungeklärten Gründen dauerhaft hängen. Über die `_electron`-API von Playwright wurde die echte
Electron-App gestartet (ein `ELECTRON_RUN_AS_NODE=1` in der Shell-Umgebung musste dafür entfernt
werden, sonst startet Electron als reiner Node-Prozess ohne Fenster) und über eine reale
Bildschirmsitzung tatsächlich bedient und fotografiert:

- Frischer Start ohne vorherige Einstellungsdatei → Hellmodus aktiv (Vorgabe erfüllt).
- Dashboard und Einstellungen in Hell- UND Dunkelmodus fotografiert — Karten klar vom Hintergrund
  abgesetzt, guter Kontrast, keine reine Umkehrung (eigene Werte je Modus sichtbar).
- Theme-Umschalter in den Einstellungen UND der kompakte Kopfbereich-Schalter sichtbar, korrekt
  beschriftet (`aria-label`: "Helles Farbschema" / "Dunkeles Farbschema (aktiv)"), Wechsel wirkt
  sofort, ohne Neuladen der Ansicht.
- Ein Schreibtraining (echte Übung mit virtueller arabischer Tastatur) gestartet und MITTEN in
  der laufenden Übung auf Dunkel umgeschaltet — die Übung lief unterbrechungsfrei weiter (Abschnitt
  7, "keine Unterbrechung einer aktiven Sitzung", live bestätigt statt nur angenommen).
- Vier Fenstergrößen geprüft: 1200×800 (Standard), 1366×768, 1920×1080, 900×600 (das in `main.js`
  konfigurierte Minimum). Bei 900×600 kein horizontaler Overflow (`scrollWidth === clientWidth`
  bestätigt), aber der App-Titel in der Seitenleiste wurde bei dieser Minimalbreite mitten im
  Wort abgeschnitten — echter, kleiner Fund, behoben durch `text-overflow: ellipsis` in
  `.app-title` (vorher nur `overflow: hidden` ohne Auslassungspunkte).
- Zurückschalten von Dunkel auf Hell in den Einstellungen ebenfalls live bestätigt.

**Wichtige Nebenfeststellung:** Diese Testläufe liefen gegen das ECHTE Nutzerprofil
(`~/.config/Learning Arabic Tool/user_data/`, seit dem 18.07.2026 bestehend), nicht gegen ein
isoliertes Testprofil. Vor jeder Bewertung wurde deshalb geprüft, ob echte Nutzerdaten verändert
wurden: `progress.json` (161 KB echter Lernfortschritt) blieb nachweislich byte-für-byte
unverändert (Soll-/Ist-Abgleich gegen die vom bestehenden Backup-Mechanismus automatisch
angelegte `.bak`-Kopie); `settings.json` wurde durch die Testklicks tatsächlich auf `theme:
"dark"` verändert — nach Abschluss der Verifikation aus der `.bak`-Kopie (Stand unmittelbar vor
dem ersten Testlauf: `theme: "light"`) wiederhergestellt, damit der Nutzer keine ungewollte
Nebenwirkung dieser Prüfung in seiner echten Installation vorfindet.

### Schritt 11: vollständige Verifikation

```text
npm run lint:            erfolgreich (158 JS-Dateien, 0 Kollisionen)
npm test:                 547/547 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                           ausgeführt, alle 10 Läufe sauber
npm run validate:course:  0 Fehler, 1 Hinweis (unverändert gegenüber Auftrag 13 — keine
                           Wort-/Theorie-/Audio-Änderung in dieser Runde)
npm run audio:verify:     759/759 in Ordnung, 0 Probleme
npm run package:source:   35,8 MB, 1.327 Einträge
```

Zusätzlich: ZIP in ein frisches temporäres Verzeichnis entpackt, `npm install` dort ausgeführt,
`npm test` (547/547 + 6/6), `npm run lint` und `npm run validate:course` **aus dem entpackten
Paket heraus** erneut ausgeführt — alle erfolgreich. 1.041 Vokabel- + 56 Buchstaben-Audiodateien
im entpackten Paket bestätigt (900 normale + 141 langsame Vokabelaufnahmen, unverändert
gegenüber Auftrag 13); alle neuen Designsystem-Dateien (`earlyTheme.js`, `themeToggle.js`,
`style.css` mit `data-theme`-Regeln) im Paket enthalten. Temporäre Verzeichnisse danach
aufgeräumt (lagen außerhalb des Repositorys, in `/tmp`).

### Manuelle Prüfliste für `npm start`

Auch wenn diese Runde erstmals eine echte automatisierte Sichtprüfung enthielt, ersetzt das keine
manuelle Prüfung durch den Nutzer selbst — die automatisierte Prüfung deckte gezielt einzelne
Ansichten/Zustände ab, nicht jede Kombination aus Ansicht × Modus × Fenstergröße.

**Theme-Umschaltung:**
1. App frisch starten (falls schon einmal gestartet: `~/.config/Learning Arabic Tool/user_data/
   settings.json` vorher löschen oder `"theme"` entfernen) → Hellmodus muss aktiv sein.
2. In den Einstellungen auf "Dunkel" wechseln → sofortige Umstellung, kein Neuladen, keine
   Ruckler.
3. Mitten in einer laufenden Lernsession (z. B. während "Frei üben") über den kompakten
   Kopfbereich-Schalter das Theme wechseln → die Übung darf nicht unterbrochen/zurückgesetzt
   werden.
4. App komplett beenden und neu starten → das zuletzt gewählte Theme muss weiterhin aktiv sein.

**Je Ansicht in Hell UND Dunkel prüfen:** Dashboard, Kursübersicht, Unit-Detailansicht, laufende
Session, Theorieanzeige (insbesondere längere Fließtexte), Vokabelbrowser, freie Übung,
Hörübungen, Grammatikbereiche, Alphabet, Verbindungstrainer, Vokalisierungstrainer, virtuelle
Tastatur, Einstellungen, Dialoge/Fehlermeldungen. Worauf achten: klare Kartenabgrenzung vom
Hintergrund, lesbarer Text (auch grauer/gedämpfter Text), deutlich unterscheidbare
Erfolgs-/Fehler-/Warnfarbe, arabische Vokalisierungszeichen nicht abgeschnitten, keine
überlaufenden langen arabischen Wörter, Audio-Buttons sichtbar und anklickbar, sichtbarer
Fokusring bei Tab-Navigation.

**Fenstergrößen:** Minimalgröße des Fensters (per Fensterrand ziehen, bis es nicht mehr kleiner
wird), 1366×768, 1920×1080. Achten auf: horizontales Scrollen, abgeschnittene Buttons,
überlappenden Text, verschwundene Audio-Buttons, zu kleine arabische Schrift, unbenutzbare
Einstellungsseite.

**Funktionaler Kurztest (unverändertes Verhalten):** Kursnavigation, Session starten/fortsetzen,
Theorie öffnen/schließen, normale UND langsame Audiowiedergabe, Antwortbewertung, virtuelle
Tastatur, schwierige Wörter, Einstellungen speichern, Lernfortschritt, Wiederholungsfunktionen,
freie Übung, Sprachprüfmodus (`npm run review:start`) startet weiterhin unverändert.

### Automatisiert / manuell / technisch gerendert / visuell bestätigt — strikt getrennt

- **Automatisiert getestet (553 Tests):** Theme-Migration/-Validierung/-Persistenz, Theme-Wechsel-
  Logik, Theme-Umschalter-Komponente (inkl. Tastaturbedienbarkeit über native Buttons und
  `aria-label`), Vorhandensein aller geforderten Design-Tokens, Hell-/Dunkel-Wertunterschied bei
  8 zentralen Farbtoken, Höchstgrenze verstreuter Hex-Farben, RTL-Grundeigenschaften der
  arabischen Textklassen, alle bestehenden Funktionstests (Audio, Navigation, Grading,
  Sprachprüfmodus-Start usw.) unverändert grün.
- **Technisch gerendert und live bestätigt (neu in dieser Runde):** Dashboard/Einstellungen in
  Hell und Dunkel, kompakter Kopfbereich-Schalter samt `aria-label`, Theme-Wechsel ohne
  Sitzungsunterbrechung, kein horizontaler Overflow bei 900×600, Layout bei 1366×768/1920×1080.
- **Nicht visuell geprüft (weder automatisiert noch manuell in dieser Runde):** alle übrigen in
  Schritt 6 des Auftrags aufgezählten Ansichten (Kursübersicht, Unit-Detail, Theorieanzeige,
  Vokabelbrowser, Hörübungen, Grammatikbereiche, Alphabet, Verbindungstrainer,
  Vokalisierungstrainer, virtuelle Tastatur, Dialoge) sowie jede Ansicht im Dunkelmodus einzeln —
  hierfür gilt weiterhin die manuelle Prüfliste oben.

### Akzeptanzkriterien dieser Runde (Auszug)

Zentrales, tokenbasiertes Designsystem vorhanden und automatisiert gegen Regression abgesichert;
vollständiger Hell- und Dunkelmodus mit eigenständigen, nicht bloß invertierten Werten; ein echter
Kontrastfehler behoben; Theme-Wahl übersteht einen Neustart über das bestehende, erweiterte
Speichermodell (keine zweite Speicherdatei); Theme-Wechsel ohne Neuladen und ohne
Sitzungsunterbrechung (live bestätigt); kein Aufblitzen des falschen Modus dank synchronem
Haupt-Prozess-IPC, ohne die Electron-Sicherheitsarchitektur zu verändern; arabische Typografie
zentral konsolidiert; 900 Wörter/90 Theorien/900+141 Audiodateien nachweislich unverändert; keine
Funktionsregression (553/553 Tests, 10× hintereinander grün); Quellpaket enthält alle
Design-System-Dateien und alle Audiodateien und wurde entpackt eigenständig erneut getestet.
Sprachprüfung, Audioerzeugung, neuer Sitzungsfluss, neues Feedbacksystem und grundlegend neue
Kursübersicht bewusst nicht Teil dieser Runde.

## 19. Entwicklungsauftrag 15: Lernziele, Theorie, Lernkarten und Audio-Lernphase (vom Nutzer, 2026-08-11)

Erster inhaltlicher Umbau des Sessionablaufs seit Entwicklungsauftrag 5: die ersten fünf Stufen
des neuen zehnstufigen pädagogischen Modells werden entwickelt (Lernziele, kurze Theorie, neue
Wörter als Lernkarten, Audio kennenlernen, gemeinsame Wortübersicht) — der Nutzer soll alle Wörter
kennenlernen, bevor eine verpflichtende Abfrage beginnt. Die bestehenden Übungsphasen (Wieder-
erkennen bis Abschluss) laufen nach Stufe 5 unverändert weiter; ihre endgültige Neuzuordnung zu
Stufe 6-10 folgt erst in Entwicklungsauftrag 16.

### Schritt 1: Baseline-Prüfung

Ausgangsstand exakt wie vom Auftrag angegeben verifiziert: 900/900 Wörter, 90 Session-Theorien
(plus 8 unabhängige Schrift-Theorien, macht 98 gesamt in `theory.json` — bereits vor diesem
Auftrag so), 900 normale + 141 separate langsame Vokabelaudios, 759 Wörter mit
verlangsamter-normaler Aufnahme, zentrales Designsystem samt Hell-/Dunkelmodus aus Auftrag 14
weiterhin vollständig, 547 Unit- + 6 Integrationstests. Keine Abweichung festgestellt. Die vom
Auftrag benannte Ausgangs-ZIP (`Arabisch Lerntool Entwicklungsauftrag 14.zip`) wurde inhaltlich
mit dem bestehenden Arbeitsverzeichnis abgeglichen (byte-identisch bis auf projektinterne
Metaverzeichnisse `.git`/`.github`/`.gitignore`) — direkt im vorhandenen Repository weitergearbeitet.

### Schritt 2: zentrales Stufenmodell, keine zweite Session-Engine (Abschnitt 5)

Neues `src/js/session/learningStages.js`: fünf Stufen (`learning_goals`, `theory`, `word_cards`,
`audio_familiarization`, `word_overview`) mit deutschen Labels, Nummer 1-5, `TOTAL_DISPLAY_STAGES
= 10` und der ehrlichen Übergangskonstante `AFTER_STAGE_5_LABEL = "Als Nächstes: Übungen"`
(Abschnitt 6). Bewusst bilden die fünf Stufen NUR die bestehenden ersten zwei Phasentypen
('theory', 'word_preview') feiner ab — `vocabSessions.json` (`sessionDef.phases`) bleibt
vollständig unverändert, `SessionEngine.phaseIndex` bleibt die alleinige Quelle der Wahrheit für
den großen Ablauf. Stufe 1 (Lernziele) liegt dabei VOR dem Phasendurchlauf (Sessionübersicht,
wie schon zuvor), Stufe 2 entspricht `phaseIndex 0`, Stufen 3-5 sind drei Unterstufen von
`phaseIndex 1`, gesteuert über ein neues `learningStageState`-Feld im Session-Snapshot.

### Schritt 3: Stufe 1 — Lernziele/Sessionübersicht (Abschnitt 7)

`renderSessionOverview()` überarbeitet: zeigt jetzt zusätzlich die Unit, verwendet
`theory.learning_objectives`, sonst eine sachliche Ersatzformulierung nach dem im Auftrag
vorgegebenen Muster ("N Wörter zu THEMA" / "die Wörter zu erkennen und auszusprechen" / "sie
anschließend in Übungen selbst anzuwenden") — keine erfundenen Inhalte. Der "Ablauf"-Kasten nennt
jetzt die fünf neuen Stufenlabel plus "Übungen" statt der rohen internen Phasennamen. Bei
Wiederaufnahme: "Session fortsetzen" als Hauptaktion, aktuelle Stufe wird benannt ("Du bist bei:
Stufe 3 von 10 – Neue Wörter kennenlernen"), "Von vorne beginnen" bleibt sekundär und weiterhin
bestätigungspflichtig (bestehender Mechanismus unverändert).

### Schritt 4: Stufe 2 — Theorie ohne Pflicht-Mini-Check (Abschnitt 8)

`TheoryRenderer.mount()` bekommt eine neue Option `mode: 'learning_intro'`: mini_check-Blöcke
werden in diesem Modus GAR NICHT gerendert (nicht nur unverbindlich), der Start-Button heißt
standardmäßig "Weiter zu den Lernkarten" und ist nie deaktiviert. Die Mini-Check-Daten selbst
bleiben in `theory.json` vollständig erhalten — beim späteren erneuten Öffnen der Theorie während
der Übungen (`renderTheoryReview()`, unverändert, kein `mode`) erscheinen sie weiterhin wie zuvor.
Zusätzlich: `word_preview`-Blöcke (die in allen 90 Theorien vorhandene 10-Wort-Vorschau) bekommen
normale UND langsame Audio-Buttons über einen neuen `onPlayWordAudio`-Callback, verdrahtet auf
`AudioPlayer.speakWord()` — echte, bereits vorhandene Audiodateien, keine neue Erzeugung.

### Schritt 5: Stufe 3 — neue Wörter als Lernkarten (Abschnitt 9-11)

Der alte, gruppenbasierte Wortlern-Ablauf (Dreiergruppen + Gruppen-Mini-Checks,
`renderWordLearningPhase`/`runGroupMiniCheck` u. a.) wurde vollständig ersetzt durch
`renderWordCardsStage()`: eine Karte pro Wort, KEINE Zwischenabfrage. Jede Karte zeigt in fester
Hierarchie: Position, großes arabisches Wort, deutsche Hauptbedeutung, Umschrift (nach
Einstellung), normale/langsame Audiowiedergabe, kompakte Grammatik-Metazeile (nur vorhandene
Felder — kein "Plural: null"), weitere Bedeutungen (dezent), ein aus `application_prompts[0]`
abgeleitetes Anwendungsbeispiel als lesbarer Text (keine JSON-Struktur), sowie einen
aufklappbaren Bereich (natives `<details>`/`<summary>`, von Haus aus tastaturbedienbar) für
Homonyme/Verwechslungen/Gegenteil/weitere akzeptierte Schreibweisen — neues
`src/js/session/wordRelations.js` löst `confusion_group`/`homonym_group`/`opposite_id` zu den
TATSÄCHLICH zugeordneten Wortobjekten auf, nie als rohe interne ID. Jede Karte hat außerdem "Als
schwierig markieren" (neu: `AppState.isWordMarkedDifficult`/`toggleWordDifficult` in `state.js`,
auf demselben bestehenden Karten-Speicherplatz wie `card.difficulty`, kein zweiter Mechanismus).

`preview_seen` (Grundlage des Tageslimits) wird jetzt NUR beim expliziten Weitergehen gesetzt
(Klick auf "Weiter →", erlaubte Tastaturnavigation, oder Verlassen der letzten Karte) — nicht mehr
beim bloßen Rendern, wie es die alte Implementierung tat (Abschnitt 10, echte Verhaltensänderung,
mit eigenem Test abgesichert). Navigation: "Zurück"/"Weiter →", Positionsanzeige, Pfeiltasten
links/rechts, Leertaste für Audio — AUSSER der Fokus liegt auf einem Button/Eingabefeld (damit
keine normale Buttonbedienung überschrieben wird). Genau ein aktiver Tastatur-Listener gleichzeitig
(neues `removeEventListener` im gemeinsamen Test-DOM-Stub ergänzt, um das zu testen).

### Schritt 6: Stufe 4 — Audio kennenlernen (Abschnitt 12, komplett neu)

Neue, eigenständige `renderAudioFamiliarizationStage()`: pro Wort großes arabisches Wort, deutsche
Bedeutung, normale/langsame Wiedergabe, Position ("Audio 3 von 10"), sichtbarer Wiedergabestatus
("Bereit"/"Wird abgespielt …"/"Abgespielt"/"Wiedergabe nicht möglich"). Nutzt durchgehend den
zentralen `AudioPlayer.speakWord()`-Einstiegspunkt (Abschnitt 12.2 damit größtenteils bereits
durch die bestehende Infrastruktur erfüllt: zentraler audio_key, Fallback auf `playbackRate:0.75`,
Doppelklick-Schutz, kein TTS bei vorhandener Aufnahme). `settings.autoPlayWord` wird respektiert,
spielt aber nur EINMAL pro Wortwechsel automatisch ab (eigene Prüfung gegen das zuletzt
automatisch abgespielte Wort, verhindert unkontrolliertes erneutes Abspielen bei jedem Re-Render).
Ein echter, im ersten Anlauf übersehener Fehler wurde durch einen eigenen Test aufgedeckt und
behoben: `AudioPlayer.stopCurrentAudio()` wurde vorher nur beim tatsächlichen Start einer neuen
Wiedergabe aufgerufen — beim bloßen Wortwechsel OHNE automatisches/manuelles Abspielen lief eine
noch laufende vorherige Aufnahme unbemerkt weiter. Jetzt wird beim Wort-/Stufenwechsel immer
zuerst gestoppt.

### Schritt 7: Stufe 5 — gemeinsame Wortübersicht (Abschnitt 13)

Neue `renderWordOverviewStage()`: Kartenraster (nur die neuen Wörter dieser Session, KEINE
eingemischten Wiederholungswörter) mit arabischer Form, deutscher Bedeutung, Umschrift,
normaler/langsamer Wiedergabe, Schwierig-Markierung. "Zurück zu den Lernkarten"/"Audio noch
einmal üben" verlieren keinen Fortschritt; erst "Weiter zu den Übungen" beendet Stufe 5
(`engine.advancePhase()`, exakt derselbe Übergang wie zuvor beim Verlassen der alten
Wortlernphase). Ein bei der visuellen Prüfung tatsächlich gefundener Darstellungsfehler wurde
behoben: mehrteilige arabische Ausdrücke (z. B. "مَعَ السَّلَامَة") brachen in der schmalen
160px-Rastersäule mitten im Wort um — Säulenbreite auf 220px erhöht und die kompaktere
`.arabic-example`-Schriftgröße statt der für Stufe 3 gedachten großen `.arabic-word-main`-Größe
verwendet (`.word-grid` wird seit diesem Auftrag ausschließlich hier verwendet, keine
Nebenwirkung auf andere Ansichten).

### Schritt 8: Speicherung und Migration (Abschnitt 11/18)

Neues `learningStageState`-Feld (`{stage, cardIndex, confirmedWordIds, audioIndex,
audioHeardNormal, audioHeardSlow}`) im bestehenden Session-Snapshot (`persistSnapshot()`) — kein
zweiter Speichermechanismus. `cardIndex`/`audioIndex` werden jetzt EXPLIZIT gespeichert statt wie
zuvor aus der Coverage geraten (Abschnitt 11, ausdrückliche Anforderung). Migration alter
Snapshots ohne dieses Feld: sichere Standardposition (`word_cards`, `cardIndex` grob aus
vorhandener `preview_seen`-Coverage rekonstruiert) — WIRD NUR ERREICHT, wenn `phaseIndex` noch bei
`word_preview` steht; eine Session, die bereits eine Übungsphase (`phaseIndex >= 2`) erreicht hat,
durchläuft diesen Pfad gar nicht erst und wird nicht an den Kartenanfang zurückgesetzt (mit
eigenem Test abgesichert).

### Schritt 9: Tests

65 neue/erweiterte Tests (547 → 612 Unit-Tests): `learningStages.test.js` (14),
`wordRelations.test.js` (11), `sessionLearningStages.test.js` (23, u. a. preview_seen-Zeitpunkt,
leere Grammatikfelder, aufgelöste Zusatzinfos, Schwierig-Markierung übersteht Neustart,
Tastaturnavigation inkl. Leertaste-vs-Button-Fokus, Audio-Stopp bei Wortwechsel, autoPlayWord
genau einmal pro Wort, Migration alter/bereits-in-Übung-befindlicher Snapshots, exakte
Karten-/Audio-Position nach Neustart), `learningStagesStructure.test.js` (4, inkl. struktureller
Prüfung aller 90 echten Sessions und der Lernziel-Ersatzformulierung gegen eine synthetische
Session ohne `learning_objectives`), 6 neue Tests in `theoryRenderer.test.js`
(`mode:'learning_intro'`, Wortaudio). `sessionController.e2e.test.js` an den neuen Ablauf
angepasst (nicht geschwächt, sondern auf die bewusst geänderten Verträge umgeschrieben) und um
sieben repräsentative Sessions erweitert (Unit 1/5/10/15/20/25/30, wie im Auftrag verlangt).
`test/helpers/domStub.js` um `removeEventListener` ergänzt (fehlte bisher komplett).

### Schritt 10: echte visuelle Verifikation, diesmal mit isoliertem Nutzerprofil

Wie schon in Entwicklungsauftrag 14 wurde die App über Playwright real gestartet und bedient
(dieselbe reale Desktop-Sitzung dieser Umgebung). Diesmal verbessert: statt gegen das echte
Nutzerprofil zu laufen und Änderungen hinterher zurückzusetzen, wurde die App mit dem von
Electron selbst (ohne Code-Änderung) ausgewerteten `--user-data-dir`-Schalter auf ein komplett
isoliertes, temporäres Profil verwiesen — das echte Nutzerprofil wurde dadurch gar nicht erst
berührt (Änderungszeitpunkte von `settings.json`/`progress.json` vor und nach der Prüfung
identisch bestätigt). Bestätigt wurden dabei: Stufe 1 zeigt Lernziele und Ablauf; Stufe 2 zeigt
"Weiter zu den Lernkarten" sofort aktiv, kein Mini-Check-Text; Stufe 3 zeigt "Wort 1 von 10" samt
Schwierig-Button; ein Theme-Wechsel MITTEN in Stufe 3 unterbricht die Karte nicht; Stufe 4 wird
korrekt erreicht ("Audio 1 von 10"); Stufe 5 zeigt "Als Nächstes: Übungen" und genau 10 Karten;
nach "Weiter zu den Übungen" startet die BESTEHENDE, unveränderte Wiedererkennen-Phase mit ihrem
alten Stepper (keine vorgetäuschte Stufe 6-10). Dabei den oben genannten Wortumbruch-Fehler in
Stufe 5 gefunden und behoben.

### Schritt 11: vollständige Verifikation

```text
npm run lint:            erfolgreich (164 JS-Dateien, 0 Kollisionen)
npm test:                 612/612 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                           ausgeführt, alle 10 Läufe sauber
npm run validate:course:  0 Fehler, 1 Hinweis (unverändert — keine Wort-/Theorie-Änderung)
npm run audio:verify:     759/759 in Ordnung, 0 Probleme
npm run package:source:   35,9 MB, 1.333 Einträge
```

Alle 90 Sessions zusätzlich per eigenem Skript strukturell geprüft (Phasenreihenfolge, nicht-leere
`new_word_ids`, vorhandenes Theoriedokument): 90/90 in Ordnung. Datenintegrität: SHA-256-Prüfsummen
von `vocabulary.json`, `theory.json`, `vocabSessions.json`, `audio_generation_manifest.json`,
allen 7 Sprachprüf-Batches sowie ein Sammelhash über alle 1.041 Audiodateien vor und nach der
Entwicklung verglichen — byte-identisch. Quellpaket zweimal in ein frisches Verzeichnis entpackt,
dort `npm install`/`npm test`/`npm run lint`/`npm run validate:course` erneut ausgeführt (jeweils
612/612 + 6/6, erfolgreich) — das zweite Mal nach dem in Schritt 7 behobenen Wortumbruch-Fix, damit
das ausgelieferte Quellpaket den finalen Stand widerspiegelt.

### Manuelle Prüfliste für `npm start`

Die im Auftrag (Abschnitt 24) vorgegebene Prüfliste wird unverändert übernommen und im
Abschlussbericht dieser Runde wiedergegeben.

### Akzeptanzkriterien dieser Runde (Auszug)

Alle 90 Sessions besitzen die neuen Stufen 1-5 in fester Reihenfolge; Lernziele vor der Theorie;
Theorie vor den Lernkarten, ohne verpflichtenden Mini-Check; übersichtliche Einzelkarten ohne
Zwischenabfrage; eigene Audio-Lernphase mit Wiedergabestatus; gemeinsame Wortübersicht vor den
Übungen; keine Abfrage vor Abschluss der fünften Stufe (automatisiert abgesichert); exakte
Wiederaufnahme innerhalb der Lernphasen (Karten-/Audio-Position explizit gespeichert, nicht
geraten); bestehende Übungsphasen laufen unverändert weiter; 900 Wörter, 90 Theorien, alle
Audiodateien nachweislich unverändert (Prüfsummen); Review-Modus nicht angefasst; keine
Testregression (612/612 + 6/6, 10× grün). Sprachprüfung, Wort-/Theorieänderungen,
Audioerzeugung, endgültige Stufen 6-10, neues Feedbacksystem, neue Kursübersicht und Onboarding
bewusst nicht Teil dieser Runde.

## 20. Entwicklungsauftrag 16: Endgültige Übungsstufen 6-10 (vom Nutzer, 2026-08-11)

Abschluss des in Entwicklungsauftrag 15 begonnenen zehnstufigen pädagogischen Sessionablaufs: die
alten sechs Übungsphasen (`recognition`/`reconstruction`/`guided_production`/
`independent_production`/`application`/`summary`) werden durch vier gradierte Stufen plus Abschluss
ersetzt, die auf `LearningStages.STAGES` (jetzt zehn statt fünf Einträge) direkt und 1:1 auf
`sessionDef.phases` abbilden — Stufe 6 „Leichtes Wiedererkennen" (`recognition`), Stufe 7
„Zuordnungsaufgaben" (`matching`, komplett neu), Stufe 8 „Schreiben mit Hilfe" (`guided_writing`,
kombiniert die alten Phasen Rekonstruieren + Geführte Produktion), Stufe 9 „Freies Schreiben ohne
Hilfe" (`independent_writing`), Stufe 10 „Zusammenfassung" (`summary`). Die Übergangskonstante
`AFTER_STAGE_5_LABEL` ("Als Nächstes: Übungen") aus Auftrag 15 entfällt ersatzlos — nach Stufe 5
erscheint direkt "Stufe 6 von 10: Leichtes Wiedererkennen".

### Schritt 1: Baseline-Prüfung

Ausgangsstand exakt wie erwartet verifiziert: 900/900 Wörter, 90 Session-Theorien, alle
Audiodateien unverändert, 612 Unit- + 6 Integrationstests aus Entwicklungsauftrag 15 vollständig
grün, fünf sichtbare Lernstufen samt Designsystem aus Auftrag 14 weiterhin intakt. Keine Abweichung
festgestellt.

### Schritt 2: Kernmodule erweitert

`SessionCoverageTracker` um `matching_attempts`/`matching_correct`/`guided_writing_attempts`/
`independent_writing_attempts` erweitert, mit rückwärtskompatibler `migrateLegacyEntry()`-Migration
der alten Feldnamen (`reconstruction_attempts`+`guided_typing_attempts`→`guided_writing_attempts`,
`independent_attempts`→`independent_writing_attempts`, `application_attempts`→`matching_attempts`,
da Anwendungs-Prompts jetzt eine Zuordnungsvariante sind) sowie neuen Hilfsfunktionen
`isRecognized`/`isMatched`/`isWritten` für die Abschlussprüfung. `PhaseRegistry` auf das neue
Sieben-Phasen-Modell mit den geforderten Bewertungsgewichten (Wiedererkennen 20 %, Zuordnung 20 %,
Schreiben mit Hilfe 25 %, Freies Schreiben 35 %, Stufen 1-5 und Abschluss 0 %) umgestellt.
`SessionQueue.create()` bekommt einen neuen optionalen dritten Parameter `{shuffle:false}` für
Stufe 8s zweiblockige (erst Teil 1, dann Teil 2) statt gemischte Reihenfolge.

### Schritt 3: Stufe 6 — Leichtes Wiedererkennen (Abschnitt 6)

Deckt jetzt ALLE neuen Wörter ab (vorher nur eine Teilmenge über die alte Wiedererkennen-Phase),
fünf gemischte Aufgabentypen: Arabisch→Deutsch (`multiple_choice`), Deutsch→Arabisch
(`german_to_arabic_choice`), Audio→arabisches Wort (`audio_to_word_choice`, bestehend), Audio→
deutsche Bedeutung (`audio_to_meaning_choice`, NEU in `exerciseRegistry.js`), Wort unter mehreren
Audioaufnahmen erkennen (`word_to_audio_choice`, bestehend). Sichere Distraktoren wie zuvor. Audio
ist vor der Antwort nur abspielbar, wenn Audio selbst die Aufgabenstellung ist — nicht bei rein
visuellen Übersetzungsaufgaben, wo das die Antwort verraten würde.

### Schritt 4: Stufe 7 — Zuordnungsaufgaben (Abschnitt 7, komplett neu)

Neue `ExerciseRegistry.renderMatching()`: zwei Spalten aus echten `<button>`-Elementen
(`role="group"` je Spalte), Klick-Auswahl-dann-Gegenstück-Auswahl statt reinem Drag-and-Drop (voll
tastaturbedienbar), Klick auf dieselbe Seite ersetzt die Auswahl statt einen Fehlversuch
auszulösen. Vier Varianten (`MATCHING_VARIANTS`): Arabisch↔Deutsch, Audio↔Arabisch (linke Seite
verrät das Wort NICHT im aria-label — anonyme "Ton N"-Beschriftung), Audio↔Bedeutung,
Kontext↔Wort (nutzt die bestehenden `application_prompts` wieder, „Besitzerwort-Regel": die
Kontextseite nennt nie das gesuchte Wort selbst). 4-5 Wortpaare je Gruppe
(`buildMatchingGroups()`, ausgewogene Gruppengröße), alle neuen Wörter über mehrere Gruppen
abgedeckt. Falsche Versuche sperren das Paar NICHT — beide Seiten bleiben wählbar, ein Fehler wird
nur beim ERSTEN Fehlversuch je Paar gezählt (`firstErrorSeen`-Set). Richtige Paare sperren
(`disabled` + `.matched`-Klasse) und bleiben sichtbar; Status ist nie nur über Farbe erkennbar
(zusätzliches „✓"-Symbol + Text im aria-label).

### Schritt 5: Stufe 8 — Schreiben mit Hilfe (Abschnitt 8)

Kombiniert die alten Phasen Rekonstruieren ("Teil 1: Wort zusammensetzen", `order_pieces`) und
Geführte Produktion ("Teil 2: Wort mit Hilfe eingeben", `guided_typing`) als AUFEINANDERFOLGENDE
(nicht gemischte) Unterblöcke in EINER Warteschlange (`SessionQueue.create(items, random,
{shuffle:false})`), jeder Block für sich gemischt. Feste (nicht adaptive) Hilfe, deterministische
Wort-zu-Teil-Zuordnung (`productionBaseline`), nicht jedes Wort braucht beide Varianten.

### Schritt 6: Stufe 9 — Freies Schreiben ohne Hilfe (Abschnitt 9)

Reine Texteingabe über die virtuelle Tastatur, KEINE Lösungspreisgabe irgendwo (DOM/Titel/
aria-label/data-Attribute/Platzhalter/Fehlermeldung/Autoplay) vor der Abgabe — bestehende
akzeptierte-Alternativantworten-Regeln bleiben erhalten. Neue Audiodiktat-Variante
(`independent_typing_dictation`): Audio IST hier die Aufgabenstellung und darf deshalb vor der
Antwort abgespielt werden; die deutsche Bedeutung erscheint erst im Feedback nach der Abgabe.
Stufe 8 + Stufe 9 decken gemeinsam über den bestehenden Baseline+TopUp-Mechanismus alle neuen
Wörter mindestens einmal ab.

### Schritt 7: Stufe 10 — Zusammenfassung (Abschnitt 10)

Unterscheidet vom Nutzer markierte ("Als schwierig markieren", Stufe 3/5) von automatisch über
Mehrfachfehler (≥2) erkannten schwierigen Wörtern (Reason-Tags: „von dir markiert" / „N Fehler"),
Markieren/Entmarkieren direkt in der Zusammenfassung, Audio je Wort, „Schwierige Wörter üben"
(führt direkt in die freie Übung), „Zur Unit", „Nächste Session" (falls vorhanden), „Session neu
starten" (bestätigungspflichtig). Eine gescheiterte Session (Mindestscore nicht erreicht) wird
klar als "Session beendet — noch nicht bestanden" ausgewiesen und NICHT als abgeschlossen markiert.

### Schritt 8: Abschlussprüfung, Speicherung und Migration (Abschnitt 10.4/16/17)

`checkCompletion()` verlangt jetzt zusätzlich zu Score/Exposition: jedes Wort mindestens einmal
erkannt (`allWordsRecognized`), zugeordnet (`allWordsMatched`) und geschrieben
(`allWordsWritten`). Speicherung erweitert: Zuordnungsgruppen, bereits gelöste Paare und der erste
Fehlversuch je Paar werden jetzt explizit pro Aufgabe im Snapshot gehalten (`task.solvedWordIds`/
`task.firstErrorWordIds`) — eine mitten in einer Gruppe unterbrochene Session zeigt nach dem
Neustart exakt dieselbe Gruppe mit denselben bereits gelösten Paaren, nicht neu gemischt (mit
eigenem Test abgesichert, siehe Schritt 10).

Migration: `sessionFlowVersion: 2`, `SessionEngine.migrateResumedState()` ordnet beim nächsten
`mount()` einmalig alte, noch offene Sessions dem neuen Phasenmodell zu — alte Rekonstruieren-/
Geführte-Produktion-Warteschlangen werden zu Stufe 8 mit passendem `part`-Feld umgetaggt, alte
Selbstständige-Produktion-Warteschlangen zu Stufe 9. Der ausdrücklich verlangte Sonderfall: alte
"application"-Sessions springen NICHT rückwärts zu Stufe 7 (Zuordnung), sondern gelten direkt als
bereit für Stufe 10 — keine Wiederholung bereits abgeschlossener Schreibstufen. Bereits
abgeschlossene Sessions bleiben abgeschlossen; keine Session wird ohne ausdrücklichen Nutzerwunsch
auf Stufe 1 zurückgesetzt.

### Schritt 9: Datenaktualisierung

Neues idempotentes `scripts/upgrade-session-phases-v16.js` (gleiches Muster wie das
Audio-Status-Upgrade aus Auftrag 13): aktualisiert `phases`/`completion_rules` aller 90 Sessions in
`vocabSessions.json` auf das neue Sieben-Phasen-Modell, überspringt das Schreiben bei bereits
aktuellem Stand. Live gegen die echten Kursdaten ausgeführt: 90/90 Sessions aktualisiert; zweiter
Lauf byte-identisch bestätigt (Idempotenz). `vocabulary.json`/`theory.json`/
`audio_generation_manifest.json`/alle Sprachprüf-Batches/alle Audiodateien nachweislich
unverändert (`git diff --stat` leer). `validateCourse.js` um eine dauerhafte Prüfung erweitert:
alle 90 Sessions verwenden exakt das neue Phasenmodell, keine alte Rekonstruktions-/
Anwendungsphase mehr, Bewertungsgewichte der vier gradierten Phasen ergeben zusammen 100 %.

### Schritt 10: Tests

Von 612+6 zu Beginn dieser Runde auf 691 Unit- + 6 Integrationstests gewachsen. Neue Dateien:
`exerciseRegistryMatching.test.js` (15, u. a. alle vier Varianten, Tastaturbedienbarkeit,
aria-pressed-Sichtbarkeit, Besitzerwort-Regel, sowie vier dedizierte Tests für die unten
beschriebene Wiederaufnahme-Lücke), `sessionFlowMigration.test.js` (17, deckt jede
Phasen-Übergangs-Kombination inkl. des "application"-Sonderfalls einzeln ab),
`upgradeSessionPhasesV16.test.js` (7, inkl. Idempotenz und einer schreibgeschützten Prüfung gegen
die echten Kursdaten), `validateCourseSessionPhases.test.js` (3). Bestehende Dateien erweitert,
u. a. `sessionController.e2e.test.js` um eine zweite Schleife über alle sieben repräsentativen
Units (1/5/10/15/20/25/30) für den VOLLSTÄNDIGEN Stufe-1-10-Durchlauf (nicht nur 1-5 wie in
Auftrag 15) sowie gezielte Regressionstests für die beiden bei der visuellen Prüfung gefundenen
Fehler (siehe Schritt 11).

Eine echte, über einen dedizierten Wiederaufnahme-Test aufgedeckte Lücke wurde behoben: der
Zuordnungs-Fortschritt (`locked`/`firstErrorSeen`) war rein lokaler Closure-Zustand in
`renderMatching()`, wurde nie gespeichert — eine mitten in einer Gruppe unterbrochene Session
verlor beim Neustart alle bereits gelösten Paare, was Abschnitt 16 ausdrücklich verbietet. Behoben
durch einen neuen `onProgress`-Callback plus `alreadySolvedWordIds`/`alreadyErroredWordIds`,
verdrahtet mit `persistSnapshot()` nach jedem Versuch.

### Schritt 11: echte visuelle Verifikation (Playwright, isoliertes Profil)

Wie in Auftrag 14/15 wurde die App über Playwright gegen die echte Desktop-Sitzung dieser Umgebung
gestartet, mit dem von Electron selbst ausgewerteten `--user-data-dir`-Schalter auf ein
isoliertes, temporäres Profil verwiesen. Ein vollständiger Durchlauf Stufe 1 bis 10 wurde
fotografiert (Sessionübersicht, alle fünf gradierten Stufen inkl. beider Teile von Stufe 8 und der
Diktat-Variante von Stufe 9, Zusammenfassung samt Markieren/Entmarkieren), zusätzlich Stufe 7
(Zuordnung) und die Zusammenfassung jeweils im Dunkelmodus sowie eine Wiederaufnahme nach
Theme-Wechsel.

Dabei wurden zwei echte, bis dahin unbemerkte Fehler gefunden und noch in dieser Runde behoben:

1. Die Sessionübersicht (Stufe 1, "Ablauf"-Kasten) hängte an die zehn echten Stufennamen noch ein
   zusätzliches, nicht mehr existierendes elftes "Übungen" an — ein Relikt aus der Zeit vor diesem
   Auftrag, als `LearningStages.STAGES` nur die Stufen 1-5 kannte. Behoben in
   `sessionController.js#renderSessionOverview()`, mit eigenem Regressionstest.
2. Der textuelle Hinweis-Button ("Hilfe" → zeigt Transliteration + deutsche Bedeutung direkt an)
   erschien unverändert auch bei Stufe 9 ("Freies Schreiben OHNE Hilfe") — ein Widerspruch zur
   ausdrücklichen Unterscheidung in Abschnitt 9.1. Auf die anderen Stufen begrenzt, mit eigenem
   Regressionstest; die reine Audio-Wiedergabe (kein Lösungshinweis) bleibt weiterhin verfügbar.

Zusätzlich beim gezielten Prüfen der Zuordnungsaufgabe gefunden und behoben: nach einem
Fehlversuch setzte `clearSelection()` nur den ZUERST angeklickten Button zurück — der zweite,
gerade angeklickte Button (der den Versuch erst ausgelöst hatte) behielt sein `aria-pressed="true"`
dauerhaft und wirkte optisch weiter "ausgewählt", obwohl er es logisch nicht mehr war. Behoben in
`ExerciseRegistry.renderMatching()#attemptMatch()`, mit eigenem Regressionstest.

### Schritt 12: vollständige Verifikation (nach allen Fixes, finaler Stand)

```text
npm run lint:            erfolgreich (169 JS-Dateien, 0 Kollisionen)
npm test:                 691/691 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                           ausgeführt, alle 10 Läufe sauber
npm run validate:course:  0 Fehler, 1 Hinweis (unverändert — keine Wort-/Theorie-Änderung)
npm run audio:verify:     759/759 in Ordnung, 0 Probleme
npm run package:source:   35,9 MB, 1.338 Einträge
```

Quellpaket in ein frisches Verzeichnis entpackt, dort `npm install`/`npm test`/`npm run lint`/
`npm run validate:course` erneut ausgeführt (691/691 + 6/6, erfolgreich). `git diff --stat` gegen
`vocabulary.json`/`theory.json`/`audio_generation_manifest.json`/alle Sprachprüf-Batches: keine
Änderung. Update-Skript ein weiteres Mal auf Idempotenz geprüft (byte-identisch).

### Manuelle Prüfliste für `npm start`

Die im Auftrag (Abschnitt 25) vorgegebene Prüfliste wird unverändert übernommen: vollständiger
Durchlauf einer Pilot-Session über alle zehn Stufen; jede Stufe 6-10 einzeln (inkl. aller fünf
Wiedererkennen-Aufgabentypen, aller vier Zuordnungsvarianten, beider Teile von Stufe 8, der
Diktat-Variante von Stufe 9, Markieren/Entmarkieren in Stufe 10); Wiederaufnahme mitten in Stufe 6,
mitten in einer Zuordnungsgruppe, mitten in Stufe 8, mitten in Stufe 9; verkürzte Zusatzdurchläufe
für Unit 15 und Unit 30; jeweils in Hell- UND Dunkelmodus.

### Akzeptanzkriterien dieser Runde (Auszug)

Genau zehn sichtbare Stufen in fester Reihenfolge, keine alte Rekonstruktions-/Anwendungsphase
mehr erreichbar, kein zweiter Fortschritts-Stepper; Stufe 6 deckt alle neuen Wörter über fünf
gemischte Aufgabentypen ab; Stufe 7 ist voll tastaturbedienbar, Fehler sperren nicht, Status nie
nur über Farbe; Stufe 8/9 decken gemeinsam alle neuen Wörter ab, Stufe 9 verrät nichts vor der
Abgabe; Stufe 10 unterscheidet markierte von automatisch erkannten schwierigen Wörtern;
Wiederaufnahme reproduziert exakt denselben Zustand (inkl. Zuordnungsgruppe und bereits gelöster
Paare); alte Sessions migrieren sicher, ohne Rückwärtssprung bei "application" und ohne Reset
abgeschlossener Sessions; 900 Wörter, 90 Theorien, alle Audiodateien nachweislich unverändert;
keine Testregression (691/691 + 6/6, 10× grün). Sprachprüfung, neue Vokabeln/Theorie,
Audioerzeugung, neues Feedbacksystem, zweite Session-Engine, pauschaler Reset alter Sessions
bewusst nicht Teil dieser Runde.

## 21. Entwicklungsauftrag 17: Gemeinsames erklärendes Feedbacksystem (vom Nutzer, 2026-08-11)

Ersetzt die zuvor je nach Aufgabentyp in `exerciseRegistry.js`/`sessionController.js` verstreuten,
uneinheitlichen Feedbacktexte durch EIN gemeinsames, erklärendes Feedbacksystem für alle Aufgaben
der Stufen 6-9: welche Antwort gegeben/erwartet wurde, warum sie richtig/teilweise
richtig/falsch ist, ob nur Vokalisierung fehlt, ob eine akzeptierte Alternative getroffen wurde,
welcher Buchstabe abweicht, ob ein anderes Wort verwechselt wurde, wie die richtige Aussprache
klingt, ob und wann das Wort erneut erscheint. Die korrekte/falsche Bewertung bleibt unverändert
Aufgabe der bestehenden Grading-Logik — das Feedback erklärt nur, deutet nie um.

### Schritt 1: Baseline-Prüfung

Ausgangsstand exakt wie vom Auftrag angegeben verifiziert: 900/900 Wörter, vollständiger
Zehn-Stufen-Ablauf aus Entwicklungsauftrag 16, 691 Unit- + 6 Integrationstests, sauberer
Git-Stand. Keine Abweichung festgestellt.

### Schritt 2: Zentrale Feedbackarchitektur (Abschnitt 5)

Drei neue Module unter `src/js/feedback/`, jedes mit klar getrennter Aufgabe:

- **`answerAnalyzer.js`** (Abschnitt 5.1, reine Antwortanalyse, kein DOM): `analyzeTypedArabicAnswer()`
  verfeinert das Ergebnis von `evaluateArabicAnswer()`/der neuen `evaluateAgainstAnyDetailed()`
  (Abschnitt 5.4, srs.js) zu einer von neun Feedbackkategorien (Abschnitt 7). Zusätzlich
  `diffArabicText()`: sicherer, RTL-tauglicher Zeichenvergleich auf CLUSTER-Ebene (Abschnitt 9) —
  `tokenizeArabicClusters()` ordnet jedes Vokalisierungszeichen dem VORHERIGEN Grundbuchstaben zu
  (nie als eigene "Buchstaben" gezählt), ein Editierabstand mit Backtrace auf dieser Cluster-Ebene
  erkennt fehlende/zusätzliche/ersetzte Grundbuchstaben UND fehlende/zusätzliche/falsche
  Vokalisierungszeichen getrennt voneinander. `analyzeChoiceAnswer()` erkennt bei einer falschen
  Auswahl zusätzlich eine echte Datenbeziehung zum Zielwort (`confusion_group`/`homonym_group`/
  `opposite_id`) — nie erfunden, nur wenn tatsächlich in den Kursdaten hinterlegt (Abschnitt 11).
- **`feedbackModel.js`** (Abschnitt 5.2/6): `buildForWord()` baut daraus den geforderten
  einheitlichen Ergebnisvertrag (`exerciseType`/`resultCategory`/`isCorrect`/`submittedAnswer`/
  `expectedWordId`/`selectedWordId`/`matchedAcceptedAnswer`/`expectedAnswers`/`errorType`/
  `prompt`/`firstAttempt`) plus die Darstellungsfelder (Titel/Symbol/ARIA-Rolle/Ton).
  `buildMatchingGroupSummary()` (Abschnitt 13) baut das Abschlussfeedback einer Zuordnungsgruppe.
- **`feedbackRenderer.js`** (Abschnitt 5.3/8/19): EINE UI-Komponente für alle Aufgabentypen —
  Kopf (Symbol + Titel, Status nie nur über Farbe), Antwortvergleich (getippt: "Deine Antwort"/
  "Richtige Form"; Auswahl: gewähltes vs. gesuchtes Wort), Zeichenvergleich (nur `textContent`,
  `dir="rtl"` + `unicode-bidi:isolate`, nie `innerHTML` — mit einer bewusst feindlichen
  HTML/Script-artigen Testeingabe geprüft, Abschnitt 23), Wortinformationen (Grammatik
  aufklappbar), normale/langsame Audiowiedergabe, Wiederholungshinweis (nur bei tatsächlich
  geplanter/limitierter Wiederholung), Verwechslungsvergleich. `role="status"` bei richtigem,
  `role="alert"` bei abweichendem Feedback, programmatischer Fokus nach der Abgabe.

`srs.js` bekommt die rückwärtskompatible `evaluateAgainstAnyDetailed()` (Abschnitt 5.4): liefert
zusätzlich, WELCHE der akzeptierten Antworten getroffen wurde und ob es die primäre war — ändert
das Ergebnis bestehender Aufrufer nicht, `evaluateAgainstAny()` bleibt unverändert nutzbar.

### Schritt 3: Feedbackkategorien (Abschnitt 7) und Grading-Treue (Abschnitt 22)

Alle neun Kategorien umgesetzt. Eine bewusste, sorgfältig hergeleitete Entscheidung:
`diacritics_mismatch` (Grundbuchstaben stimmen, Vokalzeichen falsch statt fehlend) bleibt nach der
BESTEHENDEN srs.js-Regel weiterhin als "richtig" gewertet (`correct_no_diacritics`-Tier) — die
neue Kategorie verfeinert nur die ANZEIGE (Hinweis statt voller Erfolg), ändert aber NICHT, ob die
Antwort zählt, sonst würde Abschnitt 22 ("Grading-Ergebnis darf nicht widersprüchlich umgedeutet
werden") verletzt. `accepted_alternative` erscheint nie gleichzeitig als Fehler oder Tippfehler;
bei ihr wird bewusst KEIN "Richtig wäre eigentlich …" gezeigt, da die Antwort bereits vollständig
akzeptiert wurde (Abschnitt 10). `wrong_word` bekommt je nach Aufgabenart (getippt vs.
Auswahlaufgabe) einen unterschiedlichen Fehlertyp (spelling vs. meaning, Abschnitt 17).

### Schritt 4: exerciseRegistry.js — verstreute Feedbacktexte entfernt (Abschnitt 3/26)

Alle Aufgabenrenderer (multiple_choice/german_to_arabic_choice/audio_to_word_choice/
word_to_audio_choice/audio_to_meaning_choice/order_pieces/guided_typing/independent_typing/
independent_typing_dictation/contextual_choice) setzen keinen eigenen primären Feedbacktext mehr
— sie melden nur noch strukturierte Rohdaten im `onDone`-Detail (`selectedOption`+`domain` bei
Auswahlaufgaben, `submittedAnswer` bei Eingabeaufgaben, `expectedForm` bei order_pieces). Die
Zuordnungsaufgabe (`renderMatching`) behält ihre kurze, absichtlich NICHT alles verratende
Inline-Rückmeldung WÄHREND der Aufgabe (Abschnitt 7.8, Wortlaut jetzt exakt "Diese beiden Elemente
gehören nicht zusammen. Versuche es erneut."), meldet aber zusätzlich `erroredWordIds` im
`onDone`-Detail für das GRUPPEN-Abschlussfeedback über das gemeinsame System (Abschnitt 13).
Virtuelle Tastatur/Eingabehilfen werden nach der Abgabe kompakt eingeklappt (Abschnitt 20, neue
CSS-Klasse `.session-input-collapsed`).

### Schritt 5: sessionController.js — zentrale Verdrahtung

`analysisForTask()` wählt je nach Aufgabenform (Auswahl/getippt/order_pieces) den passenden
AnswerAnalyzer-Aufruf; `renderWordFeedback()` baut Modell + rendert über FeedbackRenderer,
verdrahtet Audio-Callbacks (normale/langsame Wiedergabe, gewählte falsche Option bei
Auswahlaufgaben, Verwechslungswort), automatisch erkannte vs. auf Wunsch aufklappbare
Verwechslungsvergleiche (`manualRelationsFor()`, datenbasiert über `WordRelations`).
`renderMatchingTask()`s `onDone` baut nach vollständiger Gruppe das Abschlussfeedback über
`FeedbackModel.buildMatchingGroupSummary()`/`FeedbackRenderer.renderMatchingGroupSummary()`.

**Auto-Weiter (Abschnitt 18):** `if (model.resultCategory === 'correct_full' && !model.helpUsed
&& settings.autoAdvanceAfterFeedback)` — die einzige Bedingung, unter der automatisch
weitergegangen wird; jede andere Kategorie (inkl. akzeptierter Alternative, fehlender/abweichender
Vokalisierung, Tippfehler, Hilfenutzung) bleibt manuell. Bei Zuordnungsgruppen gilt dieselbe Regel
sinngemäß auf Gruppenebene (nur bei vollständig fehlerfreier Gruppe). Ein `advanced`-Flag
verhindert doppeltes Auslösen zwischen Auto-Timer und manuellem Klick.

### Schritt 6: SessionCoverageTracker/SessionEngine — Fehlertypen und Priorisierung (Abschnitt 17)

`SessionCoverageTracker` bekommt ein additives `errorTypes`-Feld (spelling/diacritics/meaning/
confusion/matching/empty) je Wort — rein additiv, migrationssicher (`recordErrorType()` ergänzt
das Feld bei einem alten, davor gespeicherten Eintrag bei Bedarf nachträglich, keine
`sessionFlowVersion`-Erhöhung nötig). `priorityScoreForPhase()` erweitert die bestehende
`priorityScore()` um einen Aufschlag für phasenrelevante Fehlertypen: Bedeutungsfehler
priorisieren Wiedererkennen/Zuordnung, Schreib-/Vokalisierungsfehler eine spätere Schreibaufgabe,
Verwechslungsfehler eine spätere Zuordnung. `SessionEngine`s `selectWordsForPhase()`/`topUp()`
nutzen diese phasenbewusste Priorisierung beim Auffüllen der Aufgaben-Warteschlangen. Das
bestehende Wiederholungslimit (`MAX_REPEATS_PER_WORD_PER_PHASE`) bleibt unverändert verbindlich —
keine Endlosschleifen möglich (Abschnitt 17.2).

### Schritt 7: CSS (Abschnitt 20)

Neuer Block in `style.css`, ausschließlich bestehende Design-Tokens: `.feedback-panel` (Ton je
Kategorie: correct/partial/wrong/empty/technical), `.answer-comparison`, `.char-diff` (Segmente je
Status farblich UND mit zusätzlichem Symbol markiert, nie nur Farbe), `.feedback-word-info`,
`.feedback-audio-actions`, `.repeat-hint`, `.relation-compare-table`, `.matching-summary-list`,
`.session-input-collapsed`. `.visually-hidden` neu ergänzt für die Screenreader-Textalternative
des Zeichenvergleichs.

### Schritt 8: Tests (Abschnitt 23)

91 neue Tests (691 → 782 Unit-Tests): `answerAnalyzer.test.js` (27, Zeichenvergleich inkl.
Kombinationszeichen/mehrerer Diakritika auf einem Buchstaben/Unicode-Normalisierung/feindlicher
Eingabe, alle Kategorien, Wortbeziehungen), `srsDetailedEvaluation.test.js` (6),
`feedbackModel.test.js` (15, u. a. expliziter Test, dass angezeigtes Ergebnis und gespeicherte
Bewertung IMMER übereinstimmen), `feedbackRenderer.test.js` (15, ARIA-Rollen, Fokus,
aria-label-Buttons, sichere DOM-Erzeugung auch mit feindlicher Eingabe, Verwechslungsvergleich,
Zuordnungs-Abschlussfeedback), `sessionCoverageErrorTypes.test.js` (13, inkl. Migration eines
alten Eintrags ohne `errorTypes`-Feld), `exerciseRegistryFeedbackDetail.test.js` (9, Vertrag der
`onDone`-Details je Renderer, kein primärer Feedbacktext mehr im Renderer selbst, Eingabebereich
klappt nach Abgabe ein). `sessionEngine.test.js` um 2 Tests zur phasenbewussten Priorisierung
erweitert. `sessionController.e2e.test.js` um 4 neue End-zu-Ende-Tests erweitert (Feedback-Panel
mit korrekter ARIA-Rolle und Fokus in Stufe 6, Audio-Buttons, Zuordnungs-Gruppenabschluss über das
gemeinsame System, Stufe 9 nutzt dasselbe System wie Stufe 6) — dabei zwei eigene, im Testskript
selbst liegende Endlosschleifen-Fallen gefunden und behoben (Stufe-7-Fallthrough in eine
allgemeine Kachel-Klick-Schleife; fehlende `continue` nach Gruppenlösung). 10× hintereinander
sauber.

### Schritt 9: echte visuelle Verifikation (Playwright, isoliertes Profil) — ein echter Fehler gefunden

Wie in den vorangegangenen Aufträgen wurde die App über Playwright gegen die echte Desktop-Sitzung
gestartet, mit `--user-data-dir` auf ein isoliertes, temporäres Profil verwiesen. Ein
vollständiger Durchlauf durch alle vier gradierten Stufen (6-9) wurde fotografiert, in Hell- UND
Dunkelmodus: Stufe 6 (Wiedererkennen, falsche UND richtige Antwort), Stufe 7
(Zuordnungs-Gruppenabschluss mit Paarübersicht), Stufe 8 Teil 1 (Zeichenvergleich bei
order_pieces) und Teil 2, Stufe 9 (Diktat-Variante, deutsche Bedeutung erscheint korrekt erst im
Feedback), Stufe 10 (Zusammenfassung, unverändert funktionsfähig).

Dabei wurde ein echter, bis dahin unbemerkter Darstellungsfehler gefunden und noch in dieser Runde
behoben: das neue, gegenüber den vorherigen einzeiligen Texten deutlich umfangreichere
Feedback-Panel wurde bei mittlerer Bildschirmposition teilweise von der festen (`position:sticky`)
Aktionsleiste am unteren Rand überlagert — deren negativer unterer Rand (`margin-bottom:-90px`,
bereits vor diesem Auftrag vorhanden) war auf die vorher immer nur einzeilige Feedback-Höhe
abgestimmt. Nach vollständigem Herunterscrollen war das gesamte Feedback zwar immer erreichbar,
aber die optische Überlappung bei mittlerer Scrollposition widersprach Abschnitt 20 ("darf nicht
unter der festen Aktionsleiste verschwinden"). Behoben durch ausreichenden `padding-bottom` auf
den neuen `.feedback-area`-Container — mit Playwright-Geometrieprüfung (`getBoundingClientRect()`
vor/nach dem Fix) bestätigt, dass nach dem Fix keine Überlappung mehr auftritt.

### Schritt 10: vollständige Verifikation (nach dem CSS-Fix, finaler Stand)

```text
npm run lint:            erfolgreich (178 JS-Dateien, 0 Kollisionen)
npm test:                 782/782 Unit-Tests + 6/6 Integrationstests, 10× hintereinander
                           ausgeführt, alle 10 Läufe sauber
npm run validate:course:  0 Fehler, 1 Hinweis (unverändert — keine Wort-/Theorie-Änderung)
npm run audio:verify:     759/759 in Ordnung, 0 Probleme
npm run package:source:   35,9 MB, 1.348 Einträge
```

Quellpaket in ein frisches Verzeichnis entpackt, dort `npm install`/`npm test`/`npm run lint`/
`npm run validate:course` erneut ausgeführt (782/782 + 6/6, erfolgreich). `git diff --stat` gegen
`vocabulary.json`/`theory.json`/`vocabSessions.json`/`audio_generation_manifest.json`/alle
Sprachprüf-Batches/alle Audiodateien: keine Änderung (dieser Auftrag durfte und hat keine
Kursinhalte verändert, Abschnitt 24). 1.097 Audiodateien vor/nach identisch, keine
Zugangsdaten/`node_modules`/veraltete Quell-ZIP im Paket.

### Manuelle Prüfliste für `npm start`

Die im Auftrag (Abschnitt 25/28) vorgegebene Prüfliste wird unverändert übernommen und im
Abschlussbericht dieser Runde mit konkreten Wort-/Unit-Beispielen aus den echten Kursdaten
wiedergegeben.

### Akzeptanzkriterien dieser Runde (Auszug)

Ein zentrales Feedbackmodell, ein gemeinsamer Feedbackrenderer, keine verstreuten primären
Feedbacktexte mehr in den Aufgabenrenderern; vollständige Erklärung nach jeder Aufgabe der Stufen
6-9; akzeptierte Alternativen korrekt gekennzeichnet, nie als Fehler dargestellt;
Vokalisierungsunterschiede und Buchstabenabweichungen sichtbar, mit sicherem RTL-Zeichenvergleich
(kein `innerHTML`); ausgewählte falsche Wörter nachvollziehbar, datenbasierte
Verwechslungsinformationen ohne erfundene Beziehungen; normale und langsame Audioausgabe im
Feedback; Fehlertypen in der Coverage, gezieltere spätere Wiederholungen; Auto-Weiter nur bei
vollständig richtiger, hilfefreier Antwort; Barrierefreiheit (ARIA-Rollen, Fokus, Beschriftungen,
Status nie nur über Farbe); Grading-Ergebnis wird nie widersprüchlich umgedeutet (mit eigenem Test
abgesichert); keine Änderung des Zehn-Stufen-Ablaufs, keine Änderung der Kursinhalte/Audiodateien;
Review-Modus/Grammatiktrainer/Alphabet unverändert; keine Testregression (782/782 + 6/6, 10×
grün). Sprachprüfung, neue Vokabeln/Theorie, Audioerzeugung, neue Aufgabentypen, KI-generierte
Fehlererklärungen, Anbindung der Theorie-Mini-Checks (bewusst zurückgestellt) bewusst nicht Teil
dieser Runde.

## 22. Entwicklungsauftrag 18: Responsive Oberfläche, Anzeigeoptionen und schlanker UI-Smoke-Test (vom Nutzer, 2026-08-11)

Reines Oberflächenauftrag (kompakt dokumentiert, wie vom Auftrag selbst verlangt — keine
Wort-/Theorie-/Audio-/Grading-/SRS-Änderung, keine neuen Aufgabentypen, kein Umbau der zehn
Stufen). Details siehe README.md, Abschnitt "Responsive Oberfläche, Anzeigeoptionen und
UI-Smoke-Test (Entwicklungsauftrag 18)".

- **Neue Einstellung "Arabische Schriftgröße"** (Standard/Groß/Sehr groß) — dritte Stufe des seit
  Auftrag 4/14 vorhandenen `--arabic-scale`-Tokens, sofort wirksam, migrationssicher. Dabei zwei
  echte, vorher unskalierte Stellen gefunden (`.arabic-text`-Basisklasse, `.text-input.arabic-text`)
  und einen toten Duplikatblock im Stylesheet entfernt, der die Skalierung sonst stillschweigend
  überschrieben hätte.
- **Responsive Korrekturen** für 900×600/1366×768/1920×1080: Dialoge scrollen intern, die
  Feedback-Vergleichstabelle stapelt sich statt eine Spalte zu verstecken, Matching-Grid- und
  Aktionsleisten-Abstand auf einen einzigen 900px-Grenzwert konsolidiert, Karten brechen bei langen
  deutschen Bedeutungen/Umschriften nicht mehr.
- **Barrierefreiheit:** vollständige Dialog-Fokusverwaltung (Anfangsfokus, Tab-Falle,
  Escape schließt, Fokus kehrt zurück), `prefers-reduced-motion`, gemischter arabisch-deutscher
  Text im Feedback bekommt durchgängig `lang="ar"`/`dir="rtl"` (zwei echte Fundstellen behoben,
  jetzt automatisiert über die gemeinsamen `el()`-Hilfsfunktionen für neuen Code).
- **`npm run ui:smoke`** (`scripts/uiSmoke.js`, playwright-core, isoliertes temporäres
  Nutzerprofil): Dashboard, Einstellungen (hell+dunkel), Lernkarte, Zuordnungsaufgabe,
  umfangreiches Fehlerfeedback (davon einmal bei 900×600), Zusammenfassung — automatische Prüfung
  auf unbehandelte JS-Fehler, horizontales Überlaufen, Schaltflächen außerhalb des sichtbaren
  Bereichs, Feedback-/Aktionsleisten-Überlappung, fehlende zugängliche Namen. Screenshots im
  ignorierten, nicht paketierten Ordner `ui-smoke-output/`.
- **Verifikation:** `npm run lint` (178 Dateien, 0 Kollisionen), `npm test` (793 Unit- + 6
  Integrationstests, ein Lauf, keine Regression), `npm run ui:smoke` (0 unbehandelte JS-Fehler, 0
  Layout-/A11y-Befunde), `npm run package:source` (enthält `scripts/uiSmoke.js`, schließt
  `ui-smoke-output/`/Screenshots korrekt aus).
- **Bewusst nicht Teil dieser Runde:** Sprachprüfung, neue Vokabeln/Theorie/Audio, neue
  Aufgabentypen, Gamification, Navigationsumbau, neue Sprachpakete, plattformübergreifende Builds.

## 23. Entwicklungsauftrag 19: finale Veröffentlichung von Kurs 1 und Sicherung des Grundsystems (vom Nutzer, 2026-08-12)

Erste öffentliche Version (`v1.0.0-beta.1`) über GitHub Releases im Zielrepository
`MoritzSchallenberg/Learning-Arabic-Tool-FH-Aachenpublished`. Details siehe README.md, Abschnitt
"Finale Veröffentlichung von Kurs 1 und Sicherung des Grundsystems (Entwicklungsauftrag 19)", und
das neue [`DEVELOPMENT_FOUNDATION.md`](DEVELOPMENT_FOUNDATION.md).

- ElevenLabs-Audiolizenz geklärt (kostenloser Tarif → nichtkommerziell, Namensnennung), neues
  `NOTICE-AUDIO.md`, überarbeitetes `LICENSES.md`, maschinenlesbare
  `language-packs/arabic/audio-provenance.json` (759 ElevenLabs + 338 espeak-ng).
- `npm run release:verify` (`scripts/releaseVerify.js`) prüft ein echtes gebautes `app.asar` gegen
  die tatsächlichen Kursdatenreferenzen; lokal gegen einen `electron-builder --linux dir`-Testbuild
  verifiziert (0 Fehler).
- `.github/workflows/build.yml` neu strukturiert: Push/PR = nur Lint/Validator/Tests; Tag/manueller
  Start = Windows/Ubuntu/Linux/macOS(Intel+ARM)-Matrix + `release:verify` je Plattform + EIN
  zentraler Release-Job (SHA256SUMS.txt, genau ein Prerelease) statt vormals potenziell mehrerer
  paralleler Releases.
- `package.json`/electron-builder überarbeitet (Version, App-ID ohne FH-Aachen-Domain,
  Artefaktnamen, `asar: true`, Entwicklungsdateien ausgeschlossen, Lizenzdokumente mit ins Paket).
- Eigenes, neutrales App-Icon (arabisches „ع“, Noto Kufi Arabic, bestehende Akzentfarbe).
- In-App-Kennzeichnung (Einstellungen: "Über diese App") + README-Kopfbereich mit
  Windows/Ubuntu/Linux/macOS-Anleitungen für Nutzer:innen ohne Programmierkenntnisse.
- Lokale Sicherung (Quellcode-ZIP + Git-Bundle außerhalb des Repository-Ordners, nicht gepushter
  lokaler Tag) vor jeder Remote-Änderung — Details im Abschlussbericht dieser Runde.
- **Bewusst nicht Teil dieser Runde:** erneute Sprachprüfung, neue Vokabeln/Theorie, Audio-
  Neuerzeugung, neue Aufgabentypen, Änderung von Grading/SRS/Feedback-Logik.
