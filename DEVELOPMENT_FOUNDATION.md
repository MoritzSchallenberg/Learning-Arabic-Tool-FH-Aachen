# DEVELOPMENT_FOUNDATION.md — das Grundsystem wiederverwenden

Diese Datei erklärt, wie das lokale Entwicklungssystem hinter dem *Learning Arabic Tool*
(Kurs 1) später für **Kurs 2-5**, **weitere Sprachpakete** oder eine **komplett neue Lernapp**
wiederverwendet werden kann — ohne eine zweite, duplizierte Kopie der Anwendung anzulegen.
Entstanden in Entwicklungsauftrag 19 (Abschnitt 6), als Teil der ersten öffentlichen
Veröffentlichung.

**Diese Datei ersetzt nicht** README.md (Nutzung/Entwicklung) oder ROADMAP.md (vollständige
Entwicklungsgeschichte, Abschnitt für Abschnitt je Entwicklungsauftrag) — sie ergänzt beide um
die Perspektive "was muss ich anfassen, wenn ich hierauf etwas Neues aufbauen will".

## 1. Architektur im Überblick

```
main.js / preload.js        Electron-Hauptprozess: IPC, Dateizugriff, Audioauflösung,
                             contextIsolation + sandbox (kein nodeIntegration im Renderer).
src/index.html               Einstiegspunkt des Renderers.
src/js/app.js                 App-Shell: Navigation, Theme, Einstellungen anwenden.
src/js/session/               Sessionsteuerung (der Zehn-Stufen-Ablauf) und Übungsregistrierung.
  sessionController.js         Zentrale State-Maschine: Stufen 1-10, Dialoge, Aktionsleiste.
  learningStages.js             Definition der zehn Stufen (deutsche Labels, Reihenfolge).
  exerciseRegistry.js           EIN Renderer je Aufgabentyp (Auswahl/Eingabe/Zuordnung/...).
  sessionEngine.js               Baut/füllt die Aufgaben-Warteschlangen je Phase.
  sessionCoverageTracker.js      Wer hat was wann wie beantwortet -- Basis für Wiederholungen.
src/js/feedback/               Gemeinsames Feedbacksystem (Entwicklungsauftrag 17).
  answerAnalyzer.js              Reine Antwortanalyse (kein DOM), inkl. Zeichenvergleich.
  feedbackModel.js                Einheitlicher Ergebnisvertrag.
  feedbackRenderer.js             EINE UI-Komponente für alle Aufgabentypen.
src/js/srs.js                 Bewertungslogik (evaluateArabicAnswer/evaluateAgainstAny...),
                             Wiederholungsplanung (Spaced Repetition).
src/js/progressStore.js       Migrationssichere Speicherung von Fortschritt UND Einstellungen
                             (ein Mechanismus für beides, siehe migrateProgress/migrateSettings).
src/js/audioPlayer.js         Löst einen audioKey ("vocabulary/<id>[_slow]") über IPC zu einer
                             Audiodatei im aktiven Sprachpaket auf -- normale + langsame Variante.
src/js/wordShaping.js         ARABISCH-SPEZIFISCH: Kontextform-Berechnung (isoliert/Anfang/
                             Mitte/Ende) aus der Buchstabenfolge + joining-Typ.
src/js/views/                 Eine Datei je Ansicht (Dashboard, Kursansicht, Einstellungen,
                             Vokabelbrowser, Grammatiktrainer, Alphabet, virtuelle Tastatur...).
src/css/style.css             Zentrales, tokenbasiertes Designsystem (Hell-/Dunkelmodus,
                             Abstände, Radien, Schriftgrößen inkl. 3 arabischer Stufen).
language-packs/<sprache>/     Ein Ordner je Sprache -- siehe Abschnitt 3.
scripts/                      Entwicklungswerkzeuge: Validator, Audio-Pipeline, Lint,
                             Quellpaket-Export, UI-Smoke-Test, Release-Verifikation.
```

**Designsystem** (`src/css/style.css`): zentrale CSS-Tokens (`--accent`, `--space-*`,
`--radius-*`, `--arabic-scale` ...) in drei Blöcken (`:root`, `[data-theme="light"]`,
`[data-theme="dark"]`). Neue Ansichten sollten ausschließlich diese Tokens/Klassen nutzen, keine
hartcodierten Farben/Größen (siehe README, Entwicklungsauftrag 14).

