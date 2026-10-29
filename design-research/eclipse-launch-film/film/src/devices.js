// The device moment (bars 13-14): the real Daily page on a laptop and a phone, grounded on a dark desk side by side at
// true relative scale (a 14-inch class laptop, a 6.1-inch class phone, both plain, no logo), lit by a neutral key, a
// chalk rim and Eclipse's own red from behind the lid. The screens are captures of the real pages (tools/textures.mjs).
// No bloom and no post effects: the only light that glows is the screens' own and Eclipse's red. Every value is a function
// of the frame. Station 2 changes against Station 1 (DECISIONS item 20, storyboard/REVIEW.md): the camera is closer, the
// phone lies beside the laptop's palm rest, the screens are readable, and the laptop has a body (deck, keyboard well, keys,
// trackpad, hinge, chamfer) instead of a flat slab.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const { E, clamp, prog, lmix, rand } = window.MOTION;
const { CUE, MOVE, DUR } = window.FILM;

let R = null; // the scene, built once

const canvasTexture = (w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/** A soft contact shadow: a rounded rectangle blurred into a falloff (deterministic, drawn once). */
function contactShadow(w, h, radius, blur, alpha) {
  const pad = blur * 3;
  return canvasTexture(512, Math.round(512 * (h + 2 * pad) / (w + 2 * pad)), (g, W, H) => {
    const sx = W / (w + 2 * pad), sy = H / (h + 2 * pad);
    g.filter = `blur(${Math.round(blur * sx)}px)`;
    g.fillStyle = `rgba(0,0,0,${alpha})`;
    const x = pad * sx, y = pad * sy, rw = w * sx, rh = h * sy, rr = radius * sx;
    g.beginPath(); g.roundRect(x, y, rw, rh, rr); g.fill();
  });
}

/** Build the scene. tex: { laptop, phone } image URLs; meta: the laptop page's end point (CSS px) for the match cut. */
export async function initDevices(canvas, tex, meta) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Number(new URLSearchParams(location.search).get("dpr") || 1.5)); // supersampled 1.5x and downsampled by the page: as clean as 2x here (REVIEW round 1), 45% of its cost
  renderer.setSize(1920, 1080, false);
  canvas.style.width = '1920px'; canvas.style.height = '1080px';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the devices and the lights never move: the shadow maps are drawn once
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070707'); // Eclipse --page
  scene.fog = new THREE.Fog('#070707', 9, 17);

  // An environment for the metals: a dim room with one large soft panel above and in front (a softbox), so the deck
  // and the lid take a real gradient and the lid's edge a real highlight as the camera moves past it.
  {
    const env = new THREE.Scene();
    env.background = new THREE.Color('#08090a');
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), new THREE.MeshBasicMaterial({ color: '#f5f3f2' }));
    panel.position.set(-1.5, 7.5, 5.5); panel.lookAt(0, 0, 0); env.add(panel);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.9), new THREE.MeshBasicMaterial({ color: '#c9c3c4' }));
    strip.position.set(7, 3.2, -6); strip.lookAt(0, 0.5, 0); env.add(strip);
    const red = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshBasicMaterial({ color: '#4d0713' })); // cinetic:brand-supplied Eclipse oxblood
    red.position.set(0, 0.6, -7); red.lookAt(0, 0.6, 0); env.add(red);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    scene.environmentIntensity = 0.55;
  }

  const loader = new THREE.TextureLoader();
  const load = async (url) => { const t = await loader.loadAsync(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.generateMipmaps = true; return t; };
  const [texLaptop, texPhone] = await Promise.all([load(tex.laptop), load(tex.phone)]);

  // ---- materials: graphite aluminium (no logo, no brand of hardware), black glass, the screens unlit
  const tone = (hex, k) => new THREE.Color(hex).multiplyScalar(k); // an Eclipse token, darkened by the light it sits in
  const alu = new THREE.MeshPhysicalMaterial({ color: tone('#8f898b', 0.34), metalness: 0.92, roughness: 0.36, clearcoat: 0.18, clearcoatRoughness: 0.4 });
  const aluEdge = new THREE.MeshPhysicalMaterial({ color: tone('#c9c3c4', 0.4), metalness: 1, roughness: 0.22 }); // the chamfer catches the light
  const well = new THREE.MeshStandardMaterial({ color: '#08090a', roughness: 0.82, metalness: 0.2 });
  const keyMat = new THREE.MeshStandardMaterial({ color: tone('#aaa4a6', 0.075), roughness: 0.86, metalness: 0.0 });
  const padMat = new THREE.MeshPhysicalMaterial({ color: tone('#8f898b', 0.27), metalness: 0.55, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#070707', metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
  const hingeMat = new THREE.MeshStandardMaterial({ color: '#0f0e0f', roughness: 0.5, metalness: 0.7 });
  const screen = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false });
  for (const m of [alu, aluEdge, well, keyMat, padMat, glass, hingeMat]) m.fog = false; // fog only takes the desk into the stage

  // ---- the laptop (decimetres): a 14-inch class body, a 16:10 display carrying the 1440x900 page
  const laptop = new THREE.Group();
  const W = 3.13, D = 2.21, BH = 0.075, LT = 0.05;
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, BH, D, 5, 0.034), alu);
  base.position.y = BH / 2; base.castShadow = true; base.receiveShadow = true;
  laptop.add(base);
  // the chamfer: a slightly brighter rim round the top of the deck, as a machined edge reads
  const rim = new THREE.Mesh(new RoundedBoxGeometry(W - 0.004, 0.006, D - 0.004, 3, 0.03), aluEdge);
  rim.position.y = BH - 0.002; laptop.add(rim);
  const deck = new THREE.Mesh(new RoundedBoxGeometry(W - 0.03, 0.004, D - 0.03, 3, 0.022), alu);
  deck.position.y = BH + 0.0015; deck.receiveShadow = true; laptop.add(deck);
  // the keyboard well and its keys (6 rows, the top row half height), low contrast, matte
  const wellW = W * 0.84, wellD = D * 0.39, wellZ = -D * 0.155;
  const wellMesh = new THREE.Mesh(new RoundedBoxGeometry(wellW, 0.003, wellD, 2, 0.012), well);
  wellMesh.position.set(0, BH + 0.0025, wellZ); wellMesh.receiveShadow = true; laptop.add(wellMesh);
  {
    const pitch = wellW / 14.6, key = pitch * 0.82, rows = [0.5, 1, 1, 1, 1, 1];
    const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
    const keys = [];
    let z = wellZ - wellD / 2 + pitch * 0.32;
    rows.forEach((hgt, r) => {
      const depth = pitch * hgt * 0.82;
      const n = 14;
      if (r === 5) { // the bottom row: modifiers either side of a long space bar
        const widths = [1, 1, 1.25, 6.1, 1.25, 1, 1];
        let x = -wellW / 2 + pitch * 0.38;
        for (const wk of widths) { keys.push([x + (pitch * wk) / 2 - pitch * 0.09, z + depth / 2, pitch * wk - pitch * 0.18, depth]); x += pitch * wk; }
      } else {
        for (let i = 0; i < n; i++) keys.push([-wellW / 2 + pitch * 0.38 + pitch * i + key / 2 + (r % 2) * pitch * 0.25 * (r > 1 ? 1 : 0), z + depth / 2, key, depth]);
      }
      z += pitch * hgt;
    });
    const inst = new THREE.InstancedMesh(geo, keyMat, keys.length);
    const m4 = new THREE.Matrix4();
    keys.forEach(([x, kz, kw, kd], i) => { m4.compose(new THREE.Vector3(x, BH + 0.009, kz), new THREE.Quaternion(), new THREE.Vector3(kw, 0.012, kd)); inst.setMatrixAt(i, m4); });
    inst.receiveShadow = true;
    laptop.add(inst);
  }
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.22, 0.003, 0.76, 3, 0.04), padMat);
  pad.position.set(0, BH + 0.003, D * 0.235); pad.receiveShadow = true; laptop.add(pad);
  // the hinge: a dark barrel along the back edge between the deck and the lid
  const hingeBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, W * 0.78, 24), hingeMat);
  hingeBarrel.rotation.z = Math.PI / 2; hingeBarrel.position.set(0, BH + 0.012, -D / 2 + 0.05); laptop.add(hingeBarrel);
  const hinge = new THREE.Group();
  hinge.position.set(0, BH + 0.01, -D / 2 + 0.035);
  laptop.add(hinge);
  const lid = new THREE.Group();
  hinge.add(lid);
  const lidBody = new THREE.Mesh(new RoundedBoxGeometry(W, D, LT, 5, 0.03), alu);
  lidBody.position.set(0, D / 2, -LT / 2); lidBody.castShadow = true; lidBody.receiveShadow = true;
  lid.add(lidBody);
  const lidRim = new THREE.Mesh(new RoundedBoxGeometry(W - 0.004, D - 0.004, 0.006, 3, 0.028), aluEdge);
  lidRim.position.set(0, D / 2, -0.001); lid.add(lidRim);
  const front = new THREE.Mesh(new RoundedBoxGeometry(W - 0.03, D - 0.03, 0.004, 3, 0.02), glass);
  front.position.set(0, D / 2, 0.002); lid.add(front);
  const dispW = 2.92, dispH = (dispW * 900) / 1440;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(dispW, dispH), screen(texLaptop));
  display.position.set(0, D / 2 + 0.03, 0.0045);
  lid.add(display);
  lid.rotation.x = -THREE.MathUtils.degToRad(16); // open about 106 degrees
  laptop.rotation.y = THREE.MathUtils.degToRad(13); // turned a little toward the camera: its front-left corner clears the copy
  scene.add(laptop);

  // ---- the phone: lying on the desk beside the palm rest, at true scale, turned a little toward the laptop
  const phone = new THREE.Group();
  const PW = 0.716, PH = 1.475, PT = 0.078;
  const pbody = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PH, 6, 0.1), alu);
  pbody.position.y = PT / 2; pbody.castShadow = true; pbody.receiveShadow = true;
  phone.add(pbody);
  const pglass = new THREE.Mesh(new RoundedBoxGeometry(PW - 0.02, 0.004, PH - 0.02, 6, 0.09), glass);
  pglass.position.y = PT + 0.0005;
  phone.add(pglass);
  const pdispW = 0.668, pdispH = (pdispW * 844) / 390;
  const pdisp = new THREE.Mesh(new THREE.PlaneGeometry(pdispW, pdispH), screen(texPhone));
  pdisp.rotation.x = -Math.PI / 2; pdisp.position.y = PT + 0.003;
  phone.add(pdisp);
  phone.position.set(2.08, 0, 0.42);
  phone.rotation.y = THREE.MathUtils.degToRad(-4);
  scene.add(phone);

  // ---- the desk: a dark satin plane that takes the shadows and the red spill, fading into the stage
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: '#070707' })); // matte, and cheap: it covers most of the frame
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true;
  scene.add(desk);
  // contact shadows: where a body meets the desk the light cannot reach, so the devices sit on it, never above it
  const shadowPlane = (w, d, r, blur, a, x, z, ry) => {
    const t = contactShadow(w, d, r, blur, a);
    const pad = blur * 3;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * pad, d + 2 * pad), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(x, 0.0015, z); scene.add(m);
  };
  shadowPlane(W * 1.0, D * 1.0, 0.06, 0.07, 0.85, 0, 0, laptop.rotation.y);
  shadowPlane(PW, PH, 0.1, 0.05, 0.85, phone.position.x, phone.position.z, phone.rotation.y);

  // ---- light: a neutral key from the upper left, a chalk rim from behind right, Eclipse's red behind the lid, and the
  // display's own faint oxblood spill on the deck. // cinetic:brand-supplied Eclipse red light
  const key = new THREE.SpotLight('#f5f3f2', 230, 0, THREE.MathUtils.degToRad(26), 0.95, 2);
  key.position.set(-4.2, 8.2, 6.4); key.target.position.set(0.9, 0.3, 0.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0003;
  scene.add(key, key.target);
  const rimLight = new THREE.SpotLight('#c9c3c4', 60, 0, THREE.MathUtils.degToRad(30), 0.9, 2);
  rimLight.position.set(5.5, 3.2, -4.5); rimLight.target.position.set(0.4, 0.6, 0);
  scene.add(rimLight, rimLight.target);
  const fill = new THREE.DirectionalLight('#c9c3c4', 0.12);
  fill.position.set(6, 3, 6);
  scene.add(fill);
  // Eclipse's light, retold: the laptop is the dark disc and the red sits behind it, so the desk behind the lid takes an
  // oxblood rim, brightest close to the hinge (obsidian -> oxblood -> red). // cinetic:brand-supplied Eclipse red light
  const behind = new THREE.SpotLight('#e51935', 90, 10, THREE.MathUtils.degToRad(80), 1.0, 2);
  behind.position.set(0.3, 0.07, -2.7); behind.target.position.set(0.3, 0, -0.4);
  behind.castShadow = true; behind.shadow.mapSize.set(1024, 1024); behind.shadow.radius = 10; behind.shadow.bias = -0.001;
  scene.add(behind, behind.target);
  const spill = new THREE.RectAreaLight('#4d0713', 0.55, dispW, dispH); // cinetic:brand-supplied the screen's own oxblood
  spill.position.set(0, D / 2 + 0.03, 0.05); spill.lookAt(0, -2, 3);
  lid.add(spill);

  scene.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(24, 1920 / 1080, 0.1, 100);

  // ---- framing by projection: solve the distance and the view offset so a set of points lands on a target box
  const verts = (objs, step = 5) => {
    const out = [];
    for (const obj of objs) obj.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
    });
    return out;
  };
  const groupPts = verts([laptop, phone]);
  const displayPts = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([u, v]) => new THREE.Vector3(u * dispW, v * dispH, 0).applyMatrix4(display.matrixWorld));
  const look = new THREE.Box3().setFromPoints(groupPts).getCenter(new THREE.Vector3());
  look.y += 0.15;
  const dir = new THREE.Vector3(-0.30, 0.36, 1).normalize();
  const box = (pts) => {
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of pts) { const v = c.clone().project(camera); const X = (v.x + 1) * 960, Y = (1 - v.y) * 540; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
    return { x0, x1, y0, y1 };
  };
  const frameTo = (pts, T, fitW = true) => {
    camera.clearViewOffset();
    let dist = 12;
    for (let i = 0; i < 8; i++) {
      camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
      const bx = box(pts);
      dist *= fitW ? (bx.x1 - bx.x0) / (T.x1 - T.x0) : Math.max((bx.x1 - bx.x0) / (T.x1 - T.x0), (bx.y1 - bx.y0) / (T.y1 - T.y0));
    }
    camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
    const bx = box(pts);
    return { dist, ox: (bx.x0 + bx.x1) / 2 - (T.x0 + T.x1) / 2, oy: (bx.y0 + bx.y1) / 2 - (T.y0 + T.y1) / 2 };
  };
  // the hold: both devices whole, larger than Station 1, clear of the copy at the lower left
  const HOLD = frameTo(groupPts, { x0: 520, x1: 1890, y0: 36, y1: 930 }, false);
  // the reveal: close on the laptop's screen (about 1300 px across), the phone beside it, partly past the edge
  const REVEAL = frameTo(displayPts, { x0: 210, x1: 1530, y0: 60, y1: 800 }, true);

  renderer.shadowMap.needsUpdate = true;
  R = { renderer, scene, camera, look, dir, HOLD, REVEAL, display, dispW, dispH, meta, phone, laptop };
  return R;
}

