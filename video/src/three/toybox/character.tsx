import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import {
  BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Euler, Float32BufferAttribute, LatheGeometry, Quaternion,
  Sphere, SphereGeometry, Vector2, Vector3,
} from 'three'
import { ToyBox } from './geometry'
import { ToyMaterial } from './materials'
import { sampleToyCharacterPose, type ToyCharacterTiming, type ToyPoint } from './character-pose'

export { sampleToyCharacterPose } from './character-pose'
export type { ToyAction, ToyCharacterTiming, ToyEmotion, ToyPoint } from './character-pose'

type Surface = 'mattePlastic' | 'glossyPlastic' | 'rubber' | 'silicone' | 'paintedWood' | 'metal' | 'fabric'

export type ToyCharacterConfig = {
  skin: string
  hair: string
  hairStyle: 'bob' | 'quiff' | 'cap' | 'tufts' | 'bald'
  clothing: 'apron' | 'jacket' | 'vest'
  top: string
  pants: string
  shoes: string
  accent: string
  iris: string
  accessory?: 'badge' | 'satchel' | 'glasses'
  /** Head width multiplier. Use 0.86–1.14 for families in the same cast. */
  headWidth?: number
  /** Adds variety to cycles and blinks. Measured in cycles for gait. */
  phase?: number
}

export const TOY_CAST = {
  vendor: {
    skin: '#E6A475', hair: '#763044', hairStyle: 'bob', clothing: 'apron',
    top: '#257A93', pants: '#473C57', shoes: '#713845', accent: '#FFD36E',
    iris: '#7B593A', accessory: 'badge', headWidth: 1.05, phase: 0.12,
  },
  courier: {
    skin: '#A1664E', hair: '#302A49', hairStyle: 'quiff', clothing: 'jacket',
    top: '#FF9971', pants: '#473A63', shoes: '#2A7771', accent: '#E7F3BA',
    iris: '#3D675B', accessory: 'satchel', headWidth: 0.92, phase: 0.49,
  },
  neighbor: {
    skin: '#F0BA91', hair: '#5C4C77', hairStyle: 'cap', clothing: 'vest',
    top: '#41698C', pants: '#453552', shoes: '#4A625B', accent: '#BFB4F5',
    iris: '#5C5D83', accessory: 'glasses', headWidth: 1, phase: 0.71,
  },
} as const satisfies Record<string, ToyCharacterConfig>

const sphere = new SphereGeometry(1, 18, 12)
const smallSphere = new SphereGeometry(1, 12, 8)
const RIGHT = new Vector3(1, 0, 0)
const FORWARD = new Vector3(0, 0, 1)
const DOWN = new Vector3(0, -1, 0)
const INK = '#2A1C2C'
const EGG = '#FFF4DF'

const mouldProfile = Array.from({ length: 25 }, (_, i) => {
  const arc = (i / 24 - 0.5) * Math.PI
  const height = Math.sin(arc)
  const width = Math.cos(arc) * (0.495 - 0.075 * height + 0.011 * Math.sin(arc * 3))
  return new Vector2(width, height * 0.415)
})
const headShell = new LatheGeometry(mouldProfile, 36)

const mouthGeometry = () => {
  const geometry = new BufferGeometry()
  const points = [0, 0, 0]
  const smile = [0, 0, 0]
  const frown = [0, 0, 0]
  const indices: number[] = []
  const count = 22
  for (let i = 0; i < count; i++) {
    const t = i / count * Math.PI * 2
    const x = Math.cos(t)
    const y = Math.sin(t) * 0.63
    const depth = -0.018 * x ** 2
    const corner = 0.44 * x ** 2
    points.push(x, y, depth)
    smile.push(x, y + corner, depth)
    frown.push(x, y - corner, depth)
    indices.push(0, i + 1, (i + 1) % count + 1)
  }
  geometry.setIndex(indices)
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  geometry.morphAttributes.position = [
    new Float32BufferAttribute(smile, 3), new Float32BufferAttribute(frown, 3),
  ]
  geometry.computeVertexNormals()
  return geometry
}
const mouth = mouthGeometry()

