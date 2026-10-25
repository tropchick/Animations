"""Shared pieces for the "Slime Chronicle" soundtracks: loading and cutting the ElevenLabs voice,
synthesized sounds, mixing and loudness. Episode scripts build on these (make_slime_ep2_audio.py, ...)."""

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
FPS = 30
rng = np.random.default_rng(7)


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


def longest_pause(x, a, b, thr=0.01):
    """Sample index in the middle of the longest pause between a and b seconds
    (a short dip inside a word, like the closure before "т", is never the longest)."""
    w = int(0.01 * SR)
    i0 = max(0, int(a * SR))
    seg = x[i0: max(i0 + 1, int(b * SR))]
    env = np.sqrt(np.convolve(seg ** 2, np.ones(w) / w, "same"))
    best, run, best_end = 0, 0, len(seg) // 2
    for k, q in enumerate(env < thr):
        run = run + 1 if q else 0
        if run > best:
            best, best_end = run, k
    return i0 + best_end - best // 2


def fade_edges(x, ms=8):
    n = min(int(ms / 1000 * SR), len(x) // 2)
    r = np.linspace(0, 1, n)
    x = x.copy()
    x[:n] *= r
    x[-n:] *= r[::-1]
    return x


def assemble(files, words, pieces, pauses, start, default_gap=0.4):
    """Glue word ranges from several takes into one voice track.
    pieces: [(take, first_word, last_word)]; pauses: {global word index: extra silence before that word}.
    Returns the track and the words on the video timeline [(start, end, text)]."""
    out, timeline, t, g = [], [], start, 0
    for take, w0, w1 in pieces:
        x, ws = files[take], words[take]
        a = 0 if w0 == 0 else longest_pause(x, ws[w0 - 1][1] - 0.1, ws[w0][0] + 0.05)
        b = len(x) if w1 + 1 >= len(ws) else longest_pause(x, ws[w1][1] - 0.05, ws[w1 + 1][0] + 0.1)
        if g > 0:
            gap = pauses.get(g, default_gap)
            out.append(np.zeros(int(gap * SR)))
            t += gap
        # cut the piece where extra silence goes
        cuts = [(n, longest_pause(x, ws[n - 1][1] - 0.15, ws[n][0] + 0.35)) for n in range(w0 + 1, w1 + 1) if g + n - w0 in pauses]
        bounds = [a] + [c for _, c in cuts] + [b]
        shift = {}  # word -> silence added before it inside this piece
        added = 0.0
        for k in range(len(bounds) - 1):
            if k > 0:
                n = cuts[k - 1][0]
                added += pauses[g + n - w0]
                out.append(np.zeros(int(pauses[g + n - w0] * SR)))
                shift[n] = added
            out.append(fade_edges(x[bounds[k]: bounds[k + 1]]))
        extra = 0.0
        for n in range(w0, w1 + 1):
            extra = shift.get(n, extra)
            s, e, w = ws[n]
            timeline.append((t + s - a / SR + extra, t + e - a / SR + extra, w))
        t += (b - a) / SR + added
        g += w1 - w0 + 1
    return np.concatenate(out), timeline


class Mix:
    def __init__(self, dur):
        self.dur = dur
        self.n = int(SR * dur)
        self.t = np.arange(self.n) / SR
        self.l = np.zeros(self.n)
        self.r = np.zeros(self.n)

    def idx(self, sec):
        return int(np.clip(sec * SR, 0, self.n))

    def add(self, sig, start=0.0, gain=1.0, pan=0.0):
        i = self.idx(start)
        n = min(len(sig), self.n - i)
        if n <= 0:
            return
        lg = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        rg = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.l[i: i + n] += sig[:n] * gain * lg
        self.r[i: i + n] += sig[:n] * gain * rg

    def env(self, start, end, fi=0.5, fo=0.5):
        t = self.t
        return np.clip((t - start) / max(fi, 1e-4), 0, 1) * np.clip((end - t) / max(fo, 1e-4), 0, 1)

    def write(self, name, target="I=-15:TP=-1.5:LRA=18"):
        mix = np.stack([self.l, self.r], axis=1)
        mix = filt(mix.T, "highpass", 25, 2).T
        peak = np.max(np.abs(mix))
        mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.9
        raw = ROOT / "out" / f"{name}-raw.wav"
        raw.parent.mkdir(parents=True, exist_ok=True)
        final = ROOT / "public" / "audio" / f"{name}.wav"
        final.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(raw), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((mix * 32767).astype(np.int16).tobytes())
        probe = subprocess.run(
            ["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True, check=True,
        ).stderr
        m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
        measured = (
            f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
            f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"loudnorm={target}:{measured}", "-ar", str(SR), str(final)],
            check=True,
        )
        raw.unlink()
        return final


def filt(x, kind, freq, order=4):
    return signal.sosfilt(signal.butter(order, freq, btype=kind, fs=SR, output="sos"), x)


def white(n):
    return rng.standard_normal(n)


def brown(n):
    x = np.cumsum(white(n))
    x = filt(x, "highpass", 20, 2)
    return x / (np.max(np.abs(x)) + 1e-9)


def tt_(dur):
    return np.arange(int(dur * SR)) / SR


def thump(f0=60, f1=32, dur=1.0, decay=4.0, click=0.15):
    tt = tt_(dur)
    f = f1 + (f0 - f1) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * np.exp(-tt * decay)
    return s + filt(white(len(tt)), "bandpass", [80, 900]) * np.exp(-tt * 28) * click * 1.6


def clank(dur=0.5, base=420):
    tt = tt_(dur)
    s = filt(white(len(tt)), "bandpass", [600, 5000]) * np.exp(-tt * 70)
    for k, r in enumerate((1.0, 2.31, 3.77, 5.1)):
        s += np.sin(2 * np.pi * base * r * tt + k) * np.exp(-tt * (14 + 6 * k)) * 0.35
    return s + thump(110, 60, dur, decay=18, click=0.0) * 0.6


def ting(freq=2400, dur=1.4):
    tt = tt_(dur)
    s = sum(np.sin(2 * np.pi * freq * r * tt + k) * np.exp(-tt * (3 + 2.5 * k)) / (k + 1)
            for k, r in enumerate((1.0, 1.58, 2.37, 3.11)))
    return s * np.clip(tt / 0.002, 0, 1)


def beep(freq, dur=0.16):
    tt = tt_(dur)
    return np.sign(np.sin(2 * np.pi * freq * tt)) * 0.3 * np.clip(tt / 0.004, 0, 1) * np.clip((dur - tt) / 0.01, 0, 1)


def click(dur=0.05, tone=3000):
    tt = tt_(dur)
    return (filt(white(len(tt)), "bandpass", [tone * 0.5, tone * 2]) + np.sin(2 * np.pi * tone * 0.4 * tt)) * np.exp(-tt * 140)


def step(dur=0.3):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [90, 1400]) * np.exp(-tt * 30) + thump(80, 50, dur, decay=25, click=0) * 0.5


