# Видео

В проекте два ролика (две композиции Remotion):

| Композиция | Ролик | Сценарий | Готовое видео |
|---|---|---|---|
| `AirGone` | What if the air disappeared for 5 seconds? (1:08) | `../scripts/what-if-air-disappeared.md` | `../renders/air-gone.mp4` |
| `GravityFlip` | What if gravity flipped for 10 seconds? (1:05) | `../scripts/what-if-gravity-flipped.md` | `../renders/gravity-flip.mp4` |

Оба вертикальные 1080×1920, 30 кадров в секунду.

## What if the air disappeared for 5 seconds?

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

## What if gravity flipped for 10 seconds?

```bash
cd video
npm run render:gravity   # делает звук и рендерит out/gravity-flip.mp4
npm run stills -- GravityFlip out/stills 8.5 27 55   # отдельные кадры по секундам для проверки
tools/sheet.sh out/stills out/sheet.jpg              # раскадровка из этих кадров
```

| Файл | Что внутри |
|---|---|
| `src/gravity/time.ts` | Переворот в 7 с, возврат в 37 с, смена скорости замедления между планами |
| `src/gravity/physics.ts` | Полёт вверх и обратно с сопротивлением воздуха, подбор скорости под нужный момент удара |
| `src/gravity/objects.ts` | Всё, что улетает: автобус, машины, такси, деревья, столики, вода из фонтана, и где каждое падает |
| `src/gravity/cast.ts` | Толпа и семья: кто за что держится, как висят вниз головой и как падают обратно |
| `src/gravity/city.tsx` | Площадь, улицы, дома, фонтан, фонари, светофоры, остановка, город сверху |
| `src/gravity/props.tsx` | Машина, облака, пыль, обломки, всплеск воды |
| `src/gravity/camera.tsx` | Все 22 плана камеры и тряска на ударах |
| `src/gravity/Overlay.tsx` | Таймер слева, заголовок и надписи |
| `audio/make_gravity_audio.py` | Весь звук ролика, синтезирован кодом |
