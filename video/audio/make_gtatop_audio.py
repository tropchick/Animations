"""«Топ-10 героев GTA по шахматному рейтингу» — full video.
Voice: ElevenLabs v4 «Arcades», two takes, one generation each:
  audio/voice/gtatop-test.mp3  intro + 10th place
  audio/voice/gtatop-rest.mp3  places 9..1 + the GTA VI finale
Word times from faster-whisper (…-words.json). The rest take is cut at the pause before each «N-е место»
and spread out so the leaderboard can sit on screen between heroes.
Writes public/audio/gtatop.wav and src/gtatop/cues.json. Frame 0 is the cover, so everything starts at OFF.

Sync map (on-screen event <-> sound):
  title slams in               <-> low boom
  leaderboard rows slide in    <-> soft clicks
  «НЕ ТОММИ» stamp             <-> thump
  hero card / place number     <-> whoosh + wooden piece (podium: + bright ting)
  tags pop                     <-> clicks
  ELO counter running          <-> fast ticks, ting when it stops
  best move card (‼)           <-> bright ting
  blunder card (??)            <-> low thump
  joke stamp                   <-> thump
  card flies into the table    <-> whoosh, new row pops <-> wooden piece
  next row lights up           <-> soft click
  #1 in the table / confetti   <-> noise burst + chord
  GTA VI players slide in      <-> pieces, date pill <-> ting, CTA <-> thump
"""
import json
import re
import numpy as np
from slime_lib import ROOT, SR, Mix, click, filt, load, longest_pause, thump, ting, tt_, white

OFF = 1 / 30
TABLE_HOLD = 1.7  # from the card leaving to the next «N-е место»

WA = json.loads((ROOT / "audio/voice/gtatop-test-words.json").read_text())["s"]
WB = json.loads((ROOT / "audio/voice/gtatop-rest-words.json").read_text())["s"]
va = load(ROOT / "audio/voice/gtatop-test.mp3")
vb = load(ROOT / "audio/voice/gtatop-rest.mp3")
norm = lambda w: re.sub(r"[^\wё-]", "", w.lower()).replace("ё", "е").strip("-")

# ---------------------------------------------------------------- hero 10 (test take, fixed indices)
ta = lambda i: round(WA[i][0] + OFF, 3)
tea = lambda i: round(WA[i][1] + OFF, 3)
intro = {"title": ta(0), "board": ta(4), "tommy": ta(9), "stamp": ta(10)}
heroes = [{
    "say": ta(12), "cardIn": ta(12), "name": ta(14), "game": ta(15), "tags": [ta(16), ta(17), ta(18)],
    "eloStart": ta(14), "eloEnd": ta(14) + 1.6, "best": ta(19), "blunder": ta(27), "joke": ta(35) + 0.9, "toTable": tea(39) + 0.5,
}]
subs = [(ta(a), tea(b), x) for a, b, x in [
    (0, 6, 'Топ-10 героев GTA по шахматному рейтингу!'), (7, 11, 'И нет, Томми не первый.'), (12, 13, 'Десятое место.'),
    (14, 15, 'Виктор Вэнс.'), (16, 18, 'Солдат, брат, бизнесмен.'), (19, 26, 'Его сильнейший ход: построил империю в Вайс-Сити.'),
    (27, 34, 'Его зевок: умер в самом начале следующей игры.'), (35, 39, 'Партия длиной в одну заставку.')]]
A_END = WA[39][1] + 0.35  # the test take is used up to here

