// Shared PBR materials and texture helpers for the procedural product models.
import * as THREE from 'three';

const cache = new Map();
const once = (key, make) => (cache.has(key) ? cache.get(key) : cache.set(key, make()).get(key));

export const mats = {
  // Powder-coated white housing, as on all five devices.
  shell: () => once('shell', () => new THREE.MeshPhysicalMaterial({ color: 0xf1f0ec, roughness: 0.38, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.35 })),
  shellShade: () => once('shellShade', () => new THREE.MeshPhysicalMaterial({ color: 0xdedcd6, roughness: 0.5, clearcoat: 0.3 })),
  blackGloss: () => once('blackGloss', () => new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 })),
  blackMatte: () => once('blackMatte', () => new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.75, metalness: 0.05 })),
  graphite: () => once('graphite', () => new THREE.MeshStandardMaterial({ color: 0x3a3a3f, roughness: 0.85 })),
  insulation: () => once('insulation', () => new THREE.MeshStandardMaterial({ color: 0x6f6f72, roughness: 1 })),
  ceramic: () => once('ceramic', () => new THREE.MeshStandardMaterial({ color: 0xd9d7d1, roughness: 0.95 })),
  steel: () => once('steel', () => new THREE.MeshStandardMaterial({ color: 0xc9cbcf, roughness: 0.28, metalness: 0.95 })),
  gold: () => once('gold', () => new THREE.MeshStandardMaterial({ color: 0xd9ad55, roughness: 0.3, metalness: 1 })),
  // No transmission: a transmissive material forces an extra full-scene render pass every frame.
  zirconia: () => once('zirconia', () => new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.42 })),
  glass: () => once('glass', () => new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.55 })),
  ledGreen: () => once('ledGreen', () => new THREE.MeshStandardMaterial({ color: 0x1b8f3a, emissive: 0x2fd05a, emissiveIntensity: 1.6 })),
  glow: () => once('glow', () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xd9ad55, emissiveIntensity: 0 })),
};

/** Speckled refractory insulation (furnace chamber walls), matching the grey fibre board in the renders. */
export function insulationMaterial() {
  return once('insulationSpeckle', () => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#56575a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      const v = 70 + Math.random() * 70;
      ctx.fillStyle = `rgba(${v},${v},${v + 2},0.55)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
  });
}


/** Vent slot pattern on a transparent background (for the slotted tops of the furnaces). */
export function grilleTexture(slots = 24, vertical = false) {
  return once(`grille-${slots}-${vertical}`, () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#18181a';
    const step = 496 / slots;
    for (let i = 0; i < slots; i++) {
      if (vertical) ctx.fillRect(8 + i * step, 16, step * 0.38, 480);
      else for (const x0 of [16, 266]) ctx.fillRect(x0, 8 + i * step, 230, step * 0.32);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}