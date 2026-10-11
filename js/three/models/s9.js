// NeunoRton S9 speed sintering furnace — 346 (W) × 811 (H) × 498 (D) mm.
// Geometry measured from NeunoRton's orthographic renders (front 02, left side 05, back 04);
// every exterior surface is textured by projecting those renders (see projection.js).
import * as THREE from 'three';
import { mats, grilleTexture, insulationMaterial } from '../materials.js';
import { createProjector } from '../projection.js';
import { rbox, box, cyl, at, lerpTo } from './parts.js';

export async function build(cfg) {
  const W = cfg.dimensionsMm.w / 1000, H = cfg.dimensionsMm.h / 1000, D = cfg.dimensionsMm.d / 1000;
  const mm = (v) => v / 1000;
  const proj = await createProjector({ key: 's9', dims: { w: W, h: H, d: D }, views: cfg.views });
  const shell = proj.material();
  const g = new THREE.Group();

  // Rear column (full width), back panel + side vents come from the back/side renders.
  const colZ0 = -D / 2, colZ1 = mm(-71);
  g.add(at(rbox(W, H - mm(4), colZ1 - colZ0, mm(6), shell), 0, mm(4) + (H - mm(4)) / 2, (colZ0 + colZ1) / 2));

  // Hood: rounded-front plan extruded vertically (433 → 811 mm).
  const hoodY0 = mm(430), hoodX = mm(150) - mm(6), hoodZ1 = mm(172) - mm(6), rFront = mm(95), bevel = mm(6);
  // Plan drawn in (x, -z) so that rotating the extrusion upright maps it back to +z = front.
  const plan = new THREE.Shape();
  plan.moveTo(-hoodX, -colZ1);
  plan.lineTo(-hoodX, -(hoodZ1 - rFront));
  plan.quadraticCurveTo(-hoodX, -hoodZ1, -hoodX + rFront, -hoodZ1);
  plan.lineTo(hoodX - rFront, -hoodZ1);
  plan.quadraticCurveTo(hoodX, -hoodZ1, hoodX, -(hoodZ1 - rFront));
  plan.lineTo(hoodX, -colZ1);
  plan.closePath();
  const hoodGeo = new THREE.ExtrudeGeometry(plan, { depth: H - hoodY0 - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 });
  hoodGeo.rotateX(-Math.PI / 2);          // extrusion → +y, shape y → -z (so -(-z) = +z)
  hoodGeo.computeVertexNormals();
  const hood = new THREE.Mesh(hoodGeo, shell);
  hood.position.y = hoodY0 + bevel;
  hood.castShadow = hood.receiveShadow = true;
  g.add(hood);
  // Top vents (two slot fields, as in the top render).
  const vents = new THREE.Mesh(new THREE.PlaneGeometry(mm(240), mm(150)), new THREE.MeshStandardMaterial({ map: grilleTexture(16, false), transparent: true, opacity: 0.55, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  vents.rotation.x = -Math.PI / 2;
  vents.userData.project = false;
  g.add(at(vents, 0, H + mm(0.6), mm(30)));
  // Chamber mouth under the hood.
  const mouth = cyl(mm(78), mm(78), mm(3), mats.insulation(), 48);
  mouth.userData.project = false;
  g.add(at(mouth, 0, hoodY0 - mm(1), mm(10)));

  // Base: side profile with the console face leaning back, extruded across the width.
  const prof = new THREE.Shape();
  prof.moveTo(colZ1, mm(6));
  prof.lineTo(mm(249), mm(6));
  prof.lineTo(mm(184), mm(178));
  prof.lineTo(colZ1, mm(178));
  prof.closePath();
  const baseGeo = new THREE.ExtrudeGeometry(prof, { depth: W - mm(8), bevelEnabled: true, bevelThickness: mm(4), bevelSize: mm(4), bevelSegments: 3 });
  baseGeo.rotateY(-Math.PI / 2);           // shape x → z, extrude along -x
  baseGeo.translate((W - mm(8)) / 2, 0, 0);
  baseGeo.computeVertexNormals();
  const base = new THREE.Mesh(baseGeo, shell);
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  // Glass loading plate (smoked grey glass, not projected).
  const glass = box(mm(326), mm(9), mm(150), new THREE.MeshPhysicalMaterial({ color: 0x5d646c, roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }));
  glass.userData.project = false;
  g.add(at(glass, 0, mm(186), mm(100)));
  // Insulated back wall of the open chamber (covers the photo's baked-in crucible on the column face).
  const wall = box(mm(240), mm(244), mm(2), insulationMaterial());
  wall.userData.project = false;
  g.add(at(wall, 0, mm(186) + mm(122), colZ1 + mm(1.2)));

  // Lift rail on the column face.
  g.add(at(box(mm(12), mm(200), mm(20), shell), 0, mm(325), colZ1 + mm(10)));

  // Lifting table with crucible stack (moves as one group; projection baked at rest).
  const table = new THREE.Group();
  table.add(at(cyl(mm(72), mm(72), mm(12), shell, 64), 0, mm(231), mm(10)));
  table.add(at(cyl(mm(56), mm(56), mm(43), shell, 64), 0, mm(259), mm(10)));
  table.add(at(cyl(mm(45), mm(45), mm(50), shell, 64), 0, mm(305), mm(10)));
  g.add(table);

  // Feet.
  for (const sx of [-1, 1]) for (const z of [mm(-200), mm(215)]) {
    const f = cyl(mm(13), mm(13), mm(6), mats.blackMatte(), 20);
    f.userData.project = false;
    g.add(at(f, sx * mm(130), mm(3), z));
  }

  proj.bake(g);

  const glow = new THREE.PointLight(0xffa64d, 0, 0.6, 2);
  glow.position.set(0, hoodY0 - mm(20), mm(10));
  g.add(glow);
  const travel = hoodY0 - mm(335) + mm(40);
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
