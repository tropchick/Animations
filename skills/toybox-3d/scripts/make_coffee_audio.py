#!/usr/bin/env python3
"""Build the 28-second Toybox coffee score and frame-synchronized foley with FFmpeg."""

from array import array
from math import cos, exp, pi, sin
from pathlib import Path
from random import Random
from tempfile import TemporaryDirectory
import argparse
import json
import re
import subprocess
import sys
import wave

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parents[2] / "video/public/audio/toybox-3d/coffee.mp3"
RATE = 48_000
FPS = 30
FRAMES = 840
COUNT = FRAMES * RATE // FPS
TAU = 2 * pi


def midi(note):
    return 440 * 2 ** ((note - 69) / 12)


class Mix:
    def __init__(self):
        self.left = array("f", [0]) * COUNT
        self.right = array("f", [0]) * COUNT
        self.rng = Random(428)

    def add(self, source, at, duration, gain, *, pan=0, attack=.008, release=.075):
        start = round(at * RATE)
        samples = round(duration * RATE)
        angle = (pan + 1) * pi / 4
        left = gain * cos(angle)
        right = gain * sin(angle)
        for index in range(max(0, -start), min(samples, COUNT - start)):
            time = index / RATE
            level = min(1, time / attack, (duration - time) / release)
            value = source(time) * level
            self.left[start + index] += left * value
            self.right[start + index] += right * value

    def tone(self, at, duration, frequency, gain, *, pan=0, attack=.008, release=.09,
             decay=5, end=None, partials=((1, 1), (2, .16))):
        rate = ((end if end is not None else frequency) - frequency) / duration

        def sample(time):
            phase = TAU * time * (frequency + .5 * rate * time)
            return exp(-decay * time) * sum(weight * sin(phase * harmonic) for harmonic, weight in partials)

        self.add(sample, at, duration, gain, pan=pan, attack=attack, release=release)

    def texture(self, at, duration, gain, *, pan=0, attack=.05, release=.10, decay=2,
                lowpass=.15, highpass=.012):
        low = slow = 0.

        def sample(time):
            nonlocal low, slow
            noise = self.rng.uniform(-1, 1)
            low += (noise - low) * lowpass
            slow += (low - slow) * highpass
            return (low - slow) * exp(-decay * time)

        self.add(sample, at, duration, gain, pan=pan, attack=attack, release=release)

    def foley(self, at):
        # Decoder delay is removed by FFmpeg. The recorded transient starts at about 130 ms.
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i",
            str(HERE / "coffee-foley.mp3"), "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-"])
        signal = array("f")
        signal.frombytes(raw)
        if sys.byteorder != "little":
            signal.byteswap()
        first, last = round(.104 * RATE), round(.26 * RATE)
        trim = signal[first:last]
        peak = max(abs(value) for value in trim)
        self.add(lambda time: trim[min(len(trim) - 1, round(time * RATE))] / peak,
                 at - .026, len(trim) / RATE, .31, pan=-.22, attack=.006, release=.065)

    def save(self, output):
        pcm = array("h")
        for left, right in zip(self.left, self.right):
            pcm.extend(round(32767 * max(-1, min(1, channel))) for channel in (left, right))
        if sys.byteorder != "little":
            pcm.byteswap()
        output.parent.mkdir(parents=True, exist_ok=True)
        loudness = "loudnorm=I=-17:TP=-2:LRA=8"
        with TemporaryDirectory() as directory:
            wav = Path(directory) / "coffee.wav"
            with wave.open(str(wav), "wb") as stream:
                stream.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
                stream.writeframes(pcm.tobytes())
            base = ["ffmpeg", "-hide_banner", "-i", str(wav)]
            scan = subprocess.run(base + ["-af", loudness + ":print_format=json",
                                  "-f", "null", "-"], capture_output=True, text=True, check=True)
            stats = json.loads(re.findall(r"\{[^{}]+\}", scan.stderr)[-1])
            norm = loudness + ":linear=true" + "".join(
                f":{to}={stats[source]}" for to, source in
                (("measured_I", "input_i"), ("measured_LRA", "input_lra"),
                 ("measured_TP", "input_tp"), ("measured_thresh", "input_thresh"),
                 ("offset", "target_offset")))
            subprocess.run(base + ["-loglevel", "error", "-y", "-af", norm,
                           "-ar", str(RATE), "-map_metadata", "-1",
                           "-codec:a", "libmp3lame", "-b:a", "128k", str(output)], check=True)


def mallet(mix, at, note, gain, pan=0, duration=.49):
    frequency = midi(note)
    mix.tone(at, duration, frequency, gain, pan=pan, release=.15,
             decay=5.8, partials=((1, 1), (2, .14), (3.98, .17)))
    mix.tone(at + .093, duration, frequency, gain * .17, pan=-pan, attack=.022,
             release=.18, decay=7.1, partials=((1, 1), (2, .06)))


