import * as THREE from "three";

/**
 * Builds glasses in code and attaches them to the head bone (spine006) so they
 * track the face through animations and mouse head-rotation.
 *
 * Placement is anchored to the measured EYE-mesh center (robust, pose-correct),
 * NOT the eyebrow bones (which sit ~0.4 above the eyes). three.js world space
 * here is Y-up: Y = height, Z = depth (face front = +Z), X = left/right.
 *
 * Tunables are on TUNE and exposed via window.__glassesTune for live dev calibration.
 */

const TUNE = {
  lensX: 0.40,     // half-distance between the two lenses
  dy: 0.02,        // vertical nudge from eye center (+ up)
  dz: 0.23,        // forward nudge from eye center (clears the eyeball surface)
  lensRadius: 0.30,
  lensTube: 0.028,
  lensSquash: 0.80, // vertical squash → oval lenses
  pitch: 0.08,      // tilt about X (radians) to follow the face
  templeLen: 0.85,  // reaches back to about the ears
  templeOut: 0.22,
};

function cyl(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

function eyeCenter(character: THREE.Object3D): THREE.Vector3 | null {
  let center: THREE.Vector3 | null = null;
  character.traverse((o: any) => {
    if (center || !o.isMesh || !o.name) return;
    const n = o.name.toLowerCase();
    if (n.includes("eye") && !n.includes("eyebrow")) {
      o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox.clone();
      bb.applyMatrix4(o.matrixWorld);
      center = bb.getCenter(new THREE.Vector3());
    }
  });
  return center;
}

export function addGlasses(character: THREE.Object3D) {
  (window as any).__char = character;
  const head = character.getObjectByName("spine006");
  if (!head) {
    console.warn("[glasses] head bone spine006 not found");
    return;
  }
  character.updateWorldMatrix(true, true);

  const eye = eyeCenter(character);
  if (!eye) {
    console.warn("[glasses] eye mesh not found");
    return;
  }

  const build = () => {
    const group = new THREE.Group();
    group.name = "Glasses";
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0a0a"),
      metalness: 0.55,
      roughness: 0.35,
    });

    // Lens centers in world space, anchored to the eye center
    const cy = eye.y + TUNE.dy;
    const cz = eye.z + TUNE.dz;
    const cL = new THREE.Vector3(TUNE.lensX, cy, cz);
    const cR = new THREE.Vector3(-TUNE.lensX, cy, cz);

    const lensGeo = new THREE.TorusGeometry(TUNE.lensRadius, TUNE.lensTube, 12, 30);
    [cL, cR].forEach((c) => {
      const lens = new THREE.Mesh(lensGeo, mat); // torus hole-axis = +Z (faces front)
      lens.position.copy(c);
      lens.rotation.x = TUNE.pitch;
      lens.scale.y = TUNE.lensSquash;
      lens.castShadow = true;
      group.add(lens);
    });

    // Nose bridge
    const bL = new THREE.Vector3(TUNE.lensX - TUNE.lensRadius, cy, cz);
    const bR = new THREE.Vector3(-TUNE.lensX + TUNE.lensRadius, cy, cz);
    group.add(cyl(bL, bR, TUNE.lensTube * 0.8, mat));

    // Temple arms: outer edge → back (−Z) and outward (±X)
    const oL = new THREE.Vector3(TUNE.lensX + TUNE.lensRadius, cy, cz);
    const oR = new THREE.Vector3(-TUNE.lensX - TUNE.lensRadius, cy, cz);
    const eL = new THREE.Vector3(oL.x + TUNE.templeOut, cy + 0.04, cz - TUNE.templeLen);
    const eR = new THREE.Vector3(oR.x - TUNE.templeOut, cy + 0.04, cz - TUNE.templeLen);
    group.add(cyl(oL, eL, TUNE.lensTube * 0.7, mat));
    group.add(cyl(oR, eR, TUNE.lensTube * 0.7, mat));

    return group;
  };

  let group = build();
  head.attach(group); // becomes head's child, keeps world transform → tracks head

  // ── Dev calibration hooks ────────────────────────────────────────────────
  (window as any).__glassesTune = (patch: Partial<typeof TUNE>) => {
    Object.assign(TUNE, patch);
    const old = head.getObjectByName("Glasses");
    if (old) head.remove(old);
    group = build();
    head.attach(group);
    return { ...TUNE };
  };
  (window as any).__glassesInfo = () => {
    character.updateWorldMatrix(true, true);
    const g = head.getObjectByName("Glasses");
    const lw = g?.children[0].getWorldPosition(new THREE.Vector3());
    return {
      eyeCenter: eye.toArray().map((n) => +n.toFixed(3)),
      lensWorld: lw?.toArray().map((n) => +n.toFixed(3)),
      tune: { ...TUNE },
    };
  };
}
