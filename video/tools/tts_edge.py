"""Free Russian voice-over with Microsoft Edge neural TTS (no key). Fallback when ElevenLabs is unavailable.
Needs: pip install edge-tts imageio-ffmpeg
Usage: python3 tools/tts_edge.py TEXT.txt OUT.mp3 WORDS.json [name] [voice=ru-RU-DmitryNeural] [rate=-4%] [pitch=+0Hz (negative is rejected)]

TEXT is the same file as for ElevenLabs: stress marks (U+0301) are stripped, «[pause]» becomes PAUSE s of silence,
each new line LINE s, other [tags] are dropped. Each piece is synthesized separately so the pauses are exact.
WORDS.json gets {name: [[start, end, word], ...]} in the format the audio/make_*_audio.py scripts read."""
import asyncio
import json
import re
import subprocess
import sys

import edge_tts
import imageio_ffmpeg

PAUSE, LINE, SR = 0.45, 0.3, 24000
DEEPEN = 0.93  # pitch factor applied after synthesis (about 1.25 semitones lower)
FF = imageio_ffmpeg.get_ffmpeg_exe()


async def piece(text, voice, rate, pitch, tries=25):
    # the free endpoint randomly returns no audio for valid requests, so retry the same piece
    for attempt in range(tries):
        audio, words = bytearray(), []
        try:
            com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
            async for c in com.stream():
                if c["type"] == "audio":
                    audio += c["data"]
                elif c["type"] == "WordBoundary":
                    s = c["offset"] / 1e7
                    words.append([s, s + c["duration"] / 1e7, c["text"]])
            break
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == tries - 1:
                raise
            print(f"  retry {attempt + 1}: {text[:40]}", flush=True)
            await asyncio.sleep(min(2 + attempt, 8))
    pcm = subprocess.run([FF, "-loglevel", "error", "-i", "-", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         input=bytes(audio), capture_output=True, check=True).stdout
    # every piece comes with long silence around it; keep only a short margin so the pauses stay as set
    head = max(0.0, words[0][0] - 0.06) if words else 0.0
    tail = words[-1][1] + 0.18 if words else len(pcm) / 2 / SR
    pcm = pcm[int(head * SR) * 2:int(tail * SR) * 2]
    return pcm, [[s - head, e - head, w] for s, e, w in words]


async def main(src, out, words_out, name="vo", voice="ru-RU-DmitryNeural", rate="-4%", pitch="+0Hz"):
    text = open(src, encoding="utf8").read().replace("\u0301", "")
    pcm_all, words_all, t = bytearray(), [], 0.0
    for li, line in enumerate(l for l in text.splitlines() if l.strip()):
        if li:
            pcm_all += bytes(int(LINE * SR) * 2)
            t += LINE
        for pi, part in enumerate(re.split(r"\[pause\]", line)):
            part = re.sub(r"\[[^\]]*\]", "", part).strip()
            if pi:
                pcm_all += bytes(int(PAUSE * SR) * 2)
                t += PAUSE
            if not part:
                continue
            pcm, words = await piece(part, voice, rate, pitch)
            words_all += [[round(t + s, 2), round(t + e, 2), w] for s, e, w in words]
            pcm_all += pcm
            t += len(pcm) / 2 / SR
    # the service rejects negative pitch, so the voice is deepened here without changing its tempo (timings stay valid)
    deepen = f"asetrate={SR * DEEPEN:.0f},aresample={SR},atempo={1 / DEEPEN:.5f}"
    subprocess.run([FF, "-loglevel", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-i", "-",
                    "-af", deepen, "-b:a", "192k", out], input=bytes(pcm_all), check=True)
    json.dump({name: words_all}, open(words_out, "w"), ensure_ascii=False)
    print(out, f"{t:.1f} s,", len(words_all), "words:", " ".join(w[2] for w in words_all))


asyncio.run(main(*sys.argv[1:]))