def score(mix):
    # Short, separated wood-mallet phrases leave space for the mechanism and the final clink.
    for at, notes, spacing, gain in (
        (.28, (74, 78, 81, 78), .30, .094),
        (2.39, (72, 76, 79, 76), .31, .087),
        (4.77, (74, 78, 81), .29, .062),
        (6.31, (74, 76, 78, 81, 86), .33, .072),
        (9.35, (74, 81, 86), .095, .102),
        (12.27, (81, 86, 90, 88), .22, .081),
        (14.30, (74, 76, 78, 81), .30, .077),
        (16.67, (79, 83, 86, 83), .29, .069),
        (18.89, (78, 81, 86), .34, .071),
        (20.86, (81, 78, 74), .22, .063),
        (25.50, (90, 86, 81, 74), .10, .104),
    ):
        for index, note in enumerate(notes):
            mallet(mix, at + index * spacing, note, gain * (.95 ** index),
                   (-.34, .22, -.12, .36)[index % 4])

    for at, note in (
        (.28, 50), (1.46, 57), (2.55, 55), (3.57, 57), (5.13, 50),
        (6.31, 47), (7.51, 54), (8.73, 57), (9.34, 50), (10.51, 57),
        (12.23, 62), (13.35, 57), (14.44, 55), (15.60, 57), (16.74, 55),
        (17.84, 59), (18.95, 54), (20.56, 50), (21.60, 57), (25.50, 50),
    ):
        mix.tone(at, .62, midi(note), .082, decay=5.3, release=.16,
                 partials=((1, 1), (2, .22), (3, .09)))
        if 1 < at < 21:
            mix.texture(at + .29, .13, .038, attack=.012, release=.07, decay=12,
                        lowpass=.25, highpass=.038, pan=.29)

    for at, duration in ((0, 5.65), (9.74, 2.22), (12.3, 7.93), (20.7, 2.25), (24.43, 3.55)):
        mix.texture(at, duration, .051, attack=.47, release=.55, decay=.09,
                    lowpass=.035, highpass=.002, pan=-.40)


def accents(mix, original_foley):
    tap, unfold, assemble, reveal, pullback, drop = (frame / FPS for frame in (132, 173, 279, 365, 615, 720))
    if original_foley:
        mix.texture(tap, .12, .22, pan=-.22, attack=.003, release=.07,
                    decay=21, lowpass=.31, highpass=.032)
        mix.tone(tap, .14, 640, .096, pan=-.22, end=310, decay=22)
    else:
        mix.foley(tap)
    mix.tone(tap + .022, .16, 168, .071, end=76, decay=14, release=.08)
    for lag, pan, velocity in ((0, -.45, .108), (.075, .43, .104), (.174, -.16, .123)):
        mix.texture(unfold + lag, .21, velocity, pan=pan, attack=.009,
                    release=.085, decay=10, lowpass=.22, highpass=.027)
        mix.tone(unfold + lag, .20, 210, velocity * .48, pan=pan, end=79, decay=12)
    mix.tone(unfold + .23, .57, 78, .097, end=276, decay=1.6, attack=.15, release=.22)

    mix.texture(assemble - .22, .70, .19, attack=.21, release=.27, decay=1.2, lowpass=.12)
    mix.tone(assemble, .48, 148, .159, end=54, attack=.006, decay=7, release=.20)
    mix.tone(assemble, .30, 511, .061, decay=11, partials=((1, 1), (2.21, .44)))

    mix.texture(reveal - .28, .66, .14, attack=.26, release=.25, decay=.65, lowpass=.17, pan=.23)
    mix.tone(reveal - .18, .44, 333, .058, end=832, decay=2.6, attack=.14, release=.14)
    mix.texture(pullback - .23, .72, .127, attack=.20, release=.24, decay=1.4, lowpass=.095, pan=-.24)
    mix.tone(pullback - .10, .40, 489, .057, end=155, decay=5, attack=.05, release=.19)

    # Thin ceramic has a short attack and discordant resonances. The second tap is faint.
    for time, level in ((drop, .151), (drop + .099, .052)):
        mix.texture(time, .10, level, attack=.002, release=.06, decay=24, lowpass=.30)
        mix.tone(time, .38, 892, level, pan=.15, attack=.004, release=.18, decay=13,
                 partials=((1, 1), (1.54, .52), (2.16, .34), (3.22, .16)))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--original-foley", action="store_true",
                        help="Replace the sampled button click with a synthesized one")
    args = parser.parse_args()
    mix = Mix()
    score(mix)
    accents(mix, args.original_foley)
    mix.save(args.output)
