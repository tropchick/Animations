import { toyClamp, toyEase, toyMix, toySettle, toySquash } from './motion'

export type ToyPoint = [number, number, number]

export type ToyAction = 'idle' | 'walk' | 'run' | 'jump' | 'stop' | 'turn' | 'look'
  | 'gesture' | 'interact' | 'talk' | 'surprise' | 'laugh' | 'fall'

export type ToyEmotion = 'neutral' | 'surprise' | 'joy' | 'confusion' | 'fear'
  | 'annoyance' | 'fatigue' | 'delight' | 'boredom' | 'suspicion' | 'comedy'

export type ToyCharacterTiming = {
  frame: number
  fps: number
  action?: ToyAction
  actionStart?: number
  actionDuration?: number
  emotion?: ToyEmotion
  emotionStart?: number
  expression?: number
  /** Eye target and, for interact, palm target in local coordinates. */
  target?: ToyPoint
  /** Left is local -X, right is local +X. Both hands straddle the target. */
  hand?: 'left' | 'right' | 'both'
  /** Keep one phase origin across a walk and its stop. */
  gaitStart?: number
  phase?: number
  /** Distance traveled along a straight path per second while walking or running. */
  speed?: number
  /** Radians added to the supplied yaw by a turn performance. */
  turnAngle?: number
  /** Optional normalized mouth cue from an authored speech track. */
  speech?: number
}

type Face = {
  eyes: [number, number]
  brows: [number, number]
  tilt: [number, number]
  mouth: number
  smile: number
}

const EXPRESSIONS: Record<ToyEmotion, Face> = {
  neutral: { eyes: [0.83, 0.83], brows: [0, 0], tilt: [0.12, -0.12], mouth: 0.06, smile: 0.4 },
  surprise: { eyes: [1.18, 1.18], brows: [0.075, 0.075], tilt: [0.04, -0.04], mouth: 0.88, smile: 0 },
  joy: { eyes: [0.73, 0.73], brows: [0.024, 0.024], tilt: [0.12, -0.12], mouth: 0.45, smile: 0.95 },
  confusion: { eyes: [0.81, 1.02], brows: [-0.014, 0.062], tilt: [0.12, -0.3], mouth: 0.17, smile: -0.5 },
  fear: { eyes: [1.13, 1.13], brows: [0.055, 0.055], tilt: [-0.28, 0.28], mouth: 0.75, smile: -0.55 },
  annoyance: { eyes: [0.61, 0.65], brows: [-0.045, -0.047], tilt: [-0.52, 0.48], mouth: 0.13, smile: -0.68 },
  fatigue: { eyes: [0.38, 0.43], brows: [-0.031, -0.04], tilt: [-0.13, 0.12], mouth: 0.2, smile: -0.34 },
  delight: { eyes: [0.99, 0.99], brows: [0.058, 0.058], tilt: [0.14, -0.14], mouth: 0.72, smile: 0.96 },
  boredom: { eyes: [0.51, 0.56], brows: [-0.036, -0.035], tilt: [0.02, 0.08], mouth: 0.07, smile: -0.16 },
  suspicion: { eyes: [0.51, 0.87], brows: [-0.037, 0.018], tilt: [-0.34, -0.16], mouth: 0.12, smile: 0.2 },
  comedy: { eyes: [1.1, 0.57], brows: [0.085, -0.021], tilt: [0.22, 0.4], mouth: 0.57, smile: 0.65 },
}

const mod = (value: number, cycle: number) => ((value % cycle) + cycle) % cycle

const footCycle = (phase: number, travel: number, lift: number, stance: number) => {
  const t = mod(phase, 1)
  if (t < stance) return { z: toyMix(travel / 2, -travel / 2, t / stance), lift: 0, pitch: 0 }
  const swing = (t - stance) / (1 - stance)
  const arc = Math.sin(Math.PI * swing)
  return {
    z: toyMix(-travel / 2, travel / 2, toyEase(swing)),
    lift: lift * arc ** 1.3,
    pitch: -0.42 * arc * Math.cos(Math.PI * swing),
  }
}