**Übungsregistrierung** (`exerciseRegistry.js`): jeder Aufgabentyp (`multiple_choice`,
`guided_typing`, `matching`, ...) ist eine eigene `render*(container, ctx, guard, onDone)`-
Funktion mit demselben Vertrag — `onDone(isCorrect, detail)` meldet nur strukturierte Rohdaten,
KEINEN eigenen Feedbacktext (das übernimmt zentral `feedback/feedbackRenderer.js`). Ein neuer
Aufgabentyp bedeutet: eine neue `render*`-Funktion nach demselben Vertrag plus einen Eintrag in
der Registry — nicht das Anfassen von `sessionController.js`s Kernlogik.

**Fortschrittsmodell** (`progressStore.js`): ein einziger, versionierter Speichermechanismus
(`_version`-Feld + `migrate*()`-Funktionen) für Fortschritt UND Einstellungen, atomar geschrieben
(temp+rename) mit automatischem `.bak`-Fallback bei kaputten Dateien. Neue Felder ergänzen
IMMER additiv mit einem sicheren Default in `migrate*()` — nie ein zweites Speicherformat
einführen.

**Audioauflösung:** Renderer kennt nur einen `audioKey` (z. B. `"vocabulary/greet_hallo"`);
`preload.js` reicht ihn über IPC an `main.js#loadAudio()` weiter, das ihn GEHÄRTET (Muster-Prüfung
+ Pfad-Präfix-Prüfung, siehe `scripts/audioFileAccess.js`) gegen `language-packs/<sprache>/audio/`
aus dem installierten Sprachpaket auflöst. `_slow`-Suffix für die langsame Variante, optional (nicht
jedes Wort braucht eine).

## 2. Kurs-, Unit- und Sessionstruktur (Referenz)

Zentrale Dateien unter `language-packs/arabic/`:

- `vocabulary.json` — `categories[]`, jede mit `words[]`. Jedes Wort trägt `unit_id`/`session_id`,
  `audio_key`, `content_status` (Sprachprüfstatus), das erweiterte Datenmodell (Umschrift,
  akzeptierte Alternativen, Wortbeziehungen `confusion_group`/`homonym_group`/`opposite_id`, ...).
- `vocabSessions.json` — `vocab_units[]` (30 Stück für Kurs 1, je mit `session_ids[]`) und
  `sessions[]` (90 Stück, je mit `new_word_ids[]`, `theory_id`, `title`, `estimated_minutes`).
  EIN Wort gehört zu genau einer Session, eine Session zu genau einem Unit.
- `theory.json` — Theorietexte, referenziert über `theory_id` aus der Session.
- `courses.json` — `courses[]`, jeder Kurs mit `units[]` unterschiedlichen `type`s
  (`letter_group`/`diacritics`/`special_forms`/`consolidation`/`existing_lesson_group`). **Wichtig:**
  Die 30 Vokabel-Units aus `vocabSessions.json` stehen NICHT in `courses.json` — sie werden von
  `src/js/views/courseView.js` zur Laufzeit direkt aus `pack.vocabSessions.vocab_units` gelesen
  und dem Kurs 1 angehängt (siehe `mount()`, Abschnitt "vocabUnits").
- `keyboard.json` — die 28 Grundbuchstaben inkl. `joining`-Typ (für `wordShaping.js`).

**ID-Konvention:** `vocab_unit_NN` (Unit), `vocab_unit_NN_X` (Session, X = a/b/...), Wort-IDs frei
wählbar, aber projektweit eindeutig (Kurs 1 nutzt sprechende IDs wie `greet_hallo`,
`family_brother`). `scripts/validateCourse.js` erzwingt Eindeutigkeit und prüft Querverweise.

## 3. Neuer Kurs (z. B. Kurs 2) hinzufügen

