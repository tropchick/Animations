# Интеграция, интенсивность и ресурсы

## Подключение

Рабочие модули лежат в [examples](../examples/). Компоненты 3D используют Three.js и React Three Fiber внутри `ThreeCanvas`. Типографика и композиционные переходы живут в слое Remotion, там же запускаются звук и субтитры. Используй точку входа [HyperMotionDemo](../../../video/src/HyperMotionDemo.tsx) как пример подключения к существующему проекту.

В Animations каталог `video/src/hyper-motion-examples` ссылается на `skills/hyper-motion-3d/examples`. При переносе размести модули внутри исходников проекта либо настрой разрешение зависимостей для файлов вне корня проекта. Держи одну копию React, Three, R3F и пакетов Remotion. Для `npm ci` используй существующий lockfile.

## События и шкалы времени

```tsx
const events = [
  {id: 'lens-lock', kind: 'impact', from: 237, duration: 24, priority: 10, particles: 56},
] satisfies readonly MotionEvent[];

const intensity = [
  {frame: 0, level: 'Dynamic'},
  {frame: 232, level: 'Minimal'},
  {frame: 237, level: 'Climax', channels: {background: 0.35, camera: 0.45}},
  {frame: 266, level: 'Hyper'},
] satisfies readonly IntensityKey[];

// Размести провайдер на выходной шкале композиции выше Sequence или передай frame явно.
<HyperMotionProvider events={events} intensity={intensity} quality="final" seed="observatory">
  <Film />
</HyperMotionProvider>
```

В `Film` вызови `useHyperMotion()`. Он возвращает текущий кадр, FPS, seed, качество, бюджет, значения каналов и активные события. Передай нужные значения дочернему дереву `ThreeCanvas` как props. Роутинг событий можно сделать по `event.kind` или по собственному типу через `useActiveEvents(typeGuard)`. `EffectTimeline` вызывает назначенный рендерер для каждого принятого события. Объекты в сцене остаются переиспользуемыми: позиция эффекта может вычисляться тем же семплером траектории, что и позиция объекта.

Событие активно в `[from, from + duration)`. При ограниченном бюджете порядок задают убывающий приоритет, кадр начала и ID. Параметр `particles` запрашивает количество инстансов. `particleBudget` выдаёт доступное количество с учётом текущего уровня. Передай его как бюджет эффекту; для составного эффекта подели его между подслоями. Если количество должно быть постоянным до затухания, выдели фиксированное число инстансов на событие и регулируй прозрачность или размер. Seed зависит от ID и общего seed. Эффекты за пределами таймлайна и вторичные объекты включай в отдельный бюджет сцены.

Выходной кадр управляет словами, звуком и монтажом. Кадр визуального источника после ретайма управляет позами, траекториями и выдержкой пластилиновой анимации. `useCurrentFrame()` внутри `Sequence` возвращает местный кадр. Явная передача выходного кадра предотвращает сдвиг границ событий при переносе под `Sequence`. В режиме A/B `enabled={false}` отключает события и обнуляет каналы. Базовые позы и логику мира оставь в сцене.

## Уровни интенсивности

| Уровень | Использование |
| --- | --- |
| Minimal | Чтение, ожидание, спокойная реакция. Медленная камера, деликатный фон |
| Dynamic | Путь, подготовка, небольшие изменения пространства и состояния |
| Hyper | По умолчанию. Развитие действия, наглядные акценты и смена крупности |
| Ultra | Короткий плотный момент. Эффекты разделены по планам и роли |
| Climax | Поворот сюжета или мощное раскрытие масштаба. Ясная доминанта и спад после пика |

Шесть независимых каналов `camera`, `particles`, `text`, `transitions`, `audio` и `background` имеют диапазон 0–1. `channels` переопределяет значения выбранного пресета в ключе. Кривые между ключами плавные по умолчанию. `easing: 'hold'` и `easing: 'linear'` меняют интерполяцию до следующего ключа. Интенсивность звука передавай локальным акцентам, а уровни голосовой и музыкальной дорожек управляй отдельно. При максимальной подаче сохрани контроль над движением камеры, яркостью, читаемостью и амплитудой частиц.

## Бюджет и повторяемость

- `draft`: до 96 запрошенных частиц, 4 одновременно принятых событий и 6 семплов следа. `final`: 320, 7 и 12 соответственно. Передай `budget` с поправками после замеров. Лимиты семплов следа и сцены передаются из провайдера явно; количество draw calls измеряй отдельно.
- Для повторов используй `InstancedMesh`. После записи матриц отметь `instanceMatrix.needsUpdate`. Обнови объём отсечения, если инстансы выходят за прежние границы, или отключи frustum culling для небольших динамических партий.
- Переиспользуй геометрии и материалы внутри партий, освобождай созданные вручную текстуры и рендер-таргеты. Начни с геометрических световых акцентов и ограничь экранные проходы, тени, прозрачные слои и пересечения прозрачности.
- При работе на CPU измерь время репрезентативных кадров с `--gl=swangle`. В черновике снизь число объектов или `--scale`. Проверь самые дорогие кадры в полном разрешении. Замеряй на той машине, которая будет рендерить итог.
- Получи две версии одного кадра при одинаковых размерах, браузере и GL. Сравни одиночный PNG и PNG параллельного диапазона. Дополнительно просмотри последовательность соседних кадров в точках контакта, монтажных стыках и на пике. Собирай раскадровку через [animation-quality-gate](../../animation-quality-gate/SKILL.md).

```sh
# Из video/
npm run studio:hyper
npm run render:hyper
npm run render:hyper -- --scale=0.5 --props='{"quality":"draft"}'
npx remotion still src/HyperMotionDemo.tsx HyperMotionDemo out/signal.png --frame=542 --gl=swangle
```

Для проверок из корня репозитория используй локальные пакеты из `video/` и Pillow для раскадровки.

```sh
NODE_PATH="$PWD/video/node_modules" video/node_modules/.bin/esbuild \
  skills/hyper-motion-3d/scripts/check-core.ts \
  --bundle --platform=node --outfile=video/out/hyper-motion-qa/check-core.cjs
node video/out/hyper-motion-qa/check-core.cjs
node skills/hyper-motion-3d/scripts/render-check.mjs \
  --composition=HyperMotionDemo --frames=558,48,348,470 \
  --out=video/out/hyper-motion-qa/repeat --parallel
```

`render-check.mjs` сохраняет PNG, раскадровку, отчёт о разности RGB и SHA-256. Для установленного Chromium передай `--browser=/path/to/chromium` или задай `REMOTION_BROWSER_EXECUTABLE`. В черновом пресете демонстрация рисует WebGL с DPR 0,55 и без MSAA, сохраняя геометрию кадра и выходной FPS.

- Кадры в Remotion и детерминированная синхронизация Canvas. [ThreeCanvas](https://www.remotion.dev/docs/three-canvas) · [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame) · [Flickering](https://www.remotion.dev/docs/flickering) · [GL renderer](https://www.remotion.dev/docs/options/gl)
- Партионный рендер и очистка ресурсов. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) · [Three.js Cleanup](https://threejs.org/manual/pages/cleanup.html) · [R3F Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
