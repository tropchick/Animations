import {deepStrictEqual, equal, ok, throws} from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {
  choreographyLevels, choreographyRecipes, compileChoreography, inspectVisualDensity,
  sampleAuthoredPose, sampleChoreography, worldEventsFromPlan,
  type Lane, type RecipeName,
} from '../examples/choreography';
import {compileWorldReaction} from '../examples/world-reactions';
import gardenPlan from '../examples/demo-garden-plan.json';
import schema from '../references/choreography.schema.json';

const {positionals, values} = parseArgs({
  allowPositionals: true,
  options: {
    'gap-seconds': {type: 'string', default: '3'},
    'strict-density': {type: 'boolean'},
    help: {type: 'boolean'},
  },
});
if (values.help) {
  console.log('Run the bundled choreography checks with [plan.json] [--gap-seconds=3] [--strict-density].');
  process.exit(0);
}
const gapSeconds = Number(values['gap-seconds']);
if (positionals.length > 1 || !Number.isFinite(gapSeconds) || gapSeconds <= 0) {
  throw new RangeError('Expected at most one plan path and a positive --gap-seconds value.');
}

const recipes = Object.keys(choreographyRecipes) as RecipeName[];
const lanes = Object.keys(schema.$defs.layers.properties) as Lane[];
const schemaChannels = Object.keys(schema.$defs.intensityKey.properties.channels.properties);
deepStrictEqual([...schema.$defs.recipe.enum].sort(), [...recipes].sort());
deepStrictEqual([...schema.$defs.intensityKey.properties.level.enum].sort(), Object.keys(choreographyLevels).sort());
deepStrictEqual(schemaChannels.sort(), Object.keys(choreographyLevels.Hyper).sort());
deepStrictEqual([...lanes].sort(),
  [...new Set(Object.values(choreographyRecipes).flatMap((recipe) => Object.keys(recipe)))].sort());

const cue = {id: 'plant', subject: 'A seed opens', recipe: 'layered-reveal', origin: [0, 1, 2], at: 240};
const recipePlanInput = {fps: 60, durationInFrames: 600, events: [cue]};
throws(() => compileChoreography({...recipePlanInput, events: [cue, cue]}), /Duplicate event id/);
throws(() => compileChoreography({...recipePlanInput, events: [{...cue, at: 600}]}), /plant.at/);
throws(() => compileChoreography({...recipePlanInput, events: [{...cue, layers: {world: [1, 0, 3]}}]}),
  /plant.layers.world/);
throws(() => compileChoreography({...recipePlanInput, intensity: [
  {frame: 21, level: 'Hyper'}, {frame: 21, level: 'Dynamic'},
]}), /Duplicate intensity frame/);

