// The device moment (bars 13-14): the real Daily page on a laptop and a phone, grounded on a dark desk, lit by a
// neutral key and Eclipse's own red from behind. Procedural hardware (no logos, no brand of hardware), real screens as
// textures (render.mjs captures them from vendor/eclipse/ first). No bloom, no post effects: the only glow is the
// screens' own light and Eclipse's red. Every value is a function of t.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BAR, BEAT, prog, lmix, bez, wait } from './eclipse.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');
const list = await (await fetch('./stills.json')).json();
const meta = list.find((s) => s.id === id);
const t = Number(params.get('t') ?? meta.t);

const CUT = 12 * BAR;                      // bar 13 downbeat, 22.5 s: the biggest lift
const E_OUT = bez(0.16, 1, 0.3, 1);
const E_SOFT = bez(0.22, 1, 0.36, 1);

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(2);                 // render at 2x and let the page downsample: clean edges in SwiftShader
renderer.setSize(1920, 1080, false);
canvas.style.width = '1920px'; canvas.style.height = '1080px';
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#070707');          // Eclipse --page
scene.fog = new THREE.Fog('#070707', 8.5, 16);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;

// ---- textures: the real page captures
const loader = new THREE.TextureLoader();
const tex = async (name) => {
  const tx = await loader.loadAsync(`./build/tex-${name}.png`);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tx;
};
const [texLaptop, texPhone] = await Promise.all([tex('laptop'), tex('phone')]);

// ---- materials
const graphite = new THREE.MeshPhysicalMaterial({ color: '#3a393c', metalness: 0.85, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.35 });
const bezel = new THREE.MeshPhysicalMaterial({ color: '#050505', metalness: 0.0, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 });
const keysMat = new THREE.MeshStandardMaterial({ color: '#09090a', roughness: 0.9, metalness: 0.0 });
const padMat = new THREE.MeshPhysicalMaterial({ color: '#232225', metalness: 0.6, roughness: 0.28 });
const screen = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false });
for (const m of [graphite, bezel, keysMat, padMat]) m.fog = false; // fog only takes the desk into the stage

// ---- the laptop (decimetres): a 14-inch class body, 16:10 display carrying the 1440x900 page
const laptop = new THREE.Group();
const W = 3.13, D = 2.21, BH = 0.085, LT = 0.055;
const base = new THREE.Mesh(new RoundedBoxGeometry(W, BH, D, 4, 0.05), graphite);
base.position.y = BH / 2; base.castShadow = true; base.receiveShadow = true;
laptop.add(base);
const keys = new THREE.Mesh(new RoundedBoxGeometry(W * 0.86, 0.004, D * 0.40, 2, 0.03), keysMat);
keys.position.set(0, BH, -D * 0.17);
laptop.add(keys);
const pad = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.004, 0.78, 2, 0.04), padMat);
pad.position.set(0, BH + 0.001, D * 0.22);
laptop.add(pad);
const hinge = new THREE.Group();
hinge.position.set(0, BH, -D / 2 + 0.03);
laptop.add(hinge);
const lid = new THREE.Group();
hinge.add(lid);
const lidBody = new THREE.Mesh(new RoundedBoxGeometry(W, D, LT, 4, 0.04), graphite);
lidBody.position.set(0, D / 2, -LT / 2); lidBody.castShadow = true;
lid.add(lidBody);
const front = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.05, D - 0.05), bezel);
front.position.set(0, D / 2, 0.001);
lid.add(front);
const dispW = 2.90, dispH = dispW * 900 / 1440;
const display = new THREE.Mesh(new THREE.PlaneGeometry(dispW, dispH), screen(texLaptop));
display.position.set(0, D / 2 + 0.035, 0.002);
lid.add(display);
lid.rotation.x = -THREE.MathUtils.degToRad(17);   // open about 107 degrees
laptop.rotation.y = THREE.MathUtils.degToRad(14); // turned a little toward the camera: its front-left corner recedes from the copy
scene.add(laptop);

// ---- the phone: lying on the desk to the front right, turned toward the camera
const phone = new THREE.Group();
const PW = 0.715, PH = 1.47, PT = 0.078;
const pbody = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PH, 6, 0.09), graphite);
pbody.position.y = PT / 2; pbody.castShadow = true; pbody.receiveShadow = true;
phone.add(pbody);
const pglass = new THREE.Mesh(new RoundedBoxGeometry(PW - 0.03, 0.004, PH - 0.03, 6, 0.08), bezel);
pglass.position.y = PT + 0.001;
phone.add(pglass);
const pdisp = new THREE.Mesh(new THREE.PlaneGeometry(0.665, 0.665 * 844 / 390), screen(texPhone));
pdisp.rotation.x = -Math.PI / 2; pdisp.position.y = PT + 0.004;
phone.add(pdisp);
phone.position.set(2.2, 0, 2.0);
phone.rotation.y = THREE.MathUtils.degToRad(-26);
scene.add(phone);

// ---- the desk: a dark plane that takes the shadows and the red spill, fading into the stage
const desk = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#060506', roughness: 0.62, metalness: 0.0 }));
desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true;
scene.add(desk);

