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
  (`language.json`, `lessons.json`, `vocabulary.json`, `keyboard.json`, `tutorials/`). Weitere
  Sprachen lassen sich später ergänzen, ohne die Hauptanwendung umzubauen.
- **RTL/Bidi:** Kein selbstgebauter Algorithmus — Chromium implementiert den Unicode
  Bidirectional Algorithm sowie die arabische Zeichenverbindung (isoliert/Anfang/Mitte/Ende)
  nativ. In den Sprachdaten werden nur normale Unicode-Grundbuchstaben gespeichert, nie
  getrennte Kontextform-Zeichen.
- **Aussprache:** Web Speech API (`speechSynthesis`) — einzige installationsfreie TTS-Option.
  Ob und welche arabische Stimme verfügbar ist, hängt vom Betriebssystem ab; ist keine
  passende Stimme installiert, bleibt die Wiedergabe stumm (kein Absturz).
- **Schwierigkeitsanpassung:** pro Karte und pro Fähigkeit getrennt (`arabic_to_german`,
  `german_to_arabic`, `pronunciation`, ...). Richtige Antworten senken die Schwierigkeit,
  Tippfehler/fehlende Vokalzeichen erhöhen sie leicht, falsche Antworten stärker; nach
  mehrfach falscher Antwort wird eine Karte für eine Intensivwiederholung markiert.

## Umfang dieser Version (V1)

Enthalten:

- Einführungstutorial (Lektion 0)
- Tastatur- und Eingabetutorial mit virtueller arabischer Tastatur (Lektion 1)
- Alphabetlektion mit allen 28 Buchstaben, Kontextformen, Ausspracheerklärung und zwei
  Übungstypen (Buchstaben erkennen, Buchstaben eingeben) (Lektion 2)
- Grundwortschatz I: ~38 Wörter in 5 Themenbereichen, Karteikarten-Modus in beide Richtungen
  plus optionaler Aussprache-Selbsteinschätzung (Lektion 3)
- Lokale JSON-Speicherung von Fortschritt und Einstellungen

**Noch nicht enthalten** (spätere Versionen, siehe Roadmap in der ursprünglichen
Systembeschreibung): Lektionen 4-11 (Grammatik, Hörverständnis, Lesen/Schreiben, Prüfungen),
physische Arabic-(101)-Tastaturübersicht/-umschaltung, Transliterationsmodus als echte
Eingabemethode, Fachwortpakete, Bild-basierte Vokabelkarten, Mehrsprachigkeit über Arabisch
hinaus.

## Wichtiger Hinweis zu den Inhalten

Vokabular, Buchstaben-Beispielwörter und Pluralformen in `language-packs/arabic/` wurden von
einer KI anhand von gängigem Standardwissen zu modernem Hocharabisch zusammengestellt, **nicht
von einer Person mit Arabischkenntnissen gegengelesen**. Diakritika, Genus und insbesondere
Pluralformen (im Arabischen oft unregelmäßige "gebrochene Plurale") sind fehleranfällig, wenn
sie ohne muttersprachliche Prüfung erstellt werden. Vor dem produktiven Einsatz (z. B. im
Unterricht) sollte der Inhalt von jemandem mit Arabischkenntnissen gegengelesen werden.

## Bekannte Einschränkungen

- Ob TTS-Wiedergabe funktioniert, hängt von den auf dem jeweiligen Gerät installierten
  Sprachstimmen ab (Windows/macOS bringen häufig, aber nicht garantiert, arabische Stimmen mit).
- macOS-Installer (`.dmg`) lassen sich zuverlässig nur auf einem echten Mac oder über den
  GitHub-Actions-Workflow bauen, nicht direkt unter Windows/Linux.
