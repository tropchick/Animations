"""Separate background music from a soundtrack, retaining speech and sound effects.

Install tools/requirements-music-removal.txt in a Python 3.11+ environment.
Example (from video/):
  python3 tools/remove_music.py /path/scene.mov audio/voice/scene-no-music.flac

DBS-TIGER-DnR by Zhang, Li and Hu, Apache-2.0:
https://huggingface.co/JusperLee/DBS-TIGER-DnR
The model and overlapping inference windows are based on the authors' DnR recipe.
No original soundtrack is mixed back in. The two non-music stems are summed.
"""

import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path

import numpy as np
import torch
from dbs.models import DBSTIGER

RATE = 44100
REVISION = "22da7d4cd3ea63f9365181008bff1c0d2ab6fb2b"
MODEL = "JusperLee/DBS-TIGER-DnR"
FILES = {
    "config.json": "c7f7893323e78f9b99747a13090558a13c4f4b77383a38acb9979709fd04d1d8",
    "model.safetensors": "3d8205743f2a6f5a6704f5d4104d7cf5bf7bf02dab2fd728da31f4c69225cadb",
}


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def prepare_model(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for name, digest in FILES.items():
        path = folder / name
        if not path.exists() or sha256(path) != digest:
            temporary = path.with_suffix(path.suffix + ".download")
            url = f"https://huggingface.co/{MODEL}/resolve/{REVISION}/{name}"
            subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error",
                            url, "--output", str(temporary)], check=True)
            if sha256(temporary) != digest:
                temporary.unlink()
                raise ValueError(f"Model checksum mismatch: {name}")
            temporary.replace(path)


def save_flac(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(RATE),
                    "-ac", "1", "-i", "-", "-c:a", "flac", "-sample_fmt", "s32", str(path)],
                   input=np.ascontiguousarray(samples, dtype=np.float32).tobytes(), check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model-dir", type=Path, default=Path.home() / ".cache/animations/dbs-tiger-dnr")
    parser.add_argument("--cache-dir", type=Path)
    parser.add_argument("--stems-dir", type=Path)
    parser.add_argument("--chunk", type=float, default=6.0)
    parser.add_argument("--hop", type=float, default=3.0)
    parser.add_argument("--threads", type=int, default=1)
    args = parser.parse_args()
    if args.chunk < 1 or not args.chunk / 2 <= args.hop <= args.chunk or args.threads < 1:
        parser.error("Require chunk >= 1, chunk/2 <= hop <= chunk, threads >= 1")
    if args.source.resolve() == args.output.resolve():
        parser.error("Output must be separate from the source")

    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    prepare_model(args.model_dir)
    model = DBSTIGER.from_pretrained(str(args.model_dir)).eval()
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(args.source),
                                   "-f", "f32le", "-ac", "1", "-ar", str(RATE), "-"])
    mixture = np.frombuffer(raw, np.float32).copy()
    if not len(mixture) or not np.isfinite(mixture).all():
        raise ValueError("Empty or invalid source audio")
    chunk, hop = round(args.chunk * RATE), round(args.hop * RATE)
    starts = []
    for start in range(0, len(mixture), hop):
        starts.append(start)
        if start + chunk >= len(mixture):
            break

    identity = [sha256(args.source), REVISION, chunk, hop, "linear-overlap-v1"]
    key = hashlib.sha256(json.dumps(identity).encode()).hexdigest()[:20]
    cache = (args.cache_dir or args.output.parent / ".music-removal-cache") / key
    cache.mkdir(parents=True, exist_ok=True)
    stems = np.zeros((3, len(mixture)), np.float32)  # music, effects, speech
    weight = np.zeros(len(mixture), np.float32)
    overlap = chunk - hop
    ramp = np.linspace(0, 1, overlap, dtype=np.float32)
    began = time.monotonic()
    for index, start in enumerate(starts):
        valid = min(chunk, len(mixture) - start)
        cached = cache / f"{start:012d}.npy"
        if cached.exists():
            estimate = np.load(cached, allow_pickle=False)
        else:
            piece = np.pad(mixture[start:start + valid], (0, chunk - valid))
            with torch.inference_mode():
                estimate = model(torch.from_numpy(piece).reshape(1, 1, -1))
            if isinstance(estimate, (tuple, list)):
                estimate = estimate[0]
            estimate = estimate[0].cpu().numpy().reshape(3, chunk)[:, :valid]
            if not np.isfinite(estimate).all():
                raise ValueError(f"Invalid separator output at {start / RATE:.3f}s")
            temporary = cached.with_suffix(".tmp.npy")
            np.save(temporary, estimate)
            temporary.replace(cached)
        if estimate.shape != (3, valid):
            raise ValueError(f"Invalid cached shape: {cached}")
        window = np.ones(chunk, np.float32)
        if overlap and index:
            window[:overlap] = ramp
        if overlap and index + 1 < len(starts):
            window[-overlap:] = ramp[::-1]
        window = window[:valid]
        stems[:, start:start + valid] += estimate * window
        weight[start:start + valid] += window
        print(f"{index + 1}/{len(starts)} · source {min(start + valid, len(mixture)) / RATE:.1f}s"
              f" · elapsed {time.monotonic() - began:.1f}s", flush=True)
    if np.min(weight) <= 0:
        raise ValueError("Uncovered audio samples")
    stems /= weight
    cleaned = stems[1] + stems[2]
    peak = float(np.max(np.abs(cleaned)))
    gain = min(1.0, 0.98 / max(peak, 1e-10))
    save_flac(args.output, cleaned * gain)
    if args.stems_dir:
        for name, stem in zip(("music", "effects", "speech"), stems):
            save_flac(args.stems_dir / f"{name}.flac", stem)
    report = {"source_sha256": identity[0], "model": MODEL, "revision": REVISION,
              "sample_rate": RATE, "samples": len(mixture), "chunk": args.chunk,
              "hop": args.hop, "gain": gain, "output_sha256": sha256(args.output)}
    args.output.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"Wrote {args.output} · {len(mixture) / RATE:.3f}s", flush=True)


if __name__ == "__main__":
    main()