// ---- light: a neutral key from the upper left, Eclipse's red from behind and below the lid (its light ramp's core
// #E51935), and the screen's own spill on the deck. // cinetic:brand-supplied Eclipse red light
// A focused key: the devices are lit and the desk falls away into the stage around them.
const key = new THREE.SpotLight('#f5f3f2', 260, 0, THREE.MathUtils.degToRad(24), 0.95, 2);
key.position.set(-4.5, 8.5, 6.5); key.target.position.set(1.0, 0.4, 0.5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -0.0004;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#c9c3c4', 0.18);
fill.position.set(6, 3, 4);
scene.add(fill);
// Eclipse's light, retold: the laptop is the dark disc and the red sits behind it, so the desk behind the lid takes an
// oxblood rim, brightest close to the hinge (obsidian -> oxblood -> red). // cinetic:brand-supplied Eclipse red light
const behind = new THREE.SpotLight('#e51935', 95, 10, THREE.MathUtils.degToRad(80), 1.0, 2);
behind.position.set(0.4, 0.07, -2.7); behind.target.position.set(0.4, 0, -0.4);
behind.castShadow = true; behind.shadow.mapSize.set(1024, 1024); behind.shadow.radius = 10; behind.shadow.bias = -0.001;
scene.add(behind, behind.target);

// ---- time: the devices rise on the cut already moving and decelerate (pd-device-rise-on-cut), the shot scales back
// 1 -> 0.9 over 48 f; then the one flat hold, a 2% creep so it never freezes.
// The rise moves the whole picture (desk and all) up into frame, so nothing passes through the desk.
const rise = 1 - E_OUT(prog(t, CUT - 1 / 60, CUT + 43 / 60));
const SETTLE = CUT + 1.25;   // the devices land close (the lift), then pull back by 23.75 s: the flat hold before the mark runs 2.5 s (RULES)
const creep = lmix(1, 1.025, prog(t, SETTLE, 14 * BAR, (u) => u)); // the flat hold: a 2.5% creep, never frozen
const camera = new THREE.PerspectiveCamera(24, 1920 / 1080, 0.1, 100);
// Frame by projection: solve the distance and the view offset so the devices' screen box lands on a target box
// (the hold leaves the lower left to the copy; the reveal starts closer on the same axis).
const dir = new THREE.Vector3(-0.40, 0.34, 1).normalize();
const groupBox = new THREE.Box3().setFromObject(laptop).union(new THREE.Box3().setFromObject(phone));
scene.updateMatrixWorld(true);
const verts = (objs) => { // the devices' own vertices, so the fit follows the silhouette, not an axis-aligned box
  const out = [];
  for (const obj of objs) obj.traverse((m) => {
    if (!m.isMesh) return;
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 7) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
  });
  return out;
};
let corners = verts([laptop, phone]);
const look = groupBox.getCenter(new THREE.Vector3());
function screenBox(cam) {
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const c of corners) { const v = c.clone().project(cam); const X = (v.x + 1) * 960, Y = (1 - v.y) * 540; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
  return { x0, x1, y0, y1 };
}
function frameTo(T) {
  let dist = 12;
  camera.clearViewOffset();
  for (let i = 0; i < 6; i++) {
    camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
    const bx = screenBox(camera);
    dist *= Math.max((bx.x1 - bx.x0) / (T.x1 - T.x0), (bx.y1 - bx.y0) / (T.y1 - T.y0));
  }
  camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
  const bx = screenBox(camera);
  return { dist, ox: (bx.x0 + bx.x1) / 2 - (T.x0 + T.x1) / 2, oy: (bx.y0 + bx.y1) / 2 - (T.y0 + T.y1) / 2 };
}
const HOLD = frameTo({ x0: 700, x1: 1850, y0: 70, y1: 880 });
const REVEAL = frameTo({ x0: 170, x1: 1750, y0: 40, y1: 1010 }); // the reveal: both devices large, then back to the hold
const q = prog(t, CUT + 0.7, SETTLE, bez(0.48, 0.1, 0, 0.9));
const dist = lmix(REVEAL.dist, HOLD.dist, q) / creep;
camera.position.copy(look).addScaledVector(dir, dist); camera.lookAt(look);
const ox = REVEAL.ox + (HOLD.ox - REVEAL.ox) * q, oy = REVEAL.oy + (HOLD.oy - REVEAL.oy) * q;
camera.setViewOffset(1920, 1080, ox * creep, oy * creep - 300 * rise, 1920, 1080); // the rise: 300 px, ~20 px/f on the cut frame

renderer.render(scene, camera);
await new Promise((r) => requestAnimationFrame(r));
renderer.render(scene, camera);

// ---- copy (the flat hold only)
if (id === '10') {
  const el = document.createElement('div');
  el.className = 'copy';
  el.textContent = 'Now, read yours.';
  document.querySelector('.stage').append(el);
  await document.fonts.load('500 80px "Readex Pro"');
  const cs = getComputedStyle(document.documentElement);
  const size = parseFloat(cs.getPropertyValue('--copy-size')), base_ = parseFloat(cs.getPropertyValue('--copy-baseline'));
  const c = document.createElement('canvas').getContext('2d');
  c.font = `500 ${size}px "Readex Pro"`;
  const m = c.measureText(el.textContent);
  el.style.top = `${(base_ - m.fontBoundingBoxAscent - (size - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2).toFixed(2)}px`;
}
await wait(200);
document.body.dataset.ready = '1';
