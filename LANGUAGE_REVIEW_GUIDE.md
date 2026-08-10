# Leitfaden für die Sprachprüfung von Kurs 1 (Learning Arabic Tool)

Dieser Leitfaden richtet sich an eine Person mit Arabischkenntnissen, die die arabischen
Sprachinhalte von Kurs 1 fachlich prüfen soll — **kein technisches Vorwissen nötig**. Du brauchst
nur einen Texteditor (auch ein einfacher wie Notepad/TextEdit reicht, ein Code-Editor wie
VS Code ist aber angenehmer, weil er die Struktur der Dateien übersichtlicher darstellt).

## 0. Der wichtigste Satz vorab

**Alle arabischen Inhalte in diesem Kurs wurden von einer KI anhand von Standardwissen zu
modernem Hocharabisch (MSA) erstellt, nicht von einer Person mit Arabischkenntnissen geprüft.**
Eine KI-Vervollständigung ist keine echte Sprachprüfung — deshalb brauchen wir dich. Bis du
(oder eine andere qualifizierte Person) eine Datei geprüft hast, gilt sie als **nicht geprüft**,
egal wie "fertig" sie technisch aussieht. Das gilt seit Entwicklungsauftrag 12 ausdrücklich
**auch für die Audiodateien** — dazu mehr in Abschnitt 0.1 und 5.

### 0.1 Neu (Entwicklungsauftrag 12): ein eigenes Prüf-Werkzeug statt manueller JSON-Bearbeitung

Es gibt jetzt ein eigenes, lokales Prüfprogramm im Projekt selbst — der **empfohlene Weg**, um
diesen Leitfaden praktisch umzusetzen: einfach im Projektordner `npm run review:start` ausführen
öffnet ein eigenes Fenster mit Übersicht, Filtern, Suche, einem Formular pro Wort/Theorie (Original
und dein Korrekturvorschlag stehen dabei immer nebeneinander) und einem eingebauten Audio-Player.
Die kurze Schritt-für-Schritt-Anleitung dafür steht in **`REVIEWER_QUICKSTART.md`** — falls du sie
noch nicht gelesen hast, fang dort an, nicht hier.

Der Rest dieses Dokuments beschreibt weiterhin, WAS geprüft wird und WAS die einzelnen Felder
bedeuten (das gilt unverändert, ob du das Prüfprogramm oder einen Texteditor benutzt) — nur der
Abschnitt "wie trage ich eine Korrektur ein" (Abschnitt 3) hat jetzt zwei Wege: über das
Prüfprogramm (empfohlen) oder weiterhin von Hand direkt in den `batch_NN.json`-Dateien (falls du
das Programm aus irgendeinem Grund nicht nutzen kannst oder willst — beide Wege führen am Ende zum
selben Ziel und schließen sich nicht aus).

## 1. Welche Dateien geprüft werden

Alle Sprachprüfdateien liegen im Ordner `language-review/` und heißen `batch_00.json` bis
`batch_06.json`. Jede Datei ist eine JSON-Datei — das sieht auf den ersten Blick technisch aus,
ist aber im Kern eine strukturierte Liste von Wörtern mit ihren Angaben. Du kannst sie in jedem
Texteditor öffnen und bearbeiten.

| Datei | Inhalt | Anzahl Wörter |
|---|---|---|
| `batch_00.json` | Die 141 ursprünglichen Wörter des Kurses (haben bereits Audiodateien, wurden aber nie formal sprachlich geprüft) | 141 |
| `batch_01.json` | Units 1–5 (Begrüßung, Familie, Zuhause, Zahlen, Adjektive) | 115 |
| `batch_02.json` | Units 6–10 (Uhrzeit, Farben, Möbel, Lebensmittel, Getränke/Küche) | 132 |
| `batch_03.json` | Units 11–15 (Einkaufen, Kleidung, Körper, Gesundheit, Gefühle) | 135 |
| `batch_04.json` | Units 16–20 (Tagesablauf, Verben, Adjektive, Stadt) | 134 |
| `batch_05.json` | Units 21–25 (Präpositionen, Verkehr, Schule, Universität, Arbeit) | 126 |
| `batch_06.json` | Units 26–30 (Technik, Natur, Tiere, Freizeit, Funktionswörter) | 117 |

Zusammen sind das alle 900 Wörter von Kurs 1 — jedes Wort taucht in **genau einer** dieser
Dateien auf. Du musst nicht alles auf einmal prüfen; jede Datei kann unabhängig und in beliebiger
Reihenfolge bearbeitet werden, am besten fängst du mit einer kleineren Datei an, um dich mit dem
Format vertraut zu machen.

