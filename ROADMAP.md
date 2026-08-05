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

### Bekannte Lücken (bewusst vertagt, nicht vergessen)
- Volle 5-stufige A-E-Hilfestufen-Zustandsmaschine (aktuell: einfache Zwei-Fehler-Regression je
  Buchstaben-Unit in Selbstständiger Produktion/Abschlussprüfung — deckt dasselbe Grundprinzip
  ab, aber nicht alle 5 Stufen einzeln).
- Kurs 2-5 im vollen Unit-Detail (aktuell nur Navigations-Wrapper um bestehende Lektionen).
- Physische Arabic-(101)-Tastaturbelegung/-umschaltung, Transliterationsmodus als echte Eingabe.
- Kurspakete als eigenständig installier-/aktualisierbare `.arabiccourse`-ZIP-Dateien.
- Weiterführende Grammatik (Verbstämme II-X, Passiv, Partizipien, Bedingungssätze, unregelmäßige/
  schwache Verben) — bewusst ausgelassen, zu hohes Fehlerrisiko ohne Prüfung.
- Bild-/Wortfamilien-/Minimalpaar-Aufgaben (keine Bilddaten vorhanden).
- **Inhaltliche Prüfung durch eine Person mit Arabischkenntnissen** — bislang nicht erfolgt.
- Noch nie in einer laufenden Electron-Instanz von der KI selbst getestet (Sandbox-Einschränkung
  in früheren Sessions) — der Nutzer verifiziert jeweils per `npm start`.

## 4. Nächste Schritte (priorisiert)

**Aktuell aktiv: der Entwicklungsauftrag "Veröffentlichungsfähigkeit" in Abschnitt 6 — der
hat Vorrang vor der Liste unten, siehe dort für den Stand je Meilenstein.**

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
