# Видео: What if the air disappeared for 5 seconds?

Ролик 1:08, вертикальный 1080×1920, 30 кадров в секунду. Сценарий: `../scripts/what-if-air-disappeared.md`.

Готовое видео лежит в `../renders/air-gone.mp4`.

## Как пересобрать

Нужны Node.js 22, Python 3 с `numpy` и `scipy`, и ffmpeg.

```bash
cd video
npm install
npm run render      # делает звук и рендерит out/air-gone.mp4 (около получаса без видеокарты)
npm run studio      # открыть предпросмотр в браузере
```

## Что где

| Файл | Что внутри |
|---|---|
| `src/timeline.ts` | Все ключевые моменты: отсчёт, исчезновение воздуха в 12 с, замедление ×9, возвращение в 57 с |
| `src/scene/World.tsx` | Двор: дома, люди, собака, свет, позы персонажей по времени |
| `src/scene/CameraRig.tsx` | Все планы камеры по секундам |
| `src/scene/Effects.tsx` | Небо и звёзды, огонь, птицы, самолёт, кипящая вода, шарик, листья |
| `src/scene/House.tsx` | Дом и окна, которые выгибаются и вылетают |
| `src/Overlay.tsx` | Таймер слева, заголовок и все надписи |
| `audio/make_audio.py` | Весь звук, синтезирован кодом без готовых сэмплов |
