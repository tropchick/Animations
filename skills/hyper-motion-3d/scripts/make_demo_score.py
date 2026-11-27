#!/usr/bin/env python3
"""Generate the original 'Signal' score and foley in two source-controlled stems."""

from array import array
from math import exp, log10, pi, sin, sqrt
from pathlib import Path
from random import Random
import json
import subprocess
import sys
import tempfile
import wave

SKILL = Path(__file__).resolve().parents[1]
REPO = SKILL.parents[1]
TIMING = json.loads((SKILL / "examples/demo-cues.json").read_text())
RATE = 48_000
LENGTH = round(TIMING["frames"] * RATE / TIMING["fps"])
TAU = 2 * pi
BED_GAIN = 10 ** (8.5 / 20)
ACCENT_GAIN = 10 ** (4.5 / 20)


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def cue(name):
    return TIMING["beats"][name] / TIMING["fps"]


class Stem:
    def __init__(self):
        self.left = array("f", [0]) * LENGTH
        self.right = array("f", [0]) * LENGTH
        self.rng = Random(8271)

    def tone(self, start, duration, hz, gain, pan=0, attack=.018,
             fall=2, finish=None, harmonics=(1, .23, .08), release=.22):
        first = max(0, round(start * RATE))
        count = min(LENGTH - first, round(duration * RATE))
        # Circular pan keeps the summed loudness stable at different positions.
        angle = (pan + 1) * pi / 4
        low = sin(pi / 2 - angle) * gain
        high = sin(angle) * gain
        slope = ((finish or hz) - hz) / duration
        for offset in range(count):
            seconds = offset / RATE
            envelope = min(1, seconds / attack, (duration - seconds) / release)
            envelope *= exp(-fall * seconds)
            phase = TAU * (hz * seconds + .5 * slope * seconds ** 2)
            sample = sin(phase) * harmonics[0]
            for harmonic, level in enumerate(harmonics[1:], 2):
                sample += sin(phase * harmonic) * level
            self.left[first + offset] += sample * envelope * low
            self.right[first + offset] += sample * envelope * high

    def noise(self, start, duration, gain, pan=0, attack=.03, brightness=.12, fall=3):
        first = max(0, round(start * RATE))
        count = min(LENGTH - first, round(duration * RATE))
        angle = (pan + 1) * pi / 4
        low = sin(pi / 2 - angle) * gain
        high = sin(angle) * gain
        filtered = 0
        for offset in range(count):
            seconds = offset / RATE
            envelope = min(1, seconds / attack, (duration - seconds) / .10)
            envelope *= exp(-fall * seconds)
            filtered += (self.rng.uniform(-1, 1) - filtered) * brightness
            self.left[first + offset] += filtered * envelope * low
            self.right[first + offset] += filtered * envelope * high

    def export(self, path, bitrate, gain):
        pcm = array("h")
        for left, right in zip(self.left, self.right):
            pcm.append(round(32767 * max(-1, min(1, left * gain))))
            pcm.append(round(32767 * max(-1, min(1, right * gain))))
        if sys.byteorder != "little":
            pcm.byteswap()
        with tempfile.TemporaryDirectory() as temp:
            wav = Path(temp) / "stem.wav"
            with wave.open(str(wav), "wb") as out:
                out.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
                out.writeframes(pcm.tobytes())
            subprocess.run(
                ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                 "-i", str(wav), "-map_metadata", "-1", "-codec:a", "libmp3lame",
                 "-b:a", bitrate, str(path)],
                check=True,
            )


def glass(stem, start, midi, gain, pan=0, duration=.52):
    hz = frequency(midi)
    stem.tone(start, duration, hz, gain, pan, attack=.009, fall=5.2,
              harmonics=(1, .19, .05), release=.18)
    stem.tone(start + .073, duration, hz * 1.005, gain * .23, -pan,
              attack=.018, fall=6.2, harmonics=(1, .08), release=.20)


