#!/usr/bin/env python3
"""
Erzeugt Audiodateien für das arabische Sprachpaket über die ElevenLabs-TTS-API
(natürlichere Stimme als espeak-ng). Ersetzt die vorhandenen Dateien 1:1 an derselben
Stelle (language-packs/arabic/audio/...) — keine Code-Änderung an der App nötig, die
Wiedergabe (audioPlayer.js) spielt einfach die neuen Dateien ab.

Voraussetzung: ein ElevenLabs-Account + API-Key (https://elevenlabs.io).
Kostenloses Kontingent: 10.000 Zeichen/Monat — unser gesamter Wortschatz liegt aktuell
bei ca. 500-800 Zeichen (x2 für normal+langsam), sollte also weit darunter bleiben.

Überspringt standardmäßig bereits vorhandene Dateien (spart API-Kontingent) — mit --force
werden alle Dateien neu erzeugt.

Aufruf:
    export ELEVENLABS_API_KEY="dein-api-key"
    python3 scripts/generate_audio_elevenlabs.py [--force]

Optional:
    ELEVENLABS_VOICE_ID  - andere Stimme statt der Standardstimme "Alice"
                           (nur Stimmen aus "My Voices" deines Accounts funktionieren im
                           Free-Tier über die API — abfragen mit:
                           python3 -c "import requests,os; r=requests.get('https://api.elevenlabs.io/v1/voices', headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY']}); [print(v['voice_id'],'-',v['name']) for v in r.json()['voices']]")
"""
import json
import os
import sys
import time
from pathlib import Path

import requests

FORCE = "--force" in sys.argv

REPO_ROOT = Path(__file__).resolve().parent.parent
PACK_DIR = REPO_ROOT / "language-packs" / "arabic"
AUDIO_DIR = PACK_DIR / "audio"

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "Xb7hH8MSUJpSbSDYk0k2")  # "Alice" - "Clear, Engaging Educator", aus den premade-Stimmen dieses Accounts bestätigt nutzbar
MODEL_ID = "eleven_multilingual_v2"  # unterstützt Arabisch
API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

# ElevenLabs kennt keine feste Wörter-pro-Minute-Angabe wie espeak-ng; der Wertebereich für
# "speed" ist von ElevenLabs mit ca. 0.7-1.2 dokumentiert (1.0 = normal). Nicht selbst
# live getestet — bei Fehlermeldung ggf. hier anpassen.
NORMAL_SPEED = 1.0
SLOW_SPEED = 0.7

total_characters = 0


def check_api_key():
    if not API_KEY:
        print("ELEVENLABS_API_KEY ist nicht gesetzt. Siehe Skript-Kopf für die Anleitung.", file=sys.stderr)
        sys.exit(1)


class FatalApiError(Exception):
    """Wird bei Fehlern ausgelöst, bei denen Weiterprobieren sinnlos ist (z. B. 401/402)."""


def synthesize(text, out_path, speed):
    global total_characters
    out_path.parent.mkdir(parents=True, exist_ok=True)
    response = requests.post(
        API_URL,
        params={"output_format": "wav_22050"},
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": MODEL_ID,
            "voice_settings": {"speed": speed, "stability": 0.5, "similarity_boost": 0.75},
        },
        timeout=30,
    )
    if response.status_code in (401, 402):
        raise FatalApiError(f"{response.status_code}: {response.text[:300]}")
    if response.status_code != 200:
        print(f"  FEHLER ({response.status_code}) bei \"{text}\": {response.text[:300]}", file=sys.stderr)
        return False
    out_path.write_bytes(response.content)
    total_characters += len(text)
    return True


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def generate_for_entries(entries, subdir):
    ok, failed, skipped = 0, 0, 0
    for entry_id, text in entries:
        normal_path = AUDIO_DIR / subdir / f"{entry_id}.wav"
        slow_path = AUDIO_DIR / subdir / f"{entry_id}_slow.wav"

        if not FORCE and normal_path.exists() and slow_path.exists():
            skipped += 1
            continue

        normal_ok = synthesize(text, normal_path, NORMAL_SPEED)
        ok += normal_ok
        failed += not normal_ok
        time.sleep(0.3)
        slow_ok = synthesize(text, slow_path, SLOW_SPEED)
        ok += slow_ok
        failed += not slow_ok
        time.sleep(0.3)
        status = "OK" if (normal_ok and slow_ok) else "TEILWEISE FEHLGESCHLAGEN"
        print(f"  [{status}] {subdir}/{entry_id}.wav (+ _slow) — \"{text}\"")

    if skipped:
        print(f"  ({skipped} bereits vorhanden, übersprungen — mit --force erzwingen)")
    return ok, failed


def main():
    check_api_key()

    vocabulary = load_json(PACK_DIR / "vocabulary.json")
    keyboard = load_json(PACK_DIR / "keyboard.json")

    vocab_entries = [
        (word["id"], word["arabic"])
        for category in vocabulary["categories"]
        for word in category["words"]
    ]
    letter_entries = [
        (letter["id"], letter["example_word"])
        for letter in keyboard["letters"]
    ]

    try:
        print(f"Erzeuge {len(vocab_entries)} Vokabel-Audiodateien (x2 für langsam) über ElevenLabs...")
        ok1, failed1 = generate_for_entries(vocab_entries, "vocabulary")

        print(f"Erzeuge {len(letter_entries)} Buchstaben-Beispielwort-Audiodateien (x2 für langsam)...")
        ok2, failed2 = generate_for_entries(letter_entries, "letters")
    except FatalApiError as err:
        print(f"\nAbgebrochen — API meldet einen Fehler, bei dem Weiterprobieren sinnlos ist: {err}", file=sys.stderr)
        print("Häufigste Ursache: ELEVENLABS_VOICE_ID zeigt auf eine Voice-Library-Stimme, die der", file=sys.stderr)
        print("Free-Tier nicht über die API nutzen darf. Liste deine eigenen nutzbaren Stimmen mit:", file=sys.stderr)
        print('  curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices | python3 -m json.tool', file=sys.stderr)
        print("und setze ELEVENLABS_VOICE_ID auf eine davon. Bereits erzeugte Dateien bleiben erhalten.", file=sys.stderr)
        sys.exit(1)

    print(f"\nFertig: {ok1 + ok2} Dateien erzeugt, {failed1 + failed2} fehlgeschlagen.")
    print(f"Verbrauchte Zeichen (ungefähr, zählt zum Monatskontingent): {total_characters}")


if __name__ == "__main__":
    main()
