// Photo-projection texturing.
// Each product ships orthographic reference renders/photos (front, side, back, top). Every projected
// mesh gets per-vertex texture coordinates baked from its rest position in model space, so a surface
// facing the front shows exactly what the front photo shows at that spot, a side-facing surface shows
// the side photo, and so on. Weights blend between views on rounded edges. Because coordinates are
// baked at build time, moving parts (doors, lifts) carry their own photo texture with them.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const texCache = new Map();

function loadTexture(src) {
  if (!texCache.has(src)) {
    texCache.set(src, loader.loadAsync(src).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      return t;
    }));
  }
  return texCache.get(src);
}

const AXES = ['front', 'back', 'left', 'right', 'top'];

/**
 * @param {object} cfg  { dims: {w,h,d} in metres, views: { front: {src, rect:[x0,y0,x1,y1] (normalised image coords, y down)}, … } }
 *   A view may be { mirror: 'left' } to reuse another view flipped (for symmetric devices).
 * @returns projector with .material(options) and .bake(root)
 */
export async function createProjector(cfg) {
  const views = {};
  await Promise.all(AXES.map(async (k) => {
    const v = cfg.views[k];
    if (!v) return;
    if (v.mirror) { views[k] = { mirror: v.mirror }; return; }
    views[k] = { tex: await loadTexture(v.src), rect: v.rect };
  }));
  // Resolve mirrors to the source texture/rect.
  for (const k of AXES) if (views[k]?.mirror) views[k] = { ...views[views[k].mirror], mirrored: true };

  const { w, h, d } = cfg.dims;
  const elev = cfg.elevation ?? 0.08;   // tan of the front camera's elevation angle

  // The photos already carry their own shading, so the material keeps scene lighting modest
  // (dimmed diffuse + photo emissive) and reflections low; blacks stay black.
  function material({ base = 0xa8a8a8, roughness = 0.62, metalness = 0, emissive = 0.5, clearcoat = 0, fallback } = {}) {
    const m = new THREE.MeshPhysicalMaterial({ color: base, roughness, metalness, clearcoat, clearcoatRoughness: 0.5, envMapIntensity: 0.35 });
    const uniforms = {
      tFront: { value: views.front?.tex || null }, tBack: { value: views.back?.tex || null },
      tLeft: { value: views.left?.tex || null }, tRight: { value: views.right?.tex || null },
      tTop: { value: views.top?.tex || views.front?.tex || null },
      uHas: { value: new THREE.Vector4(+!!views.front, +!!views.back, +!!views.left, +!!views.right) },
      uHasTop: { value: +!!(views.top || views.front) },
      uEmissive: { value: emissive },
      uFallback: { value: new THREE.Color(fallback ?? cfg.fallback ?? 0xf2f2f0) },
    };
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec2 aProjZ; attribute vec2 aProjX; attribute vec2 aProjY; attribute vec3 aProjW; attribute vec3 aProjS;
          varying vec2 vProjZ; varying vec2 vProjX; varying vec2 vProjY; varying vec3 vProjW; varying vec3 vProjS;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vProjZ = aProjZ; vProjX = aProjX; vProjY = aProjY; vProjW = aProjW; vProjS = aProjS;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D tFront; uniform sampler2D tBack; uniform sampler2D tLeft; uniform sampler2D tRight; uniform sampler2D tTop;
          uniform vec4 uHas; uniform float uHasTop; uniform float uEmissive; uniform vec3 uFallback;
          varying vec2 vProjZ; varying vec2 vProjX; varying vec2 vProjY; varying vec3 vProjW; varying vec3 vProjS;
          vec3 projColor() {
            vec3 cz = vProjS.z > 0.0 ? (uHas.x > 0.5 ? texture2D(tFront, vProjZ).rgb : uFallback) : (uHas.y > 0.5 ? texture2D(tBack, vProjZ).rgb : uFallback);
            vec3 cx = vProjS.x > 0.0 ? (uHas.w > 0.5 ? texture2D(tRight, vProjX).rgb : uFallback) : (uHas.z > 0.5 ? texture2D(tLeft, vProjX).rgb : uFallback);
            vec3 cy = (vProjS.y > 0.0 && uHasTop > 0.5) ? texture2D(tTop, vProjY).rgb : uFallback;
            vec3 wsum = max(vProjW, vec3(1e-4));
            return (cz * wsum.z + cx * wsum.x + cy * wsum.y) / (wsum.x + wsum.y + wsum.z);
          }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec3 pColor = projColor();
          diffuseColor.rgb *= pColor;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += pColor * uEmissive;`);
    };
    m.customProgramCacheKey = () => `proj-${cfg.key || ''}-${emissive}-${fallback ?? ''}`;
    return m;
  }

  const inv = new THREE.Matrix4();
  const nm = new THREE.Matrix3();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  /** Bakes projection attributes into every mesh under `root` that has userData.project !== false. */
  function bake(root, mat) {
    root.updateMatrixWorld(true);
    inv.copy(root.matrixWorld).invert();
    root.traverse((mesh) => {
      if (!mesh.isMesh || mesh.userData.project === false) return;
      const geo = mesh.geometry.clone();
      mesh.geometry = geo;
      const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
      nm.getNormalMatrix(m);
      const pos = geo.attributes.position, nor = geo.attributes.normal, count = pos.count;
      const aZ = new Float32Array(count * 2), aX = new Float32Array(count * 2), aY = new Float32Array(count * 2);
      const aW = new Float32Array(count * 3), aS = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(m);
        n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        const sz = n.z >= 0 ? 1 : -1, sx = n.x >= 0 ? 1 : -1, sy = n.y >= 0 ? 1 : -1;
        const ux = (p.x + w / 2) / w, uy = p.y / h, uz = (p.z + d / 2) / d;
        setUV(aZ, i, sz > 0 ? views.front : views.back, sz > 0 ? ux : 1 - ux, uy);
        setUV(aX, i, sx > 0 ? views.right : views.left, sx > 0 ? 1 - uz : uz, uy);
        if (views.top) setTopUV(aY, i, views.top, ux, uz);
        // No top view: the front renders are shot from slightly above, so upward faces are visible in
        // them, foreshortened. Sample the front view at y shifted by depth × tan(elevation).
        else setUV(aY, i, views.front, ux, uy + ((d / 2 - p.z) * elev) / h);
        const wx = Math.pow(Math.abs(n.x), 6), wy = Math.pow(Math.abs(n.y), 6), wz = Math.pow(Math.abs(n.z), 6);
        aW.set([wx, wy, wz], i * 3);
        aS.set([sx, sy, sz], i * 3);
      }
      geo.setAttribute('aProjZ', new THREE.BufferAttribute(aZ, 2));
      geo.setAttribute('aProjX', new THREE.BufferAttribute(aX, 2));
      geo.setAttribute('aProjY', new THREE.BufferAttribute(aY, 2));
      geo.setAttribute('aProjW', new THREE.BufferAttribute(aW, 3));
      geo.setAttribute('aProjS', new THREE.BufferAttribute(aS, 3));
      if (mat) mesh.material = mat;
    });
  }

  return { views, material, bake };
}

function setUV(arr, i, view, u, v) {
  if (!view) { arr[i * 2] = 0; arr[i * 2 + 1] = 0; return; }
  if (view.mirrored) u = 1 - u;
  const [x0, y0, x1, y1] = view.rect;
  const ix = x0 + u * (x1 - x0);
  const iy = y1 - v * (y1 - y0);      // image y grows downward
  arr[i * 2] = ix;
  arr[i * 2 + 1] = 1 - iy;            // texture v grows upward (flipY)
}

function setTopUV(arr, i, view, ux, uz) {
  if (!view) { arr[i * 2] = 0; arr[i * 2 + 1] = 0; return; }
  const [x0, y0, x1, y1] = view.rect;  // image top = device back, image bottom = device front
  arr[i * 2] = x0 + ux * (x1 - x0);
  arr[i * 2 + 1] = 1 - (y0 + uz * (y1 - y0));
}