const Oval = ({ at = [0, 0, 0], size, rotation, color, kind = 'mattePlastic', low, shadow = false }: {
  at?: ToyPoint
  size: ToyPoint
  rotation?: ToyPoint
  color: string
  kind?: Surface
  low?: boolean
  shadow?: boolean
}) => (
  <mesh geometry={low ? smallSphere : sphere} position={at} scale={size} rotation={rotation} castShadow={shadow}>
    <ToyMaterial kind={kind} color={color} quality="preview" />
  </mesh>
)

type Pose = ReturnType<typeof sampleToyCharacterPose>

const ToyFace = ({ config, pose, detailed }: { config: ToyCharacterConfig; pose: Pose; detailed: boolean }) => {
  const face = pose.face
  const mouthWidth = 0.16 - 0.058 * face.mouth + 0.05 * Math.max(0, face.smile)
  const mouthHeight = 0.035 + 0.134 * face.mouth
  const blush = '#' + new Color(config.skin).lerp(new Color('#D16768'), 0.28).getHexString()
  return (
    <>
      {[-1, 1].map((side, i) => (
        <group key={side} position={[side * 0.169, 0.077, 0.385]} rotation={[0, side * 0.22, 0]}>
          {detailed && <Oval size={[0.108, 0.139, 0.035]} color={config.skin} kind="rubber" at={[0, -0.003, -0.014]} />}
          <group scale={[1, face.eyes[i], 1]}>
            <Oval size={[0.088, 0.11, 0.048]} color={EGG} low={!detailed} />
            <Oval at={[pose.gaze[0], pose.gaze[1], 0.038]} size={[0.047, 0.058, 0.022]} color={config.iris} low={!detailed} />
            <Oval at={[pose.gaze[0], pose.gaze[1], 0.056]} size={[0.027, 0.037, 0.011]} color={INK} low={!detailed} />
            {detailed && <Oval at={[pose.gaze[0] - 0.011, pose.gaze[1] + 0.019, 0.065]}
              size={[0.011, 0.013, 0.005]} color="#FFFFFF" low />}
          </group>
          {detailed && <Oval at={[0, 0.148 + face.brows[i], -0.081 - face.brows[i] * 0.82]}
            rotation={[0, 0, face.tilt[i]]} size={[0.107, 0.026, 0.028]} color={config.hair} kind="rubber" />}
          {detailed && config.accessory === 'glasses' && (
            <mesh position={[0, 0.007, 0.057]}>
              <torusGeometry args={[0.111, 0.011, 7, 22]} />
              <ToyMaterial kind="mattePlastic" color={config.hair} quality="preview" />
            </mesh>
          )}
        </group>
      ))}
      <Oval at={[0.012, -0.057, 0.408]} size={[0.076, 0.053, 0.08]} color={config.skin} />
      {detailed && config.accessory === 'glasses' &&
        <Oval at={[0, 0.09, 0.426]} size={[0.068, 0.011, 0.01]} color={config.hair} />}
      {detailed && [-1, 1].map(side => (
        <Oval key={side} at={[side * 0.295, -0.095, 0.325]} rotation={[0, side * 0.63, 0]}
          size={[0.051, 0.024, 0.009]} color={blush} kind="mattePlastic" />
      ))}
      <mesh geometry={mouth} position={[0.012, -0.177, 0.420]} scale={[mouthWidth, mouthHeight, 1]}
        morphTargetInfluences={[Math.max(0, face.smile), Math.max(0, -face.smile)]}>
        <ToyMaterial kind="rubber" color={INK} quality="preview" />
      </mesh>
      {face.mouth > 0.25 && face.smile > 0.2 && (
        <Oval at={[0.012, -0.177 + mouthHeight * 0.37, 0.423]}
          size={[mouthWidth * 0.64, 0.015 + 0.007 * face.mouth, 0.003]} color={EGG} low />
      )}
      {detailed && face.mouth > 0.52 && (
        <Oval at={[0.017, -0.177 - mouthHeight * 0.37, 0.423]}
          size={[mouthWidth * 0.48, 0.019 * face.mouth, 0.003]} color="#E57076" low />
      )}
    </>
  )
}

