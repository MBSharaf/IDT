// NeunoRton M9 sintering furnace — 361 (W) × 555 (H) × 360 (D) mm.
// Geometry measured from NeunoRton's orthographic renders (front 01, left side 05); exterior surfaces
// are photo-projected. The door swings on its left-hand hinges to reveal the insulated chamber.
import * as THREE from 'three';
import { mats, grilleTexture, insulationMaterial } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'm9', dims: { w: W, h: H, d: D }, views: cfg.views });
  const shell = proj.material();
  const plainWhite = new THREE.MeshPhysicalMaterial({ color: 0xeeeeec, roughness: 0.55, clearcoat: 0.2 });
  const g = new THREE.Group();

  const baseTop = mm(150), doorY0 = mm(168), bodyZ0 = -D / 2, bodyZ1 = mm(137), doorZ1 = mm(156);
  const chamberD = mm(150), ow = mm(210), oh = mm(205), cy = doorY0 + (H - doorY0) / 2 - mm(10);

  // Control base (black console face comes from the front render).
  g.add(at(rbox(W - mm(4), baseTop - mm(4), D, mm(16), shell), 0, mm(4) + (baseTop - mm(4)) / 2, 0));
  // Recessed band between base and body.
  g.add(at(box(W - mm(20), doorY0 - baseTop + mm(4), D - mm(30), shell), 0, (baseTop + doorY0) / 2, -mm(10)));

  // Body built from continuous slabs (sides, top, bottom, back) around a hollow chamber, so the
  // outer side faces are single surfaces without seams.
  const bodyH = H - doorY0;
  const bodyD = bodyZ1 - bodyZ0;
  const frameZ = bodyZ1 - chamberD / 2;
  const sideW = (W - ow) / 2;
  const bodyZc = (bodyZ0 + bodyZ1) / 2;
  const sideH = H - baseTop;  // side walls run down to the base (the recess is only on the front)
  for (const sx of [-1, 1]) g.add(at(rbox(sideW, sideH, bodyD, mm(12), shell), sx * (W - sideW) / 2, baseTop + sideH / 2, bodyZc));
  g.add(at(rbox(ow + mm(4), H - (cy + oh / 2), bodyD, mm(10), shell), 0, (H + cy + oh / 2) / 2, bodyZc));
  g.add(at(box(ow + mm(4), cy - oh / 2 - doorY0, bodyD, shell), 0, (doorY0 + cy - oh / 2) / 2, bodyZc));
  g.add(at(box(ow + mm(4), oh, bodyD - chamberD, shell), 0, cy, bodyZ0 + (bodyD - chamberD) / 2));
  // Plain front frame face (hidden by the closed door; avoids the door artwork appearing here when open).
  const frameFace = new THREE.Shape();
  frameFace.moveTo(-W / 2 + mm(4), doorY0 + mm(2)); frameFace.lineTo(W / 2 - mm(4), doorY0 + mm(2));
  frameFace.lineTo(W / 2 - mm(4), H - mm(10)); frameFace.lineTo(-W / 2 + mm(4), H - mm(10)); frameFace.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-ow / 2, cy - oh / 2); hole.lineTo(-ow / 2, cy + oh / 2); hole.lineTo(ow / 2, cy + oh / 2); hole.lineTo(ow / 2, cy - oh / 2); hole.closePath();
  frameFace.holes.push(hole);
  const face = new THREE.Mesh(new THREE.ShapeGeometry(frameFace), plainWhite);
  face.userData.project = false;
  g.add(at(face, 0, 0, bodyZ1 + mm(0.5)));
  // Insulated chamber lining + three stacked crucibles (100 × 100 × 35 mm).
  const lining = insulationMaterial();
  const liner = (w, h, d, x, y, z) => { const m = box(w, h, d, lining); m.userData.project = false; g.add(at(m, x, y, z)); };
  liner(ow, oh, mm(3), 0, cy, bodyZ1 - chamberD + mm(2));
  liner(ow, mm(3), chamberD, 0, cy - oh / 2 + mm(1.5), frameZ);
  liner(ow, mm(3), chamberD, 0, cy + oh / 2 - mm(1.5), frameZ);
  for (const sx of [-1, 1]) liner(mm(3), oh, chamberD, sx * (ow / 2 - mm(1.5)), cy, frameZ);
  for (let i = 0; i < 3; i++) {
    const c = rbox(mm(100), mm(34), mm(100), mm(4), mats.ceramic());
    c.userData.project = false;
    g.add(at(c, 0, cy - oh / 2 + mm(20) + i * mm(37), frameZ));
  }

  // Door on its left-hand hinges (projected: logo, handle, warning label come from the front render).
  const hinge = new THREE.Group();
  at(hinge, -W / 2, 0, bodyZ1);
  g.add(hinge);
  const doorW = W, doorH = H - doorY0;
  const door = rbox(doorW, doorH, doorZ1 - bodyZ1, mm(14), shell);
  at(door, doorW / 2, doorY0 + doorH / 2, (doorZ1 - bodyZ1) / 2);
  hinge.add(door);
  const handle = rbox(mm(14), mm(118), mm(18), mm(6), shell);
  hinge.add(at(handle, doorW - mm(30), mm(374), doorZ1 - bodyZ1 + mm(9)));
  // Hinge blocks on the left side (from the side render).
  for (const y of [mm(425), mm(216)]) {
    const hb = rbox(mm(8), mm(44), mm(38), mm(3), mats.blackGloss());
    hb.userData.project = false;
    g.add(at(hb, -W / 2 - mm(3), y, bodyZ1 + mm(4)));
  }

  // Top vents and the two cable glands on the right side (seen in the 3/4 renders).
  const vents = new THREE.Mesh(new THREE.PlaneGeometry(mm(250), mm(230)), new THREE.MeshStandardMaterial({ map: grilleTexture(14, false), transparent: true, opacity: 0.6, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  vents.rotation.x = -Math.PI / 2;
  vents.userData.project = false;
  g.add(at(vents, 0, H + mm(0.6), -mm(30)));
  for (const z of [-mm(120), mm(20)]) {
    const gland = cyl(mm(11), mm(11), mm(4), mats.graphite(), 24);
    gland.rotation.z = Math.PI / 2;
    gland.userData.project = false;
    g.add(at(gland, W / 2 + mm(1), mm(75), z));
  }
  for (const sx of [-1, 1]) for (const z of [-mm(140), mm(140)]) {
    const f = cyl(mm(12), mm(12), mm(4), mats.blackMatte(), 20);
    f.userData.project = false;
    g.add(at(f, sx * mm(140), mm(2), z));
  }

  proj.bake(g);

  const glow = new THREE.PointLight(0xffa64d, 0, 0.5, 2);
  glow.position.set(0, cy, bodyZ1 - mm(40));
  g.add(glow);
  let open = false, p = 0;
  g.userData.demo = {
    label: 'Open door',
    toggle() { open = !open; return open; },
    update(dt) {
      p = lerpTo(p, open ? 1 : 0, 2.4, dt);
      hinge.rotation.y = -1.75 * p;
      glow.intensity = 0.12 * p;
    },
  };
  return g;
}
