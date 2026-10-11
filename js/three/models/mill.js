// Zahndent ZDM-E5 milling machine — modelled at 539 (W) × 668 (H) × 637 (D) mm.
// Front layout and proportions come from Zahndent's orthographic front render (detail page image 04),
// which is photo-projected. Height and depth follow the spec sheet; width follows the render's aspect
// (the sheet's 494 mm does not match Zahndent's own front view). The window door is hinged at the top
// and swings outward, as shown in Zahndent's product photo; behind it sits the milling chamber.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'e5', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xf1f1ef, elevation: 0 });
  const shell = proj.material();
  const g = new THREE.Group();
  const front = D / 2;

  const footH = mm(11);
  const ledgeY0 = mm(335.6), ledgeY1 = mm(373.5), doorY0 = mm(108), ledgeDepth = mm(26);
  const winX0 = mm(-212.7), winX1 = mm(206.2), winY0 = mm(124.5), winY1 = mm(292.3);
  const chamberD = mm(230);

  // Continuous side panels (one piece each, as on the real machine), with the inner volumes between them.
  const sideT = mm(30), innerW = W - 2 * sideT + mm(2), bodyH = H - footH;
  for (const sx of [-1, 1]) g.add(at(rbox(sideT, bodyH, D, mm(14), shell), sx * (W / 2 - sideT / 2), footH + bodyH / 2, 0));
  // Display panel block.
  g.add(at(box(innerW, H - ledgeY1 - mm(1), D - mm(2), shell), 0, ledgeY1 + (H - ledgeY1 - mm(1)) / 2, 0));
  // Recessed ledge between the display panel and the window door.
  g.add(at(box(innerW, ledgeY1 - ledgeY0, D - ledgeDepth, shell), 0, (ledgeY0 + ledgeY1) / 2, -ledgeDepth / 2));
  // Around the milling chamber: cheeks beside the window, sill below, lintel above, rear wall.
  const inX0 = -W / 2 + sideT - mm(1), inX1 = W / 2 - sideT + mm(1);
  const lowH = ledgeY0 - footH, lowY = footH + lowH / 2;
  g.add(at(box(winX0 - inX0, lowH, D - mm(2), shell), (inX0 + winX0) / 2, lowY, 0));
  g.add(at(box(inX1 - winX1, lowH, D - mm(2), shell), (winX1 + inX1) / 2, lowY, 0));
  g.add(at(box(winX1 - winX0, winY0 - footH, D - mm(2), shell), (winX0 + winX1) / 2, footH + (winY0 - footH) / 2, 0));
  g.add(at(box(winX1 - winX0, ledgeY0 - winY1, D - mm(2), shell), (winX0 + winX1) / 2, winY1 + (ledgeY0 - winY1) / 2, 0));
  g.add(at(box(winX1 - winX0, winY1 - winY0, D - chamberD, shell), (winX0 + winX1) / 2, (winY0 + winY1) / 2, -chamberD / 2));

  // Milling chamber interior (not projected): dark lining, disc holder with a 98 mm zirconia disc,
  // spindle with bur. Simplified — the real chamber holds the 5-axis carriage seen in the photos.
  const lining = new THREE.MeshStandardMaterial({ color: 0x2c2d31, roughness: 0.6, metalness: 0.4 });
  const cz = front - chamberD / 2, cw = winX1 - winX0, ch = winY1 - winY0, cxm = (winX0 + winX1) / 2, cym = (winY0 + winY1) / 2;
  const lin = (w, h, d, x, y, z) => { const m = box(w, h, d, lining); m.userData.project = false; g.add(at(m, x, y, z)); };
  lin(cw, ch, mm(2), cxm, cym, front - chamberD + mm(1));
  lin(cw, mm(2), chamberD, cxm, winY0 + mm(1), cz);
  lin(cw, mm(2), chamberD, cxm, winY1 - mm(1), cz);
  lin(mm(2), ch, chamberD, winX0 + mm(1), cym, cz);
  lin(mm(2), ch, chamberD, winX1 - mm(1), cym, cz);
  const holder = new THREE.Mesh(new THREE.TorusGeometry(mm(56), mm(7), 12, 64), mats.steel());
  holder.rotation.y = Math.PI / 2;
  holder.userData.project = false;
  g.add(at(holder, cxm - mm(20), cym - mm(20), cz));
  const disc = cyl(mm(49), mm(49), mm(18), mats.zirconia(), 64);
  disc.rotation.z = Math.PI / 2;
  disc.userData.project = false;
  g.add(at(disc, cxm - mm(20), cym - mm(20), cz));
  const spindle = cyl(mm(26), mm(26), mm(70), mats.steel(), 40);
  spindle.userData.project = false;
  g.add(at(spindle, cxm + mm(40), winY1 - mm(36), cz));
  const bur = cyl(mm(2), mm(1), mm(30), mats.gold(), 16);
  bur.userData.project = false;
  g.add(at(bur, cxm + mm(40), winY1 - mm(86), cz));
  const lamp = new THREE.PointLight(0xc7c3ff, 0, 0.6, 2);
  lamp.position.set(cxm, winY1 - mm(20), cz);
  g.add(lamp);

  // Window door, hinged along its top edge (projected: frame, glass and handle strip from the render).
  const hinge = new THREE.Group();
  at(hinge, 0, ledgeY0, front);
  g.add(hinge);
  const doorH = ledgeY0 - doorY0;
  const door = rbox(W - mm(36), doorH, mm(14), mm(5), shell);
  hinge.add(at(door, 0, -doorH / 2, mm(7)));

  // Feet.
  for (const sx of [-1, 1]) for (const z of [mm(-250), mm(250)]) {
    const f = cyl(mm(22), mm(20), footH, mats.blackMatte(), 24);
    f.userData.project = false;
    g.add(at(f, sx * mm(205), footH / 2, z));
  }
  // Side panel screws and the small rating label (left side, as in the 3/4 photo).
  const screwMat = new THREE.MeshStandardMaterial({ color: 0xb9b9b9, roughness: 0.4, metalness: 0.6 });
  for (const sx of [-1, 1]) for (const y of [mm(60), mm(330), mm(600)]) for (const z of [mm(-280), mm(-5), mm(275)]) {
    const s = cyl(mm(3.2), mm(3.2), mm(1.2), screwMat, 12);
    s.rotation.z = Math.PI / 2;
    s.userData.project = false;
    g.add(at(s, sx * (W / 2 + mm(0.5)), y, z));
  }
  const label = box(mm(1), mm(30), mm(24), new THREE.MeshStandardMaterial({ color: 0x8f9296, roughness: 0.5 }));
  label.userData.project = false;
  g.add(at(label, -W / 2 - mm(0.6), mm(55), front - mm(45)));

  proj.bake(g);

  let open = false, p = 0;
  g.userData.demo = {
    label: 'Open door',
    toggle() { open = !open; return open; },
    update(dt) {
      p = lerpTo(p, open ? 1 : 0, 2.4, dt);
      hinge.rotation.x = -1.05 * p;
      lamp.intensity = 0.35 * p;
    },
  };
  return g;
}
