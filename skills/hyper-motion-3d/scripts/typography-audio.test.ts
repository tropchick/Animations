import assert from 'node:assert/strict';
import {test} from 'node:test';
import {beatPulse, cueGain, frameAt, sampleEnvelope} from '../examples/audio';
import {counterValue, SHORT_VERTICAL_INSETS} from '../examples/typography';
import timing from '../examples/demo-cues.json';
import envelope from '../examples/demo-envelope.json';

test('manual and imported timecodes align at the composition FPS', () => {
  assert.equal(frameAt({frame: 122}, 30), 122);
  assert.equal(frameAt({seconds: 2.5}, 30), 75);
  assert.equal(frameAt({seconds: 2.5}, 24), 60);
  for (const frame of Object.values(timing.beats)) {
    assert.equal(frameAt({seconds: frame / timing.fps}, timing.fps), frame);
  }
});

test('audio envelopes interpolate continuously and vanish beyond their recording', () => {
  const track = {samples: [0.1, 0.9], startSeconds: 1, stepSeconds: 0.5};
  assert.equal(sampleEnvelope(track, 29, 30), 0);
  assert.equal(sampleEnvelope(track, 30, 30), 0.1);
  assert.equal(sampleEnvelope(track, 37.5, 30), 0.5);
  assert.equal(sampleEnvelope(track, 45, 30), 0.9);
  assert.equal(sampleEnvelope(track, 46, 30), 0);
  assert.equal(sampleEnvelope({...track, samples: []}, 30, 30), 0);
});

test('score shape stays deterministic when the same frames are visited in reverse order', () => {
  const frames = Object.values(timing.beats);
  const values = frames.map((frame) => sampleEnvelope(envelope, frame, timing.fps));
  const reversed = [...frames].reverse().map((frame) => sampleEnvelope(envelope, frame, timing.fps));
  assert.deepEqual(values, reversed.reverse());
  assert.equal(envelope.samples.length, timing.frames);
  assert.ok(values.every((value) => value > 0 && value <= 1));
  assert.ok(values[5] > values[0]);
});

test('audio cue pulses, clip fades and beat overlap stay bounded', () => {
  const beats = [20, 40, 48];
  assert.equal(beatPulse(15, beats, 8, 10), 0.25);
  assert.equal(beatPulse(20, beats, 8), 1);
  assert.equal(beatPulse(24, beats, 8), 0.25);
  assert.equal(beatPulse(28, beats, 8), 0);
  assert.equal(beatPulse(48, beats, 8), 1);
  assert.equal(beatPulse(100, [], 8), 0);

  assert.equal(cueGain(-1, 10, 0.8, 2, 2), 0);
  assert.equal(cueGain(1, 10, 0.8, 2, 2), 0.4);
  assert.equal(cueGain(2, 10, 0.8, 2, 2), 0.8);
  assert.equal(cueGain(8, 10, 0.8, 2, 2), 0.4);
  assert.equal(cueGain(9, 10, 0.8, 2, 2), 0);
  assert.equal(cueGain(10, 10, 0.8, 2, 2), 0);
});

test('counters preserve bounds and support descending and instantaneous cues', () => {
  assert.equal(counterValue(5, 6, 12, 10, 90), 10);
  assert.equal(counterValue(6, 6, 12, 10, 90), 10);
  assert.equal(counterValue(12, 6, 12, 10, 90), 80);
  assert.equal(counterValue(12, 6, 12, 90, 10), 20);
  assert.equal(counterValue(18, 6, 12, 10, 90), 90);
  assert.equal(counterValue(6, 6, 0, 10, 90), 90);
  assert.ok(SHORT_VERTICAL_INSETS.left + SHORT_VERTICAL_INSETS.right < 1);
  assert.ok(SHORT_VERTICAL_INSETS.top + SHORT_VERTICAL_INSETS.bottom < 1);
});
