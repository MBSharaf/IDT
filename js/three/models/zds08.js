// Zahndent ZDS-08 lift-type sintering furnace — 363 (W) × 653 (H) × 521 (D) mm, plus its separate
// 10" touch screen. Heights and widths are measured from Zahndent's straight front photo (~0.65 mm/px),
// which is photo-projected onto the hood, column and base fronts. Depth layout follows the three-quarter
// photos: a deep graphite hood over the loading area, a light column with the lift slot behind it, and
// on the right a tall white side tower (angled top, orange rear edge, vertical Zahndent wordmark).
import * as THREE from 'three';
import { mats } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 'zds08', dims: { w: W, h: H, d: D }, views: cfg.views, fallback: 0xd0d2d4, elevation: 0 });
  const metal = proj.material();
  const graphite = proj.material({ fallback: 0x45464a });
  const plain = (m) => { m.userData.project = false; return m; };
  const g = new THREE.Group();

  const back = -D / 2, front = D / 2;
  const footH = mm(20), baseTop = mm(74), chamberY0 = mm(334);
  const hoodX0 = mm(-182), hoodX1 = mm(163), hoodZ0 = back + mm(6), hoodZ1 = front - mm(45);
  const towerX0 = hoodX1, towerX1 = W / 2, towerZ0 = back + mm(3), towerZ1 = mm(-55), towerTop = mm(600);
  const colX0 = mm(-143), colZ1 = mm(-85);
  const mouthZ = mm(30), slotX = mm(11);

  // ---- Base: thick silver plate with a slightly darker top plate and four black feet.
  g.add(at(rbox(W, baseTop - footH, D, mm(10), metal), 0, footH + (baseTop - footH) / 2, 0));
  const topPlate = new THREE.MeshStandardMaterial({ color: 0xbfc2c6, roughness: 0.32, metalness: 0.7 });
  g.add(at(plain(rbox(W - mm(26), mm(3), D - mm(26), mm(6), topPlate)), 0, baseTop + mm(0.5), 0));
  for (const sx of [-1, 1]) for (const z of [mm(-205), mm(205)]) g.add(at(plain(cyl(mm(16), mm(14), footH, mats.blackMatte(), 20)), sx * mm(140), footH / 2, z));

  // ---- Column: the light wall between base and hood; its front face (with the lift slot) is projected.
  g.add(at(box(towerX0 - colX0, chamberY0 - baseTop, colZ1 - back - mm(8), metal), (colX0 + towerX0) / 2, (baseTop + chamberY0) / 2, (back + mm(8) + colZ1) / 2));
  // Lift slot: a dark recess with the guide rail inside.
  const slotY0 = mm(138), slotY1 = mm(327);
  g.add(at(plain(box(mm(22), slotY1 - slotY0, mm(4), new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.8 }))), slotX, (slotY0 + slotY1) / 2, colZ1 + mm(0.5)));
  g.add(at(plain(box(mm(8), slotY1 - slotY0, mm(6), mats.steel())), slotX, (slotY0 + slotY1) / 2, colZ1 - mm(1)));

  // ---- Graphite hood (heating chamber), rounded all round; the front photo gives ZDS-08 / Zahndent.
  const hoodZ = (hoodZ0 + hoodZ1) / 2;
  g.add(at(rbox(hoodX1 - hoodX0, H - chamberY0, hoodZ1 - hoodZ0, mm(24), graphite), (hoodX0 + hoodX1) / 2, (chamberY0 + H) / 2, hoodZ));
  // Chamber mouth underneath: silver ring around the insulation.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(mm(98), mm(5), 10, 64), mats.steel());
  ring.rotation.x = Math.PI / 2;
  g.add(at(plain(ring), mm(-8), chamberY0 - mm(3), mouthZ));
  g.add(at(plain(cyl(mm(95), mm(95), mm(3), mats.insulation(), 56)), mm(-8), chamberY0 - mm(1.5), mouthZ));
  // Hot-surface warning label on the hood's right side, near the front.
  const warn = new THREE.Mesh(new THREE.PlaneGeometry(mm(44), mm(40)), new THREE.MeshStandardMaterial({ map: warningTexture(), transparent: true, roughness: 0.5 }));
  warn.rotation.y = Math.PI / 2;
  g.add(at(plain(warn), hoodX1 + mm(0.6), chamberY0 + mm(45), hoodZ1 - mm(55)));

  // ---- White side tower on the right: angled top towards the front, orange rear edge.
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f1ed, roughness: 0.45 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xf26a1b, roughness: 0.4 });
  const chamferY = mm(470);
  const profile = new THREE.Shape([
    new THREE.Vector2(towerZ0, baseTop), new THREE.Vector2(towerZ1, baseTop), new THREE.Vector2(towerZ1, chamferY),
    new THREE.Vector2(towerZ1 - mm(90), towerTop), new THREE.Vector2(towerZ0, towerTop),
  ].map((v) => new THREE.Vector2(-v.x, v.y)));
  const towerGeo = new THREE.ExtrudeGeometry(profile, { depth: towerX1 - towerX0, bevelEnabled: true, bevelThickness: mm(2), bevelSize: mm(2), bevelSegments: 2 });
  const tower = plain(new THREE.Mesh(towerGeo, white));
  // Shape is drawn in (−z, y); turn it so the extrusion runs along +x.
  tower.rotation.y = Math.PI / 2;
  tower.position.x = towerX0 + mm(2); // local z (extrusion) → +x, local x (= −z) → z
  g.add(tower);
  g.add(at(plain(box(towerX1 - towerX0 + mm(2), towerTop - baseTop, mm(6), orange)), (towerX0 + towerX1) / 2, (baseTop + towerTop) / 2, towerZ0 - mm(2)));
  // Vertical wordmark on the tower's outer face.
  const word = new THREE.Mesh(new THREE.PlaneGeometry(mm(62), mm(330)), new THREE.MeshStandardMaterial({ map: wordmarkTexture(), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
  word.rotation.y = Math.PI / 2;
  g.add(at(plain(word), towerX1 + mm(2.6), mm(330), (towerZ0 + towerZ1) / 2 + mm(10)));

  // ---- Lifting table: carriage in the slot, L-arm forward, silver plate, insulated pedestal, three trays.
  const table = new THREE.Group();
  const restY = mm(150);
  table.add(at(plain(box(mm(26), mm(46), mm(18), mats.steel())), slotX, restY + mm(16), colZ1 + mm(9)));
  table.add(at(plain(box(mm(24), mm(12), mouthZ - colZ1, mats.steel())), slotX, restY + mm(33), (colZ1 + mouthZ) / 2));
  table.add(at(plain(cyl(mm(78), mm(78), mm(8), mats.steel(), 56)), mm(-8), restY + mm(43), mouthZ));
  table.add(at(plain(cyl(mm(56), mm(60), mm(22), mats.insulation(), 48)), mm(-8), restY + mm(58), mouthZ));
  for (let i = 0; i < 3; i++) {
    const tray = cyl(mm(50), mm(48), mm(14), mats.zirconia(), 48);
    table.add(at(plain(tray), mm(-8), restY + mm(77) + i * mm(17), mouthZ));
  }
  g.add(table);

  // ---- Separate 10" touch screen: silver wedge stand, black glass, tilted back.
  const silver = new THREE.MeshStandardMaterial({ color: 0xd9dadc, roughness: 0.3, metalness: 0.6 });
  const screen = new THREE.Group();
  screen.add(at(plain(rbox(mm(262), mm(30), mm(120), mm(10), silver)), 0, mm(15), 0));
  const tablet = new THREE.Group();
  tablet.add(at(plain(rbox(mm(262), mm(180), mm(16), mm(12), silver)), 0, mm(90), 0));
  tablet.add(at(plain(box(mm(246), mm(164), mm(2), mats.blackGloss())), 0, mm(90), mm(7.5)));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(mm(214), mm(134)), new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.12, metalness: 0.2, emissive: 0x0d1118 }));
  tablet.add(at(plain(glass), 0, mm(92), mm(8.7)));
  tablet.rotation.x = -0.3;
  screen.add(at(tablet, 0, mm(22), mm(-22)));
  screen.rotation.y = -0.18;
  g.add(at(screen, W / 2 + mm(165), 0, mm(150)));

  proj.bake(g);

  const glow = new THREE.PointLight(0xffa64d, 0, 0.6, 2);
  glow.position.set(mm(-8), chamberY0 - mm(25), mouthZ);
  g.add(glow);
  // Rest = table down (trays visible); the demo lifts the trays up into the chamber.
  const travel = chamberY0 + mm(30) - (restY + mm(77));
  let closed = false, p = 0;
  g.userData.demo = {
    label: 'Lift table',
    toggle() { closed = !closed; return closed; },
    update(dt) {
      p = lerpTo(p, closed ? 1 : 0, 2.2, dt);
      table.position.y = travel * p;
      glow.intensity = 0.3 * p;
    },
  };
  return g;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// "Zahndent" running top to bottom, with the orange "a" of the logo.