# ---------------------------------------------------------------- the rest take: phrases (first word, subtitle) per segment
SEGS = [
    {"phrases": [("девятое", "Девятое место."), ("тони", "Тони Сиприани."), ("захватил", "Захватил город, разобрался с тремя мафиозными семьями."),
                 ("но", "Но мама всё равно недовольна."), ("минус", "Минус двести очков за каждый звонок от мамы.")],
     "best": 2, "blunder": 3, "joke": (4, 0.3)},
    {"phrases": [("восьмое", "Восьмое место."), ("клод", "Клод."), ("самый", "Самый молчаливый игрок в истории шахмат."),
                 ("за", "За всю игру ни слова."), ("его", "Его даже предали молча:"), ("каталина", "Каталина выстрелила и сбежала с деньгами.")],
     "best": 3, "blunder": 4, "joke": (2, 0.6)},
    {"phrases": [("7", "Седьмое место."), ("джонни", "Джонни Клебиц."), ("байкер", "Байкер, лидер, человек чести."),
                 ("сыграл", "Сыграл достойную партию."), ("а", "А потом встретил Тревора."), ("здесь", "Здесь комментарии излишни.")],
     "best": 3, "blunder": 4, "joke": (5, 0.2), "tags": ["байкер", "лидер", "человек"]},
    {"phrases": [("6", "Шестое место."), ("майкл", "Майкл Де Санта."), ("инсценировал", "Инсценировал свою смерть и ушёл на пенсию."),
                 ("идеальная", "Идеальная защита."), ("а", "А потом из-за ревности снёс балкон чужого дома."),
                 ("как", "Как оказалось, дом наркобарона."), ("пенсия", "Пенсия окончена.")],
     "best": 2, "blunder": 4, "joke": (6, 0.2)},
    {"phrases": [("5", "Пятое место."), ("франклин", "Франклин Клинтон."), ("начинал", "Начинал с угона машин за долги."),
                 ("закончил", "Закончил домом на холмах и своим агентством."), ("единственная", "Единственная слабость — лучший друг Ламар."),
                 ("с", "С таким другом враги не нужны.")],
     "best": 2, "blunder": 4, "joke": (5, 0.6)},
    {"phrases": [("четвертое", "Четвёртое место."), ("тревор", "Тревор Филипс."), ("его", "Его дебют: снёс целую банду байкеров."),
                 ("вместе", "Вместе с Джонни, кстати."), ("зевков", "Зевков нет."), ("не", "Не потому что их не было."),
                 ("просто", "Просто спрашивать его об этом никто не рискнул.")],
     "best": 2, "blunder": 4, "joke": (6, 0.3)},
    {"phrases": [("третье", "Третье место!"), ("ника", "Нико Беллик."), ("приехал", "Приехал в Америку за мечтой."),
                 ("нашел", "Нашёл войну, мафию и месть."), ("сыграл", "Сыграл как гроссмейстер."),
                 ("но", "Но так и не научился отвечать кузену «нет»."), ("ника", "«Нико, пойдём в боулинг!»")],
     "best": 2, "blunder": 5, "joke": (6, 0.1)},
    {"phrases": [("второе", "Второе место!"), ("томми", "Томми Версетти."), ("15", "Пятнадцать лет тюрьмы, потерянные деньги, ни одного союзника."),
                 ("через", "Через одну игру он хозяин Вайс-Сити."), ("ошибка", "Ошибка одна: доверял Лэнсу."),
                 ("брату", "Брату того самого Виктора с десятого места.")],
     "best": 2, "blunder": 4, "joke": (5, 0.2)},
    {"phrases": [("и", "И первое место!"), ("си", "Си-Джей."), ("вернулся", "Вернулся домой на похороны мамы,"),
                 ("а", "а в итоге забрал себе весь штат:"), ("от", "от Гроув-стрит до казино в Лас-Вентурасе."),
                 ("хех", "Единственный зевок — не успел за тем самым поездом."), ("все", "«Всё, что надо было, это ехать за поездом, Си-Джей!»")],
     "best": 2, "blunder": 5, "joke": (6, 0.3)},
    {"phrases": [("но", "Но таблица ещё не закрыта."), ("двое", "Двое новых игроков садятся за доску."), ("джейсон", "Джейсон и Люсия."),
                 ("рейтинг", "Рейтинг: неизвестен."), ("первая", "Первая партия: 19 ноября."),
                 ("а", "А кто, по-твоему, должен быть первым? Пиши в комменты!")]},
]

pos = 0
for sg in SEGS:
    idx = []
    for w, _ in sg["phrases"]:
        while norm(WB[pos][2]) != w:
            pos += 1
        idx.append(pos)
        pos += 1
    sg["idx"] = idx
for k, sg in enumerate(SEGS):
    sg["last"] = (SEGS[k + 1]["idx"][0] - 1) if k + 1 < len(SEGS) else len(WB) - 1
    print(k, [WB[i][2] for i in sg["idx"]], "… last:", WB[sg["last"]][2])

# cut points (seconds in the rest take): the longest pause before each segment's first word
cuts = [0.0]
for k in range(1, len(SEGS)):
    a = WB[SEGS[k - 1]["last"]][0]
    b = WB[SEGS[k]["idx"][0]][0] + 0.6
    c = longest_pause(vb, a, b)
    cuts.append(c / SR)
    # whisper often puts the first word of a paragraph too early: snap it to the real voice onset after the pause
    w = int(0.01 * SR)
    j = c
    while np.sqrt((vb[j: j + w] ** 2).mean()) < 0.02:
        j += w
    i0 = SEGS[k]["idx"][0]
    WB[i0][0] = max(WB[i0][0], round(j / SR, 3))
cuts.append(len(vb) / SR)

