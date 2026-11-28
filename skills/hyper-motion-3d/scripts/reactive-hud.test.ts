import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compileReactiveHud, formatHudValue, type ReactiveHudCue} from '../examples/reactive-hud';
import {compileCueAudio, excerptCueAudio} from '../examples/cue-audio';

const base = {label: 'Рост', value: 0, maximum: 100, unit: 'percent', palette: '#ffeac8'} as const;
const events = [
  {id: 'burst', at: 20, hud: {stage: 'Квартал', value: 100, tween: 8, motif: 'star', pop: 0.2}, audio: {key: 'grow'}},
  {id: 'sprout', at: 10, hud: {stage: 'Двор', value: 50, palette: '#9be87d', tween: 20, motif: 'ring'},
    audio: {key: 'grow', gain: 0.8}},
  {id: 'light', at: 15, hud: {label: 'Цветение', pop: 0}},
] as const satisfies readonly {id: string; at: number; hud?: ReactiveHudCue; audio?: {key: string; gain?: number}}[];

test('persistent stage and temporary accent share an authored frame', () => {
  const track = compileReactiveHud(events, base);
  assert.equal(track.at(9).stage, undefined);
  assert.equal(track.at(9).scale, 1);
  assert.equal(track.at(10).stage, 'Двор');
  assert.equal(track.at(10).palette, '#9be87d');
  assert.equal(track.at(10).motif, 'ring');
  assert.ok(track.at(10).scale > 1);
  assert.equal(track.at(14).targetValue, 50);
  assert.equal(track.at(16).label, 'Цветение');
  assert.equal(track.at(16).scale, 1);
  assert.equal(track.at(65).stage, 'Квартал');
  assert.equal(track.at(65).motif, 'none');
  assert.equal(track.at(65).value, 100);
  assert.equal(track.at(65).progress, 1);
});

test('numeric and gauge paths are continuous on interruption and stable after seeking', () => {
  const track = compileReactiveHud(events, base);
  const onlyFirst = compileReactiveHud(events.filter((event) => event.at < 20), base);
  assert.equal(track.at(20).value, onlyFirst.at(20).value);
  assert.equal(track.at(20).progress, onlyFirst.at(20).progress);
  assert.equal(track.at(20).scale, 1.16);
  const frames = [0, 9, 10, 15, 20, 21, 26, 95];
  assert.deepEqual(frames.map(track.at), [...frames].reverse().map(track.at).reverse());
  assert.equal(track.at(21).progress, track.at(21).value / 100);
  assert.ok(track.at(21).value > track.at(20).value);
});

test('unit and meter maximum can change in independent scoreboard tracks', () => {
  const data = [
    ...events,
    {id: 'combo', at: 10, hud: {target: 'combo', unit: 'multiplier', value: 10, maximum: 10, tween: 0}},
  ] as const;
  const normal = compileReactiveHud(data, base);
  const combo = compileReactiveHud(data, {...base, value: 1}, 'combo');
  assert.equal(normal.at(10).value, 0);
  assert.equal(combo.at(10).value, 10);
  assert.equal(combo.at(10).progress, 1);
  assert.equal(formatHudValue(combo.at(10).value, combo.at(10).unit), '×10');
  assert.equal(formatHudValue(20, normal.at(10).unit), '20%');
});

test('each event onset latches one sound and excerpt overlap preserves source time', () => {
  const library = {grow: {src: 'grow.mp3', duration: 16, gain: 0.5}};
  const cues = compileCueAudio(events, library);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues.find((cue) => cue.id === 'sprout')?.time, {frame: 10});
  assert.equal(cues.find((cue) => cue.id === 'sprout')?.volume, 0.4);
  const excerpt = excerptCueAudio(cues, 14, 10);
  assert.deepEqual(excerpt.map(({id, time, duration}) => ({id, time, duration})), [
    {id: 'burst', time: {frame: 6}, duration: 4}, {id: 'sprout', time: {frame: -4}, duration: 14},
  ]);
  assert.throws(() => compileCueAudio([...events, {...events[0], id: 'duplicate'}], library), /overlapping/);
  assert.throws(() => compileCueAudio(events, {}), /Invalid/);
  assert.throws(() => compileReactiveHud([...events, {...events[0], id: 'duplicate'}], base), /Invalid/);
});