const Hair = ({ config, pose, detailed }: { config: ToyCharacterConfig; pose: Pose; detailed: boolean }) => {
  const color = config.hair
  switch (config.hairStyle) {
    case 'bob':
      return (
        <>
          <Oval at={[0, 0.095, -0.116]} size={[0.494, 0.393, 0.31]} color={color} shadow={detailed} />
          {[-1, 1].map(side => <Oval key={side} at={[side * 0.422, -0.043, -0.021]}
            rotation={[0, 0, -side * 0.3]} size={[0.121, 0.29, 0.202]} color={color} />)}
          <group rotation={[0, 0, 0.22 + 0.14 * pose.follow]}>
            <Oval at={[-0.068, 0.364, 0.177]} size={[0.398, 0.129, 0.235]} color={color} />
            {detailed && <Oval at={[0.16, 0.365, 0.251]} rotation={[0, 0, -0.47]}
              size={[0.189, 0.079, 0.127]} color={color} />}
          </group>
        </>
      )
    case 'quiff':
      return (
        <>
          <Oval at={[0, 0.19, -0.133]} size={[0.458, 0.279, 0.316]} color={color} shadow={detailed} />
          <group rotation={[0, 0, -0.17 + pose.follow]}>
            <Oval at={[-0.07, 0.369, 0.146]} rotation={[0.25, 0.1, 0.44]}
              size={[0.342, 0.201, 0.227]} color={color} />
            {detailed && <Oval at={[0.209, 0.386, 0.218]} rotation={[0.14, -0.29, 0.33]}
              size={[0.159, 0.105, 0.132]} color={color} />}
          </group>
        </>
      )
    case 'cap':
      return (
        <>
          <Oval at={[0, 0.27, -0.017]} rotation={[0.09, 0, -0.08]}
            size={[0.464, 0.195, 0.373]} color={color} kind="fabric" shadow={detailed} />
          <Oval at={[0.011, 0.286, 0.311]} rotation={[-0.21, 0, -0.08]}
            size={[0.41, 0.04, 0.312]} color={color} kind="fabric" />
          {detailed && <Oval at={[0.015, 0.427, -0.018]} size={[0.05, 0.05, 0.049]} color={config.accent} />}
        </>
      )
    case 'tufts':
      return <>
        <Oval at={[0.038, 0.2, -0.12]} size={[0.43, 0.29, 0.29]} color={color} />
        {[-1, 0, 1].map((part) => <Oval key={part} at={[0.18 * part, 0.35 + 0.04 * (1 - Math.abs(part)), 0.15]}
          rotation={[0, 0, 0.5 * part + pose.follow]} size={[0.15, 0.16, 0.17]} color={color} />)}
      </>
    case 'bald':
      return null
  }
}

