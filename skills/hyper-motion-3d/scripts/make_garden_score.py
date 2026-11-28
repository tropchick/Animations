#!/usr/bin/env python3
"""Synthesize the original rooftop garden music bed and individual Foley cues."""

from array import array
from math import cos, exp, pi, sin
from pathlib import Path
from random import Random
import json
import subprocess
import sys
import tempfile
import wave

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[1]
OUTPUT = ROOT / "video/public/audio/hyper-motion-v2"
TIMING = json.loads((SKILL / "examples/garden-audio.json").read_text())
FPS = TIMING["fps"]
RATE = 48_000
FRAME_SAMPLES = RATE // FPS
TAU = 2 * pi
MASTER_GAIN = 10 ** (2.7 / 20)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


class Stereo:
    def __init__(self, frames, seed):
        self.left = array("f", [0]) * (frames * FRAME_SAMPLES)
        self.right = array("f", [0]) * (frames * FRAME_SAMPLES)
        self.random = Random(seed)

    def add(self, start, seconds, gain, pan, oscillator):
        offset = max(0, round(start * RATE))
        count = min(len(self.left) - offset, round(seconds * RATE))
        angle = (pan + 1) * pi / 4
        left_gain, right_gain = gain * cos(angle), gain * sin(angle)
        for index in range(count):
            sample = oscillator(index / RATE)
            self.left[offset + index] += left_gain * sample
            self.right[offset + index] += right_gain * sample

    def export(self, path, bitrate):
        pcm = array("h")
        peak = MASTER_GAIN * max(max(map(abs, self.left)), max(map(abs, self.right)))
        if peak >= 0.98:
            raise ValueError(f"Overloaded source {path.name}: {peak:.3f}")
        scale = 32767 * MASTER_GAIN
        for left, right in zip(self.left, self.right):
            pcm.extend((round(scale * left), round(scale * right)))
        if sys.byteorder != "little":
            pcm.byteswap()
        with tempfile.TemporaryDirectory() as temp:
            wav_path = Path(temp) / "garden.wav"
            with wave.open(str(wav_path), "wb") as stream:
                stream.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
                stream.writeframes(pcm.tobytes())
            subprocess.run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(wav_path), "-map_metadata", "-1", "-c:a", "libmp3lame",
                    "-b:a", bitrate, str(path),
                ],
                check=True,
            )


def swell(time, duration, attack, release):
    rise = min(1, time / attack)
    fall = min(1, (duration - time) / release)
    return rise * rise * fall * fall


def struck(bus, start, duration, frequency, gain, pan=0, wood=True):
    """Damped physical modes of a struck wood bar or miniature glass bead."""
    mode_two, mode_three = (3.97, 9.11) if wood else (2.40, 5.12)
    decay = 6.4 if wood else 3.9
    omega = TAU * frequency

    def oscillator(time):
        phase = omega * time + (1 - exp(-time * 49)) * (0.56 if wood else .16)
        body = sin(phase) * exp(-time * decay)
        attack = .24 * sin(phase * mode_two) * exp(-time * 24)
        tip = .085 * sin(phase * mode_three) * exp(-time * 52)
        return (body + attack + tip) * swell(time, duration, .0025, .16)

    bus.add(start, duration, gain, pan, oscillator)


def elastic(bus, start, duration, low, high, gain, pan=0, decay=8.0):
    slope = (high - low) / duration

    def oscillator(time):
        phase = TAU * (low + slope * time / 2) * time
        return (sin(phase) + .17 * sin(phase * 2) + .05 * sin(phase * 3)) * (
            exp(-time * decay) * swell(time, duration, .008, .095)
        )

    bus.add(start, duration, gain, pan, oscillator)


def air(bus, start, duration, gain, pan=0, tint=.13, attack=.015, release=.18, decay=2.0):
    low = 0.0
    high = 0.0

    def oscillator(time):
        nonlocal low, high
        white = bus.random.uniform(-1, 1)
        high += (white - high) * tint
        low += (high - low) * (tint * .23)
        gust = .80 + .2 * sin(TAU * 3.2 * time)
        return (high - low * .62) * gust * exp(-time * decay) * (
            swell(time, duration, attack, release)
        )

    bus.add(start, duration, gain, pan, oscillator)


def chord_tone(bus, start, duration, note, gain, pan, attack=.3, release=.75):
    """A soft harmonium-like support with slightly asymmetric beating."""
    omega = TAU * hz(note)

    def oscillator(time):
        phase = omega * time
        flutter = .83 + .17 * sin(TAU * 2.9 * time)
        voice = sin(phase) + .31 * sin(phase * 1.998) + .10 * sin(phase * 3.006)
        return voice * flutter * swell(time, duration, attack, release)

    bus.add(start, duration, gain, pan, oscillator)


def motif(bed, start, notes, step, gain):
    for index, note in enumerate(notes):
        pan = (-.29, .14, -.1, .35, .12)[index]
        struck(bed, start + index * step, .76, hz(note), gain * (.93 ** index), pan)
        struck(bed, start + index * step + .113, .54, hz(note) * 1.002,
               gain * .14, -pan, wood=False)