const authored = {
  fps: 30,
  durationInFrames: 180,
  voice: [{from: 30, to: 62, text: 'Watch the leaves.'}],
  poseTracks: [{subject: 'gardener', keys: [
    {frame: 0, position: [0, 0, 0]},
    {frame: 75, position: [2, 1, -1], rotation: [0, 0.4, 0], scale: [1, 1.1, 1], ease: 'smooth'},
  ]}],
  cameraTrack: [
    {frame: 0, position: [0, 3, 7], target: [0, 1, 0], fov: 38, roll: -1, focus: 4},
    {frame: 75, position: [1, 2, 5], target: [2, 1, -1], ease: 'spline', cut: false,
      orbit: 'clockwise', dollyZoom: true, focus: [2, 1, -1]},
  ],
  events: [{...cue, at: 60, reaction: {
    targets: ['near'], speed: 0.5, radius: 10, attack: 0, hold: 2, decay: 4,
    falloff: 'smooth', channels: {lift: 0.9}, persist: {open: true}, commit: 'arrival', transitionFrames: 4,
  }}],
} as const;
const authoredPlan = compileChoreography(authored);
deepStrictEqual(authoredPlan.voice, authored.voice);
equal(authoredPlan.poseTracks[0].subject, authored.poseTracks[0].subject);
deepStrictEqual(authoredPlan.poseTracks[0].keys[1], authored.poseTracks[0].keys[1]);
const expectedCamera = authored.cameraTrack[1];
for (const key of Object.keys(expectedCamera) as (keyof typeof expectedCamera)[]) {
  deepStrictEqual(authoredPlan.cameraTrack[1][key], expectedCamera[key]);
}
const poseAt = (frame: number) => sampleAuthoredPose(authoredPlan.poseTracks[0], frame);
deepStrictEqual(poseAt(37.5), {position: [1, 0.5, -0.5], rotation: [0, 0.2, 0], scale: [1, 1.05, 1]});
const poseOrder = [83, 37.5, 0, 24, 47, 37.5];
deepStrictEqual(poseOrder.map(poseAt), [...poseOrder].reverse().map(poseAt).reverse());
const [authoredCue] = authoredPlan.cues;
deepStrictEqual(authoredCue.reaction, authored.events[0].reaction);
const world = compileWorldReaction({
  origins: {near: [1, 1, 2], far: [5, 1, 2]},
  initial: {near: {open: false}},
  events: worldEventsFromPlan(authoredPlan),
});
equal(world(61, 'near').pulse, 0);
equal(world(62, 'near').hits[0].arrival, 62);
ok((world(62, 'near').channels.lift ?? 0) > 0);
equal(world(65, 'near').state.open, false);
equal(world(66, 'near').state.open, true);
equal(world(150, 'near').state.open, true);
deepStrictEqual(world(63, 'far'), {pulse: 0, hits: [], channels: {}, state: {}});
const reactionOrder = [75, 61, 150, 62, 66, 61];
const nearAt = (frame: number) => world(frame, 'near');
deepStrictEqual(reactionOrder.map(nearAt), [...reactionOrder].reverse().map(nearAt).reverse());

throws(() => compileChoreography({...authored, voice: [{from: 30, to: 30, text: 'Too short.'}]}), /voice/i);
throws(() => compileChoreography({...authored, poseTracks: [
  {subject: 'gardener', keys: [authored.poseTracks[0].keys[0], authored.poseTracks[0].keys[0]]},
]}), /pose|duplicate/i);
throws(() => compileChoreography({...authored, cameraTrack: [
  {...authored.cameraTrack[0], frame: 180},
]}), /camera/i);
throws(() => compileChoreography({...authored, events: [
  {...authored.events[0], reaction: {speed: 0}},
]}), /reaction/i);

const frames = [250, 18, 300, 215, 241, 430, 250, 239, 589];
const pace = 1.5;
const authoredFrameScale = recipePlanInput.fps / 30 * pace;
for (const recipe of recipes) {
  const plan = compileChoreography({...recipePlanInput, events: [{...cue, recipe, pace}]});
  const sample = (frame: number) => sampleChoreography(plan, frame, {seed: `recipe/${recipe}`});
  const intensityAt = (frame: number, lane: Lane) => sample(frame).events[0]?.lanes[lane] ?? 0;
  deepStrictEqual(frames.map(sample), [...frames].reverse().map(sample).reverse(), recipe);
  const windows = plan.timings[0].layers;
  for (const lane of lanes) {
    const window = windows[lane];
    if (!window) {
      equal(intensityAt(cue.at, lane), 0, `${recipe}/${lane} must stay disabled`);
      continue;
    }
    const [start, peak, end] = window;
    equal(intensityAt(cue.at + (start - 1) * authoredFrameScale, lane), 0, `${recipe}/${lane} before`);
    ok(intensityAt(cue.at + peak * authoredFrameScale, lane) > 0, `${recipe}/${lane} at peak`);
    equal(intensityAt(cue.at + end * authoredFrameScale, lane), 0, `${recipe}/${lane} at end`);
  }
}