# ---------------------------------------------------------------- lay the segments out on the timeline
mix_parts = [(va[: int(A_END * SR)], OFF)]
prev_to_table = heroes[0]["toTable"]
prev_end = OFF + A_END
for k, sg in enumerate(SEGS):
    t0 = WB[sg["idx"][0]][0]
    shift = max(prev_to_table + TABLE_HOLD - t0, prev_end + 0.05 - cuts[k])
    mix_parts.append((vb[int(cuts[k] * SR): int(cuts[k + 1] * SR)], cuts[k] + shift))
    T = lambda i: round(WB[i][0] + shift, 3)
    TE = lambda i: round(WB[i][1] + shift, 3)
    ph = sg["idx"]
    ends = ph[1:] + [sg["last"] + 1]
    for j, (i0, (_, text)) in enumerate(zip(ph, sg["phrases"])):
        subs.append((T(i0), TE(ends[j] - 1), text))
    if k < len(SEGS) - 1:
        name = T(ph[1])
        if "tags" in sg:
            tg, p2 = [], ph[2]
            for w in sg["tags"]:
                while norm(WB[p2][2]) != w:
                    p2 += 1
                tg.append(T(p2))
        else:
            tg = [round(name + 0.8 + 0.35 * j, 3) for j in range(3)]
        h = {"say": T(ph[0]), "cardIn": round(name - 0.3, 3), "name": name, "game": round(name + 0.6, 3), "tags": tg,
             "eloStart": name, "eloEnd": round(name + 1.6, 3), "best": T(ph[sg["best"]]), "blunder": T(ph[sg["blunder"]]),
             "joke": round(T(ph[sg["joke"][0]]) + sg["joke"][1], 3), "toTable": round(TE(sg["last"]) + 0.45, 3)}
        heroes.append(h)
        prev_to_table = h["toTable"]
    else:
        finale = {"start": T(ph[0]), "two": T(ph[1]), "jason": T(ph[2]), "lucia": T(ph[2] + 2), "rating": T(ph[3]),
                  "date": T(ph[4]), "cta": T(ph[5]), "end": TE(sg["last"])}
    prev_end = cuts[k + 1] + shift

DUR = round(finale["end"] + 2.8, 3)

# ---------------------------------------------------------------- sound
def piece():
    s = thump(240, 150, 0.18, decay=38, click=0) * 0.5
    c = click(0.06, 1700)
    s[: len(c)] += c * 0.8
    return s


def whoosh(dur=0.5):
    tt = tt_(dur)
    return filt(white(len(tt)), "bandpass", [400, 4000]) * np.sin(np.pi * tt / dur) ** 2


def burst(dur=0.35):
    tt = tt_(dur)
    return filt(white(len(tt)), "highpass", 2500) * np.exp(-tt * 9)


mix = Mix(DUR)
for sig, at in mix_parts:
    mix.add(sig, at, 1.0)
mix.add(thump(55, 28, 1.6, decay=2.5, click=0.3), intro["title"], 0.55)
for k in range(10):
    mix.add(click(0.04, 2200), intro["board"] + k * 0.06, 0.12)
mix.add(thump(90, 40, 0.7, decay=6), intro["stamp"], 0.5)

for i, h in enumerate(heroes):
    place = 10 - i
    mix.add(whoosh(0.5), h["cardIn"] - 0.3, 0.14)
    mix.add(piece(), h["cardIn"] + 0.45, 0.45)
    if place <= 3:
        mix.add(ting(1568, 1.2), h["cardIn"] + 0.2, 0.06)
        mix.add(ting(2093, 1.2), h["cardIn"] + 0.25, 0.05)
        mix.add(burst(), h["cardIn"] + 0.2, 0.12 if place == 1 else 0.07)
    for x in h["tags"]:
        mix.add(click(0.05, 2600), x, 0.25)
    n = int((h["eloEnd"] - h["eloStart"]) / 0.05)
    for k in range(n):
        mix.add(click(0.02, 3200), h["eloStart"] + k * 0.05, 0.08)
    mix.add(ting(1900, 0.8), h["eloEnd"], 0.07)
    mix.add(piece(), h["best"], 0.4)
    mix.add(ting(2600, 1.3), h["best"] + 0.03, 0.09)
    mix.add(piece(), h["blunder"], 0.4)
    mix.add(thump(80, 38, 0.8, decay=5), h["blunder"] + 0.02, 0.45)
    mix.add(thump(100, 45, 0.6, decay=7), h["joke"], 0.4)
    mix.add(whoosh(0.6), h["toTable"] - 0.2, 0.14)
    mix.add(piece(), h["toTable"] + 0.5, 0.4)
    if i + 1 < len(heroes):
        mix.add(click(0.05, 1800), heroes[i + 1]["say"] - 0.3, 0.18)
    else:
        mix.add(burst(0.5), h["toTable"] + 0.5, 0.14)
        for f, d in [(1047, 0), (1319, 0.06), (1568, 0.12), (2093, 0.18)]:
            mix.add(ting(f, 1.6), h["toTable"] + 0.5 + d, 0.05)
mix.add(whoosh(0.6), finale["start"] - 0.1, 0.12)
mix.add(piece(), finale["jason"], 0.4)
mix.add(piece(), finale["lucia"], 0.4)
mix.add(ting(2400, 1.2), finale["date"], 0.08)
mix.add(thump(90, 45, 0.6, decay=6), finale["cta"], 0.4)
final = mix.write("gtatop")

S = [{"s": s, "e": round(e + 0.3, 3), "text": x} for s, e, x in subs]
for k in range(len(S) - 1):
    S[k]["e"] = round(min(S[k]["e"], S[k + 1]["s"] - 0.05), 3)
cues = {"duration": DUR, "intro": intro, "heroes": heroes, "finale": finale, "subs": S}
(ROOT / "src/gtatop/cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=1))
print(f"wrote {final}; duration {DUR:.2f} s = {round(DUR * 30) + 1} frames")
