// Model registry. A product's `model3d` entry decides how its 3D asset is produced:
//   { "glb": "assets/models/<id>.glb" }   → loaded with GLTFLoader (drop-in replacement path)
//   { "type": "procedural", "builder": … } → built in code from published dimensions
import * as THREE from 'three';

const builders = {
  mill: () => import('./mill.js'),
  scanner: () => import('./scanner.js'),
  s9: () => import('./s9.js'),
  m9: () => import('./m9.js'),
  m5: () => import('./m5.js'),
};

let gltfLoader;
async function loadGLB(url) {
  if (!gltfLoader) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    gltfLoader = new GLTFLoader();
  }
  const gltf = await gltfLoader.loadAsync(url);
  const root = gltf.scene;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // Sit the asset on the floor and centre it, matching the procedural convention.
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
  const g = new THREE.Group();
  g.add(root);
  return g;
}

/** Builds (or loads) the 3D model for a product. Always resolves to a THREE.Group. */
export async function createProductModel(product) {
  const cfg = product.model3d || {};
  let group;
  if (cfg.glb) {
    group = await loadGLB(cfg.glb);
  } else {
    const load = builders[cfg.builder];
    if (!load) throw new Error(`No 3D builder for "${cfg.builder}" (${product.id})`);
    const mod = await load();
    group = await mod.build(cfg, product);
  }
  group.name = product.id;
  group.userData.productId = product.id;
  return group;
}