**Ehrlicher Zwischenstand:** `courseView.js` liest aktuell **fest `course_1`**
(`pack.courses.courses.find((c) => c.id === 'course_1')`) und hängt dessen Vokabel-Units an. Ein
zweiter, gleichwertiger Kurs erscheint damit NICHT automatisch nur durch einen neuen Eintrag in
`courses.json` — `courseView.js`/die oberste Navigation müssten zusätzlich verallgemeinert werden,
mehrere Kurse aufzulisten und auszuwählen (bewusst zurückgestellt, siehe ROADMAP "Bekannte
Lücken"). Das Vokabel-/Session-/Theorie-/Audio-Datenmodell selbst ist dagegen bereits vollständig
kursunabhängig — die folgenden Schritte gelten unverändert:

1. **Vokabeln ergänzen:** neue `categories[]`/`words[]` in `vocabulary.json` (oder eine eigene
   Datei plus Merge-Schritt, falls Kurs 2 komplett getrennt bleiben soll), mit neuen, eindeutigen
   `unit_id`/`session_id`-Werten (z. B. `vocab_unit_31` aufwärts) und `audio_key`.
2. **Units/Sessions definieren:** neue Einträge in `vocabSessions.json#vocab_units[]`/`sessions[]`
   nach demselben Schema wie Kurs 1 (siehe Abschnitt 2) — `new_word_ids[]` referenziert die neuen
   Wort-IDs, `theory_id` referenziert einen neuen Theorietext.
3. **Theorie einbinden:** neue Einträge in `theory.json`, ID = die `theory_id` aus Schritt 2.
   `TheoryRenderer` (`src/js/theoryRenderer.js`) rendert jedes vorhandene Feld generisch (Titel,
   Lernziele, Erklärungstext, Beispiele, Mini-Checks) — keine Kursunterscheidung im Code nötig.
4. **Zehn-Stufen-Ablauf übernehmen:** automatisch, sobald Schritt 1-3 stehen —
   `learningStages.js`/`sessionController.js`/`exerciseRegistry.js` kennen keine Kurs- oder
   Unit-spezifische Logik, sie arbeiten ausschließlich über `session_id`/`new_word_ids`.
5. **Audiodateien zuordnen:** `scripts/audioCli.js plan|generate` (siehe `AUDIO_GENERATION_GUIDE.md`)
   für die neuen `audio_key`s laufen lassen; Herkunft danach mit
   `npm run audio:provenance` neu erzeugen (`scripts/generateAudioProvenance.js`).
6. **Validatoren ausführen:** `npm run validate:course` (Eindeutigkeit, Querverweise, fehlende
   Audios für bereits sprachlich geprüfte Wörter) und `npm test` (u. a.
   `test/unit/sessionController.e2e.test.js` läuft bereits kursunabhängig gegen echte Session-IDs).
7. **In der Navigation erscheinen lassen:** für Kurs 1 automatisch (Schritt 1-3 genügen, siehe
   oben). Für einen ECHTEN zweiten, gleichrangigen Kurs zusätzlich `courseView.js` (und die
   Kurs-Auswahl in der obersten Navigation) verallgemeinern, mehrere `courses.json`-Einträge
   anzuzeigen, statt `course_1` fest zu verdrahten.

## 4. Neue Sprache hinzufügen

1. Neuen Ordner `language-packs/<sprachcode>/` anlegen, Struktur wie `language-packs/arabic/`
   spiegeln (`language.json`, `lessons.json`, `vocabulary.json`, `keyboard.json`, `grammar*.json`,
   `reading.json`, `courses.json`, `vocabSessions.json`, `theory.json`, `tutorials/`, `audio/`).
2. **`language.json`** trägt die Sprachmetadaten: `language` (ISO-Code), `name`, `direction`
   (`"rtl"`/`"ltr"`), `default_keyboard`, `input_mode`, `special_characters`, `diacritics`,
   `tts_lang`. Diese Datei ist die EINZIGE Stelle, die Leserichtung und Tastaturzuordnung festlegt
   — `main.js`/`app.js` schalten `dir`/`lang` auf `<html>` danach automatisch um.
3. `main.js#listInstalledLanguages()` erkennt jeden Unterordner von `language-packs/` automatisch
   als installierbares Sprachpaket — kein Code-Eintrag pro Sprache nötig.
4. **Trennung Sprache/Schrift/Audio bleibt strikt:** `vocabulary.json` enthält nur Text (in der
   jeweiligen Schrift) + `audio_key`; die eigentliche Audiodatei liegt getrennt unter
   `language-packs/<sprache>/audio/` und wird nur über den `audio_key` verknüpft, nie eingebettet.
5. **Sprachunabhängige Teile** (unverändert wiederverwendbar): `sessionController.js`,
   `learningStages.js`, `exerciseRegistry.js`, das gesamte Feedbacksystem (`src/js/feedback/`),
   `progressStore.js`, `audioPlayer.js`, das Designsystem, die virtuelle Tastatur als Konzept
   (Layout kommt aus `keyboard.json`, nicht aus Code).
6. **Arabisch-spezifische Teile** (müssen für eine neue Sprache ANGEPASST oder ersetzt werden):
   - `src/js/wordShaping.js` — arabische Kontextform-/Verbindungsregeln, ergibt für eine Sprache
     ohne verbundene Schrift (z. B. Lateinschrift) keinen Sinn und müsste durch eine
     schriftspezifische Alternative ersetzt oder für diese Sprache deaktiviert werden.
   - `src/js/srs.js#evaluateArabicAnswer()`/der arabische Zeichenvergleich in
     `feedback/answerAnalyzer.js` — Diakritika-Toleranz und Cluster-Zeichenvergleich sind auf die
     arabische Vokalisierung zugeschnitten; für eine andere Schrift braucht es eine eigene,
     analoge Normalisierungs-/Vergleichsfunktion mit demselben Rückgabevertrag.
   - `.arabic-text`/`.arabic-word-main`/etc. in `style.css` — RTL/Bidi-CSS-Klassen, für eine
     linksläufige Sprache schlicht ungenutzt lassbar statt zu entfernen.
   - Virtuelle-Tastatur-Sonderzeichen (Hamza-Formen, Tāʾ marbūṭa, Lam-Alif-Ligatur) sind arabisch-
     spezifische Konstanten in `keyboard.json`/`keyboardData.js`, nicht im Kernlogik-Code.

## 5. Neue App auf Basis dieses Grundsystems

Für ein komplett neues Produkt (andere Zielgruppe, anderes Branding) auf Basis desselben
Grundsystems:

1. **Produktname ändern:** `package.json#productName` sowie `build.productName`.
2. **App-ID ändern:** `package.json#build.appId` (umgekehrte Domain, z. B.
   `de.<autor>.<produktname>`) — bestimmt u. a. den Speicherort der Nutzerdaten
   (`app.getPath('userData')`), daher VOR der ersten echten Veröffentlichung final festlegen.
3. **Icons ersetzen:** `build/icon.ico`/`build/icon.icns`/`build/icon.png` (siehe Abschnitt 11 des
   Auftrags — eigenes, neutrales Design, keine fremden Logos/Marken).
4. **Repository ändern:** `package.json#repository`/`homepage`/`bugs` sowie
   `build.publish.owner`/`repo` auf das neue Ziel-Repository.
5. **Sprachpaket/Kurspaket austauschen:** `main.js#DEFAULTS.installedLanguages` (Standard-
   Sprachauswahl) sowie welche `language-packs/<sprache>/`-Ordner tatsächlich mitgeliefert werden.
6. **Versionsnummer zurücksetzen:** `package.json#version`, z. B. auf `0.1.0` für ein neues Produkt.
7. **Build-Workflow anpassen:** `.github/workflows/build.yml` — Artefaktnamen
   (`electron-builder`-Konfiguration in `package.json#build`), Release-Titel/-Beschreibung,
   ggf. andere Zielplattformen.
8. **Keine alten Nutzerprofile übernehmen:** ein neues `appId` erzeugt automatisch einen neuen,
   leeren `userData`-Pfad — nichts vom alten Produkt manuell kopieren.

**Bewusst keine zweite Kopie:** Dieses Dokument beschreibt Anpassungen AM VORHANDENEN,
modularen Repository — nicht das Duplizieren der gesamten Anwendung in einen zweiten Ordner
(würde langfristig veralten und doppelt gepflegt werden müssen). Für einen wirklich unabhängigen
Fork: dieses Repository klonen/forken und obige Schritte 1-8 dort durchführen.

## 6. Weiterführend

- `README.md` — Nutzung, Entwicklung, Tests, vollständige Feature-Liste.
- `ROADMAP.md` — vollständige Entwicklungsgeschichte je Entwicklungsauftrag, "Bekannte Lücken".
- `LICENSES.md`/`NOTICE-AUDIO.md` — welche Lizenz für Code/Kursinhalte/welche Audiodateien gilt
  (wichtig: NICHT alle Audiodateien sind gleich lizenziert, siehe dort vor jeder Weiterverwendung).
- `AUDIO_GENERATION_GUIDE.md` — Audio-Erzeugungspipeline im Detail.
- `LANGUAGE_REVIEW_GUIDE.md`/`REVIEWER_QUICKSTART.md` — der separate Sprachprüf-Arbeitsbereich
  (`npm run review:start`), unabhängig von der normalen Lernoberfläche.