Die eigentlichen Sprachinhalte (Vokabeln UND Theorietexte) liegen in
`language-packs/arabic/vocabulary.json` und `language-packs/arabic/theory.json` — diese beiden
Dateien sind viel größer und technischer aufgebaut. **Du musst diese Dateien in der Regel nicht
selbst bearbeiten** — die `batch_NN.json`-Dateien enthalten bereits alle nötigen Informationen,
um jedes Wort zu beurteilen. Wenn du einen Fehler findest, trägst du ihn als Notiz in die
`batch_NN.json`-Datei ein (siehe Abschnitt 3) — jemand mit technischem Hintergrund überträgt die
Korrektur dann in die eigentlichen Sprachdateien.

## 2. Was die einzelnen Prüffelder bedeuten

Ein einzelner Wort-Eintrag in einer `batch_NN.json`-Datei sieht ungefähr so aus (gekürztes
Beispiel):

```json
{
  "id": "c1_u11_05",
  "unit_id": "vocab_unit_11",
  "session_id": "vocab_unit_11_a",
  "arabic_unvocalized": "رخيص",
  "proposed_arabic_vocalized": "رَخِيص",
  "proposed_transliteration": "rakhīṣ",
  "german_answers": ["billig", "günstig"],
  "part_of_speech": "Adjektiv",
  "gender": "maskulin",
  "plural": null,
  "accepted_arabic_answers": ["رَخِيص", "رخيص"],
  "application_prompts": [
    { "type": "context_choice", "prompt": "Du möchtest sagen, dass etwas günstig ist.", "expected_meaning": "billig" }
  ],
  "homonym_group": null,
  "opposite_id": "c1_u11_06",
  "confusion_group": "c1_price_terms",
  "notes": "",
  "review_status": "needs_language_review",
  "review": {
    "arabic_vocalization_reviewed": false,
    "transliteration_reviewed": false,
    "german_translation_reviewed": false,
    "application_prompts_reviewed": false
  }
}
```

| Feld | Bedeutung |
|---|---|
| `id` | Interne, technische Kennung des Wortes — bitte nicht verändern, wird für Fortschrittsdaten der Lernenden gebraucht. |
| `unit_id` / `session_id` | In welcher Lerneinheit das Wort vorkommt — nur zur Orientierung. |
| `arabic_unvocalized` | Die arabische Form ohne Vokalzeichen (Diakritika), so wie sie im Alltag meist geschrieben wird. |
| `proposed_arabic_vocalized` | **Zu prüfen:** die vorgeschlagene arabische Form MIT Vokalzeichen. Ist die Vokalisierung korrekt? Stimmt sie mit `arabic_unvocalized` überein (also: ergibt das Entfernen der Vokalzeichen wieder exakt `arabic_unvocalized`)? |
| `proposed_transliteration` | **Zu prüfen:** die lateinische Umschrift. Passt sie zur Aussprache der vokalisierten Form? |
| `german_answers` | Die deutschen Übersetzungen, die als richtig akzeptiert werden. Ist die erste (Haupt-)Übersetzung treffend? Fehlt eine wichtige, ebenfalls richtige Übersetzung? Ist eine der genannten Übersetzungen tatsächlich falsch? |
| `part_of_speech` | Die Wortart (z. B. "Substantiv", "Verb (3. Pers. m. Vergangenheit)", "Präposition"). Stimmt sie? |
| `gender` | Genus des Wortes (`"maskulin"`/`"feminin"`/`null`, falls nicht zutreffend, z. B. bei Verben). |
| `plural` | Die vokalisierte Pluralform, falls vorhanden (`null`, falls kein Plural gebildet wird oder das Wort schon selbst ein Plural ist). Gerade bei "gebrochenen Pluralen" im Arabischen ist das eine der fehleranfälligsten Angaben — hier ist deine Prüfung besonders wertvoll. |
| `accepted_arabic_answers` | Welche arabischen Schreibweisen bei einer Tipp-Aufgabe als richtig akzeptiert werden (i. d. R. die vokalisierte und die unvokalisierte Form). |
| `application_prompts` | Ein kurzer deutscher Beispielkontext ("Du möchtest sagen, dass..."), mit dem Lernende in einer Übungsaufgabe das richtige Wort erkennen sollen. Passt der Kontext eindeutig zu genau diesem Wort? |
| `homonym_group` | Falls gesetzt: dieses Wort teilt sich seine unvokalisierte Schreibweise absichtlich mit einem anderen Wort (z. B. `مِنْ` "von" und `مَنْ` "wer" — beide unvokalisiert `من`). Kein Fehler, nur ein Hinweis. |
| `opposite_id` | Verweist auf die interne `id` eines Gegensatzworts (z. B. "billig" ↔ "teuer"). Prüfe, ob das inhaltlich wirklich ein sinnvolles Gegensatzpaar ist. |
| `confusion_group` | Ein Gruppenname für Wörter, die zusammen gelernt werden, weil sie leicht verwechselt werden (z. B. alle Wörter rund um Preise). Rein didaktisch, kein Fehler. |
| `notes` | **Hier trägst DU deine Anmerkungen ein** — siehe Abschnitt 3. |
| `review_status` | Der Gesamtstatus dieses Wortes — siehe Abschnitt 4 für die zulässigen Werte. |
| `review` | Vier einzelne Häkchen, die du unabhängig voneinander setzen kannst — siehe Abschnitt 3. |