const sampleFace = (
  emotion: ToyEmotion,
  blend: number,
  local: number,
  seconds: number,
  phase: number,
  action: ToyAction,
  speech?: number,
) => {
  const start = EXPRESSIONS.neutral
  const end = EXPRESSIONS[emotion]
  const blinkTime = mod(seconds + phase + 0.85, 3.43)
  const blink = blinkTime < 0.16 ? 1 - Math.sin((blinkTime / 0.16) * Math.PI) ** 1.65 : 1
  const talking = action === 'talk'
    ? (speech === undefined ? 0.13 + 0.45 * Math.sin(local * 12) ** 2 * Math.sin(local * 4.2) ** 2 : toyClamp(speech))
    : 0
  const laughing = action === 'laugh' ? 0.22 + 0.24 * Math.sin(local * 15) ** 2 : 0
  return {
    eyes: [0, 1].map(i => Math.max(0.075, toyMix(start.eyes[i], end.eyes[i], blend) * blink)) as [number, number],
    brows: [0, 1].map(i => toyMix(start.brows[i], end.brows[i], blend)) as [number, number],
    tilt: [0, 1].map(i => toyMix(start.tilt[i], end.tilt[i], blend)) as [number, number],
    mouth: toyClamp(toyMix(start.mouth, end.mouth, blend) + talking + laughing),
    smile: toyMix(start.smile, end.smile, blend),
  }
}