const JacketDetails = ({ config, follow }: { config: ToyCharacterConfig; follow: number }) => {
  const { accent, top, pants } = config
  return (
    <>
      {config.clothing === 'apron' ? (
        <>
          <ToyBox position={[0, 0.278, 0.21]} size={[0.42, 0.36, 0.071]} radius={0.052} rotation={[0.04, 0, 0]} quality="preview">
            <ToyMaterial kind="fabric" color={accent} quality="preview" />
          </ToyBox>
          <ToyBox position={[0.064, 0.204, 0.252]} size={[0.20, 0.119, 0.032]} radius={0.019} quality="preview">
            <ToyMaterial kind="fabric" color={top} quality="preview" />
          </ToyBox>
          {[-1, 1].map(side => <Oval key={side} at={[side * 0.13, 0.445, 0.178]} rotation={[0.24, 0, side * 0.27]}
            size={[0.035, 0.123, 0.038]} color={accent} kind="fabric" low />)}
        </>
      ) : (
        <>
          <Oval at={[0, 0.253, 0.226]} size={[0.013, 0.236, 0.018]} color={pants} kind="rubber" />
          <Oval at={[0.005, 0.383, 0.244]} size={[0.026, 0.04, 0.026]} color={accent} kind="metal" />
          {[-1, 1].map(side => <Oval key={side} at={[side * 0.111, 0.463, 0.143]} rotation={[-0.34, 0, -side * 0.65]}
            size={[0.068, 0.09, 0.071]} color={accent} kind="fabric" />)}
        </>
      )}
      {config.accessory === 'badge' && (
        <group position={[-0.165, 0.387, 0.248]} rotation={[0.01, -0.11, 0.10]}>
          <Oval size={[0.049, 0.049, 0.012]} color={pants} kind="rubber" />
          <Oval at={[0, 0, 0.012]} size={[0.025, 0.025, 0.008]} color="#FFF3D5" />
        </group>
      )}
      {config.accessory === 'satchel' && <>
        <Oval at={[0.008, 0.279, 0.225]} rotation={[0, 0, -0.69]} size={[0.041, 0.267, 0.034]} color={pants} kind="fabric" />
        <group position={[0.309, 0.135, 0.152]} rotation={[0.22 * follow, 0, 0.13 + follow]}>
          <ToyBox size={[0.235, 0.21, 0.14]} radius={0.047} quality="preview">
            <ToyMaterial kind="fabric" color={pants} quality="preview" />
          </ToyBox>
          <ToyBox position={[0, 0.031, 0.064]} size={[0.238, 0.144, 0.043]} radius={0.02} quality="preview">
            <ToyMaterial kind="mattePlastic" color={accent} quality="preview" />
          </ToyBox>
        </group>
      </>}
    </>
  )
}

type JointSolution = { root: Vector3; middle: Vector3; end: Vector3 }

const twoLink = (root: Vector3, goal: ToyPoint, pole: Vector3, upper: number, lower: number): JointSolution => {
  const direction = new Vector3(...goal).sub(root)
  const distance = Math.min(upper + lower - 0.0001, Math.max(Math.abs(upper - lower) + 0.0001, direction.length()))
  if (direction.lengthSq() < 0.000001) direction.copy(DOWN)
  direction.normalize()
  const bend = pole.addScaledVector(direction, -pole.dot(direction))
  if (bend.lengthSq() < 0.00001) {
    bend.copy(Math.abs(direction.x) > 0.95 ? FORWARD : RIGHT)
    bend.addScaledVector(direction, -bend.dot(direction))
  }
  bend.normalize()
  const along = (upper ** 2 + distance ** 2 - lower ** 2) / (2 * distance)
  const rise = Math.sqrt(Math.max(0, upper ** 2 - along ** 2))
  return {
    root,
    middle: root.clone().addScaledVector(direction, along).addScaledVector(bend, rise),
    end: root.clone().addScaledVector(direction, distance),
  }
}

const SLEEVE_RINGS = 7
const ARM_WIDTHS = [0.107, 0.104, 0.091, 0.085, 0.083, 0.079, 0.071]
const LEG_WIDTHS = [0.134, 0.129, 0.11, 0.103, 0.097, 0.088, 0.078]

function sleeveGeometry(sides: number) {
  const geometry = new BufferGeometry()
  const line = sides + 1
  const count = SLEEVE_RINGS * line
  const uv = new Float32Array(count * 2)
  const indices: number[] = []
  for (let ring = 0; ring < SLEEVE_RINGS; ring++) {
    for (let j = 0; j <= sides; j++) {
      const i = ring * line + j
      uv[i * 2] = j / sides
      uv[i * 2 + 1] = ring / (SLEEVE_RINGS - 1)
      if (j < sides && ring < SLEEVE_RINGS - 1) {
        indices.push(i, i + 1, i + line, i + 1, i + line + 1, i + line)
      }
    }
  }
  geometry.setIndex(indices)
  geometry.boundingSphere = new Sphere(new Vector3(0, 0.78, 0), 1.3)
  geometry.setAttribute('uv', new BufferAttribute(uv, 2))
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage))
  return geometry
}

