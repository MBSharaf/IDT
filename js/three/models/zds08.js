// Zahndent ZDS-08 lift-type sintering furnace — 363 (W) × 653 (H) × 521 (D) mm, plus its separate
// 10" touch screen. Geometry is measured from Zahndent's straight front photo (0.542 mm/px), which is
// photo-projected onto the chamber, column and base. The white branded side panel and the touch
// screen come from the three-quarter photos and are plain materials.
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
  const g = new THREE.Group();

  const footH = mm(8), baseTop = mm(55), chamberY0 = mm(339);
  const chamberD = mm(330), chamberZ1 = D / 2 - mm(30), chamberZ0 = chamberZ1 - chamberD;
  const colZ0 = -D / 2 + mm(20);

  // Silver base plate.
  g.add(at(rbox(W, baseTop - footH, D, mm(10), metal), 0, footH + (baseTop - footH) / 2, 0));
  // Column: the light rear wall between base and chamber (its face, with the lift slot, is in the photo).
  g.add(at(box(mm(309), chamberY0 - baseTop, chamberZ0 - colZ0, metal), mm(12), (baseTop + chamberY0) / 2, (colZ0 + chamberZ0) / 2));
  // Graphite chamber block with rounded vertical edges.
  const chamber = rbox(mm(353), H - chamberY0, chamberD, mm(28), graphite);
  g.add(at(chamber, mm(-5), (chamberY0 + H) / 2, (chamberZ0 + chamberZ1) / 2));
  const chamberZ = (chamberZ0 + chamberZ1) / 2;
  // Insulated mouth under the chamber.
  const mouth = cyl(mm(68), mm(68), mm(3), mats.insulation(), 48);
  mouth.userData.project = false;
  g.add(at(mouth, 0, chamberY0 - mm(1), chamberZ));

  // White branded side panel with its orange edge (right-rear, rising above the chamber's base).
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f0ec, roughness: 0.5 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xf26a1b, roughness: 0.45 });
  const panelH = mm(560), panelD = mm(140), panelZ = colZ0 + panelD / 2;
  const panel = box(mm(22), panelH, panelD, white);
  panel.userData.project = false;
  g.add(at(panel, W / 2 - mm(11), baseTop + panelH / 2, panelZ));
  const edge = box(mm(22), panelH, mm(4), orange);
  edge.userData.project = false;
  g.add(at(edge, W / 2 - mm(11), baseTop + panelH / 2, panelZ + panelD / 2 + mm(2)));

  // Lift rail on the column face.
  const rail = box(mm(16), mm(190), mm(6), mats.blackMatte());
  rail.userData.project = false;
  g.add(at(rail, mm(15), mm(237), chamberZ0 + mm(3)));

  // Lifting table: arm from the rail and three stacked 100 mm trays (moves as one group).
  const table = new THREE.Group();
  const restY = mm(170);
  const arm = box(mm(20), mm(12), chamberZ - chamberZ0, mats.steel());
  arm.userData.project = false;
  table.add(at(arm, mm(15), restY, (chamberZ0 + chamberZ) / 2));
  const plate = cyl(mm(62), mm(62), mm(10), mats.steel(), 40);
  plate.userData.project = false;
  table.add(at(plate, 0, restY + mm(10), chamberZ));
  for (let i = 0; i < 3; i++) {
    const tray = cyl(mm(50), mm(48), mm(10), mats.zirconia(), 40);
    tray.userData.project = false;
    table.add(at(tray, 0, restY + mm(26) + i * mm(24), chamberZ));
  }
  g.add(table);

  // Feet.
  for (const sx of [-1, 1]) for (const z of [mm(-210), mm(210)]) {
    const f = cyl(mm(12), mm(12), footH, mats.blackMatte(), 16);
    f.userData.project = false;
    g.add(at(f, sx * mm(150), footH / 2, z));
  }

  // Separate 10" touch screen on its silver stand, beside the furnace.
  const silver = new THREE.MeshStandardMaterial({ color: 0xd9dadc, roughness: 0.35, metalness: 0.5 });
  const screen = new THREE.Group();
  const stand = rbox(mm(250), mm(26), mm(110), mm(8), silver);
  stand.userData.project = false;
  screen.add(at(stand, 0, mm(13), 0));
  const tablet = new THREE.Group();
  const bezel = rbox(mm(250), mm(170), mm(14), mm(10), mats.blackGloss());
  bezel.userData.project = false;
  tablet.add(at(bezel, 0, mm(85), 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(mm(222), mm(140)), new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.15, metalness: 0.2, emissive: 0x0d1118 }));
  glass.userData.project = false;
  tablet.add(at(glass, 0, mm(85), mm(7.2)));
  tablet.rotation.x = -0.32;
  screen.add(at(tablet, 0, mm(20), mm(-20)));
  g.add(at(screen, W / 2 + mm(150), 0, mm(130)));

  proj.bake(g);

  const glow = new THREE.PointLight(0xffa64d, 0, 0.6, 2);
  glow.position.set(0, chamberY0 - mm(20), chamberZ);
  g.add(glow);
  // Rest = table down (trays visible); the demo lifts the trays into the chamber.
  const travel = chamberY0 + mm(40) - restY;
  let closed = false, p = 0;
  g.userData.demo = {
    label: 'Lift table',
    toggle() { closed = !closed; return closed; },
    update(dt) {
      p = lerpTo(p, closed ? 1 : 0, 2.2, dt);
      table.position.y = travel * p;
      glow.intensity = 0.25 * p;
    },
  };
  return g;
}
