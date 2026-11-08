# «Что если она реально выбрала медведя?» — sync map

Story time v is the time inside the story; the video has the cover as frame 0, so video time = v + 1/30 s and frame = round(v·30) + 1. The soundtrack (video/public/audio/bear-choice.wav) is built with the same offset, so every sound lands on its frame. Source of the times: video/src/bear/cues.json (built by video/audio/make_bear_audio.py from the voice word times).

| Event on screen | Story time v (s) | Video time (s) | Frame | Sound |
|---|---|---|---|---|
| typing on the phone | 0.40 | 0.433 | 13 | key clicks (synth) until 2.35 |
| post goes out | 2.55 | 2.583 | 77 | ping |
| reply arrives | 4.85 | 4.883 | 147 | ping |
| jump cut to the forest | 5.95 | 5.983 | 179 | whoosh |
| bush starts shaking | 10.05 | 10.083 | 303 | rustle (ElevenLabs) |
| bear starts to rise | 11.50 | 11.533 | 346 | rustle (ElevenLabs) |
| ROAR | 12.95 | 12.983 | 389 | bear roar (ElevenLabs) + low thump + leaves |
| she grabs the bar | 15.35 | 15.383 | 461 | zip (synth) |
| throw | 16.15 | 16.183 | 485 | whoosh |
| he catches it | 16.95 | 16.983 | 509 | chomp |
| chewing | 17.00 | 17.033 | 511 | chew (ElevenLabs) |
| wrapper lands | 18.45 | 18.483 | 555 | crinkle (ElevenLabs), starts 0.7 s before |
| he sits down | 19.42 | 19.453 | 584 | thump + leaves |
| paw out | 20.20 | 20.233 | 607 | soft whoosh |
| views counter runs | 23.90 | 23.933 | 718 | ticks, ping at 25.75 |
| backpack lift | 27.85 | 27.883 | 837 | thump |
| subscribers counter | 29.85 | 29.883 | 897 | ticks, ping at 32.45 |
| parcel rip | 32.20 | 32.233 | 967 | rip (ElevenLabs), starts 0.3 s before (the take has a 0.2 s lead-in) |
| contract slides | 34.55 | 34.583 | 1037 | paper |
| pen dip | 36.85 | 36.883 | 1107 | soft splash |
| STAMP | 38.30 | 38.333 | 1150 | stamp (ElevenLabs) |
| sack of coins | 38.95 | 38.983 | 1169 | thump + coins (ElevenLabs) |
| hammer hit 1 | 39.55 | 39.583 | 1187 | hammer (ElevenLabs) |
| hammer hit 2 | 39.95 | 39.983 | 1199 | hammer (ElevenLabs) |
| hammer hit 3 | 40.35 | 40.383 | 1211 | hammer (ElevenLabs) |
| hammer hit 4 | 40.75 | 40.783 | 1223 | hammer (ElevenLabs) |
| hammer hit 5 | 41.15 | 41.183 | 1235 | hammer (ElevenLabs) |
| den lights on | 42.05 | 42.083 | 1263 | five tings |
| point at the plan | 46.55 | 46.583 | 1397 | whoosh |
| LADLE | 47.75 | 47.783 | 1433 | thump + ting + plop (ElevenLabs) |
| crowd shot | 49.80 | 49.833 | 1495 | crowd (ElevenLabs), fade in 1.2 s |
| jaw drop | 54.15 | 54.183 | 1625 | (voice only) |
| star shot | 55.30 | 55.333 | 1660 | fans cheering (ElevenLabs) |
| camera flash 1 | 55.45 | 55.483 | 1665 | shutter |
| camera flash 2 | 55.70 | 55.733 | 1672 | shutter |
| camera flash 3 | 55.85 | 55.883 | 1677 | shutter |
| camera flash 4 | 56.20 | 56.233 | 1687 | shutter |
| camera flash 5 | 56.55 | 56.583 | 1697 | shutter |
| camera flash 6 | 56.70 | 56.733 | 1702 | shutter |
| camera flash 7 | 57.05 | 57.083 | 1713 | shutter |
| camera flash 8 | 57.30 | 57.333 | 1720 | shutter |
| camera flash 9 | 57.75 | 57.783 | 1733 | shutter |
| camera flash 10 | 58.10 | 58.133 | 1744 | shutter |
| camera flash 11 | 58.40 | 58.433 | 1753 | shutter |
| camera flash 12 | 58.90 | 58.933 | 1768 | shutter |
| camera flash 13 | 59.30 | 59.333 | 1780 | shutter |
| music cut (podcast) | 60.60 | 60.633 | 1819 | music bed fades out 60.3-60.62 |
| freeze: total silence | 70.95 | 70.983 | 2129 | nothing until 74.4 |
| «С мёдом» | 74.40 | 74.433 | 2233 | bear voice |
| sunset forest | 75.90 | 75.933 | 2278 | forest + birds (ElevenLabs) |
| unwrap (tear at 77.13) | 76.70 | 76.733 | 2302 | crinkle (ElevenLabs), starts 0.45 s before so its peak lands on the tear |
| bite | 78.05 | 78.083 | 2343 | crunch + chewing |
| title «А ты бы кого выбрал(а)?» | 78.60 | 78.633 | 2359 | (forest continues) |
