# Avatar customization notes

3D hero character (`src/components/Character/`) cloned from a tutorial template,
customized to be unique. Mesh appearance is independent of animation — the baked
clips ride the skeleton, so recoloring/hiding meshes and attaching code-built
accessories never breaks the motion.

## Gotcha: three.js strips dots from GLB node names
Blender names like `CAP.001`, `Face.002`, `Ear.001`, `BODY.SHIRT` import as
`CAP001`, `Face002`, `Ear001`, and the body-shirt splits into child meshes
`Cube006` / `Cube006_1`. So `colorByMesh` keys with dots (`"Face.002"`,
`"Ear.001"`, `"BODY.SHIRT"`) do NOT match at runtime and silently don't recolor.
Keys without dots (`"Hair"`, `"Pant"`, `"Hand"`, `"Neck"`) DO match.

## Cap → hair swap (character.ts)
The model ships a `Hair` mesh hidden UNDER `CAP001` + `CAP002`. Swap = hide the
caps (`mesh.name.startsWith("CAP") → visible=false`); the `Hair` mesh shows and
the exact-match `"Hair": "#1a1a1a"` recolor makes it black. No geometry built.
To list runtime mesh names, use a DEV `[character meshes]` console dump.

## Glasses + headphones (glasses.ts, headphones.ts)
Code-built, attached to bones via `bone.attach(group)` (preserves world
transform): glasses → head bone `spine006` (tracks head-look), headphones →
neck bone `spine005` (body-only). Placement is self-measured from the model at
runtime (eye center, face-front Z, ear centroids, neck center) rather than
hardcoded, so it stays correct in pose. Live-tune in DEV via
`window.__glassesTune({...})` / `__headphonesTune({...})`; inspect geometry via
`__glassesInfo()` / `__headphonesInfo()`. TUNE objects at the top of each file.

## Verifying visually
rAF screenshots time out when the Claude window is minimized/hidden — bring the
window forward first, then the built-in browser `computer` screenshot + `zoom`
works.
