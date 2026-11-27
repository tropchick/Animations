# Sculpting and moving a puppet

## Build outward from the armature

Use a consistent puppet axis. [The courier](../examples/character.tsx) faces +Z, stands on y=0, and looks out from y≈1.52. The hat reaches y≈1.96. Scale an enclosing group to change height. Use the eye height and shoe length to size doorways, kerbs and counters throughout the set.

Block the pelvis, rib cage and skull as three different masses. Check the side view before adding eyes. Give the head a slimmer crown, broad jaw, offset nose and ears that extend beyond the cheeks. Let the coat hang over the hips and the boot tongue tuck beneath the trouser cuff. Overlap pieces at joints through the full range of motion. Check the elbow and knee in the raised pose especially.

Build expressions in layers. Seat the eye whites inside a compressed warm-coloured rim. Angle the sockets around the skull, slide both pupils together and pin a small light-coloured clay speck to each pupil. Flatten the complete eye assembly for a blink. Preserve a closed line at full compression. Place brows on their own tilted arcs and allow one to peak earlier. Tint cheeks near the skin tone and place two or three press marks within one patch. Test the mouth at three-quarter view before extracting its groove or applying a thin clay cord.

Sculpt hair in broad locks with a pinched tip or use a dark hairline below a cap. For a woven garment, repeat shallow ribs around the turned brim and press wider folds into the crown. The example varies radius around one closed lathe profile, so the stitches follow its edge even from below. Use a different profile, e.g. a hood, braids or earmuffs, when designing another lead. Put contrasting cuffs, buttons, a zip pull or a repair patch beside a broad area of uninterrupted clay. For background puppets, change coat, cap, cheek and skin colours together and use `detail="extra"` to omit small accessories and close-up facial details.

## Plant a foot in world space

Each foot has a contact interval, a passing pose and a swing. Supply the **cumulative path length** in puppet-local units. For an externally scaled puppet, divide world distance by its uniform scale first. Orient +Z to the path tangent. Sample its distance and pose from the same character time.

```tsx
const legPhase = distance / CLAY_STRIDE.walk;
<group position={[0, 0, distance]}>
  <ClayCharacter gait="walk" time={t} phase={legPhase} palette={{coat: '#637c8b'}}/>
</group>
```

`ClayWalkCycle(phase)` and `ClayRunCycle(phase)` return one foot's local `{z, lift, pitch}`. Offset the other by half a cycle. Strides are 0.78 and 1.10 units per pair of steps. During stance, local z decreases linearly with distance, cancelling root translation. Walk uses 61% stance so there is an overlap of both feet. Run uses 37%, producing airborne intervals. During swing the cubic interpolant matches stance velocity at each end. Lift peaks at mid-swing and returns to zero before the next support. Two-segment knee placement follows the ankle target; hips bob independently. On a tight turn, use independent world-space planted targets and swivel each foot on toe-off. The stride sampler assumes locally straight, level ground.

Arms counter the legs. Shift some weight toward the support leg and let the head resist torso twist. Give the hat, bag or hanging sleeve a later peak than the torso. For an arrival, ease **distance** to its endpoint so phase slows with it. Choose an endpoint in double support (walk phase modulo one in [0, 0.11] or [0.5, 0.61]). With an explicit phase, the foot targets follow distance even as `motion` fades the upper-body swing toward zero. To hold a staggered stance, keep passing the final phase. With automatic in-place cycling, `motion` fades both legs and torso.

## Direct the performance in beats

| Beat | Director's controls | Silhouette to review |
| --- | --- | --- |
| Notice | Move gaze first. Pause the stride or finish the planted step. | Pupils clear the inner rim in each eye. |
| Anticipate | Let the head turn partway toward the target, compress at the hips or counter-rotate the reaching arm. | Head and leading mitten separate from the chest. |
| React | Raise `reaction` over a few exposures, widen the eyes, lift one brow, open the mouth and raise the receiving mitten. | Hand clears the cheek in profile. |
| Settle | Let the face return to a smile and hold the hand with a separate `reach` value. Allow the satchel to settle after the body. | Final pose holds long enough for the audience to read it. |

The example keeps squash local to the upper assembly. For a vertical stretch factor s, scale width and depth by 1/√s to preserve volume. Offset the group's y by (1−s) times hip height so the soles stay on the ground. Starting amplitudes of 1–3% work for breathing and weight transfer. Use a stronger accent for a jump or a recoil. Drive secondary response using a delayed copy of the driving curve evaluated at a known earlier time. This makes an out-of-order seek behave like sequential playback.

## Change timing without changing the sculpt

Use [the two clocks](../examples/timing.ts). Smooth mode samples the continuous curves at output-frame time. Stop-motion mode samples all character channels once per exposure at 12 Hz. At 30 fps, frame indices 0–2 show the first pose, 3–4 the next, and 5–7 the next. Preserve the asset seed across all exposures. Apply a sub-percent, exposure-keyed change in cheek or coat scale to suggest refitting clay. Check the eye sockets, mouth and hat seam at maximum deformation. For a smooth dolly through held character poses, use the unquantized camera clock.

To review a gait, place a visible ground joint beside a contact foot. Inspect the frames before, during and after that foot's entire support interval with a stationary camera. Inspect the entire stride from the side and both three-quarter views. Check the raised arm clears collars and straps throughout the transition. Compare the face at neutral, peak and settle at the intended delivery size.

For production context, animation director Will Becher discusses staging miniature characters for wide shots and facial close-ups. [Post Magazine interview](https://www.postmagazine.com/publications/2024/november-december-2024/animation-wallace-gromit-vengeance-most-fowl/)
