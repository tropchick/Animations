# Build a miniature street

Give the place a purpose that explains what people do there. A postal counter needs a public entrance, a letter slot within reach of a hand and a route between the two. Those relationships tell the audience where they are before they can read the sign.

## Block in physical scale

Use the sole of the puppet as ground zero and the shoulder span as a quick clearance gauge. In the example, +Y is up, the shops face +Z, the courier uses the near sidewalk and traffic travels along X. The curb drops roughly 0.09 units below the sidewalk. The tire radius is 0.176 units and the axle sits 0.18 units above its local ground. Place scaled vehicles by the road elevation, then rotate their wheels by distance divided by their *world-space* radius.

Compose through the actual delivery camera. Give the foreground an object that can pass the edge of frame, such as a lip of paving or a letterbox. Keep space around the hero’s outline in the middle and reserve the far layer for rhythm, scale and story. At both travel endpoints, check whether the hero appears to wear a tree, carry a chimney on their head or merge with a dark shop window. Move a tree half a trunk width or shift the camera target before altering the character’s sculpt.

## Construct a family of objects

- **Buildings.** Begin with a slightly warped plaster mass and a real roof profile. Separate the eaves, chimney cap, cornice, sill and signboard far enough to cast shadows. Let a cloth awning sag between ribs. Round its front into a scalloped hem with a little thickness in silhouette. Use a mid-distance painted pane for an interior room. Frame it in relief and paint dark ceiling values, window bars, tied curtains and a recognizable group of goods. Keep the texel scale appropriate for the nearest planned view. For a shot inside the window, build the shelf and its wares at separate depths.
- **Trees.** Overlap a leaning trunk and forks well into the crown. Arrange masses around a changing radius and height so the canopy produces gaps and a tapered silhouette. Use two neighboring greens across a crown, plus one muted accent for fruit or buds. A tree at the edge of the lens needs fewer, larger leaf shapes than a specimen that the camera orbits in close-up.
- **Vehicles.** Build the wheelbase first. Sink the passenger cabin into a softer fender volume, add a differently colored roof cap, waist molding, lights and contrasting hub. Choose a deliberate nose and tail. Make the body slightly wider over each axle to suggest wheel arches. Wheels share geometry. Tiny hub marks rotate with the distance parameter and read as wheel motion even on a solid tire.
- **Furniture.** For a bench, lay out the seat at a seated character’s knee height and check its depth from hip to knee. Splay two end supports slightly, compress the clay where they meet the ground, overlap the slats onto them and pick out only the nearest fasteners. Make the seat, back and front feet discernible as individual silhouettes at a three-quarter angle.
- **Small props.** Revolve an original profile for a letterbox or urn. Make the cylinder taper, flare its base, turn over the upper lip and draw attention to its purpose with an inset slot and raised hood. Build up a flowerpot from a tapered cup, a visible dark opening, clustered leaf pinches and a few flower heads. Use objects in little functional groups, such as a postbox and planter beside a shop threshold. Preserve clear routes for feet and deliveries.

[Reusable set pieces](../examples/street.tsx) · [Original storefront brushwork](../examples/shop-paint.ts)

## Pigment decisions

| Set | Large masses | Repeating trim | Single story accent |
| --- | --- | --- | --- |
| Warm postal town | Buff paving, apricot plaster, dusty sage | Ivory sills and desaturated teal glazing | Oxide-red letterbox |
| Rainy harbor | Blue-gray cobbles, slate roofs, moss-green doors | Pale flax boat rope and window frames | Orange buoy or scarf |
| Winter bakery | Powder blue, muted plum and oatmeal | Cream flour, frosted eaves, window liners | Cherry-red parcel ribbon |

Mix color variation *within* a parent pigment. A small variation in value across paving stones makes the pattern visible without drawing the viewer away from a face. Use the richest contrast in the action area. For distant buildings, group windows and omit isolated hardware. Make storefronts cousins through shared proportions and repeated moldings, then vary their heights, setback, roof colors and purpose. Give the widest arc of an orbit a second row of silhouettes beyond the roofline. Fog softens that row with actual depth.

## Background choreography

Pick one short independent action for each moving layer. Two cars approach the shop from opposite directions, a walker crosses the display and a resident heads toward the florist. Give each a distinct speed and initial phase. Stage a gap in traffic during the story beat so a passing roof cannot conceal a hand gesture. For a looping shot, hide route resets behind the edge of the frustum or a building. Sample vehicle translation and wheel rotation from the same time. Sample the pedestrian’s feet and torso together. When scaling a car, express the travel distance in its local units before passing it to the wheel rig.

```tsx
// Inside ThreeCanvas. t is sampled pose time, d is signed WORLD travel distance.
const d = 0.72 * t;
const modelScale = 0.82;
return <>
  <ClayGround seed={31} width={18} />
  <ClayBuilding shop="bakery" width={3.6} height={3.5} position={[0, 0, -5]} />
  <ClayTree position={[-2.5, 0, -4.1]} seed={12} scale={0.85} />
  <ClayCar position={[-3 + d, -0.092, -2.3]} distance={d / modelScale} scale={modelScale} />
</>;
```

## CPU rendering

Group static layout outside the animated puppet subtree. The example renders its paving in a single instanced mesh with a color per stone. The muted rear houses use draft geometry even at final output size. Painterly detail in the shop glass comes from locally drawn, opaque, mipmapped textures. They are allocated on mount and are independent of pose and camera time. A shadow-casting awning has substantially more visual impact here than a separately modeled handle on every cupboard behind the glass. Check the decision again if a new camera approaches the cupboards.