Für die 15 Theoriedokumente jedes Batches (`batch_01.json` bis `batch_06.json` enthalten
zusätzlich ein Feld `theory_review`, `batch_00.json` nicht, da es keine eigenen neuen
Theorietexte einführt) gilt dasselbe Prinzip mit vier eigenen Prüf-Häkchen:
`arabic_examples_reviewed` (sind die arabischen Beispielsätze in der Theorie korrekt?),
`german_explanation_reviewed` (ist die deutsche Erklärung verständlich und fachlich richtig?),
`mini_check_reviewed` (sind die Quizfragen und ihre Lösungen korrekt?),
`application_prompts_reviewed` (sind die Anwendungsbeispiele sinnvoll?). Den vollständigen
Theorietext zu einer `theory_id` findest du in `language-packs/arabic/theory.json` — suche dort
einfach nach der `theory_id` (z. B. `"theory_vocab_unit_11_a"`).

## 3. Wie du Korrekturen und Notizen einträgst

**Weg A — mit dem Prüfprogramm (empfohlen, siehe `REVIEWER_QUICKSTART.md`):** öffne das Wort im
Programm, trage deinen Korrekturvorschlag direkt im dafür vorgesehenen Feld ein (der
Ausgangswert bleibt daneben sichtbar) und klicke "Vorschlag speichern". Für jeden der neun
Prüfaspekte (Vokalisierung, Umschrift, Übersetzung, Wortart, Genus/Plural, akzeptierte arabische
Antworten, Application-Prompts, Homonym/Gegensatz/Verwechslung, Audioaussprache) wählst du
getrennt "korrekt" / "Korrektur vorgeschlagen" / "unsicher" / "nicht anwendbar". Das Programm
speichert automatisch, sicher und mit Verlauf (siehe Abschnitt 7) — die `batch_NN.json`-Dateien
selbst werden dabei **nicht** verändert, deine Korrekturen landen in einem eigenen, separaten
Arbeitsbereich (`language-review/workspace/`).

**Weg B — von Hand direkt in der Datei** (falls du das Programm nicht nutzt):
- **Kleine Korrekturen** (z. B. falsche Vokalisierung, falscher Plural): trage den korrekten Wert
  direkt in `notes` ein, z. B.: `"notes": "Plural sollte أَسْعَار sein, nicht أَسْعَارٌ (Tanwin am Wortende ungewöhnlich für die Grundform)."`
  Ändere die eigentlichen Felder (`proposed_arabic_vocalized` usw.) NICHT selbst direkt um —
  schreibe die Korrektur stattdessen in `notes`, damit sie nachvollziehbar bleibt und von der
  Entwicklung kontrolliert eingepflegt wird.
- **Größere inhaltliche Probleme** (z. B. eine Übersetzung ist schlicht falsch, ein
  Anwendungsbeispiel ergibt keinen Sinn): beschreibe das Problem in `notes` so konkret wie
  möglich, gerne mit Verbesserungsvorschlag.
- **Wenn alles passt:** setze die passenden Felder in `review` auf `true` (z. B.
  `"arabic_vocalization_reviewed": true`, wenn die Vokalisierung korrekt ist) — du kannst die
  vier Aspekte eines Wortes unabhängig voneinander abhaken, falls du z. B. die Übersetzung schon
  geprüft hast, dir bei der Vokalisierung aber noch unsicher bist.