/** Sweep one tapered section through both joints to keep the silhouette continuous. */
const Sleeve = ({ joint, widths, color, detailed }: {
  joint: JointSolution
  widths: number[]
  color: string
  detailed: boolean
}) => {
  const sides = detailed ? 12 : 7
  const geometry = useMemo(() => sleeveGeometry(sides), [sides])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => {
    const centers = [
      joint.root,
      joint.root.clone().lerp(joint.middle, 0.36),
      joint.root.clone().lerp(joint.middle, 0.77),
      joint.middle,
      joint.middle.clone().lerp(joint.end, 0.24),
      joint.middle.clone().lerp(joint.end, 0.66),
      joint.end,
    ]
    const position = geometry.getAttribute('position')
    const normal = geometry.getAttribute('normal')
    const tangent = new Vector3()
    const axis = new Vector3()
    const binormal = new Vector3()
    const radial = new Vector3()
    for (let ring = 0; ring < centers.length; ring++) {
      tangent.subVectors(centers[Math.min(ring + 1, centers.length - 1)], centers[Math.max(0, ring - 1)]).normalize()
      axis.copy(Math.abs(tangent.x) > 0.95 ? FORWARD : RIGHT)
      axis.addScaledVector(tangent, -axis.dot(tangent)).normalize()
      binormal.crossVectors(tangent, axis)
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * Math.PI * 2
        const index = ring * (sides + 1) + j
        radial.copy(axis).multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle))
        normal.setXYZ(index, radial.x, radial.y, radial.z)
        radial.multiplyScalar(widths[ring]).add(centers[ring])
        position.setXYZ(index, radial.x, radial.y, radial.z)
      }
    }
    position.needsUpdate = true
    normal.needsUpdate = true
  }, [geometry, joint, sides, widths])
  return (
    <mesh geometry={geometry}>
      <ToyMaterial kind="fabric" color={color} quality="preview" />
    </mesh>
  )
}

