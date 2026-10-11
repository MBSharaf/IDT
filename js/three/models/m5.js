// NeunoRton M5 vacuum porcelain furnace — 290 (W) × 541 (H) × 329 (D) mm.
// The published "329 × 290 × 541 mm" is depth × width × height: the orthographic front render has the
// same pixel scale on both axes only with W = 290 mm. Geometry is measured from the front (01) and
// back (05) renders, which are photo-projected; the sides use the white shell with modelled vent slots.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'm5', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xf0f0ee });
  const shell = proj.material();
  const g = new THREE.Group();

  const baseTop = mm(165), hoodY0 = mm(315), hoodR = mm(126), hoodZ = mm(38);
  const colW = mm(233), colZ0 = -D / 2, colZ1 = mm(-40);

  // Rear column (full height) with slotted sides. Its front face sits behind the hood in the front
  // render, so it gets a plain white facing instead of projection (visible once the hood lowers).
  g.add(at(rbox(colW, H, colZ1 - colZ0, mm(8), shell), 0, H / 2, (colZ0 + colZ1) / 2));
  const colFace = box(colW - mm(10), H - baseTop - mm(6), mm(1), new THREE.MeshPhysicalMaterial({ color: 0xeeeeec, roughness: 0.55 }));
  colFace.userData.project = false;
  g.add(at(colFace, 0, baseTop + (H - baseTop - mm(6)) / 2, colZ1 + mm(0.6)));
  for (const sx of [-1, 1]) {
    const slots = slotDecal(mm(12), mm(250), 26);
    slots.rotation.y = sx * Math.PI / 2;
    slots.userData.project = false;
    g.add(at(slots, sx * (colW / 2 + mm(0.6)), mm(330), colZ1 - mm(22)));
  }

  // Base with rounded corners; the tilted touch console stands proud of its front.
  g.add(at(rbox(W, baseTop - mm(8), D - mm(14), mm(18), shell), 0, mm(8) + (baseTop - mm(8)) / 2, -mm(7)));
  const consoleGroup = new THREE.Group();
  at(consoleGroup, 0, mm(66), D / 2 - mm(10));
  consoleGroup.rotation.x = -0.1;
  const consoleMesh = rbox(mm(222), mm(126), mm(18), mm(10), shell);
  consoleGroup.add(consoleMesh);
  g.add(consoleGroup);
  // Power socket + switch on the right side of the base (seen in the rear 3/4 render).
  const socket = rbox(mm(4), mm(30), mm(22), mm(2), mats.blackMatte());
  socket.userData.project = false;
  g.add(at(socket, W / 2 + mm(1), mm(70), -mm(110)));

  // Lift neck under the hood (grey cover with the drive screw).
  g.add(at(rbox(mm(163), hoodY0 - baseTop, mm(40), mm(10), shell), 0, (baseTop + hoodY0) / 2, colZ1 + mm(18)));

  // Firing platform: black seal ring + refractory pedestal, centred under the hood.
  const ring = cyl(mm(76), mm(77), mm(10), mats.blackGloss(), 80);
  ring.userData.project = false;
  g.add(at(ring, 0, baseTop + mm(5), hoodZ));
  g.add(at(cyl(mm(66), mm(68), mm(10), shell, 64), 0, baseTop + mm(13), hoodZ));
  g.add(at(cyl(mm(58), mm(62), mm(22), shell, 64), 0, baseTop + mm(26), hoodZ));
  g.add(at(cyl(mm(44), mm(58), mm(40), shell, 64), 0, baseTop + mm(57), hoodZ));

  // Cylindrical lifting hood (lowers onto the platform).
  const hood = new THREE.Group();
  g.add(hood);
  hood.add(at(cyl(hoodR, hoodR, H - hoodY0, shell, 96), 0, (H + hoodY0) / 2, hoodZ));
  const vents = new THREE.Mesh(new THREE.CircleGeometry(hoodR - mm(4), 64), new THREE.MeshStandardMaterial({ map: radialVentTexture(), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  vents.rotation.x = -Math.PI / 2;
  vents.userData.project = false;
  hood.add(at(vents, 0, H + mm(0.5), hoodZ));
  const mouth = cyl(hoodR - mm(30), hoodR - mm(30), mm(3), mats.insulation(), 48);
  mouth.userData.project = false;
  hood.add(at(mouth, 0, hoodY0 - mm(1), hoodZ));

  for (const sx of [-1, 1]) for (const z of [-mm(130), mm(130)]) {
    const f = cyl(mm(14), mm(14), mm(8), mats.blackMatte(), 20);
    f.userData.project = false;
    g.add(at(f, sx * mm(118), mm(4), z));
  }

  proj.bake(g);

  const glow = new THREE.PointLight(0xffa64d, 0, 0.5, 2);
  glow.position.set(0, hoodY0 - mm(20), hoodZ);
  g.add(glow);
  const travel = hoodY0 - (baseTop + mm(12));
  let closed = false, p = 0;
  g.userData.demo = {
    label: 'Lower hood',
    toggle() { closed = !closed; return closed; },
    update(dt) {
      p = lerpTo(p, closed ? 1 : 0, 2.2, dt);
      hood.position.y = -travel * p;
      glow.intensity = 0.2 * p;
    },
  };
  return g;
}

/** Vertical stack of horizontal vent slots (column sides). */
function slotDecal(w, h, count) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1a1c';
  for (let i = 0; i < count; i++) ctx.fillRect(4, 8 + i * (496 / count), 24, (496 / count) * 0.38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
}

/** Radial vent pattern on the hood top (as in the top render). */
function radialVentTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.translate(256, 256);
  ctx.fillStyle = '#1a1a1c';
  for (let i = 0; i < 64; i++) {
    ctx.save();
    ctx.rotate((i / 64) * Math.PI * 2);
    ctx.fillRect(196, -2.2, 44, 4.4);
    ctx.restore();
  }
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 180, Math.sin(a) * 180, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
