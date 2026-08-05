# Mitwirken am Learning Arabic Tool

Danke für dein Interesse an diesem Projekt! Diese kurze Anleitung soll den Einstieg
erleichtern — bei Fragen gerne ein Issue eröffnen.

## Voraussetzungen

- Node.js 18 oder neuer (nur für die Entwicklung, nicht für Endnutzer:innen der fertigen App)
- Für die Audio-Erzeugungsskripte optional: Python 3, `espeak-ng` oder ein ElevenLabs-API-Key
  (siehe [`README.md`](README.md), Abschnitt "Audiodateien neu erzeugen/erweitern")

## Projekt lokal einrichten

```bash
git clone https://github.com/MoritzSchallenberg/Learning-Arabic-Tool-FH-Aachen.git
cd Learning-Arabic-Tool-FH-Aachen
npm install
npm start
```

## Vor jedem Commit

```bash
npm run lint            # Syntax, JSON-Validität, Namenskollisionen
npm run validate:course  # Kursdaten-Konsistenz (IDs, Audio, Querverweise)
npm test                 # alle automatisierten Tests
```

Alle drei Befehle müssen mit Exit-Code 0 durchlaufen, bevor ein Pull Request erstellt wird.

## Architekturprinzipien (bitte beibehalten)

- **Kein Framework-Wechsel.** Der Stack ist bewusst Electron + reines JavaScript/HTML/CSS
  ohne Build-Schritt für den Renderer — siehe [`ROADMAP.md`](ROADMAP.md) für die
  Begründung. Änderungsvorschläge, die React/Vue/einen Bundler o. Ä. einführen, werden nicht
  angenommen, ohne das vorher zu besprechen.
- **Geteilter globaler Scope in `src/js/`.** Dateien unter `src/js/*.js` und
  `src/js/views/*.js` werden als klassische `<script>`-Tags geladen (kein ES-Module-System) —
  jede neue Top-Level-`const`/`let`/`function`-Deklaration muss projektweit eindeutig sein
  (`npm run lint` prüft das automatisch).
- **Electron-Sicherheit bleibt aktiv:** `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`. Der Renderer darf nur über `window.api.*` (preload.js) mit dem
  Dateisystem interagieren.
- **Kein `innerHTML` mit ungeprüften/externen Daten.** Kursinhalte werden über
  `textContent`/sichere DOM-Erzeugung gerendert (siehe `TheoryRenderer` und die
  Sicherheitshinweise in der ROADMAP).
- **Sprachinhalte:** neue oder geänderte arabische Vokabeln/Grammatik bekommen
  `content_status: "needs_language_review"`, bis eine Person mit Arabischkenntnissen sie
  bestätigt. Bitte keine KI-generierten Inhalte stillschweigend als geprüft markieren.
- **Tests mitliefern.** Neue Logik (insbesondere in `src/js/*.js`, nicht nur Views) sollte
  einen entsprechenden Test unter `test/unit/` bekommen — siehe bestehende Tests als Vorlage.
  `test/helpers/domStub.js` stellt einen abhängigkeitsfreien DOM-Stub bereit, falls eine View
  End-zu-Ende getestet werden soll.

## Pull Requests

1. Branch von `main` abzweigen (nicht direkt auf `main` committen).
2. Beschreibe kurz, *warum* die Änderung nötig ist, nicht nur *was* geändert wurde.
3. Verlinke ggf. den betroffenen Abschnitt der ROADMAP.
4. Stelle sicher, dass `npm run lint && npm run validate:course && npm test` grün sind.

## Verhaltenskodex

Für dieses Projekt gilt der [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Sicherheitslücken melden

Bitte nicht als öffentliches Issue — siehe [`SECURITY.md`](SECURITY.md).