const ToyCharacterRig = ({ config, pose, detailed, children }: {
  config: ToyCharacterConfig
  pose: Pose
  detailed: boolean
  children: ReactNode
}) => {
  const pelvis = new Vector3(pose.sway, pose.hipY, 0)
  const torsoRotation = new Euler(pose.lean, pose.torsoYaw, -pose.sway * 1.5)
  const arms = [-1, 1].map((side, i) => {
    const grip = twoLink(
      new Vector3(side * 0.32, 0.384, 0.008).applyEuler(torsoRotation).add(pelvis), pose.hands[i],
      new Vector3(side * 0.83, -0.18, -0.61), 0.273, 0.319,
    )
    // The pose goal is at the center of the palm. End the sleeve one cuff behind it.
    return { ...grip, end: grip.end.clone().lerp(grip.middle, 0.215) }
  })
  const feet = [-1, 1].map((side, i) => twoLink(
    new Vector3(side * 0.157, -0.032, 0).applyEuler(torsoRotation).add(pelvis), pose.feet[i].at,
    new Vector3(side * 0.13, 0.13, 1), 0.349, 0.352,
  ))
  return (
    <>
      {feet.map((leg, i) => (
        <group key={i}>
          <Sleeve joint={leg} widths={LEG_WIDTHS} color={config.pants} detailed={detailed} />
          <group position={leg.end} rotation={[pose.feet[i].pitch, i === 0 ? -0.08 : 0.08, 0]}>
            <ToyBox size={[0.243, 0.171, 0.393]} radius={0.066} position={[0, -0.003, 0.069]} quality="preview">
              <ToyMaterial kind="rubber" color={config.shoes} quality="preview" />
            </ToyBox>
            <ToyBox size={[0.247, 0.057, 0.398]} radius={0.023} position={[0, -0.0865, 0.069]} quality="preview">
              <ToyMaterial kind="rubber" color={detailed ? EGG : config.shoes} quality="preview" />
            </ToyBox>
            {detailed && <Oval at={[0, 0.073, 0.115]} size={[0.089, 0.014, 0.028]} color={config.accent} low />}
          </group>
        </group>
      ))}
      <group position={pelvis} rotation={torsoRotation}>
        <group scale={pose.torsoScale}>
          <Oval at={[0, 0.166, 0.002]} size={[0.322, 0.245, 0.212]} color={config.pants} kind="fabric" low={!detailed} />
          <Oval at={[0, 0.293, 0.007]} size={[0.34, 0.281, 0.224]} color={config.top} kind="fabric" shadow={detailed} />
          {detailed && <JacketDetails config={config} follow={pose.follow} />}
          <Oval at={[0, 0.535, 0.035]} size={[0.11, 0.105, 0.105]} color={config.skin} low />
          <group position={[0, 0.866, 0.041]} rotation={pose.head}>{children}</group>
        </group>
      </group>
      {arms.map((arm, i) => (
        <group key={i}>
          <Sleeve joint={arm} widths={ARM_WIDTHS} color={config.top} detailed={detailed} />
          <Oval at={arm.root.toArray()} size={[0.112, 0.105, 0.106]} color={config.top} kind="fabric" low={!detailed} />
          <group position={arm.end}
            quaternion={new Quaternion().setFromUnitVectors(DOWN, arm.end.clone().sub(arm.middle).normalize())}>
            <Oval at={[0, 0.012, 0]} size={[0.086, 0.042, 0.076]} color={config.accent} kind="fabric" low={!detailed} />
            <Oval at={[0, -0.0686, 0.006]} size={[0.081, 0.107, 0.069]} color={config.skin} low={!detailed} />
            {detailed && <Oval at={[(i === 0 ? 1 : -1) * 0.067, -0.048, 0.034]}
              size={[0.035, 0.059, 0.033]} color={config.skin} low />}
          </group>
        </group>
      ))}
    </>
  )
}

export type ToyCharacterProps = ToyCharacterTiming & {
  config?: Partial<ToyCharacterConfig>
  /** Ground position. Orientation is +Z before yaw. */
  position?: ToyPoint
  yaw?: number
  scale?: number
  detail?: 'hero' | 'background'
}

export const ToyCharacter = ({
  config = TOY_CAST.vendor, position = [0, 0, 0], yaw = 0, scale = 1, detail = 'hero', ...timing
}: ToyCharacterProps) => {
  const appearance = { ...TOY_CAST.vendor, ...config }
  const pose = sampleToyCharacterPose({ ...timing, phase: timing.phase ?? appearance.phase })
  const detailed = detail === 'hero'
  return (
    <group position={position} rotation={[0, yaw + pose.yaw, 0]} scale={scale}>
      <group position={[pose.roll * 0.24, pose.rootLift, 0]} rotation={[0, 0, pose.roll]}>
        <ToyCharacterRig config={appearance} pose={pose} detailed={detailed}>
          <group scale={[appearance.headWidth, 1, 1]}>
            <mesh geometry={headShell} scale={[1, 1, 0.82]} castShadow={detailed}>
              <ToyMaterial kind="mattePlastic" color={appearance.skin} quality="preview" />
            </mesh>
            {[-1, 1].map(side => <Oval key={side} at={[side * 0.453, -0.063, 0.004]}
              size={[0.087, 0.129, 0.084]} rotation={[0, 0, side * -0.32]} color={appearance.skin} low={!detailed} />)}
            <ToyFace config={appearance} pose={pose} detailed={detailed} />
            <Hair config={appearance} pose={pose} detailed={detailed} />
          </group>
        </ToyCharacterRig>
      </group>
    </group>
  )
}