def garden_bed():
    bed = Stereo(TIMING["bed"], 31831)
    # Rubbery wooden mallets and the recessed pad leave room for actual motions.
    chords = [
        (0, .87, (50, 57, 64), .16),
        (1.72, 2.25, (50, 57, 61, 64), .17),
        (4.18, 2.7, (47, 54, 57, 62), .17),
        (6.78, 2.52, (43, 55, 62, 66), .19),
        (8.76, 3.2, (50, 57, 64, 66), .21),
        (11.81, 3.2, (47, 54, 57, 62), .22),
        (14.40, 1.01, (45, 57, 62, 64), .16),
        (16.04, 3.43, (43, 55, 62, 66), .25),
        (19.15, 3.28, (50, 57, 64, 66), .24),
        (22.08, 2.15, (54, 57, 62, 64), .12),
        (25.50, 2.50, (50, 57, 66, 69), .14),
    ]
    for start, duration, notes, gain in chords:
        for index, note in enumerate(notes):
            chord_tone(
                bed, start, duration, note, gain * (.61, .35, .29, .22)[index],
                (0, -.34, .29, .42)[index],
                attack=min(.36, duration * .3), release=min(.85, duration * .53),
            )

    # The tune starts with three notes. Later phrases reach outward as the garden grows.
    phrases = [
        (.19, (69, 74), .28, .09),
        (2.10, (69, 74, 76), .48, .12),
        (4.86, (66, 69, 71, 76), .38, .096),
        (6.88, (67, 74, 76, 81), .42, .127),
        (9.46, (69, 74, 76, 78, 81), .40, .136),
        (12.39, (71, 74, 78, 83, 81), .395, .133),
        (16.49, (74, 78, 81, 83, 86), .39, .142),
        (19.57, (74, 81, 86, 88, 90), .46, .152),
        (21.81, (81, 78, 76), .55, .087),
        (25.55, (69, 74, 76), .67, .077),
    ]
    for start, notes, step, gain in phrases:
        motif(bed, start, notes, step, gain)

    for time in (2.90, 3.57, 4.12, 5.2, 6.73, 7.36, 8.02, 8.62, 9.86, 10.52,
                 11.21, 12.53, 13.18, 13.82, 14.49, 16.25, 16.92, 17.57, 18.23,
                 18.79, 19.45, 20.11, 20.8, 21.4):
        elastic(bed, time, .17, 103, 40, .064, decay=14)
        air(bed, time + .31, .16, .057, -.24, tint=.49, attack=.008, release=.08, decay=14)

    # Low-filtered stereo air is the thread across the gaps before the catch and the crest.
    air(bed, 0, 28, .095, -.58, tint=.012, attack=.41, release=1.1, decay=.013)
    air(bed, 0, 28, .102, .59, tint=.011, attack=.47, release=1.2, decay=.013)
    return bed


def sound_cues():
    clips = {name: Stereo(frames, 3241 + index) for index, (name, frames) in enumerate(TIMING["accents"].items())}

    rattle = clips["rattle"]
    struck(rattle, 0, .21, 192, .18, -.21)
    air(rattle, 0, .21, .27, -.20, tint=.42, attack=.003, release=.08, decay=18)
    struck(rattle, .064, .17, 270, .089, -.13)

    catch = clips["catch"]
    elastic(catch, 0, .28, 186, 62, .26, -.08, decay=13)
    air(catch, 0, .205, .23, .12, tint=.25, attack=.004, release=.085, decay=14)
    elastic(catch, .036, .16, 342, 455, .12, .07, decay=14)

    seed = clips["seed"]
    struck(seed, 0, .29, hz(57), .28, -.09)
    struck(seed, .019, .40, hz(74), .16, .23, wood=False)
    air(seed, 0, .22, .27, tint=.35, attack=.003, release=.1, decay=24)

    growth = clips["growth"]
    elastic(growth, 0, .37, 224, 449, .17, -.23, decay=4)
    air(growth, 0, .45, .31, -.14, tint=.19, attack=.008, release=.15, decay=5.7)
    struck(growth, .105, .57, hz(76), .16, .17, wood=False)

    light = clips["light"]
    struck(light, 0, .59, hz(78), .23, .12, wood=False)
    struck(light, .043, .52, hz(81), .145, -.26, wood=False)
    air(light, 0, .13, .18, .22, tint=.5, attack=.003, release=.08, decay=21)

    bloom = clips["bloom"]
    air(bloom, 0, .47, .36, -.26, tint=.32, attack=.006, release=.19, decay=4.6)
    elastic(bloom, 0, .44, 183, 67, .25, .12, decay=7.9)
    for index, note in enumerate((74, 78, 81)):
        struck(bloom, .044 + .073 * index, .60, hz(note),
               .148 - index * .028, (-.28, .04, .27)[index])

    crest = clips["crest"]
    elastic(crest, 0, .82, 124, 49, .42, decay=3.7)
    air(crest, 0, 1.24, .32, tint=.13, attack=.018, release=.55, decay=1.9)
    for index, note in enumerate((62, 69, 74, 78)):
        struck(crest, .012 * index, 1.20, hz(note),
               (.24, .14, .13, .098)[index], (-.03, -.33, .30, .41)[index], wood=False)

    spread = clips["spread"]
    elastic(spread, 0, .46, 162, 68, .30, decay=6.2)
    air(spread, 0, .83, .39, .16, tint=.24, attack=.005, release=.44, decay=2.8)
    for index, note in enumerate((76, 81, 86)):
        struck(spread, index * .067, .88, hz(note),
               (.24, .173, .12)[index], (-.37, .05, .41)[index], wood=False)

    dew = clips["dew"]
    elastic(dew, 0, .14, 720, 295, .075, .13, decay=15)
    struck(dew, .008, .58, hz(86), .158, .16, wood=False)
    struck(dew, .047, .53, hz(78), .083, -.31, wood=False)
    return clips


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    garden_bed().export(OUTPUT / "bed.mp3", "96k")
    for name, clip in sound_cues().items():
        clip.export(OUTPUT / f"{name}.mp3", "96k")


if __name__ == "__main__":
    main()