export const sampleToyCharacterPose = ({
  frame, fps, action = 'idle', actionStart = 0, actionDuration = fps,
  emotion = 'neutral', emotionStart, expression = 1, phase = 0,
  speed, target, hand = 'both', gaitStart = actionStart, turnAngle = Math.PI / 2, speech,
}: ToyCharacterTiming) => {
  const seconds = frame / fps
  const relative = (frame - actionStart) / fps
  const local = Math.max(0, relative)
  const progress = toyClamp((frame - actionStart) / Math.max(1, actionDuration))
  const mode = relative < 0 ? 'idle' : action
  const isRun = mode === 'run'
  const walking = mode === 'walk' || isRun
  const cycleDuration = isRun ? 0.58 : 0.96
  const cycle = Math.max(0, frame - gaitStart) / fps / cycleDuration + phase
  const gait = Math.sin(cycle * 2 * Math.PI)
  const breath = Math.sin(seconds * 2.65 + phase * 2 * Math.PI)
  const motionAmount = walking ? 1 : mode === 'stop' ? 1 - toyEase(progress * 2.1) : 0
  const stillShift = 0.026 * Math.sin(seconds * 1.7 + phase * 2 * Math.PI)
  const stance = isRun ? 0.43 : 0.62
  const travel = toyClamp((speed ?? (isRun ? 1.72 : 0.92)) * cycleDuration * stance, 0.12, 0.56)
  const lift = isRun ? 0.25 : 0.115
  const leftFoot = footCycle(cycle, travel, lift, stance)
  const rightFoot = footCycle(cycle + 0.5, travel, lift, stance)

  let rootLift = 0
  let hipY = 0.79 + 0.008 * breath - motionAmount * (0.025 + 0.022 * Math.cos(cycle * 4 * Math.PI))
  let lean = motionAmount * (isRun ? 0.24 : 0.073)
  let sway = motionAmount * 0.046 * gait + stillShift * (1 - motionAmount)
  let torsoYaw = motionAmount * gait * 0.105
  let yaw = 0
  let roll = 0
  let stretch = 1

  if (mode === 'jump') {
    const flight = toyClamp((progress - 0.24) / 0.52)
    rootLift = 4 * flight * (1 - flight) * 0.64
    const preload = Math.sin(Math.PI * toyClamp(progress / 0.24))
    const landing = Math.sin(Math.PI * toyClamp((progress - 0.76) / 0.24))
    hipY -= 0.15 * preload + 0.13 * landing
    lean += (preload + landing) * 0.23
    stretch += Math.sin(flight * Math.PI) * 0.072 - 0.1 * (preload + landing)
  }
  if (mode === 'stop') lean = 0.2 * motionAmount + toySettle(local, { amplitude: 0.23, frequency: 2.2, decay: 6 })
  if (mode === 'turn') {
    yaw = turnAngle * (toyEase((progress - 0.13) / 0.72) - 0.075 * Math.sin(Math.PI * toyClamp(progress / 0.24)))
    torsoYaw = turnAngle * 0.12 * Math.sin(Math.PI * progress * 2)
    sway -= Math.sign(turnAngle) * 0.079 * Math.sin(progress * Math.PI)
  }
  if (mode === 'interact') lean = 0.15 * toyEase(progress * 3)
  if (mode === 'surprise') {
    const windup = Math.sin(Math.PI * toyClamp(progress / 0.18))
    rootLift = 0.13 * Math.sin(Math.PI * toyClamp((progress - 0.18) / 0.45))
    lean -= 0.12 * toyEase((progress - 0.09) * 4)
    hipY -= 0.08 * windup
  }
  if (mode === 'laugh') {
    hipY -= 0.035 * Math.sin(local * 12) ** 2
    lean -= 0.085 + 0.055 * Math.sin(local * 12)
  }
  if (mode === 'fall') {
    roll = -1.39 * toyEase((progress - 0.15) / 0.58)
      + toySettle((progress - 0.73) * actionDuration / fps, { amplitude: 0.18 })
    lean = -0.15 * Math.sin(Math.PI * progress)
  }
  if (mode === 'look') torsoYaw += target ? 0.12 * Math.sign(target[0]) * toyEase(progress * 4) : 0.075

  const fallbackEmotion = mode === 'surprise' ? 'surprise' : mode === 'laugh' ? 'joy' : emotion
  const face = sampleFace(
    emotion === 'neutral' ? fallbackEmotion : emotion,
    toyClamp(expression) * (emotionStart === undefined ? 1 : toyEase((frame - emotionStart) / (fps * 0.18))),
    local, seconds, phase, mode, speech,
  )
  const gazeYaw = target ? toyClamp(Math.atan2(target[0], Math.max(0.16, target[2])), -0.74, 0.74) : 0
  const gazePitch = target ? toyClamp(Math.atan2(1.69 - target[1], Math.hypot(target[0], target[2])), -0.43, 0.42) : 0
  const headTilt = fallbackEmotion === 'confusion' ? 0.15 : fallbackEmotion === 'suspicion' ? -0.11 : 0
  const head: ToyPoint = [
    gazePitch - lean * 0.52 + 0.029 * breath,
    gazeYaw - torsoYaw * 0.5 + (mode === 'turn' ? turnAngle * 0.23 * Math.sin(progress * Math.PI) : 0),
    headTilt - sway * 1.08 + toySettle(local, { amplitude: mode === 'surprise' ? 0.14 : 0, lag: 0.13 }),
  ]

  const feet = [-1, 1].map((side, index) => {
    const f = index === 0 ? leftFoot : rightFoot
    const pivot = mode === 'turn' ? Math.max(0, Math.sin((progress * 2 - index) * Math.PI)) * 0.095 : 0
    return {
      at: [side * 0.16, 0.115 + f.lift * motionAmount + pivot, f.z * motionAmount] as ToyPoint,
      pitch: f.pitch * motionAmount,
    }
  })
  const hands = [-1, 1].map((side, index) => {
    const f = index === 0 ? rightFoot : leftFoot
    const at: ToyPoint = [
      side * (0.36 + 0.02 * breath) + sway,
      hipY - 0.076 + 0.028 * Math.abs(gait) * motionAmount,
      0.095 + f.z * motionAmount * 0.86,
    ]
    if (mode === 'gesture' || mode === 'talk') {
      const raise = toyEase(progress * 3)
      if (side === 1) {
        at[0] += 0.20 * raise
        at[1] += (0.29 + 0.075 * Math.sin(local * 7)) * raise
        at[2] += 0.22 * raise
      } else at[2] += 0.06 * raise
    }
    const reaching = hand === 'both' || hand === (side < 0 ? 'left' : 'right')
    if (mode === 'interact' && target && reaching) {
      const reach = toyEase(progress * 3.7)
      at[0] = toyMix(at[0], target[0] + (hand === 'both' ? side * 0.17 : 0), reach)
      at[1] = toyMix(at[1], target[1], reach)
      at[2] = toyMix(at[2], target[2], reach)
    }
    if (mode === 'surprise' || mode === 'jump' || mode === 'fall') {
      const raise = Math.sin(Math.PI * toyClamp(progress * 1.2))
      at[0] += side * 0.25 * raise
      at[1] += 0.65 * raise
      at[2] += 0.19 * raise
    }
    if (mode === 'laugh') {
      at[0] = side * 0.24
      at[1] += 0.20
      at[2] += 0.34
    }
    return at
  })

  return {
    rootLift, hipY, lean, sway, torsoYaw, yaw, roll, feet, hands, head, face,
    gaze: [gazeYaw * 0.058, -gazePitch * 0.07] as [number, number],
    torsoScale: toySquash(stretch),
    follow: walking ? 0.13 * Math.sin((cycle - 0.16) * 2 * Math.PI) : toySettle(local, {
      amplitude: mode === 'stop' || mode === 'turn' || mode === 'surprise' ? 0.28 : 0.02,
      lag: 0.11,
    }),
  }
}
