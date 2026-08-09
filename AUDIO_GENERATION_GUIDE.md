# Anleitung: Audioerzeugung für Kurs 1 (Entwicklungsauftrag 12)

Diese Anleitung richtet sich an das Entwicklungsteam (technisches Vorwissen vorausgesetzt) und
beschreibt die manifest-gesteuerte Audio-Erzeugungspipeline für die 759 bislang fehlenden
Vokabelaudios von Kurs 1.

## 0. Der wichtigste Satz vorab

**Der Nutzer Moritz Schallenberg hat mit Entwicklungsauftrag 12 ausdrücklich die technische
Erzeugung der 759 fehlenden Audiodateien erlaubt, obwohl die Sprachprüfung noch nicht
abgeschlossen ist.** Diese Erlaubnis bedeutet **nicht**, dass die arabischen Inhalte sprachlich
bestätigt wurden, dass die Aussprache geprüft wurde, oder dass die Audios als endgültig
freigegeben gelten. **Audioerzeugung ist nicht gleich Audiofreigabe.** Jede so erzeugte Datei ist
und bleibt "generiert, aber sprachlich ungeprüft", bis eine Person mit Arabischkenntnissen sie
im Review-Modus (`npm run review:start`, siehe `REVIEWER_QUICKSTART.md`) angehört und bestätigt
hat.

## 1. Überblick über die Pipeline

```
scripts/audio/
  audioManifestModel.js  — Statusmodell (language_status/generation_status/audio_review_status)
  ttsProviders.js         — Anbieter-Anbindung (ElevenLabs; espeak-ng NUR für technische Muster)
  wavValidation.js        — rein technische WAV-Prüfung (kein Ersatz für eine Hörprüfung!)
  audioPipeline.js        — Auswahl, Staging, Erzeugung mit Backoff, atomare Übernahme, Verify
scripts/audioCli.js        — Kommandozeilenwerkzeug (plan/generate/verify)
scripts/upgrade-audio-manifest-model.js — einmalige, idempotente Schemaerweiterung des Manifests
```

Das Manifest (`audio_generation_manifest.json`) ist die **maßgebliche Auswahlquelle** — die
Pipeline verarbeitet niemals pauschal das gesamte Vokabular, sondern ausschließlich die dort
gelisteten Einträge (aktuell 759 — alle Wörter ohne vorhandene Audiodatei aus den Batches 1-6).
Die 141 ursprünglichen Wörter aus Batch 0 stehen bewusst NICHT im Manifest, da sie bereits eine
Aufnahme haben, und werden von der Pipeline dadurch niemals angefasst.

## 2. Statusmodell (Abschnitt 9)

Jeder Manifest-Eintrag hat jetzt drei unabhängige Statusachsen (zusätzlich zum alten, unverändert
erhaltenen `status`-Feld):

| Feld | Werte | Bedeutung |
|---|---|---|
| `language_status` | `needs_language_review` / `reviewed` / `approved` | Sprachlicher Prüfstand des Wortes |
| `generation_status` | `pending` / `preview_generation_authorized` / `generated_unreviewed` / `failed` / `regeneration_required` | Stand der TECHNISCHEN Erzeugung |
| `audio_review_status` | `not_reviewed` / `approved` / `rejected` / `uncertain` | Ergebnis einer Anhörprüfung |

Jeder erfolgreich erzeugte Eintrag bekommt zusätzlich ein `generation`-Objekt mit `provider`,
`model`, `voice_id`, `generated_at`, `input_text`, `input_text_hash`, `checksum_sha256` und
`reason` (immer `"user_authorized_preview_generation"` für diese Runde).

## 3. Befehle

```
npm run audio:plan              # nur lesen: zeigt Anzahl Dateien, Zeichen, geplante API-Aufrufe
npm run audio:generate:sample   # erzeugt eine repräsentative Stichprobe von 20 Wörtern
npm run audio:generate          # erzeugt alle noch fehlenden Dateien
npm run audio:verify            # rein lesende Konsistenzprüfung (Prüfsummen, Dateien vorhanden)
```

Zusätzliche Flags für `scripts/audioCli.js generate`: `--dry-run` (schreibt nichts, macht keinen
API-Aufruf), `--ids id1,id2` (gezielte Einzel-IDs, z. B. zur Neuerzeugung nach einer Korrektur),
`--unit vocab_unit_26` (nur eine bestimmte Unit).

**Kein Befehl unterstützt `--force` für den Gesamtlauf** — die 141 vorhandenen Aufnahmen werden
dadurch strukturell nie überschrieben (zusätzlich durch eine eigene Laufzeitprüfung abgesichert,
siehe `audioPipeline.js#generateOne`).

## 4. Anbieter und Kostenschutz (Abschnitt 12)

Bevorzugter Anbieter: **ElevenLabs**, Modell `eleven_multilingual_v2` (unterstützt Arabisch).
Voraussetzung: Umgebungsvariable `ELEVENLABS_API_KEY` gesetzt (niemals im Code, niemals in Logs,
niemals im Export). Vor jedem `generate`-Lauf gibt die Pipeline automatisch eine
Kostenschutz-Vorschau aus: Anzahl Dateien, Anzahl Zeichen, Anzahl geplanter API-Aufrufe, bereits
vorhandene/zu überspringende Dateien.

