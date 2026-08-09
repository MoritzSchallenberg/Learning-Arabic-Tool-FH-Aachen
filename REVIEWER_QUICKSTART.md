# Schnellstart für die Sprachprüfung (Prüfprogramm)

Diese Seite ist für dich, wenn du die arabischen Inhalte von Kurs 1 prüfen sollst und **kein
technisches Vorwissen** hast. Sie beschreibt nur, wie du das Prüfprogramm startest und benutzt.
Was genau geprüft werden soll und was die einzelnen Begriffe bedeuten, steht ausführlich in
`LANGUAGE_REVIEW_GUIDE.md` — lies diese Seite hier zuerst, dann bei Bedarf dort weiter.

## 1. Voraussetzungen

- Node.js ist installiert (falls nicht: von [nodejs.org](https://nodejs.org) herunterladen und
  installieren, die "LTS"-Version reicht).
- Du hast den Projektordner ("Learning Arabic Tool" / `Vokabeltrainer`) auf deinem Rechner.

## 2. Einmalig einrichten

Öffne ein Terminal (Windows: "Eingabeaufforderung" oder "PowerShell", Mac: "Terminal") im
Projektordner und führe einmalig aus:

```
npm install
```

Das lädt die benötigten Programmbausteine herunter (nur beim ersten Mal nötig, dauert ein paar
Minuten).

## 3. Prüfprogramm starten

```
npm run review:start
```

Es öffnet sich ein eigenes Fenster — **das ist nicht die normale Lern-App**, sondern ein
getrenntes Werkzeug nur für die Sprachprüfung. Die normale Lern-App (`npm start`) bleibt davon
komplett unberührt und weiterhin nutzbar.

## 4. Was du im Fenster siehst

- **Übersicht** — Zahlen zum aktuellen Prüfstand: wie viele der 900 Wörter und 90 Theoriedokumente
  schon bearbeitet sind, aufgeteilt nach Status, Batch, Unit und Session.
- **Wörter** — eine durchsuchbare, filterbare Liste aller 900 Wörter. Ein Klick auf ein Wort öffnet
  die Detailansicht.
- **Theorien** — Liste aller 90 Lern-Theoriedokumente, genauso mit Klick zur Detailansicht.
- Oben rechts: **"Arbeitsstand exportieren"** — erzeugt einen Ordner mit allen deinen bisherigen
  Korrekturen und Notizen zum Weitergeben an das Entwicklungsteam (siehe Abschnitt 6).

## 5. Ein Wort prüfen — Schritt für Schritt

1. Klicke in der Wortliste auf ein Wort (oder suche zuerst gezielt danach).
2. Oben siehst du das Wort in allen Feldern: arabische Form, Umschrift, deutsche Bedeutung(en),
   Wortart, Genus/Plural, Application-Prompts usw. — jeweils mit dem **aktuellen Wert links** und
   einem **Eingabefeld für deinen Korrekturvorschlag rechts daneben**. Der Ausgangswert
   verschwindet nie, auch nicht nach dem Speichern eines Vorschlags.
3. Ist etwas falsch: trage die richtige Fassung in das Korrekturfeld ein und klicke
   "Vorschlag speichern".
4. Unten findest du für jeden der neun Prüfaspekte (Vokalisierung, Umschrift, Übersetzung, ...) ein
   Auswahlfeld mit fünf Möglichkeiten: *noch nicht geprüft* / *korrekt* / *Korrektur
   vorgeschlagen* / *unsicher/Rückfrage erforderlich* / *nicht anwendbar*. Wähle für jeden Aspekt
   das Zutreffende — optional mit einer kurzen Notiz daneben.
5. Gibt es eine Audiodatei: ein "▶ abspielen"-Knopf erscheint. Höre sie dir an und bewerte den
   Aspekt "Audioaussprache" genauso wie die anderen Aspekte.
6. Erst wenn **alle neun** Aspekte bearbeitet sind, kannst du oben auf **"Als geprüft
   markieren"** klicken.
7. **"Ausdrücklich freigeben"** geht noch einen Schritt weiter — das ist eine bewusste, seltenere
   Entscheidung, dass ein Wort wirklich fertig ist. Das Programm zeigt dir vorher eine
   vollständige Übersicht aller deiner Korrekturvorschläge zu diesem Wort und fragt eigens nach
   Bestätigung. Geht nur, wenn wirklich **kein** Aspekt "unsicher" oder "Korrektur vorgeschlagen"
   ist.

Ein Theoriedokument prüfst du genauso — nur mit neun anderen, zum Theorieinhalt passenden
Aspekten (Titel/Lernziele, Erklärtext, "Mehr erfahren", Wortvorschau, arabische Beispiele,
Vokalisierung/Umschrift, Merksätze/typische Fehler, Mini-Checks, Application-Prompts).

## 6. Wichtige Regeln, die das Programm für dich einhält

- **Nur Ansehen ändert nie etwas** — ein Wort/Theoriedokument zu öffnen setzt keinen Status.
- **Eine Korrektur speichern setzt NICHT automatisch "geprüft"** — das musst du bewusst extra
  anklicken.
- **Ein als "unsicher" markierter Eintrag kann nicht "ausdrücklich freigegeben" werden.**
- Deine Eingaben werden automatisch sicher gespeichert (mit Sicherungskopie und Verlauf) — ein
  Programmabsturz verliert deine Arbeit nicht.
- Das Programm verändert **nie** die eigentlichen Kursdateien (`vocabulary.json`, `theory.json`)
  — deine Korrekturen werden in einem eigenen Bereich gesammelt und später von jemandem aus dem
  Entwicklungsteam kontrolliert übernommen.
- Es werden **niemals** vorhandene Original-Audiodateien überschrieben oder gelöscht.

## 7. Wenn du fertig bist (oder eine Pause machst)

Klicke oben rechts auf **"Arbeitsstand exportieren"** und wähle einen Ordner (z. B. auf deinem
Schreibtisch oder in einem Cloud-Ordner) — das Programm legt dort einen neuen Ordner mit all
deinen Korrekturen, Notizen und dem vollständigen Änderungsverlauf an. Diesen Ordner schickst du
an das Entwicklungsteam. Der Export enthält **keine** API-Schlüssel, keinen Programmcode, keinen
Lernfortschritt und keine Audiodateien selbst — nur deine reinen Prüfergebnisse.

Du musst nicht alles auf einmal schaffen — dein Fortschritt bleibt beim nächsten Start von
`npm run review:start` automatisch erhalten.

## 8. Bei Problemen

- Das Fenster öffnet sich nicht / eine Fehlermeldung erscheint: prüfe, ob `npm install` erfolgreich
  durchgelaufen ist, und starte `npm run review:start` erneut.
- Inhaltliche Fragen (was bedeutet Feld X, wie gehe ich mit Fall Y um): siehe
  `LANGUAGE_REVIEW_GUIDE.md`.
- Alles andere: wende dich an das Entwicklungsteam.

Vielen Dank für deine Arbeit — ohne eine echte Sprachprüfung durch eine Person mit
Arabischkenntnissen bleibt dieser Kurs, egal wie vollständig er technisch wirkt, ein reiner
Entwurf.