- Wenn alle vier Aspekte eines Wortes geprüft und korrekt sind, setze zusätzlich
  `"review_status": "reviewed"` (siehe nächster Abschnitt für die genaue Bedeutung).

## 4. Zulässige Statuswerte

Für `review_status` (sowohl bei Wörtern als auch bei Theoriedokumenten) sind genau diese Werte
vorgesehen:

- **`"needs_language_review"`** — Ausgangszustand, noch nicht geprüft. So beginnt jeder Eintrag.
- **`"reviewed"`** — du hast den Eintrag geprüft und für inhaltlich korrekt befunden (ggf. nach
  kleineren, in `notes` dokumentierten Korrekturen).
- **`"needs_correction"`** — du hast einen Fehler gefunden, der noch behoben werden muss, bevor
  der Eintrag als geprüft gelten kann (Beschreibung bitte in `notes`).
- **`"unsure"`** — du bist dir bei diesem Eintrag nicht sicher (z. B. bei regionalen
  Sprachvarianten, seltenen Begriffen oder wenn dir der Kontext fehlt) — siehe Abschnitt 6.

Setze **niemals** einen anderen Statuswert als diese vier — insbesondere kein `"approved"` (das
ist ein separater, späterer Schritt, siehe Abschnitt 5) und keinen frei erfundenen Text.

## 5. Wichtig: eine vorhandene Audiodatei ist KEINE Sprachprüfung — auch technisch erzeugte nicht

Ursprünglich (bis Entwicklungsauftrag 11) galt: kein neues Wort bekommt eine Audiodatei, bevor die
Sprachprüfung abgeschlossen ist. **Seit Entwicklungsauftrag 12 hat der Projektinhaber (Moritz
Schallenberg) ausdrücklich erlaubt, die fehlenden Audiodateien bereits VOR der Sprachprüfung
technisch zu erzeugen**, als reine unveröffentlichte Vorschau — um Zeit zu sparen, nicht um die
Prüfung zu ersetzen. Das ändert an deiner Aufgabe nichts Grundsätzliches, nur der Ausgangspunkt
ist jetzt ein anderer:

- Wörter, deren Audio so erzeugt wurde, tragen im Audio-Manifest den Erzeugungsstatus
  `"generated_unreviewed"` ("erzeugt, aber ungeprüft") und den Anhörprüfstatus `"not_reviewed"`.
  **Beides ist ausdrücklich NICHT dasselbe wie eine sprachliche Freigabe.**
- Der `content_status` des Wortes bleibt trotz vorhandener Datei `"needs_language_review"`, bis du
  (oder eine andere Person mit Arabischkenntnissen) es tatsächlich geprüft hast.
- **Neue Teilaufgabe für dich:** wenn eine Audiodatei existiert, höre sie dir im Prüfprogramm an
  (Aspekt "Audioaussprache") und markiere sie als korrekt, fehlerhaft ("Korrektur vorgeschlagen")
  oder unsicher. Klingt die Aussprache falsch, wird die Datei **nicht gelöscht**, sondern nur zur
  Neuerzeugung vorgemerkt (`"regeneration_required"`) — es passiert dabei nichts automatisch,
  jemand aus dem Entwicklungsteam stößt die Neuerzeugung gezielt an.
- **Stand seit Entwicklungsauftrag 13:** alle 900 Wörter haben inzwischen eine normale
  Audiodatei (141 Bestand + 759 technisch erzeugt) — solltest du dennoch auf ein Wort ohne Audio
  stoßen (z. B. nach einer späteren Korrektur mit `"regeneration_required"`), siehst du das im
  Prüfprogramm am Audiozustand des Wortes.

Die 141 Wörter aus `batch_00.json` haben schon länger eine Audiodatei (aus einer früheren
Projektphase, unverändert) — auch das war und ist keine Sprachprüfung. Bitte prüfe auch diese 141
Wörter wie alle anderen, inklusive ihrer Aussprache.

**Eine ausdrückliche, endgültige Audiofreigabe (`audio_review_status: "approved"` als
abschließendes Signal für "diese Aufnahme darf so im fertigen Kurs bleiben") ist weiterhin ein
eigener, bewusster letzter Schritt** — er setzt voraus, dass sowohl der Inhalt (Vokalisierung
usw.) als auch die Aussprache tatsächlich geprüft wurden.

## 6. Umgang mit widersprüchlichen oder unsicheren Einträgen

