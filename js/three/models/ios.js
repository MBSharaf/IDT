// Aident AI-30 intraoral scanner — a ~255 mm wand (no published dimensions), modelled from Aident's
// product photo: white handle, silver ring, slim neck, grey scanning head, round button with a green
// status light and the green AIDENT logo. It stands tip-up in an illustrative cradle; the demo lifts it
// out and lights the scanning window.
import * as THREE from 'three';
import { mats } from '../materials.js';
import { rbox, cyl, at, lerpTo } from './parts.js';

export async function build() {
  const mm = (v) => v / 1000;
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 0.32 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x8b8e93, roughness: 0.5, metalness: 0.2 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.55, metalness: 0.2 });

  // Cradle: weighted base and a cup the wand's grey end sits in.
  g.add(at(rbox(mm(110), mm(18), mm(110), mm(14), graphite), 0, mm(9), 0));
  const cup = cyl(mm(30), mm(34), mm(55), graphite, 40);
  g.add(at(cup, 0, mm(18) + mm(27.5), 0));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(mm(30), mm(2), 8, 40), mats.steel());
  rim.rotation.x = Math.PI / 2;
  g.add(at(rim, 0, mm(73), 0));

  // Wand (local origin at its bottom end), turned so the scanning window faces +z.
  const wand = new THREE.Group();
  const profile = [
    [0, 0], [17, 0], [19.5, 4], [20, 12],              // grey connector end
    [21, 40], [22, 90], [21.5, 140], [19, 168],        // handle
    [18, 172], [16.5, 180], [14, 215], [12.5, 238],    // neck
    [12.5, 240], [0, 240],
  ].map(([r, y]) => new THREE.Vector2(mm(r), mm(y)));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), shell);
  body.scale.z = 0.88; // slightly flattened, as in the photo
  wand.add(body);
  const end = cyl(mm(19.6), mm(18), mm(12), grey, 40);
  wand.add(at(end, 0, mm(6), 0));
  const ring = cyl(mm(19.2), mm(19.2), mm(3), mats.steel(), 40);
  ring.scale.z = 0.88;
  wand.add(at(ring, 0, mm(170), 0));
  // Scanning head: grey tip block with a dark window facing the teeth.
  const head = rbox(mm(24), mm(30), mm(19), mm(6), shell);
  wand.add(at(head, 0, mm(250), mm(2)));
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.1, metalness: 0.3, emissive: 0x2a6bff, emissiveIntensity: 0 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(mm(15), mm(20)), windowMat);
  wand.add(at(win, 0, mm(252), mm(11.6)));
  // Button with the green status light, just below the ring.
  const button = cyl(mm(8), mm(8), mm(2.5), shell, 32);
  button.rotation.x = Math.PI / 2;
  wand.add(at(button, 0, mm(150), mm(19.3)));
  const led = new THREE.Mesh(new THREE.SphereGeometry(mm(1.4), 12, 8), new THREE.MeshStandardMaterial({ color: 0x2bd46a, emissive: 0x2bd46a, emissiveIntensity: 0.8 }));
  wand.add(at(led, 0, mm(163), mm(18.2)));
  // AIDENT wordmark along the handle.
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(mm(12), mm(48)), new THREE.MeshStandardMaterial({ map: logoTexture(), transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }));
  wand.add(at(logo, 0, mm(70), mm(19.6)));

  const rest = mm(30);
  at(wand, 0, rest, 0);
  g.add(wand);

  const light = new THREE.PointLight(0x4b8bff, 0, 0.4, 2);
  light.position.set(0, mm(252), mm(40));
  wand.add(light);

  let on = false, p = 0;
  g.userData.demo = {
    label: 'Scan',
    toggle() { on = !on; return on; },
    update(dt) {
      p = lerpTo(p, on ? 1 : 0, 2.6, dt);
      wand.position.y = rest + mm(90) * p;
      wand.rotation.x = 0.45 * p;
      windowMat.emissiveIntensity = 1.4 * p;
      light.intensity = 0.4 * p;
    },
  };
  return g;
}

function logoTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(32, 128);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#2fbf4f';
  ctx.font = 'bold italic 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AIDENT', 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
