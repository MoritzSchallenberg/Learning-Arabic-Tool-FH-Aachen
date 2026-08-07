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
