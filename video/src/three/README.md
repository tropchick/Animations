# «Три истории: что если человек…»

Soft 3D reconstruction, 1080×1920 / 30 fps / 1711 frames (57.033 s).

- `ThreeStories` is the film. Frame 0 is exactly `ThreeCover`; frame 1 starts story time 0.
- `timing.ts` owns every shot and contact; `World.tsx` selects the scenes.
- `Bus.tsx`, `Storm.tsx`, `Lab.tsx` contain the deterministic scene animation.
- `Xray.tsx` uses the original bear human rig's proportions (head center y=1.337). The thin proton ray follows the skull's local z axis.
- Original `bear/People.tsx`, `bear/face.tsx`, `bear/rig.ts`, `bear/kit.tsx` are reused without changes. The overlay shares the Rubik font/plate design and word-time karaoke method.
- All animation comes from `useCurrentFrame()` through story time. No `useFrame`, CSS animations, random runtime values or wall-clock animation.
- Every canvas enables logarithmic depth. Small surface details are offset; the supplied zcheck runs against the actual scene graph.
- 21.85–29.05 s of story time reserves y=720…1200 for a centered 480 px banner.

## Audio

Only the supplied `audio/voice/three/narrator.mp3` is used. No TTS/music/external generation. Original speed and timbre are preserved. At source time 20.1 s, four seconds of silence are inserted for the bus-window notice and storm opening. `words-raw.json` is the faster-whisper output, with orthographic corrections made in the mixer. Synthesized SFX are deterministic (seed 317). The pipeline reuses `slime_lib.Mix`, as the bear film does, with two-pass -15 LUFS / -1.5 dBTP normalization.

Install Python dependencies if needed:

```
python3 -m venv --system-site-packages audio/.venv-three
audio/.venv-three/bin/pip install -r audio/requirements-three.txt
npm run audio:three
```

`transcribe_three.py` documents the original transcription run. Word timings are checked in; rerunning Whisper is optional. It decodes with FFmpeg before inference to avoid PyAV-version-specific decoding issues.

## Render and review

From `video/`:

```
npm run audio:three
npm run zcheck -- ThreeStories 0.5
npm run render:three
npm run cover:three
python3 tools/three-audit.py ../renders/three-stories.mp4 out/three-review/final
```

A draft uses the same resumable chunk renderer with `SCALE=0.6666666666666666`. The chunk key automatically invalidates after source/audio/scale changes. Do not run other heavy jobs while it renders. The audit decodes the actual MP4, exports every second and both sides of every shot boundary (also the impact contact frames), then calls `tools/sheet.sh` for four complete pages.

Sync map: `../../../scripts/three-stories-sync.md`. Review: `../../../scripts/three-stories-review.md`.
