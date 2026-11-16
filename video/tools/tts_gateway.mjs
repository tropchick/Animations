// ElevenLabs voice through Vercel AI Gateway (no ElevenLabs account needed; auth: VERCEL_OIDC_TOKEN from .env.development.local).
// Needs the `ai` package (not a video dependency): npm i ai in a scratch dir and run this file from there.
// Usage: node tts_gateway.mjs TEXT.txt OUT.mp3 [model=elevenlabs/eleven-v4] [voice=VASKO]
import { readFileSync, writeFileSync } from 'node:fs'
import { generateSpeech } from 'ai'

const VASKO = 'Vl27Cllkuw8BhyPqus2n'
const [textPath, outPath, model = 'elevenlabs/eleven-v4', voice = VASKO] = process.argv.slice(2)

const result = await generateSpeech({
  model,
  text: readFileSync(textPath, 'utf8').trim(),
  voice,
  outputFormat: 'mp3',
  language: 'ru',
  providerOptions: {
    elevenlabs: { voiceSettings: { stability: 0.4, similarityBoost: 0.75 } },
  },
})
writeFileSync(outPath, result.audio.uint8Array)
console.log(outPath, result.audio.uint8Array.length, 'bytes', result.warnings?.length ? JSON.stringify(result.warnings) : '')
