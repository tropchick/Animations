export type ToyMotionProfile = {
  /** Seconds occupied by the first ballistic bounce. */
  airtime: number
  /** Height of the first bounce in scene units. */
  height: number
  /** Ratio of consecutive flight times. */
  restitution: number
  /** Maximum displayed bounce count. */
  bounces: number
  /** Fractional vertical compression at first contact. */
  squash: number
  /** Seconds for contact compression to recover. */
  contact: number
}

export const TOY_MOTION = {
  coin: { airtime: 0.23, height: 0.17, restitution: 0.56, bounces: 4, squash: 0.015, contact: 0.053 },
  silicone: { airtime: 0.36, height: 0.27, restitution: 0.48, bounces: 3, squash: 0.22, contact: 0.095 },
  cardboard: { airtime: 0.13, height: 0.047, restitution: 0.37, bounces: 2, squash: 0.065, contact: 0.083 },
  stone: { airtime: 0.09, height: 0.023, restitution: 0.25, bounces: 2, squash: 0, contact: 0.05 },
  fabric: { airtime: 0.16, height: 0.045, restitution: 0.32, bounces: 2, squash: 0.12, contact: 0.14 },
} as const satisfies Record<string, ToyMotionProfile>

export const toyClamp = (value: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, value))
export const toyMix = (start: number, end: number, progress: number) => start + (end - start) * progress
export const toyEase = (progress: number) => {
  const t = toyClamp(progress)
  return t * t * (3 - 2 * t)
}

/** Preserve volume under deformation. Anchor the contact pivot before scaling. */
export const toySquash = (
  stretch: number,
  axis: 0 | 1 | 2 = 1,
): [number, number, number] => {
  const along = Math.max(0.18, stretch)
  const across = 1 / Math.sqrt(along)
  const result: [number, number, number] = [across, across, across]
  result[axis] = along
  return result
}

/** Sample an authored impact. At every bounce connection the contact height is zero. */
export const toyImpact = (seconds: number, profile: ToyMotionProfile = TOY_MOTION.coin) => {
  if (seconds < 0) return { height: 0, scale: toySquash(1), bounce: -1 }
  let local = seconds
  let duration = profile.airtime
  let height = profile.height
  let strength = 1

  for (let bounce = 0; bounce <= profile.bounces; bounce++) {
    const lastContact = bounce === profile.bounces || duration <= 0
    if (lastContact || local < duration) {
      const flight = lastContact ? 0 : local / duration
      const contactWindow = lastContact ? profile.contact : Math.min(profile.contact, duration * 0.46)
      const compression = contactWindow > 0
        ? profile.squash * strength * (1 - toyEase(local / contactWindow))
        : 0
      // The first part of the parabola ramps in while the contact deforms.
      const lift = contactWindow > 0 ? toyEase(local / contactWindow) : 1
      return { height: 4 * height * flight * (1 - flight) * lift, scale: toySquash(1 - compression), bounce }
    }
    local -= duration
    duration *= profile.restitution
    height *= profile.restitution ** 2
    strength *= profile.restitution
  }
  return { height: 0, scale: toySquash(1), bounce: -1 }
}

/** Signed follow-through in radians or scene units, sampled from a frame offset in seconds. */
export const toySettle = (
  seconds: number,
  { amplitude = 0.12, frequency = 3, decay = 7, lag = 0 }: {
    amplitude?: number
    frequency?: number
    decay?: number
    lag?: number
  } = {},
) => {
  const local = seconds - lag
  if (local <= 0) return 0
  return amplitude * Math.sin(local * 2 * Math.PI * frequency) * Math.exp(-local * decay)
}

/** Compress before release, then settle after opening. All inputs are authored seconds/radians. */
export const toyHinge = (
  seconds: number,
  { angle = 1.4, windup = 0.17, opening = 0.23, anticipation = 0.08, rebound = 0.17 }: {
    angle?: number
    windup?: number
    opening?: number
    anticipation?: number
    rebound?: number
  } = {},
) => {
  if (seconds < 0) return 0
  if (seconds < windup) return -anticipation * toyEase(seconds / windup)
  if (seconds < windup + opening) {
    return toyMix(-anticipation, angle, toyEase((seconds - windup) / opening))
  }
  return angle + toySettle(seconds - windup - opening, { amplitude: rebound })
}
