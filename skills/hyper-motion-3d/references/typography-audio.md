# Типографика, HUD и звук

## Текст на вертикальном экране

Держи важный текст в `SafeArea`, внешний контейнер композиции 1080×1920. Стартовые поля сверху 10%, справа 16%, снизу 22%, слева 8%. Перед публикацией проверь каждый целевой интерфейс с реальной подписью, кнопками и субтитрами. При необходимости передай дробные `insets` для конкретного проекта. Смотри уменьшенный кадр примерно 360×640 и кадры на входе и выходе текста. [TikTok Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes) · [Google Ads safe-zone templates](https://support.google.com/google-ads/answer/13547298) · [Meta Reels best practices](https://business-auth.facebook.com/business/learn/video/reels-best-practices)

Начни с 42–56 px для текста, который зритель должен прочитать при 1080×1920. Переноси короткие фразы целиком, фиксируй ширину цифровых полей и подложи матовую плашку, если за словами меняется яркость. Проверь свободное место вокруг лица, руки и предмета действия на всём пролёте камеры. Если HUD и субтитры пересекаются, передвинь HUD или временно убери его.

| Компонент | Применение |
| --- | --- |
| `KineticText` | Вход фразы с подъёмом и коротким затуханием. `emphasis` задаёт усиленный акцент или его цвет. `intensity` регулирует амплитуду движения. `from`, `duration`, `hold` задаются в кадрах. |
| `KineticWords` | Постепенное появление слов со `stagger`. Скрытые слова сохраняют место в строке. |
| `AnimatedCounter` | Целые значения, проценты и множители. Используй `start` для кадра начала, `from` и `to` для значений, `prefix="×"` для множителей. `format` форматирует уже интерполированное значение. |
| `AnimatedHUD` | Шкала прогресса с значением 0–1, отметками `ticks` и произвольным числом или подписью в `children`. |
| `InfoCard` | Короткая всплывающая карточка с заголовком, подписью и необязательным пояснением. |
| `KaraokeCaptions` | Удерживает фразу целиком. Подсвечивает произносимое слово, ключевым словам даёт небольшой масштабный акцент. |
| `WorldText` | Меш с объёмом и фаской в сцене. Центрирует геометрию, может появиться в кадре `from` и вырасти за `duration` кадров. |

```tsx
<SafeArea style={{justifyContent: 'space-between'}}>
  <KineticText from={338} duration={12} emphasis="#ecd395" style={{fontSize: 60}}>
    Линза на месте
  </KineticText>
  <AnimatedHUD progress={power} label="СИГНАЛ" ticks={9}>
    <AnimatedCounter start={338} duration={27} from={1} to={10} prefix="×"/>
  </AnimatedHUD>
</SafeArea>
```

Для караоке передай `CaptionLine[]` в порядке воспроизведения. `from` включён, `to` исключён. Храни интервалы слов в пределах фразы и разбивай длинные фразы по естественным паузам. Когда субтитры монтируются в `Sequence`, передай выходной `frame` явно, если интервалы записаны на шкале ролика. Границы локального кадра описаны в документации Remotion. [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame) · [Sequence](https://www.remotion.dev/docs/sequence)

```tsx
<KaraokeCaptions frame={outputFrame} lines={[
  {from: 340, to: 383, words: [
    {text: 'Линза', from: 340, to: 351},
    {text: 'на', from: 351, to: 358},
    {text: 'месте', from: 358, to: 374, emphasis: true},
  ]},
]}/>
```

Для `WorldText` загрузи лицензированный typeface JSON с глифами языка ролика. Стабильный объект `Font` можно создать через `new FontLoader().parse(typeface)` из локально импортированного JSON. Передай его в `<WorldText text="×10" font={font} from={338} position={[0, 1.8, 0]} />` внутри `ThreeCanvas`. Для часто меняющихся чисел используй HUD, а для объёмной вывески кэшируй шрифт и меняй трансформацию, чтобы геометрия переиспользовалась. Проверь контраст букв при зерне материала, боковом свете и быстром движении. [FontLoader](https://threejs.org/docs/pages/FontLoader.html) · [TextGeometry](https://threejs.org/docs/pages/TextGeometry.html)

[Код компонентов типографики](../examples/typography.tsx)

## Сведение и синхронизация

1. Выставь опорные точки после финального монтажа озвучки. Возьми интервалы слов из транскрипта или вручную отметь начало ударного слога. Для музыки отметь значимые доли и смену фразы. Для шумов найди фактический транзиент в исходнике.
2. Переведи секунды в выходные кадры через `frameAt({seconds}, fps)`. Один кадр слова или события может запускать счётчик, движение камеры и звук. Небольшое предвосхищение камеры иногда начинается на 2–4 кадра раньше. Приземление и звуковой транзиент обычно совпадают.
3. Сохрани сетку долей и огибающую после офлайн-анализа. `sampleEnvelope` интерполирует шаги RMS или peak во времени. `beatPulse` берёт упорядоченные выходные кадры и вычисляет атаку и спад. Передавай амплитуду в небольшой диапазон, например `0.88 + 0.10 * level` для яркости мотива. `BeatSync` и `AudioReactiveEffect` дают те же значения через render prop. Экспозиции стоп-моушена и временные ремапы оставляют микс на выходной шкале.
4. Выдели голос, музыку, атмосферу и акценты по дорожкам. Подстрой громкость музыки под голос и дай кульминации запас по пику. Удар часто выигрывает от лёгкого затишья перед ним. Оцени тихое воспроизведение и моно на телефоне, проверь интегральную громкость и true peak итогового файла.

```tsx
const impact = frameAt({seconds: spokenWord.start}, fps);
const pulse = beatPulse(outputFrame, [impact], 12);
const level = sampleEnvelope(offlineRms, outputFrame, fps);

<CueAudio gain={accentStrength} cues={[
  {id: 'lock', src: staticFile('audio/lens-click.mp3'),
    time: {frame: impact}, duration: 15, volume: 0.65, fadeOut: 4},
]}/>
```

У `CueAudio` время события выражается в секундах или кадрах. `duration`, `trimBefore`, `fadeIn` и `fadeOut` измеряются в кадрах. Размещай его в корне композиции для общей шкалы. Смещай `trimBefore` к началу полезного звука, чтобы атака клика совпала с выбранным кадром. [Код аудиокомпонентов](../examples/audio.tsx) · [Remotion Audio](https://www.remotion.dev/docs/media/audio) · [Звук в существующих роликах](../../remotion-markup/audio.md)

## Дорожки демонстрации

Два стереофонических файла 48 кГц содержат оригинальную процедурную музыку и акценты. При сложении полный микс даёт −18,5 LUFS и −2,8 dBTP по `ebur128`. В [demo-cues.json](../examples/demo-cues.json) хранятся 7 опорных кадров, а [demo-envelope.json](../examples/demo-envelope.json) содержит 720 измерений RMS до кодирования. Огибающая переводит диапазон −40…−14 dBFS в 0…1. `DemoScore` принимает `trimBefore` и `trimAfter` для повторного использования монтажа, а также отдельные `accents` и `accentGain` для звуковых акцентов. Для демонстрации сторонние семплы и сетевые запросы не требуются. [Дорожки](../../../video/public/audio/hyper-motion-3d) · [Код синтеза](../scripts/make_demo_score.py)

Чтобы изменить партитуру, отредактируй карту событий и перегенерируй звук и огибающую из корня репозитория. Требуются Python 3 и FFmpeg с `libmp3lame`.

```bash
python3 skills/hyper-motion-3d/scripts/make_demo_score.py
```

После `npm ci` в `video/` проверь преобразование временных меток, обратный порядок расчёта, огибающие и счётчики из корня репозитория.

```bash
check_dir="$(mktemp -d)"
NODE_PATH="$PWD/video/node_modules" video/node_modules/.bin/esbuild \
  skills/hyper-motion-3d/scripts/typography-audio.test.ts \
  --bundle --platform=node --jsx=automatic --outfile="$check_dir/test.cjs"
node --test "$check_dir/test.cjs"
```
