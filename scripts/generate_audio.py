#!/usr/bin/env python3
"""
Erzeugt Audiodateien für das arabische Sprachpaket mit espeak-ng.

Voraussetzung (nur für dieses Skript, nicht für Nutzer der fertigen App):
    sudo apt-get install -y espeak-ng

Erzeugt je Wort/Buchstaben-Beispielwort zwei WAV-Dateien (normal + langsam) unter
language-packs/arabic/audio/{vocabulary,letters}/<id>[_slow].wav — das entspricht
Stufe 2 ("im Sprachpaket enthaltene Aufnahme") aus der Systembeschreibung, besser als
sich zur Laufzeit auf eine ggf. fehlende System-TTS-Stimme zu verlassen.

Die Stimme (espeak-ng "ar") klingt synthetisch/robotisch, keine menschliche Aufnahme —
vor produktivem Einsatz idealerweise durch echte Aufnahmen ersetzen. Erneut ausführen,
wenn Vokabular/Buchstaben-Beispielwörter ergänzt werden.

Aufruf: python3 scripts/generate_audio.py
"""
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PACK_DIR = REPO_ROOT / "language-packs" / "arabic"
AUDIO_DIR = PACK_DIR / "audio"

NORMAL_SPEED_WPM = 150
SLOW_SPEED_WPM = 90
VOICE = "ar"


def check_espeak_ng():
    try:
        subprocess.run(["espeak-ng", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("espeak-ng nicht gefunden. Installieren mit: sudo apt-get install -y espeak-ng", file=sys.stderr)
        sys.exit(1)


def synthesize(text, out_path, speed_wpm):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["espeak-ng", "-v", VOICE, "-s", str(speed_wpm), "-w", str(out_path), text],
        check=True,
        capture_output=True,
    )


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def generate_for_entries(entries, subdir):
    generated = 0
    for entry_id, text in entries:
        normal_path = AUDIO_DIR / subdir / f"{entry_id}.wav"
        slow_path = AUDIO_DIR / subdir / f"{entry_id}_slow.wav"
        synthesize(text, normal_path, NORMAL_SPEED_WPM)
        synthesize(text, slow_path, SLOW_SPEED_WPM)
        generated += 2
        print(f"  {subdir}/{entry_id}.wav (+ _slow) — \"{text}\"")
    return generated


def main():
    check_espeak_ng()

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

    print(f"Erzeuge {len(vocab_entries)} Vokabel-Audiodateien (x2 für langsam)...")
    count_vocab = generate_for_entries(vocab_entries, "vocabulary")

    print(f"Erzeuge {len(letter_entries)} Buchstaben-Beispielwort-Audiodateien (x2 für langsam)...")
    count_letters = generate_for_entries(letter_entries, "letters")

    total = count_vocab + count_letters
    print(f"\nFertig: {total} Audiodateien erzeugt unter {AUDIO_DIR}")


if __name__ == "__main__":
    main()
