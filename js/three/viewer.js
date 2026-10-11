// Product viewer: one WebGL scene per container. Handles lighting, product swapping with
// cinematic transitions, optional orbit controls, floaters, scroll-driven state and a
// visibility-aware render loop. Falls back to the product photo when WebGL is unavailable.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createProductModel } from './models/index.js';
import { createFloaters } from './floaters.js';
import { srcsetAttrs } from '../core/dom.js';

const TARGET = 1.35;           // normalised product size (scene units)
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl');
  } catch { return false; }
}

const VIEWS = {
  'three-quarter': { yaw: -0.62, pitch: 0.16 },
  front: { yaw: 0, pitch: 0.08 },
  side: { yaw: -Math.PI / 2, pitch: 0.08 },
  top: { yaw: -0.4, pitch: 0.95 },
};

/**
 * @param {HTMLElement} el container (gets the canvas, a poster image and a loader)
 * @param {object} opts
 *   interactive  – orbit controls (product pages)
 *   floaters     – hero floating materials
 *   idleSpin     – gentle oscillating turntable when not interacting
 *   frame        – { x, y, zoom } offsets for composing the product in its layout
 */
export function createViewer(el, opts = {}) {
  const o = { interactive: false, floaters: false, idleSpin: true, frame: { x: 0, y: 0, zoom: 1 }, ...opts };
  el.classList.add('viewer');
  const poster = document.createElement('img');
  poster.className = 'viewer__poster';
  poster.alt = '';
  poster.setAttribute('aria-hidden', 'true');
  const loader = document.createElement('div');
  loader.className = 'viewer__loader';
  loader.innerHTML = '<span class="viewer__ring"></span><span>Preparing 3D model</span>';
  el.append(poster, loader);

  const api = {
    el, ready: false, product: null, model: null,
    state: { spin: 0, spread: 0, lift: 0, offsetX: 0, scale: 1, tiltX: 0 },
    setProduct, preload, setView, toggleAutoRotate, toggleDemo, resetView, dispose, onChange: null,
  };
  el.idtViewer = api; // handy for debugging from the console

  if (!supportsWebGL()) {
    el.classList.add('is-fallback');
    api.setProduct = async (p) => { api.product = p; poster.src = p.images.hero; poster.alt = p.name; };
    api.preload = () => {};
    return api;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  // Performance: cap the pixel ratio and skip real-time shadow maps (the graphite "pool" under the
  // product grounds it at a fraction of the cost of an extra shadow render pass every frame).
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  // Shader error checks force a synchronous wait on every new program; the shaders are known-good.
  renderer.debug.checkShaderErrors = location.hostname === 'localhost';
  el.prepend(renderer.domElement);
  api.renderer = renderer; // debugging / QA
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 50);

  // Lighting: warm key, cool fill, brand-gold rim for the premium halo.
  scene.add(new THREE.HemisphereLight(0xf5f3ee, 0x0a0a0a, 0.35));
  const key = new THREE.DirectionalLight(0xfff6e8, 2.4);
  key.position.set(-1.4, 5.2, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 2, bottom: -0.3, near: 0.5, far: 10 });
  key.shadow.bias = -0.0006;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe4ee, 0.6);
  fill.position.set(3, 1.2, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xd9ad55, 3.2);
  rim.position.set(1.8, 2.2, -3);
  scene.add(rim);

  // Ground: shadow catcher + soft graphite pool
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.38 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.001;
  scene.add(pool);

  const stage = new THREE.Group();     // receives scroll/pointer transforms
  const turntable = new THREE.Group(); // receives idle spin / orbit
  stage.add(turntable);
  scene.add(stage);

  let floaters = null;
  if (o.floaters) { floaters = createFloaters(); scene.add(floaters.group); }

  let controls = null;
  const camTarget = new THREE.Vector3(0, TARGET * 0.48, 0);
  let camDist = 4.2;
  const views = Object.fromEntries(Object.entries(VIEWS).map(([k, v]) => [k, { ...v }]));
  let view = { ...views['three-quarter'] };
  if (o.interactive) {
    import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = camDist * 0.45;
      controls.maxDistance = camDist * 1.6;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.autoRotate = !REDUCED;
      controls.autoRotateSpeed = 0.9;
      controls.target.copy(camTarget);
      controls.addEventListener('start', () => { controls.autoRotate = false; api.onChange?.('autorotate', false); });
      placeCamera(view);
    });
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-hidden', 'false');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.addEventListener('keydown', onKey);
  }

  function placeCamera(v) {
    const dist = camDist;
    camera.position.set(
      camTarget.x + Math.sin(v.yaw) * Math.cos(v.pitch) * dist,
      camTarget.y + Math.sin(v.pitch) * dist,
      camTarget.z + Math.cos(v.yaw) * Math.cos(v.pitch) * dist,
    );
    camera.lookAt(camTarget);
    controls?.target.copy(camTarget);
    controls?.update();
  }

  // Fit = the current model's height and turntable radius (rotation-safe framing).
  let fit = { h: TARGET, r: TARGET * 0.55 };
  let desiredDist = camDist;
  const desiredTarget = camTarget.clone();

  function computeDist() {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const byH = (fit.h * 1.22) / (2 * t);
    const byW = (fit.r * 2 * 1.08) / (2 * t * camera.aspect);
    desiredDist = Math.max(byH, byW) / (o.frame.zoom || 1) + fit.r * 0.6;
    desiredTarget.set(0, fit.h * 0.5, 0);
  }

  function frame() {
    const { clientWidth: w, clientHeight: h } = el;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.setViewOffset(w, h, -o.frame.x * w, -o.frame.y * h, w, h);
    camera.updateProjectionMatrix();
    computeDist();
    if (o.interactive) {
      camDist = desiredDist;
      camTarget.copy(desiredTarget);
      if (controls) { controls.minDistance = camDist * 0.45; controls.maxDistance = camDist * 1.6; }
      placeCamera(view);
    }
  }

  function setFit(wrap, instant) {
    fit = { h: wrap.userData.height, r: wrap.userData.radius };
    computeDist();
    if (instant || o.interactive) { camDist = desiredDist; camTarget.copy(desiredTarget); }
    if (o.interactive) {
      if (controls) { controls.minDistance = camDist * 0.45; controls.maxDistance = camDist * 1.6; }
      placeCamera(view);
    }
  }

  // ----- Product loading & swapping -----
  const cache = new Map();
  let swapToken = 0;
  async function setProduct(product, { immediate = false } = {}) {
    const token = ++swapToken;
    api.product = product;
    // The poster is only seen before the first model appears (or if 3D fails); later swaps skip it.
    if (!api.ready) setPoster(product);
    renderer.domElement.setAttribute('aria-label', `Interactive 3D model of the ${product.manufacturer} ${product.name}`);
    let next;
    try { next = await load(product); } catch (err) {
      console.error(err);
      setPoster(product);
      el.classList.add('is-fallback');
      return;
    }
    if (token !== swapToken) return;
    const prev = api.model;
    api.model = next;
    if (prev && prev !== next && !immediate && !REDUCED) {
      await tween(400, (k) => { prev.scale.setScalar(prev.userData.baseScale * (1 - 0.25 * k)); prev.rotation.y = -k * 1.2; prev.position.y = -k * 0.15; setOpacity(prev, 1 - k); });
      turntable.remove(prev);
      resetModel(prev);
    } else if (prev && prev !== next) {
      turntable.remove(prev);
      resetModel(prev);
    }
    if (token !== swapToken) return;
    turntable.add(next);
    // Products can prefer the side their official 3/4 imagery shows (e.g. the scanner's open end).
    views['three-quarter'].yaw = product.model3d?.preferredYaw ?? VIEWS['three-quarter'].yaw;
    views.side.yaw = Math.sign(views['three-quarter'].yaw) * Math.PI / 2;
    views.top.yaw = views['three-quarter'].yaw * 0.65;
    if (!prev) view = { ...views['three-quarter'] };
    setFit(next, immediate || !prev);
    if (!immediate && !REDUCED) {
      await tween(900, (k) => { const e = easeOut(k); next.scale.setScalar(next.userData.baseScale * (0.82 + 0.18 * e)); next.rotation.y = (1 - e) * 0.7; next.position.y = (1 - e) * 0.25; setOpacity(next, Math.min(1, k * 2)); });
    } else {
      resetModel(next);
    }
    resetModel(next);
    el.classList.add('is-ready');
    api.ready = true;
    api.onChange?.('product', product);
  }

  function setPoster(product) {
    const m = srcsetAttrs(product.images.hero, '').match(/srcset="([^"]+)"/);
    if (m) { poster.sizes = '(min-width: 960px) 50vw, 100vw'; poster.srcset = m[1].replace(/&amp;/g, '&'); }
    poster.src = product.images.hero;
    poster.alt = product.name;
  }

  function load(product) {
    if (!cache.has(product.id)) cache.set(product.id, createProductModel(product).then(normalise).then(prepare));
    return cache.get(product.id);
  }

  // Uploads textures one at a time (yielding in between) and compiles shaders in the background, so a
  // model's first frame doesn't freeze the page — this matters most on phones.
  async function prepare(wrap) {
    const textures = new Set();
    wrap.traverse((m) => {
      if (!m.isMesh) return;
      for (const mat of [].concat(m.material)) {
        mat.userData.projTextures?.forEach((t) => textures.add(t));
        for (const k of ['map', 'normalMap', 'roughnessMap', 'alphaMap', 'emissiveMap', 'bumpMap']) if (mat[k]) textures.add(mat[k]);
      }
    });
    for (const t of textures) { renderer.initTexture(t); await yieldToMain(); }
    // Shader variants depend on the scene's light count, so compile as if this model were the only
    // one on the turntable (the model on show is hidden for the synchronous part of compileAsync).
    const shown = turntable.visible;
    turntable.visible = false;
    let compiled;
    try { compiled = renderer.compileAsync(wrap, camera, scene); } finally { turntable.visible = shown; }
    try { await compiled; } catch { /* compiled on first render instead */ }
    return wrap;
  }

  /** Builds the given products in idle time so later swaps are instant. */
  function preload(products) {
    const queue = products.filter((p) => !cache.has(p.id));
    const next = () => {
      const p = queue.shift();
      if (p) whenIdle(() => load(p).catch(() => {}).finally(next));
    };
    next();
  }

  function normalise(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const fit = Math.max(size.y, size.x * 0.9, size.z * 0.75);
    const s = TARGET / fit;
    const wrap = new THREE.Group();
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    wrap.add(model);
    wrap.userData.baseScale = s;
    wrap.userData.demo = model.userData.demo;
    wrap.userData.height = size.y * s;
    wrap.userData.radius = (Math.hypot(size.x, size.z) / 2) * s;
    wrap.scale.setScalar(s);
    // Materials are shared between products; give the wrap its own opacity handling list.
    wrap.userData.meshes = [];
    wrap.traverse((m) => { if (m.isMesh) wrap.userData.meshes.push(m); });
    // Every model carries exactly one point light (an unlit one if it has none), so swapping products
    // never changes the scene's light count, which would force every material to recompile.
    let points = 0;
    wrap.traverse((l) => { if (l.isPointLight) points++; });
    if (!points) wrap.add(new THREE.PointLight(0xffffff, 0, 0.01));
    return wrap;
  }

  function setOpacity(wrap, a) {
    // Fade via per-mesh visibility threshold (materials are shared, so we avoid mutating opacity).
    const visible = a > 0.02;
    for (const m of wrap.userData.meshes) m.visible = visible;
  }
  function resetModel(wrap) {
    wrap.scale.setScalar(wrap.userData.baseScale);
    wrap.rotation.set(0, 0, 0);
    wrap.position.set(0, 0, 0);
    setOpacity(wrap, 1);
  }

  // ----- Controls API -----
  function setView(name) {
    view = { ...(views[name] || views['three-quarter']) };
    if (controls) controls.autoRotate = false;
    turntable.rotation.y = 0;
    animateCamera(view);
  }
  function resetView() { setView('three-quarter'); }
  function toggleAutoRotate(force) {
    if (!controls) return false;
    controls.autoRotate = typeof force === 'boolean' ? force : !controls.autoRotate;
    return controls.autoRotate;
  }
  function toggleDemo() { return api.model?.userData.demo?.toggle() ?? false; }

  function animateCamera(v) {
    const from = camera.position.clone();
    const to = new THREE.Vector3(
      camTarget.x + Math.sin(v.yaw) * Math.cos(v.pitch) * camDist,
      camTarget.y + Math.sin(v.pitch) * camDist,
      camTarget.z + Math.cos(v.yaw) * Math.cos(v.pitch) * camDist,
    );
    // Interpolate on a sphere around the target for a smooth arc.
    const a = from.clone().sub(camTarget), b = to.clone().sub(camTarget);
    const ra = a.length(), rb = b.length();
    a.normalize(); b.normalize();
    tween(REDUCED ? 0 : 900, (k) => {
      const e = easeInOut(k);
      const dir = a.clone().lerp(b, e).normalize();
      camera.position.copy(camTarget).addScaledVector(dir, ra + (rb - ra) * e);
      camera.lookAt(camTarget);
      controls?.update();
    });
  }

  function onKey(e) {
    if (!controls) return;
    const step = 0.18;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    if (e.key === 'ArrowLeft') sph.theta -= step;
    else if (e.key === 'ArrowRight') sph.theta += step;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.2, sph.phi - step);
    else if (e.key === 'ArrowDown') sph.phi = Math.min(Math.PI * 0.49, sph.phi + step);
    else if (e.key === '+' || e.key === '=') sph.radius = Math.max(controls.minDistance, sph.radius * 0.9);
    else if (e.key === '-') sph.radius = Math.min(controls.maxDistance, sph.radius * 1.1);
    else return;
    e.preventDefault();
    controls.autoRotate = false;
    api.onChange?.('autorotate', false);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    controls.update();
  }

  // ----- Pointer parallax (non-interactive viewers) -----
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  function onPointer(e) {
    const r = el.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }
  if (!o.interactive && !REDUCED) addEventListener('pointermove', onPointer, { passive: true });

  // ----- Loop -----
  const clock = new THREE.Clock();
  let visible = true, raf = 0, elapsed = 0;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); }, { rootMargin: '100px' });
  io.observe(el);
  const ro = new ResizeObserver(frame);
  ro.observe(el);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  function start() { if (!raf) { clock.getDelta(); raf = requestAnimationFrame(loop); } }
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    const s = api.state;

    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    if (!o.interactive) {
      camDist += (desiredDist - camDist) * 0.06;
      camTarget.lerp(desiredTarget, 0.06);
      placeCamera({ yaw: 0, pitch: 0.12 });
      const idle = o.idleSpin && !REDUCED ? -0.45 + Math.sin(elapsed * 0.35) * 0.7 : -0.5;
      turntable.rotation.y = idle + s.spin + pointer.sx * 0.18;
      turntable.rotation.x = pointer.sy * 0.04 + s.tiltX;
    }
    stage.position.x = s.offsetX;
    stage.position.y = s.lift;
    stage.scale.setScalar(s.scale);
    if (floaters) floaters.update(elapsed, s.spread, REDUCED, fit.r);
    api.model?.userData.demo?.update(dt);
    tweens.forEach((t) => t(dt));
    controls?.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  // Lightweight tweens driven by the render loop (keeps the 3D layer independent of GSAP).
  const tweens = new Set();
  function tween(ms, fn) {
    return new Promise((resolve) => {
      if (!ms) { fn(1); resolve(); return; }
      let t = 0;
      const step = (dt) => {
        t += dt * 1000;
        const k = Math.min(1, t / ms);
        fn(k);
        if (k >= 1) { tweens.delete(step); resolve(); }
      };
      tweens.add(step);
      start();
    });
  }

  /** Renders a frame immediately and returns it as a PNG blob (used for visual QA). */
  api.snapshot = () => new Promise((resolve) => {
    renderer.render(scene, camera);
    renderer.domElement.toBlob(resolve, 'image/png');
  });

  function dispose() {
    cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect();
    removeEventListener('pointermove', onPointer);
    controls?.dispose();
    renderer.dispose();
    pmrem.dispose();
  }

  frame();
  start();
  return api;
}

const yieldToMain = () => new Promise((r) => setTimeout(r, 0));
const whenIdle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 600));

const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(48,48,52,0.85)');
  g.addColorStop(0.45, 'rgba(48,48,52,0.35)');
  g.addColorStop(1, 'rgba(48,48,52,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
