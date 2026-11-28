# Звуковая дорожка «Всего один кофе»

`make_coffee_audio.py` собирает оригинальную партитуру и фоли в стерео 48 кГц для 840 кадров при 30 FPS. Из корня репозитория выполните команду с Python 3 и FFmpeg с `libmp3lame`.

```sh
python3 skills/toybox-3d/scripts/make_coffee_audio.py
```

Файл микса используется в композиции `ToyboxHyperDemo`. События читаются и при выключенном звуке.

| Кадр | Событие | Звук |
| ---: | --- | --- |
| 132 | Кнопка | Короткий фоли ElevenLabs и негромкий низкий щелчок |
| 173 | Шарниры раскрываются | Три приглушённых щелчка и упругий тон |
| 279 | Чашка собрана | Короткий механический акцент и восходящие ноты |
| 365 | Открывается терраса | Воздушный звук и смена регистра |
| 615 | Возврат на улицу | Нисходящий тон и мягкий воздушный звук |
| 720 | Маленькая чашка на поддоне | Тихий двойной керамический звон после музыкальной паузы |
| 765 | Реакция | Короткая нисходящая музыкальная фраза |

## Исходник и условия использования

`coffee-foley.mp3` — один дубль ElevenLabs Sound Effects v2 (`eleven_text_to_sound_v2`, generation ID `0SHd3t6WZpX57XgidPFB`). Сервис вернул примерно полсекунды с единственным выраженным щелчком. Из этого файла вырезана атака кнопки. Мелодию, фон, механику и керамику синтезирует сам скрипт на основе осцилляторов и шума с фиксированным seed. Уровень готового MP3 по FFmpeg составляет −17.18 LUFS и −2.23 dBTP.

Промпт дубля

> 4-second studio foley, three sounds separated by little silences: soft silicone button tick, toy espresso machine swivelling with warm wooden latches and tiny spring return, then a porcelain cup landing on coaster with a clear little clink and bounce. Close, dry, tactile, playful. No voices, music, or ambience.

Условия коммерческого использования исходника зависят от тарифа ElevenLabs, на котором он создан. Флаг `--original-foley` синтезирует весь микс локально. Чтобы сохранить альтернативную дорожку отдельно, добавьте `--output /путь/к/файлу.mp3`. [Условия публикации ElevenLabs](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform)
