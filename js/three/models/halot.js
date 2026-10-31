// Creality HALOT-X1 resin 3D printer — 331 (W) × 434 (H) × 344 (D) mm.
// Front layout from Creality's straight front product render (0.736 mm/px), photo-projected onto the
// white base, the amber UV lid and the touch-screen pod. The lid is hollow and hinged along its top
// back edge; it lifts up and back (as in Creality's lid-open photo) to show the vat, plate and rails.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'halot', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xeeeeec, elevation: 0 });
  const white = proj.material();
  const amber = proj.material({ fallback: 0xc8681f });
  const g = new THREE.Group();

  const baseTop = mm(98), lidTop = mm(414), t = mm(4);

  // White base with the rounded corners of the render.
  g.add(at(rbox(W, baseTop - mm(3), D, mm(16), white), 0, mm(3) + (baseTop - mm(3)) / 2, 0));
  // Plain top deck: the projection would smear the lid's bottom edge across the base's top face.
  const deck = rbox(W - mm(10), mm(2), D - mm(10), mm(12), new THREE.MeshStandardMaterial({ color: 0xe9e9e6, roughness: 0.45 }));
  deck.userData.project = false;
  g.add(at(deck, 0, baseTop + mm(1), 0));

  // Inside the lid (not projected): resin vat over the LCD, linear rails and the build plate.
  const vat = box(mm(250), mm(14), mm(160), new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.35, metalness: 0.4 }));
  vat.userData.project = false;
  g.add(at(vat, 0, baseTop + mm(9), mm(10)));
  const resin = box(mm(230), mm(2), mm(140), new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.15, transparent: true, opacity: 0.8 }));
  resin.userData.project = false;
  g.add(at(resin, 0, baseTop + mm(15), mm(10)));
  for (const sx of [-1, 1]) {
    const rail = cyl(mm(6), mm(6), lidTop - baseTop - mm(20), mats.steel(), 16);
    rail.userData.project = false;
    g.add(at(rail, sx * mm(105), (baseTop + lidTop - mm(20)) / 2, -D / 2 + mm(45)));
  }
  const carriage = box(mm(230), mm(16), mm(30), mats.steel());
  carriage.userData.project = false;
  g.add(at(carriage, 0, mm(300), -D / 2 + mm(45)));
  const arm = box(mm(30), mm(14), mm(110), mats.steel());
  arm.userData.project = false;
  g.add(at(arm, 0, mm(300), -D / 2 + mm(110)));
  const plate = box(mm(220), mm(10), mm(128), new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.35, metalness: 0.8 }));
  plate.userData.project = false;
  g.add(at(plate, 0, mm(290), mm(10)));

  // Hollow amber lid, hinged along its top back edge; the touch-screen pod rides on top of it.
  const hinge = new THREE.Group();
  at(hinge, 0, lidTop, -D / 2 + mm(6));
  g.add(hinge);
  const lidH = lidTop - baseTop, lidD = D - mm(12), lidW = W - mm(8);
  const panel = (w, h, d, x, y, z) => hinge.add(at(box(w, h, d, amber), x, y, z));
  panel(lidW, lidH, t, 0, -lidH / 2, lidD - t / 2);                 // front
  panel(lidW, lidH, t, 0, -lidH / 2, t / 2);                        // back
  panel(t, lidH, lidD, -lidW / 2 + t / 2, -lidH / 2, lidD / 2);     // sides
  panel(t, lidH, lidD, lidW / 2 - t / 2, -lidH / 2, lidD / 2);
  const lidTopMesh = rbox(lidW, mm(10), lidD, mm(5), new THREE.MeshStandardMaterial({ color: 0xc8681f, roughness: 0.25 }));
  lidTopMesh.userData.project = false; // the front photo has no top view (it would smear the screen pod)
  hinge.add(at(lidTopMesh, 0, -mm(5), lidD / 2));
  // Plain tinted inner faces, so the open lid doesn't show the projected photo from inside.
  const tint = new THREE.MeshStandardMaterial({ color: 0xa8561a, roughness: 0.25, side: THREE.BackSide });
  const inner = new THREE.Mesh(new THREE.BoxGeometry(lidW - 2 * t - mm(1), lidH - mm(11), lidD - 2 * t - mm(1)), tint);
  inner.userData.project = false;
  hinge.add(at(inner, 0, -mm(11) - (lidH - mm(11)) / 2, lidD / 2));
  hinge.add(at(rbox(mm(125), H - lidTop, mm(46), mm(6), white), 0, (H - lidTop) / 2, lidD - mm(30)));

  // Feet.
  for (const sx of [-1, 1]) for (const z of [mm(-140), mm(140)]) {
    const f = cyl(mm(14), mm(14), mm(3), mats.blackMatte(), 16);
    f.userData.project = false;
    g.add(at(f, sx * mm(130), mm(1.5), z));
  }

  proj.bake(g);

  // UV glow under the lid while it is closed and "printing".
  const uv = new THREE.PointLight(0x9a6bff, 0.2, 0.5, 2);
  uv.position.set(0, baseTop + mm(40), mm(10));
  g.add(uv);
  let open = false, p = 0;
  g.userData.demo = {
    label: 'Open lid',
    toggle() { open = !open; return open; },
    update(dt) {
      p = lerpTo(p, open ? 1 : 0, 2.4, dt);
      hinge.rotation.x = -1.0 * p;
      uv.intensity = 0.2 * (1 - p);
    },
  };
  return g;
}