const overlap = compileChoreography({fps: 30, durationInFrames: 200, events: [
  {...cue, id: 'secondary', at: 90, priority: -1, state: {open: true}},
  {...cue, id: 'primary', at: 90, priority: 9, state: {open: true}},
]});
const unrestricted = sampleChoreography(overlap, 97);
const capped = sampleChoreography(overlap, 97, {budgets: {particles: 6, spatialCues: 1}});
const empty = sampleChoreography(overlap, 97, {budgets: {particles: 0, spatialCues: 0}});
equal(capped.events.find(({cue}) => cue.id === 'primary')?.particleBudget, 6);
equal(capped.events.find(({cue}) => cue.id === 'secondary')?.lanes.vfx, 0);
for (const result of [capped, empty]) {
  equal(result.events.length, unrestricted.events.length);
  deepStrictEqual(result.events.map(({cue}) => cue.state), [{open: true}, {open: true}]);
  for (const lane of lanes.filter((lane) => lane !== 'vfx')) {
    deepStrictEqual(result.events.map((event) => event.lanes[lane]),
      unrestricted.events.map((event) => event.lanes[lane]), lane);
  }
}
ok(unrestricted.events.every(({lanes}) => lanes.world > 0 && lanes.audio > 0));
ok(empty.events.every(({lanes, particleBudget}) => lanes.vfx === 0 && particleBudget === 0));

const density = compileChoreography({fps: 30, durationInFrames: 420, events: [
  {...cue, at: 40, id: 'open'},
  {...cue, at: 120, id: 'camera-only',
    layers: {body: false, world: false, vfx: false, light: false, hud: false, audio: false}},
  {...cue, at: 175, id: 'decoration', meaningful: false},
  {...cue, at: 205, id: 'disabled', strength: 0},
  {...cue, at: 235, id: 'grow'},
  {...cue, at: 300, id: 'settle'},
], shots: [{from: 300, to: 420, focus: 'Petal', camera: 'Static detail', quietReason: 'Read the reaction'}]});
deepStrictEqual(inspectVisualDensity(density), [
  {from: 40, to: 235, seconds: 6.5, explained: false},
  {from: 300, to: 420, seconds: 4, explained: true},
]);
deepStrictEqual(inspectVisualDensity(density, 6.5), []);
const stateOnlyDensity = compileChoreography({fps: 30, durationInFrames: 250, events: [
  {...cue, id: 'state', at: 80, layers: {body: false, world: false}, state: {open: true}},
  {...cue, id: 'number', at: 170, layers: {body: false, world: false}, hud: {label: 'Progress', value: 1}},
]});
deepStrictEqual(inspectVisualDensity(stateOnlyDensity), []);

const customPath = positionals[0];
const planInput: unknown = customPath === undefined ? gardenPlan : JSON.parse(readFileSync(customPath, 'utf8'));
const plan = compileChoreography(planInput);
const intensityKeys = (planInput as {intensity?: {channels?: Record<string, unknown>}[]}).intensity ?? [];
for (const key of intensityKeys) {
  for (const channel of Object.keys(key.channels ?? {})) {
    ok(schemaChannels.includes(channel), `Unknown intensity channel: ${channel}`);
  }
}
const requestedFrames = [plan.durationInFrames - 1, 0, ...plan.cues.flatMap(({at}) => [at + 7, at, at - 7])]
  .filter((frame) => frame >= 0 && frame < plan.durationInFrames);
const renderFrame = (frame: number) => sampleChoreography(plan, frame, {seed: 'plan-review'});
deepStrictEqual(requestedFrames.map(renderFrame), [...requestedFrames].reverse().map(renderFrame).reverse());

const gaps = inspectVisualDensity(plan, gapSeconds);
console.log(JSON.stringify({
  plan: customPath ?? 'demo-garden-plan.json',
  durationInFrames: plan.durationInFrames,
  events: plan.cues.length,
  voiceLines: plan.voice.length,
  poseTracks: plan.poseTracks.length,
  cameraKeys: plan.cameraTrack.length,
  worldReactions: plan.cues.filter(({reaction}) => reaction !== undefined).length,
  testedRecipes: recipes.length,
  testedPlanFrames: requestedFrames.length,
  visualDensityReview: gaps,
}, null, 2));
if (values['strict-density'] && gaps.some(({explained}) => !explained)) {
  process.exitCode = 1;
}