function wordmarkTexture() {
  return canvasTexture(128, 680, (ctx) => {
    ctx.translate(64, 340);
    ctx.rotate(Math.PI / 2);
    ctx.font = '500 84px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    const parts = [['Z', '#2c2c2e'], ['a', '#f26a1b'], ['hndent', '#2c2c2e']];
    const total = parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0);
    let x = -total / 2;
    for (const [t, c] of parts) { ctx.fillStyle = c; ctx.fillText(t, x, 0); x += ctx.measureText(t).width; }
  });
}

// Yellow hot-surface warning triangle.
function warningTexture() {
  return canvasTexture(128, 116, (ctx) => {
    ctx.beginPath(); ctx.moveTo(64, 4); ctx.lineTo(124, 112); ctx.lineTo(4, 112); ctx.closePath();
    ctx.fillStyle = '#1b1b1b'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(64, 16); ctx.lineTo(113, 105); ctx.lineTo(15, 105); ctx.closePath();
    ctx.fillStyle = '#f5d000'; ctx.fill();
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const x of [50, 64, 78]) { ctx.beginPath(); ctx.moveTo(x, 52); ctx.bezierCurveTo(x - 7, 62, x + 7, 72, x, 84); ctx.stroke(); }
    ctx.fillRect(40, 92, 48, 5);
  });
}
