`narrator.mp3`: the owner's chosen 51.409 s short ElevenLabs VASKO take, copied verbatim from `/mnt/project-files/voice/three/narrator.mp3`.
`words-raw.json`: faster-whisper small word timestamps. No other voice take is used.

`../../transcribe_three.py` reproduces transcription; FFmpeg decodes to 16 kHz float32 before Whisper. ASR spelling corrections and semantic caption grouping are applied by `../../make_three_audio.py` without inventing word timestamps.
