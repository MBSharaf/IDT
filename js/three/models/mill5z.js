// Zahndent ZDM-5T Pro milling machine (same housing as the ZDM-5Z) — 480 (W) × 635 (H) × 625 (D) mm.
// Front layout comes from Zahndent's straight front product photo (5Z-2), which is photo-projected;
// sides and back take the grey housing colour. The window door is hinged along its lower edge and
// swings outward, as in Zahndent's photo; behind it sits the milling chamber.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: '5z', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xc4c5c7, elevation: 0 });
  const shell = proj.material();
  const g = new THREE.Group();
  const front = D / 2;

  // Measured on the front photo (0.636 mm/px): door band, window opening, frame thickness.
  const footH = mm(12), sideT = mm(19);
  const doorY0 = mm(133), doorY1 = mm(375), doorT = mm(14);
  const winX0 = mm(-160), winX1 = mm(151), winY0 = mm(200), winY1 = mm(346);
  const chamberD = mm(240);
  const bodyH = H - footH, innerW = W - 2 * sideT + mm(2);

  // Grey side frames, the screen block above the door and the wordmark block below it.
  for (const sx of [-1, 1]) g.add(at(rbox(sideT, bodyH, D, mm(8), shell), sx * (W / 2 - sideT / 2), footH + bodyH / 2, 0));
  g.add(at(box(innerW, H - doorY1 - mm(1), D - mm(2), shell), 0, doorY1 + (H - doorY1 - mm(1)) / 2, 0));
  g.add(at(box(innerW, doorY0 - footH, D - mm(2), shell), 0, footH + (doorY0 - footH) / 2, 0));
  // Behind the door: cheeks beside the window, sill, lintel and the chamber's rear wall.
  const bandD = D - doorT - mm(2), bandZ = -doorT / 2 - mm(1);
  const inX0 = -W / 2 + sideT - mm(1), inX1 = W / 2 - sideT + mm(1);
  const bandH = doorY1 - doorY0, bandY = (doorY0 + doorY1) / 2;
  g.add(at(box(winX0 - inX0, bandH, bandD, shell), (inX0 + winX0) / 2, bandY, bandZ));
  g.add(at(box(inX1 - winX1, bandH, bandD, shell), (winX1 + inX1) / 2, bandY, bandZ));
  g.add(at(box(winX1 - winX0, winY0 - doorY0, bandD, shell), (winX0 + winX1) / 2, (doorY0 + winY0) / 2, bandZ));
  g.add(at(box(winX1 - winX0, doorY1 - winY1, bandD, shell), (winX0 + winX1) / 2, (winY1 + doorY1) / 2, bandZ));
  const rearD = bandD - chamberD;
  g.add(at(box(winX1 - winX0, winY1 - winY0, rearD, shell), (winX0 + winX1) / 2, (winY0 + winY1) / 2, -D / 2 + mm(1) + rearD / 2));

  // Milling chamber interior (not projected): lining, disc fixture with a 98 mm zirconia disc,
  // spindle with bur and the tool magazine. Simplified from the chamber photos.
  const lining = new THREE.MeshStandardMaterial({ color: 0x2c2d31, roughness: 0.6, metalness: 0.4 });
  const cFront = front - doorT, cz = cFront - chamberD / 2, cw = winX1 - winX0, ch = winY1 - winY0;
  const cxm = (winX0 + winX1) / 2, cym = (winY0 + winY1) / 2;
  const lin = (w, h, d, x, y, z) => { const m = box(w, h, d, lining); m.userData.project = false; g.add(at(m, x, y, z)); };
  lin(cw, ch, mm(2), cxm, cym, cFront - chamberD + mm(1));
  lin(cw, mm(2), chamberD, cxm, winY0 + mm(1), cz);
  lin(cw, mm(2), chamberD, cxm, winY1 - mm(1), cz);
  lin(mm(2), ch, chamberD, winX0 + mm(1), cym, cz);
  lin(mm(2), ch, chamberD, winX1 - mm(1), cym, cz);
  const holder = new THREE.Mesh(new THREE.TorusGeometry(mm(56), mm(7), 12, 48), mats.steel());
  holder.rotation.y = Math.PI / 2;
  holder.userData.project = false;
  g.add(at(holder, cxm + mm(10), cym - mm(10), cz));
  const disc = cyl(mm(49), mm(49), mm(18), mats.zirconia(), 48);
  disc.rotation.z = Math.PI / 2;
  disc.userData.project = false;
  g.add(at(disc, cxm + mm(10), cym - mm(10), cz));
  const spindle = cyl(mm(24), mm(24), mm(60), mats.steel(), 32);
  spindle.userData.project = false;
  g.add(at(spindle, cxm + mm(80), winY1 - mm(32), cz));
  const bur = cyl(mm(2), mm(1), mm(26), mats.gold(), 12);
  bur.userData.project = false;
  g.add(at(bur, cxm + mm(80), winY1 - mm(75), cz));
  const magazine = box(mm(50), mm(16), mm(30), mats.steel());
  magazine.userData.project = false;
  g.add(at(magazine, winX0 + mm(40), winY0 + mm(10), cz + mm(40)));
  const lamp = new THREE.PointLight(0xc7c3ff, 0, 0.6, 2);
  lamp.position.set(cxm, winY1 - mm(20), cz);
  g.add(lamp);

  // Window door, hinged along its lower edge (projected: black glass, window and frame from the photo).
  const hinge = new THREE.Group();
  at(hinge, 0, doorY0, front - doorT);
  g.add(hinge);
  const doorH = doorY1 - doorY0;
  hinge.add(at(rbox(innerW - mm(4), doorH, doorT, mm(4), shell), 0, doorH / 2, doorT / 2));

  // Feet.
  for (const sx of [-1, 1]) for (const z of [mm(-240), mm(240)]) {
    const f = cyl(mm(20), mm(18), footH, mats.blackMatte(), 20);
    f.userData.project = false;
    g.add(at(f, sx * mm(190), footH / 2, z));
  }

  proj.bake(g);

  let open = false, p = 0;
  g.userData.demo = {
    label: 'Open door',
    toggle() { open = !open; return open; },
    update(dt) {
      p = lerpTo(p, open ? 1 : 0, 2.4, dt);
      hinge.rotation.x = 1.0 * p;
      lamp.intensity = 0.35 * p;
    },
  };
  return g;
}
