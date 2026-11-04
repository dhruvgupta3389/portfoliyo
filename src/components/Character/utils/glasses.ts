import * as THREE from "three";

/**
 * Builds glasses in code and attaches them to the head bone (spine006) so they
 * track the face through animations and mouse head-rotation.
 *
 * Placement is measured from the model itself (robust, pose-correct):
 *  - eye mesh centre  → lens X/Y
 *  - face front depth at eye height → lens sits IN FRONT of the face (no clip)
 *  - ear centres      → temple arms route to the ears (not into the skull)
 * three.js world space here is Y-up: Y = height, +Z = face front, X = left/right.
 *
 * Tunables are on TUNE and exposed via window.__glassesTune for live dev calibration.
 */

const TUNE = {
  lensX: 0.36,       // half-distance between the two lenses
  dy: 0.06,          // vertical nudge from eye centre (+ up)
  frontClear: 0.12,  // how far the lens plane sits in front of the face surface
  lensRadius: 0.23,  // smaller, less chunky lenses
  lensTube: 0.022,   // slimmer frame
  lensSquash: 0.82,  // vertical squash → oval-ish square lenses
  pitch: 0.08,       // tilt about X (radians) to follow the face
  earOut: 0.12,      // push the temple ends slightly past the ear centres
  earDrop: 0.02,     // small vertical drop of the temple end
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

function meshByName(character: THREE.Object3D, match: (n: string) => boolean) {
  let found: THREE.Mesh | null = null;
  character.traverse((o: any) => {
    if (!found && o.isMesh && o.name && match(o.name.toLowerCase())) found = o;
  });
  return found;
}

function eyeCenter(character: THREE.Object3D): THREE.Vector3 | null {
  const eye = meshByName(
    character,
    (n) => n.includes("eye") && !n.includes("eyebrow")
  );
  if (!eye) return null;
  eye.geometry.computeBoundingBox();
  const bb = eye.geometry.boundingBox!.clone().applyMatrix4(eye.matrixWorld);
  return bb.getCenter(new THREE.Vector3());
}

// Front-most Z of the face surface within a Y band around the eyes.
function faceFrontZ(character: THREE.Object3D, y: number): number | null {
  const face = meshByName(character, (n) => n.includes("face"));
  if (!face) return null;
  const pos = face.geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  let maxZ = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(face.matrixWorld);
    if (v.y > y - 0.25 && v.y < y + 0.25 && v.z > maxZ) maxZ = v.z;
  }
  return maxZ === -Infinity ? null : maxZ;
}

// Per-ear world centroids (split by X sign).
function earCenters(character: THREE.Object3D) {
  const ear = meshByName(character, (n) => n.includes("ear") && !n.includes("eyebrow"));
  if (!ear) return null;
  const pos = ear.geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const R = new THREE.Vector3(), L = new THREE.Vector3();
  let rn = 0, ln = 0;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(ear.matrixWorld);
    if (v.x >= 0) { R.add(v); rn++; } else { L.add(v); ln++; }
  }
  if (!rn || !ln) return null;
  return { R: R.multiplyScalar(1 / rn), L: L.multiplyScalar(1 / ln) };
}

export function addGlasses(character: THREE.Object3D) {
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
  const front = faceFrontZ(character, eye.y);
  const ears = earCenters(character);

  const build = () => {
    const group = new THREE.Group();
    group.name = "Glasses";
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0a0a"),
      metalness: 0.55,
      roughness: 0.35,
    });

    const cy = eye.y + TUNE.dy;
    // Lens plane sits in front of the measured face surface (fallback: eye + 0.4).
    const cz = (front ?? eye.z + 0.28) + TUNE.frontClear;
    const cL = new THREE.Vector3(TUNE.lensX, cy, cz);
    const cR = new THREE.Vector3(-TUNE.lensX, cy, cz);

    // Square lens frames: four bars per lens, built in a local XY plane then
    // tilted by `pitch`. Half-width = lensRadius; half-height uses lensSquash.
    const hw = TUNE.lensRadius;
    const hh = TUNE.lensRadius * TUNE.lensSquash;
    [cL, cR].forEach((c) => {
      const lens = new THREE.Group();
      const corners = [
        new THREE.Vector3(-hw, hh, 0),
        new THREE.Vector3(hw, hh, 0),
        new THREE.Vector3(hw, -hh, 0),
        new THREE.Vector3(-hw, -hh, 0),
      ];
      for (let i = 0; i < 4; i++) {
        lens.add(cyl(corners[i], corners[(i + 1) % 4], TUNE.lensTube, mat));
      }
      lens.position.copy(c);
      lens.rotation.x = TUNE.pitch;
      group.add(lens);
    });

    // Nose bridge
    const bL = new THREE.Vector3(TUNE.lensX - TUNE.lensRadius, cy, cz);
    const bR = new THREE.Vector3(-TUNE.lensX + TUNE.lensRadius, cy, cz);
    group.add(cyl(bL, bR, TUNE.lensTube * 0.8, mat));

    // Temple arms: a 2-segment path per side — hinge (lens outer edge) → a point
    // beside the head at the temple → the ear — so the arm hugs the head instead
    // of poking out sideways.
    const arm = (sign: number, ear: THREE.Vector3 | null) => {
      const hinge = new THREE.Vector3(sign * (TUNE.lensX + TUNE.lensRadius), cy, cz);
      const target = ear ?? new THREE.Vector3(sign * 1.25, cy - 0.1, cz - 0.9);
      const endX = target.x + sign * TUNE.earOut;
      const side = new THREE.Vector3(endX, cy, (cz + target.z) / 2); // temple, eye height
      const end = new THREE.Vector3(endX, target.y - TUNE.earDrop, target.z);
      group.add(cyl(hinge, side, TUNE.lensTube * 0.7, mat));
      group.add(cyl(side, end, TUNE.lensTube * 0.7, mat));
    };
    arm(1, ears?.R ?? null);
    arm(-1, ears?.L ?? null);

    return group;
  };

  let group = build();
  head.attach(group); // becomes head's child, keeps world transform → tracks head

  // ── Dev-only calibration hooks (stripped from production builds) ──────────
  if (import.meta.env.DEV) {
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
        faceFrontZ: front,
        ears: ears && { R: ears.R.toArray().map((n) => +n.toFixed(2)), L: ears.L.toArray().map((n) => +n.toFixed(2)) },
        lensWorld: lw?.toArray().map((n) => +n.toFixed(3)),
        tune: { ...TUNE },
      };
    };
  }
}
