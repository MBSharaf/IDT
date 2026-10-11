// Floating "materials of the trade" around the hero product — the reference's orbiting ingredients,
// translated to the dental lab: 98 mm zirconia discs, milling burs and crowns.
import * as THREE from 'three';
import { mats } from './materials.js';

function zirconiaDisc() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.018, 72), mats.zirconia());
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.0505, 0.0505, 0.005, 72), mats.zirconia());
  g.add(body, flange);
  return g;
}

function bur() {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03, 20), mats.steel());
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.002, 0.008, 20), mats.steel());
  neck.position.y = -0.019;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 16, 12), mats.gold());
  tip.position.y = -0.024;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.003, 20), mats.gold());
  ring.position.y = 0.01;
  g.add(shank, neck, tip, ring);
  return g;
}

function crown() {
  // Lathe profile approximating a molar crown silhouette.
  const pts = [
    [0.0, 0.0], [0.0062, 0.0], [0.0068, 0.002], [0.0072, 0.0055], [0.0066, 0.0075],
    [0.0045, 0.0082], [0.0028, 0.0072], [0.0012, 0.0078], [0.0, 0.0074],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 48);
  const m = new THREE.Mesh(geo, mats.zirconia());
  m.scale.setScalar(1.6);
  return m;
}

const makers = { disc: zirconiaDisc, bur, crown };

// pos.x is a side offset beyond the product's turntable radius (sign = side).
const LAYOUT = [
  { kind: 'disc', pos: [-0.22, 1.05, 0.2], scale: 1.9, rot: [1.1, 0.2, 0.4] },
  { kind: 'crown', pos: [0.2, 0.78, 0.35], scale: 6, rot: [0.4, 0.5, -0.3] },
  { kind: 'bur', pos: [-0.12, 0.42, 0.45], scale: 4.4, rot: [0.2, 0.0, 0.9] },
  { kind: 'disc', pos: [0.32, 1.3, -0.3], scale: 1.3, rot: [0.6, 0.3, -0.8] },
  { kind: 'bur', pos: [0.1, 0.3, 0.2], scale: 3.6, rot: [-0.3, 0.2, -1.1] },
  { kind: 'crown', pos: [-0.36, 0.2, -0.25], scale: 4.4, rot: [-0.4, 1.2, 0.2] },
];

export function createFloaters() {
  const group = new THREE.Group();
  const items = LAYOUT.map((cfg, i) => {
    const obj = makers[cfg.kind]();
    obj.scale.multiplyScalar(cfg.scale);
    obj.position.set(...cfg.pos);
    obj.rotation.set(...cfg.rot);
    obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(obj);
    return { obj, base: new THREE.Vector3(...cfg.pos), baseRot: new THREE.Euler(...cfg.rot), phase: i * 1.37, speed: 0.5 + (i % 3) * 0.12 };
  });

  return {
    group,
    /** t: seconds, spread: 0..1 scroll-driven dispersion, still: reduced motion, radius: product turntable radius. */
    update(t, spread = 0, still = false, radius = 0.6) {
      for (const it of items) {
        const k = still ? 0 : 1;
        const side = Math.sign(it.base.x) * (radius * 1.05 + Math.abs(it.base.x));
        it.obj.position.set(
          side * (1 + spread * 0.9),
          it.base.y + Math.sin(t * it.speed + it.phase) * 0.035 * k + spread * 0.25 * Math.sign(it.base.y - 0.6),
          it.base.z + spread * 0.6,
        );
        it.obj.rotation.set(it.baseRot.x + t * 0.15 * k, it.baseRot.y + t * 0.22 * k, it.baseRot.z);
      }
    },
  };
}