def breath(dur=1.6, inhale=True):
    tt = tt_(dur)
    shape = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** (1.5 if inhale else 0.8)
    return filt(white(len(tt)), "bandpass", [500, 3500]) * shape


def drone(freqs, dur, detune=0.25, wobble=0.07):
    tt = tt_(dur)
    s = np.zeros(len(tt))
    for f in freqs:
        for d in (-detune, detune):
            ph = rng.uniform(0, 2 * np.pi)
            fm = 1 + 0.002 * np.sin(2 * np.pi * wobble * tt + ph)
            s += np.sin(2 * np.pi * (f + d) * np.cumsum(fm) / SR + ph)
    return s / (2 * len(freqs))


def dictaphone(v, n):
    """The voice as if recorded on a small recorder in an empty room: band-limited, a bit gritty, short reverb."""
    v = filt(v, "highpass", 120, 2)
    v = filt(v, "lowpass", 7000, 2)
    v = np.tanh(v * 1.6) / 1.6
    ir_t = tt_(0.9)
    ir = filt(white(len(ir_t)), "lowpass", 3500) * np.exp(-ir_t * 6.5)
    ir[: int(0.012 * SR)] = 0
    wet = signal.fftconvolve(v, ir)[:n]
    wet *= 0.1 * np.max(np.abs(v)) / (np.max(np.abs(wet)) + 1e-9)
    return v, wet


def envelope(v, dur):
    """Voice loudness per video frame, 0..1, for screens that react to the voice."""
    frames = int(dur * FPS)
    hop = SR // FPS
    a = np.abs(v)
    e = np.array([np.sqrt(np.mean(a[k * hop:(k + 1) * hop] ** 2)) for k in range(frames)])
    e = e / (np.percentile(e[e > 0], 98) + 1e-9)
    return np.clip(e, 0, 1)
