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
- **~141 Vokabeln** über 21 Themenkategorien (Lektionen 3, 6, 8), inkl. Audio.
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
- **Inhaltliche Prüfung durch eine Person mit Arabischkenntnissen** — bislang nicht erfolgt.
- Noch nie in einer laufenden Electron-Instanz von der KI selbst getestet (Sandbox-Einschränkung
  in früheren Sessions) — der Nutzer verifiziert jeweils per `npm start`.

## 4. Nächste Schritte (priorisiert)

**Aktuell aktiv: Entwicklungsauftrag 4 "Neues Interface und echte Lernphase" in Abschnitt 8,
konkret Schritt 1-4 (UI-Grundgerüst, Kurs-/Unit-Ansichten, Session Engine, Theorie-Integration)
anhand einer Pilot-Session — hat Vorrang vor der Liste unten und vor Entwicklungsauftrag 3
(Abschnitt 7), siehe Abschnitt 8 für den Stand je Schritt.**

1. **Kurs 2-5 im Unit-Detail nachbauen**, analog zu Kurs 1.
2. **Wortschatz weiter ausbauen** (Richtung 200-300), weiterhin in geprüften Schritten.
3. **Inhaltliche Prüfung durch jemanden mit Arabischkenntnissen.**
4. Physische Arabic-101-Tastaturbelegung, Transliterationsmodus, Kurspakete als ZIP.

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

### Meilenstein F — Audio (noch nicht begonnen)

Ein Audio pro neuem Wort (kein separates Slow-File mehr nötig), langsame Wiedergabe über
`HTMLAudioElement.playbackRate` (Standard ~0.75), bestehende `_slow.wav`-Dateien weiterhin
unterstützt und bevorzugt falls vorhanden. Zentraler AudioManager.

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
