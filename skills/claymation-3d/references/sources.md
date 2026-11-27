# Research and design decisions

The project lockfile pins Three.js 0.186.1, React Three Fiber 9.8.2, React 19.3.1 and the Remotion packages at 4.0.538. The example uses the existing renderer and native Three.js materials. The craft references below informed original procedural designs.

| Source | Application |
| --- | --- |
| [Remotion, ThreeCanvas](https://www.remotion.dev/docs/three-canvas) and [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame) | Specify the canvas dimensions from the composition. Derive seconds from the frame at the composition boundary. A nested Sequence has a local frame origin. |
| [Three.js, MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html) | Roughness controls the width of reflections. A bump map changes shading without altering the outline. Build silhouette dents into geometry. |
| [Three.js, shadows](https://threejs.org/docs/pages/DirectionalLightShadow.html) | Bound the directional-light shadow camera around the performance area. Spend the shadow-map resolution on the puppet and nearby set. |
| [R3F, scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) | Share surface resources and instance repeated set dressing. Keep the demand-rendered Remotion clock for export. |
| [MPC artists on digital plasticine in Wallace & Gromit](https://www.cgw.com/Publications/CGW/2005/Volume-28-Issue-10-October-2005-/Cracking-Clay.aspx) | Preserve puppet volume, keep thumb impressions associated with handling, and give the closest shots finer detail. Check secondary shapes across successive exposures. |
| [Animation director Will Becher on staging and scale](https://www.postmagazine.com/publications/2024/november-december-2024/animation-wallace-gromit-vengeance-most-fowl/) | Judge the hand, eyes and featured prop in both the establishing shot and the portrait. Oversize acting features deliberately. |
| [American Cinematographer on lighting miniature sets](https://theasc.com/article/wallace-gromit-vengeance-most-fowl/) | Design the direction of light and camera movement around the story beat, preserving a sense of physical space as shot size changes. |
