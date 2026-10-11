// Geometry helpers shared by the procedural model builders.
// Convention: 1 unit = 1 metre, origin at floor centre, +Y up, device front faces +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mats } from '../materials.js';

export function rbox(w, h, d, r, material, segments = 4) {
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, Math.max(radius, 1e-4)), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function box(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cyl(rTop, rBottom, h, material, segments = 48) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function at(obj, x = 0, y = 0, z = 0) {
  obj.position.set(x, y, z);
  return obj;
}

/** Plane showing a texture as an emissive screen, placed on a front (+Z) face. */
export function screenPlane(w, h, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  return mesh;
}

/** Four rubber feet under a footprint. */
export function feet(w, d, height = 0.014, inset = 0.05, radius = 0.016) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(at(cyl(radius, radius * 0.9, height, mats.blackMatte(), 24), sx * (w / 2 - inset), height / 2, sz * (d / 2 - inset)));
  }
  return g;
}

/** Simple time-based animation helper for model "demo" actions. */
export function lerpTo(current, target, speed, dt) {
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}