**Ist `ELEVENLABS_API_KEY` nicht gesetzt, bricht `audio:generate`/`audio:generate:sample` sofort
ab, BEVOR auch nur ein Wort verarbeitet oder das Manifest verändert wird** ("Fail-Fast") — es
gibt keine stille Umschaltung auf einen anderen Anbieter oder eine andere Stimme.

`espeak-ng` darf laut Auftrag nur für eine klar getrennte TECHNISCHE Stichprobe verwendet werden,
niemals für produktnahe Vorschauaufnahmen — `synthesizeWithEspeakTechnicalSample()` in
`scripts/audio/ttsProviders.js` ist entsprechend gekennzeichnet und wird von den npm-Skripten
`audio:*` nicht automatisch verwendet.

## 5. Nur normale Datei, standardmäßig keine `_slow.wav` (Abschnitt 11)

`src/js/audioPlayer.js` spielt eine normale Aufnahme bereits mit `playbackRate=0.75` langsamer ab,
wenn keine eigene `*_slow.wav` existiert. Die Pipeline erzeugt deshalb standardmäßig **nur**
`<id>.wav`, keine zweite Datei — das halbiert den Zeichenverbrauch ungefähr. Aus den tatsächlichen
Daten neu berechnet (nicht die veraltete Schätzung "500-800 Zeichen für den gesamten Kurs" aus
einer früheren Projektphase): **759 fehlende Wörter ≈ 6.159 Zeichen** für die normale Aufnahme
allein (≈ 12.318 Zeichen, wenn zusätzlich auch alle `_slow.wav` erzeugt würden — was dieser
Auftrag bewusst nicht tut).

## 6. Staging, technische Prüfung, atomare Übernahme (Abschnitt 13)

Neue Dateien werden zuerst nach `language-packs/arabic/audio/.staging/vocabulary/` geschrieben
(temporäre Datei + atomares Umbenennen), dort technisch geprüft (`wavValidation.js`: gültiger
WAV-Header, plausible Größe/Dauer, nicht stumm, keine als WAV gespeicherte JSON-/HTML-
Fehlerantwort) und erst danach atomar in den produktiven Audioordner übernommen. Schlägt die
Prüfung fehl, wird NICHTS übernommen, der Eintrag bekommt `generation_status: "failed"` mit
Fehlerbeschreibung.

**Wichtig:** eine bestandene technische Prüfung ist KEINE Bestätigung der arabischen Aussprache
— das kann nur ein Mensch mit Arabischkenntnissen beurteilen (siehe `REVIEWER_QUICKSTART.md`).

## 7. Wiederholungsversuche, Fortsetzbarkeit

Bei einem als wiederholbar eingestuften Fehler (Netzwerkfehler, unerwarteter HTTP-Status)
versucht die Pipeline bis zu 3x mit steigender, begrenzter Wartezeit (Backoff). Bei einem
nicht wiederholbaren Fehler (401/402 — ungültiger Schlüssel/Kontingent aufgebraucht) bricht sie
sofort ab, ohne weitere Versuche zu verschwenden. Ein unterbrochener Gesamtlauf (z. B. durch
Abbruch oder Absturz) ist von selbst fortsetzbar: `npm run audio:generate` verarbeitet beim
nächsten Aufruf nur noch die Wörter, die noch nicht erfolgreich erzeugt wurden.

## 8. Regenerierung nach einer Korrektur

Wird im Review-Modus die Vokalisierung eines Wortes korrigiert oder die Aussprache als "Korrektur
vorgeschlagen"/"unsicher" markiert, setzt `scripts/review/reviewWorkspaceStore.js` den
`generation_status` des betroffenen Manifest-Eintrags automatisch auf
`"regeneration_required"` — die vorhandene Datei wird dabei **nicht gelöscht** und es wird
**keine automatische Neuerzeugung gestartet**. Um die Neuerzeugung gezielt anzustoßen:

```
node scripts/audioCli.js generate --ids <wort-id>[,<wort-id>...]
```

## 9. Nach einem vollständigen Lauf: Verify

```
npm run audio:verify
```

Prüft für jeden als `generated_unreviewed` markierten Eintrag: Datei vorhanden, Prüfsumme
stimmt noch mit der beim Erzeugen gespeicherten überein (erkennt externe Veränderungen), Datei
besteht weiterhin die technische WAV-Prüfung. Rein lesend, verändert nichts.

## 10. Nicht Teil dieser Pipeline (bewusst)

- Keine Sprachprüfung durch die Pipeline selbst — nur technische Prüfung.
- Keine endgültige Audiofreigabe (`audio_review_status: "approved"` wird ausschließlich über den
  Review-Modus von einer Person gesetzt, nie automatisch von der Pipeline).
- Kein Kauf von zusätzlichem Kontingent, kein automatisches Umschalten auf einen anderen
  kostenpflichtigen Anbieter.
- Keine Änderung an den 141 vorhandenen normalen und 141 vorhandenen langsamen Aufnahmen.
