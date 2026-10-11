// Aident AI-S3 lab scanner — 393 (W) × 264 (H) × 271 (D) mm.
// Layout from Aident's orthographic renders: front (07, looking into the scan bay), right end (08, the
// camera head's lens face) and back (03, motor cover + ports), all photo-projected.
//   • Tower on the left; the black camera head sits on top and faces the scan bay (+X).
//   • Thick back wall with a sloped top and a large rounded end; the tilt ring is on its inner face.
//   • Tilt arm hangs from the ring and carries a block with the rotating model plate.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { box, rbox, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'ai-s3', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xf3f3f1, elevation: 0.04 });
  const shell = proj.material();
  const g = new THREE.Group();

  const left = -W / 2, right = W / 2, front = D / 2;
  const plateY0 = mm(10), plateY1 = mm(26);
  const towerX1 = mm(-97), headX1 = mm(-77), headY0 = mm(148);
  const wallZ0 = mm(-119), wallZ1 = mm(-70);

  // Base plate.
  g.add(at(rbox(W, plateY1 - plateY0, front - wallZ0, mm(5), shell), 0, (plateY0 + plateY1) / 2, (front + wallZ0) / 2));

  // Tower (logo, status bar and line art come from the front render).
  g.add(at(rbox(towerX1 - left, H - plateY1, front - wallZ0, mm(4), shell), (left + towerX1) / 2, plateY1 + (H - plateY1) / 2, (front + wallZ0) / 2));
  // Camera head standing proud of the tower towards the scan bay; lens face from the end render.
  g.add(at(rbox(headX1 - towerX1 + mm(6), H - headY0 - mm(2), front - wallZ1, mm(4), shell), (towerX1 - mm(6) + headX1) / 2, headY0 + (H - headY0 - mm(2)) / 2, (front + wallZ1) / 2));
  // The tower's inner face below the head: plain (the end render shows the arm in front of it).
  const innerFace = box(mm(1), headY0 - plateY1, front - wallZ1 - mm(4), new THREE.MeshStandardMaterial({ color: 0xcfd0d2, roughness: 0.6 }));
  innerFace.userData.project = false;
  g.add(at(innerFace, towerX1 + mm(0.6), plateY1 + (headY0 - plateY1) / 2, (front + wallZ1) / 2));
  const cap = box(headX1 - left, mm(2), front - wallZ0, mats.blackGloss());
  cap.userData.project = false;
  g.add(at(cap, (left + headX1) / 2, H + mm(0.6), (front + wallZ0) / 2));

  // Back wall: sloped top, large rounded far end; extruded through its 65 mm thickness.
  const r = mm(28);
  const prof = new THREE.Shape();
  prof.moveTo(headX1 - mm(4), plateY1);
  prof.lineTo(right, plateY1);
  prof.lineTo(right, mm(184));
  prof.quadraticCurveTo(right, mm(212), right - r, mm(212));
  prof.lineTo(headX1 - mm(4), mm(261));
  prof.closePath();
  const wallGeo = new THREE.ExtrudeGeometry(prof, { depth: wallZ1 - wallZ0 - mm(4), bevelEnabled: true, bevelThickness: mm(2), bevelSize: mm(2), bevelSegments: 3, curveSegments: 24 });
  wallGeo.translate(0, 0, wallZ0 + mm(2));
  const wall = new THREE.Mesh(wallGeo, shell);
  wall.castShadow = wall.receiveShadow = true;
  g.add(wall);
  // Motor cover ("peanut") on the outside of the wall comes from the back render; give it relief.
  // Back render: lobes run diagonally from the high far end (+X) down towards the tower.
  const peanut = new THREE.Mesh(peanutGeometry(mm(195), mm(40), mm(10)), proj.material({ fallback: 0x1a1a1c }));
  g.add(at(peanut, mm(85), mm(111.5), wallZ0 - mm(12)));

  // Tilt ring on the wall's inner face.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(mm(52), mm(1.6), 10, 96), mats.blackMatte());
  ring.userData.project = false;
  g.add(at(ring, mm(134), mm(156), wallZ1 + mm(0.8)));

  // Tilt arm assembly (pivots about Z through the ring centre); plate spins about its own axis.
  // Positions: X/Y from the front render, Z from the end render.
  const pivot = new THREE.Vector3(mm(134), mm(156), wallZ1);
  const tilt = new THREE.Group();
  tilt.position.copy(pivot);
  g.add(tilt);
  const armMat = mats.blackGloss();
  const link = rbox(mm(52), mm(98), mm(18), mm(24), armMat);
  link.userData.project = false;
  tilt.add(at(link, 0, mm(136) - pivot.y, mm(9)));
  const blockLen = mm(146);
  const block = rbox(mm(76), mm(39), blockLen, mm(14), armMat);
  block.userData.project = false;
  tilt.add(at(block, mm(6), mm(52) - pivot.y, mm(18.5) + blockLen / 2));
  const spin = new THREE.Group();
  at(spin, mm(-1), mm(77) - pivot.y, mm(58) - wallZ1);
  tilt.add(spin);
  const plate = cyl(mm(38), mm(38), mm(7), mats.blackMatte(), 48);
  plate.userData.project = false;
  spin.add(plate);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const pin = cyl(mm(3.5), mm(3.5), mm(6), mats.steel(), 16);
    pin.userData.project = false;
    spin.add(at(pin, Math.cos(a) * mm(22), mm(5), Math.sin(a) * mm(22)));
  }

  for (const [x, z] of [[left + mm(40), mm(100)], [left + mm(40), mm(-90)], [right - mm(40), mm(100)], [right - mm(40), mm(-90)]]) {
    const f = rbox(mm(30), plateY0, mm(18), mm(3), mats.blackMatte());
    f.userData.project = false;
    g.add(at(f, x, plateY0 / 2, z));
  }

  proj.bake(g);

  let running = false, time = 0, tiltAngle = 0;
  g.userData.demo = {
    label: 'Scan motion',
    toggle() { running = !running; return running; },
    update(dt) {
      if (running) { time += dt; spin.rotation.y += dt * 1.6; }
      tiltAngle = lerpTo(tiltAngle, running ? Math.sin(time * 0.9) * 0.35 : 0, 3, dt);
      tilt.rotation.z = tiltAngle;
    },
  };
  return g;
}

/** Two-lobed motor cover outline (seen on the back render), extruded to a shallow relief. */
function peanutGeometry(len, rad, depth) {
  const s = new THREE.Shape();
  const r1 = rad, r2 = rad * 1.05, waist = rad * 0.62, cx = len / 2 - rad;
  s.absarc(-cx, 0, r1, Math.PI * 0.62, Math.PI * 1.38, false);
  s.quadraticCurveTo(0, -waist * 0.9, cx - r2 * 0.6, -r2 * 0.8);
  s.absarc(cx, 0, r2, Math.PI * 1.25, Math.PI * 0.75 + Math.PI * 2, false);
  s.quadraticCurveTo(0, waist * 0.9, -cx * 0.95, r1 * 0.78);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: mm2(2), bevelSize: mm2(2), bevelSegments: 3, curveSegments: 24 });
  geo.rotateZ(0.714);
  return geo;
}
const mm2 = (v) => v / 1000;