def make_bed():
    score = Stem()
    # Sparse bowed-sine voicings change when the robot's objective changes.
    chords = [
        (0.00, 4.20, (45, 57, 64, 71)),
        (3.75, 4.80, (41, 53, 60, 64)),
        (7.85, 4.00, (43, 55, 62, 69)),
        (11.23, 4.55, (45, 57, 64, 72)),
        (15.20, 3.60, (47, 59, 66, 69)),
        (18.06, 4.35, (48, 60, 67, 74)),
        (21.75, 2.25, (45, 57, 64, 69)),
    ]
    for start, duration, notes in chords:
        for index, note in enumerate(notes):
            hz = frequency(note)
            score.tone(start, duration, hz, (.105, .042, .035, .026)[index],
                       (-.06, -.42, .42, .2)[index],
                       attack=min(.85, duration * .33), release=min(1.05, duration * .45),
                       fall=.30, finish=hz * (1.001 if index % 2 else .999),
                       harmonics=(1, .13, .04))

    # An original four-note motif opens out after the signal leaves the dish.
    phrases = [
        (.55, (69, 76, 72, 71), .56),
        (4.63, (65, 72, 76, 72), .53),
        (8.38, (67, 74, 69, 71), .59),
        (11.76, (69, 72, 76, 81), .62),
        (15.76, (71, 74, 78, 83), .43),
        (18.67, (72, 79, 86, 84), .65),
        (22.05, (76, 72, 69), .45),
    ]
    for start, notes, step in phrases:
        for index, note in enumerate(notes):
            glass(score, start + index * step, note, .09 - .009 * index,
                  pan=(-.44, .34, -.25, .42)[index], duration=.74)

    for beat in range(6, 34):
        time = beat * .625
        if beat in (12, 17, 18, 27, 29):
            continue
        score.tone(time, .19, 69 if beat % 2 == 0 else 92,
                   .075 if beat % 2 == 0 else .036,
                   attack=.009, fall=13, finish=43, release=.11, harmonics=(1, .08))
        if beat % 2:
            score.noise(time + .33, .14, .035, pan=.27, attack=.014, brightness=.25, fall=12)
    return score


def make_accents():
    score = Stem()
    target = cue("target")
    glass(score, target, 84, .112, .38, .32)
    glass(score, target + .10, 88, .052, .17, .28)

    pickup = cue("pickup")
    score.tone(pickup, .22, 113, .139, -.22, attack=.007,
               fall=10, finish=54, harmonics=(1, .16))
    score.noise(pickup, .23, .21, -.22, attack=.008, brightness=.28, fall=11)

    dish = cue("dish")
    score.noise(dish - .24, .64, .125, .43, attack=.24, brightness=.04, fall=1.9)
    score.tone(dish - .27, .72, 126, .097, .12, attack=.27,
               fall=1.15, finish=256, harmonics=(1, .18))

    dock = cue("dock")
    score.noise(dock, .20, .26, -.15, attack=.005, brightness=.46, fall=15)
    score.tone(dock, .31, 179, .20, attack=.005, fall=9.5, finish=57, harmonics=(1, .13))
    glass(score, dock + .045, 81, .15, .30, .49)

    charge = cue("charge")
    score.tone(charge, 1.17, 93, .081, -.12, attack=.22, fall=.5, finish=196,
               release=.38, harmonics=(1, .24, .08))
    for index in range(3):
        glass(score, charge + index * .23, 72 + index * 3, .105, -.24 + index * .24)

    launch = cue("launch")
    score.noise(launch - .21, .91, .29, attack=.21, brightness=.11, fall=1.3)
    score.tone(launch, .97, 102, .37, attack=.013, fall=4.3, finish=45,
               release=.39, harmonics=(1, .25, .05))
    for index, note in enumerate((72, 79, 86, 91)):
        glass(score, launch + index * .057, note, .174 - .02 * index,
              pan=(-.44, -.20, .20, .42)[index], duration=.91)

    received = cue("received")
    for index, note in enumerate((69, 76, 81)):
        glass(score, received + index * .074, note, .126, pan=(index - 1) * .25, duration=.95)
    return score


def export_envelope(bed, accents):
    samples = []
    for frame in range(TIMING["frames"]):
        start = round(frame * RATE / TIMING["fps"])
        end = round((frame + 1) * RATE / TIMING["fps"])
        rms = sqrt(sum(
            (bed.left[index] * BED_GAIN + accents.left[index] * ACCENT_GAIN) ** 2
            + (bed.right[index] * BED_GAIN + accents.right[index] * ACCENT_GAIN) ** 2
            for index in range(start, end)
        ) / (2 * (end - start)))
        db = 20 * log10(max(1e-8, rms))
        samples.append(round(max(0, min(1, (db + 40) / 26)), 3))
    envelope = {"stepSeconds": 1 / TIMING["fps"], "samples": samples}
    (SKILL / "examples/demo-envelope.json").write_text(
        json.dumps(envelope, separators=(",", ":")) + "\n"
    )


def main():
    output = REPO / "video/public/audio/hyper-motion-3d"
    output.mkdir(parents=True, exist_ok=True)
    bed = make_bed()
    accents = make_accents()
    bed.export(output / "bed.mp3", "96k", BED_GAIN)
    accents.export(output / "accents.mp3", "64k", ACCENT_GAIN)
    export_envelope(bed, accents)


if __name__ == "__main__":
    main()
