import * as THREE from "three";

/**
 * Builds over-ear headphones in code and rests them around the character's
 * NECK (band behind the neck, two earcups hanging at the front sides). They are
 * attached to the neck bone (spine005) — NOT the head bone — so they follow the
 * body through animations but do NOT swivel when the head tracks the mouse.
 *
 * Y-up world space: Y = height, +Z = face front, X = left/right.
 * Placement is anchored to the measured Neck-mesh center (pose-robust).
 * Tunables exposed via window.__headphonesTune for live dev calibration.
 */

const TUNE = {
  radius: 0.62,   // band radius around the neck
  tube: 0.055,    // band thickness
  dy: -0.05,      // vertical nudge from neck center (+ up)
  dz: 0.0,        // forward nudge from neck center
  gap: 0.9,       // front opening (radians) where the two cups hang
  cupR: 0.26,     // earcup radius
  cupDepth: 0.13, // earcup thickness
  cupDrop: 0.16,  // how far the cups hang below the band
  cupOut: 0.04,   // extra outward push for the cups
  seg: 26,        // band smoothness
};

const BAND_COLOR = "#0e0e12";   // near-black band + arms
const CUP_COLOR = "#151519";    // dark earcup shell
const ACCENT_COLOR = "#7c6cf0"; // violet accent ring — matches site --accentColor

function cyl(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

function neckCenter(character: THREE.Object3D): THREE.Vector3 | null {
  let center: THREE.Vector3 | null = null;
  character.traverse((o: any) => {
    if (center || !o.isMesh || o.name !== "Neck") return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone();
    bb.applyMatrix4(o.matrixWorld);
    center = bb.getCenter(new THREE.Vector3());
  });
  return center;
}

export function addHeadphones(character: THREE.Object3D) {
  const anchor =
    character.getObjectByName("spine005") ||
    character.getObjectByName("spine006");
  if (!anchor) {
    console.warn("[headphones] neck bone spine005 not found");
    return;
  }
  character.updateWorldMatrix(true, true);

  const neck = neckCenter(character);
  if (!neck) {
    console.warn("[headphones] Neck mesh not found");
    return;
  }

  const build = () => {
    const group = new THREE.Group();
    group.name = "Headphones";
    const bandMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(BAND_COLOR),
      metalness: 0.5,
      roughness: 0.4,
    });
    const cupMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CUP_COLOR),
      metalness: 0.3,
      roughness: 0.6,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ACCENT_COLOR),
      metalness: 0.4,
      roughness: 0.45,
    });

    const cy = neck.y + TUNE.dy;
    const cz = neck.z + TUNE.dz;

    // Band point at angle a (0 = +X right, PI/2 = +Z front) in the XZ plane.
    const bandPt = (a: number) =>
      new THREE.Vector3(
        Math.cos(a) * TUNE.radius,
        cy,
        cz + Math.sin(a) * TUNE.radius
      );

    // Sweep the band around the BACK, leaving `gap` open at the front (+Z).
    const start = Math.PI / 2 + TUNE.gap / 2; // front-left edge of gap
    const end = Math.PI / 2 - TUNE.gap / 2 + Math.PI * 2; // wrap around the back
    let prev = bandPt(start);
    for (let i = 1; i <= TUNE.seg; i++) {
      const a = start + ((end - start) * i) / TUNE.seg;
      const p = bandPt(a);
      group.add(cyl(prev, p, TUNE.tube, bandMat));
      prev = p;
    }

    // Two earcups hang at the front ends of the band (front-left / front-right).
    [start, end].forEach((a) => {
      const anchorPt = bandPt(a);
      const outward = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).normalize();
      const cupPos = anchorPt
        .clone()
        .add(outward.clone().multiplyScalar(TUNE.cupOut));
      cupPos.y -= TUNE.cupDrop;

      // Shell: a short cylinder whose flat faces point outward (radially).
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(TUNE.cupR, TUNE.cupR, TUNE.cupDepth, 20),
        cupMat
      );
      shell.position.copy(cupPos);
      shell.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        outward
      );
      shell.castShadow = true;
      group.add(shell);

      // Violet accent ring on the outer face.
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(TUNE.cupR * 0.6, TUNE.cupR * 0.12, 10, 24),
        accentMat
      );
      ring.position
        .copy(cupPos)
        .add(outward.clone().multiplyScalar(TUNE.cupDepth * 0.55));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);
      group.add(ring);

      // Short arm connecting band end down to the cup.
      group.add(cyl(anchorPt, cupPos, TUNE.tube * 0.8, bandMat));
    });

    return group;
  };

  let group = build();
  anchor.attach(group); // child of the neck bone → tracks body, ignores head look

  if (import.meta.env.DEV) {
    (window as any).__headphonesTune = (patch: Partial<typeof TUNE>) => {
      Object.assign(TUNE, patch);
      const old = anchor.getObjectByName("Headphones");
      if (old) anchor.remove(old);
      group = build();
      anchor.attach(group);
      return { ...TUNE };
    };
  }
}
