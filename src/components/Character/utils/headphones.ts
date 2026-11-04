import * as THREE from "three";

/**
 * Builds over-ear headphones in code resting around the character's NECK: a band
 * that arcs around the BACK of the neck (above the shoulders) with two earcups
 * resting on the collarbones at the front. Attached to the neck bone (spine005),
 * NOT the head bone, so they follow the body but don't swivel with head-look.
 *
 * Y-up world space: Y = height, +Z = face front, X = left/right.
 * Placement is anchored to the measured Neck-mesh centre (pose-robust).
 * Tunables exposed via window.__headphonesTune for live dev calibration.
 */

const TUNE = {
  radius: 0.5,    // band radius around the neck (neck is ~±0.44 wide)
  tube: 0.05,     // band thickness
  dy: 0.22,       // raise the band to the neck base, ABOVE the shoulders
  dz: 0.0,        // forward nudge from neck centre
  gap: 0.95,      // front opening (radians) where the band ends sit
  cupR: 0.32,     // earcup radius (bigger, reads as real headphones)
  cupDepth: 0.16, // earcup thickness
  collarX: 0.58,  // half-distance between the two cups (rest on the collarbones)
  collarDrop: 0.5,// how far below the band the cups sit
  collarFwd: 0.95,// forward offset of the cups from the neck centre (onto the chest)
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
    const start = Math.PI / 2 + TUNE.gap / 2;
    const end = Math.PI / 2 - TUNE.gap / 2 + Math.PI * 2;
    let prev = bandPt(start);
    for (let i = 1; i <= TUNE.seg; i++) {
      const a = start + ((end - start) * i) / TUNE.seg;
      const p = bandPt(a);
      group.add(cyl(prev, p, TUNE.tube, bandMat));
      prev = p;
    }

    // Two earcups rest on the collarbones; each connects up to its band end.
    const forward = new THREE.Vector3(0, 0, 1);
    [start, end].forEach((a) => {
      const bandEnd = bandPt(a);
      const sx = Math.sign(bandEnd.x) || 1;
      const cupPos = new THREE.Vector3(
        sx * TUNE.collarX,
        cy - TUNE.collarDrop,
        cz + TUNE.collarFwd
      );

      // Shell: a short cylinder whose flat faces point forward (toward viewer).
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(TUNE.cupR, TUNE.cupR, TUNE.cupDepth, 24),
        cupMat
      );
      shell.position.copy(cupPos);
      shell.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
      shell.castShadow = true;
      group.add(shell);

      // Violet accent ring on the front face.
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(TUNE.cupR * 0.62, TUNE.cupR * 0.12, 12, 28),
        accentMat
      );
      ring.position.copy(cupPos).add(forward.clone().multiplyScalar(TUNE.cupDepth * 0.55));
      group.add(ring);

      // Arm connecting the band end down/forward to the cup.
      group.add(cyl(bandEnd, cupPos, TUNE.tube * 0.9, bandMat));
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
    (window as any).__headphonesInfo = () => {
      const cy = neck.y + TUNE.dy, cz = neck.z + TUNE.dz;
      return {
        neckCenter: neck.toArray().map((n) => +n.toFixed(2)),
        bandCenterY: +cy.toFixed(2),
        bandBackZ: +(cz - TUNE.radius).toFixed(2),
        cupPos: [TUNE.collarX, +(cy - TUNE.collarDrop).toFixed(2), +(cz + TUNE.collarFwd).toFixed(2)],
        cupR: TUNE.cupR,
      };
    };
  }
}