- Wenn du zwischen zwei plausiblen Vokalisierungen/Übersetzungen schwankst (z. B. wegen
  regionaler Unterschiede im gesprochenen Arabisch gegenüber MSA), setze `review_status` auf
  `"unsure"` und beschreibe in `notes`, worin die Unsicherheit besteht — das ist ausdrücklich in
  Ordnung, rate nicht.
- Wenn ein Wort als bewusstes Homonym markiert ist (`homonym_group` gesetzt) und dir die
  Doppelbedeutung fraglich erscheint, prüfe bitte gezielt: sind wirklich BEIDE Bedeutungen im
  MSA gebräuchlich? Falls nicht, vermerke das in `notes`.
- Wenn dir ein `opposite_id`-Gegensatzpaar sprachlich nicht überzeugend erscheint (z. B. zu
  konstruiert), vermerke das ebenfalls — solche Zuordnungen sind rein didaktisch gedacht und
  können bei Bedarf entfernt werden.
- Bei Unit 14 (Gesundheit) und Unit 25 (Arbeit): diese Einheiten vermitteln ausschließlich
  Wortschatz für Alltagssituationen (Arztbesuch/Apotheke bzw. Bewerbungsgespräch) — bitte prüfe
  nur die sprachliche Korrektheit, nicht die medizinische oder arbeitsrechtliche Richtigkeit von
  Inhalten (diese Unit ist bewusst kein medizinischer oder rechtlicher Ratgeber).
- Widersprichst du dir selbst zwischen zwei Prüfdurchgängen (z. B. weil du eine frühere Notiz
  nicht mehr nachvollziehen kannst)? Kein Problem — überschreibe `notes` mit deiner aktuellen,
  finalen Einschätzung. Wichtig ist der Stand am Ende, nicht die Historie einzelner Änderungen.

## 7. Wichtig: keine Review-Datei darf von Batch-Skripten überschrieben werden

**Falls du das Prüfprogramm nutzt (Weg A):** deine Eingaben werden automatisch atomar
gespeichert, mit Sicherungskopie und vollständigem Änderungsverlauf (wer/wann/welches Feld/alter
Wert/neuer Wert) — dazu musst du nichts weiter tun. Das Programm erkennt außerdem, wenn ein
Eintrag zwischenzeitlich anderswo geändert wurde (z. B. in einem zweiten geöffneten Fenster), und
überschreibt ihn dann nicht stillschweigend, sondern meldet einen Konflikt.

**Für Weg B (manuelle Bearbeitung) gilt zusätzlich:**

Die technischen Erzeugungsskripte dieses Projekts (`scripts/build-language-review-and-manifest.js`
und ähnliche) sind so geschrieben, dass sie **niemals** eine bereits erzeugte `batch_NN.json`
automatisch neu generieren und dabei deine Prüfnotizen überschreiben — jeder Batch wird genau
einmal erzeugt. Trotzdem als Sicherheitshinweis für alle, die mit dem Code arbeiten: **Führe
nie erneut ein `build-*`-Skript für einen Batch aus, den eine Person bereits zu prüfen begonnen
hat**, ohne vorher ausdrücklich zu prüfen, ob dabei `notes`/`review_status`/`review`-Felder
verloren gehen könnten. Im Zweifel: vorher eine Sicherheitskopie der Datei anlegen.

## 8. Kurz zusammengefasst — dein Arbeitsablauf

1. Öffne eine `batch_NN.json`-Datei.
2. Gehe die Wörter nacheinander durch (Reihenfolge egal).
3. Prüfe pro Wort: Vokalisierung, Umschrift, deutsche Übersetzung(en), Application-Prompt.
4. Trage Korrekturen/Anmerkungen in `notes` ein.
5. Setze die passenden `review`-Häkchen auf `true`, wenn dieser Aspekt korrekt ist.
6. Wenn alle vier Aspekte korrekt sind: setze `review_status` auf `"reviewed"`.
7. Wiederhole für die 15 `theory_review`-Einträge derselben Datei (Theorietexte in
   `language-packs/arabic/theory.json` nachlesen).
8. Speichere die Datei — fertig für diesen Batch. Audiofreigabe und weitere Schritte übernimmt
   danach das Entwicklungsteam.

Vielen Dank für deine Arbeit — ohne eine echte Sprachprüfung durch eine Person mit
Arabischkenntnissen bleibt dieser Kurs, egal wie vollständig er technisch wirkt, ein reiner
Entwurf.