/** Camera state on frame f (fractional allowed). */
function cameraAt(f) {
  const { camera, look, dir, HOLD, REVEAL } = R;
  // the rise: the whole picture (desk and all) comes up 220 px into frame, already moving on the cut (~22 px/f)
  const rise = 1 - E.outSoft(clamp((f - (CUE.devices - 1)) / DUR.rise));
  // close on the lift, then back to the hold (the devices land close, then pull back by 23.75 s)
  const q = prog(f, MOVE.devPull.from, MOVE.devPull.to, E.cam);
  // the one flat hold: a 2.5% creep so it never freezes
  const creep = lmix(1, 1.025, prog(f, MOVE.devPull.to, CUE.construct, E.linear));
  const dist = lmix(REVEAL.dist, HOLD.dist, q) / creep;
  camera.clearViewOffset();
  camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
  const ox = REVEAL.ox + (HOLD.ox - REVEAL.ox) * q, oy = REVEAL.oy + (HOLD.oy - REVEAL.oy) * q;
  camera.setViewOffset(1920, 1080, ox * creep, oy * creep - 220 * rise, 1920, 1080);
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
}

export function renderDevices(f) {
  if (!R) return;
  cameraAt(f);
  R.renderer.render(R.scene, R.camera);
  const gl = R.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, PX); // finish the frame now, once
}
const PX = new Uint8Array(4);

/** The laptop's live end point on screen on frame f: { x, y, r } (the dot's radius in screen px). */
export function endPointOnScreen(f) {
  cameraAt(f);
  const { display, dispW, dispH, meta, camera } = R;
  display.updateMatrixWorld(true);
  const toScreen = (px, py) => {
    const v = new THREE.Vector3((px / meta.w - 0.5) * dispW, (0.5 - py / meta.h) * dispH, 0).applyMatrix4(display.matrixWorld).project(camera);
    return { x: (v.x + 1) * 960, y: (1 - v.y) * 540 };
  };
  const c = toScreen(meta.end.x, meta.end.y);
  const e = toScreen(meta.end.x + meta.end.r, meta.end.y);
  return { x: c.x, y: c.y, r: Math.hypot(e.x - c.x, e.y - c.y) };
}
