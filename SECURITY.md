# Sicherheitsrichtlinie

## Unterstützte Versionen

Dieses Projekt befindet sich in aktiver Entwicklung (Version `0.1.0`, vor dem ersten
stabilen Release). Es gibt aktuell nur einen unterstützten Stand: den jeweils neuesten
Commit auf dem Standard-Branch. Ältere Zwischenstände werden nicht rückwirkend gepatcht.

## Sicherheitslücke melden

**Bitte keine Sicherheitslücken als öffentliches GitHub-Issue melden.**

Bevorzugter Weg: über die private
["Report a vulnerability"-Funktion](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
im Reiter *Security* dieses Repositories (falls aktiviert), oder alternativ über eine
private Nachricht an den Repository-Inhaber ([@MoritzSchallenberg](https://github.com/MoritzSchallenberg))
über dessen GitHub-Profil.

Bitte gib nach Möglichkeit an:

- betroffene Datei(en)/Komponente
- Schritte zur Reproduktion
- mögliche Auswirkung (z. B. Codeausführung, Datenverlust, Pfad-Traversal)

## Bekannte sicherheitsrelevante Designentscheidungen

- **Electron-Sicherheit:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
  in `main.js` — der Renderer hat keinen direkten Node-/Dateisystemzugriff, nur die über
  `preload.js` freigegebene `window.api.*`-Oberfläche.
- **Audio-Pfad-Validierung:** `main.js`s `loadAudio()` prüft den `audioKey` gegen ein
  striktes Muster (`AUDIO_KEY_PATTERN`) und stellt zusätzlich sicher, dass der aufgelöste
  Pfad innerhalb des erwarteten Audio-Verzeichnisses bleibt (Schutz vor Pfad-Traversal wie
  `../../etwas`).
- **Fortschrittsspeicherung:** atomares Schreiben (temp+rename) mit automatischem Backup vor
  jedem Überschreiben, siehe `src/js/progressStore.js`.
- **Kursinhalte** werden aktuell ausschließlich mitgeliefert (kein Import von außen). Sobald
  das geplante `.arabiccourse`-Kurspaketsystem (siehe [`ROADMAP.md`](ROADMAP.md), Abschnitt 7,
  Meilenstein C) umgesetzt ist, gelten zusätzlich: ZIP-Slip-Schutz, Schema-/
  Checksummenvalidierung, Dateigrößen-/Dateityp-Limits, keine `../`- oder absoluten Pfade, kein
  `innerHTML` mit ungeprüften externen Daten. Bis Meilenstein C abgeschlossen ist, sollten
  keine Kurspakete aus nicht vertrauenswürdigen Quellen importiert werden.

Falls du eine Abweichung von einer dieser Zusagen findest, ist das per Definition ein
sicherheitsrelevanter Fund — bitte wie oben beschrieben melden.
