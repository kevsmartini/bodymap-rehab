// 3D anatomy viewer. One instance is created on first use and reused for
// every area; switching areas only swaps the model inside the scene.
//
// Models live in ./anatomy/<model>.glb with a matching <model>.json that lists
// the structures (id, label, layer, mesh names, description, function).
// They come from Z-Anatomy (CC BY-SA 4.0), based on BodyParts3D © DBCLS
// (CC BY-SA 2.1 Japan); the credit is shown in the viewer's panel.
//
// Model frame: metres, +y up, +z anterior, +x towards the patient's LEFT,
// centred on the joint. Limbs are modelled on the patient's left; the right
// side is the same model mirrored (scale.x = -1). Spine models are midline.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODELS_PATH = "./anatomy/";

// App area id (data.js) → model file.
const MODEL_FOR = {
  neck: "neck",
  thoracic: "upper_back",
  lumbar: "lower_back",
  shoulder: "shoulder",
  elbow: "elbow",
  wrist: "wrist_hand",
  hip: "hip",
  knee: "knee",
  ankle: "ankle_foot"
};

const LAYERS = [
  ["superficial", "Superficial muscles"],
  ["deep", "Deep muscles"],
  ["ligament", "Ligaments & cartilage"],
  ["bone", "Bones"]
];
const LAYER_DEPTH = { superficial: 0, deep: 1, ligament: 2, bone: 3 };
const KIND_LABEL = {
  superficial: "Muscle · superficial",
  deep: "Muscle · deep",
  ligament: "Ligament or cartilage",
  bone: "Bone"
};

const STAGE_GREY = 0x8b8b88;
const PEACH = new THREE.Color(0xf3d2af);
const BLACK = new THREE.Color(0x000000);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let instance = null;

export function hasAnatomy(regionId) {
  return regionId in MODEL_FOR;
}

export function showAnatomy(dialog, regionId, side) {
  if (!instance) instance = new AnatomyViewer(dialog);
  return instance.show(regionId, side);
}

// ---------- Materials ----------

// Muscle-fibre micro-relief: a procedural bump that runs along each part's
// main axis, faded out when the part is small on screen so it never shimmers.
const FIBER_GLSL = /* glsl */`
uniform vec3 uFibAxis; uniform float uFibAmp; uniform float uFibFreq; varying vec3 vFibPos;
float fhash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fnoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fhash(i), fhash(i + vec3(1,0,0)), f.x), mix(fhash(i + vec3(0,1,0)), fhash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fhash(i + vec3(0,0,1)), fhash(i + vec3(1,0,1)), f.x), mix(fhash(i + vec3(0,1,1)), fhash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fiberHeight(vec3 p){ vec3 a = uFibAxis; vec3 b = normalize(cross(a, abs(a.y) < 0.9 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0))); vec3 c = cross(a, b);
  vec3 q = vec3(dot(p, b) * uFibFreq, dot(p, c) * uFibFreq, dot(p, a) * uFibFreq * 0.06);
  return fnoise(q) * 0.65 + fnoise(q * vec3(2.7, 2.7, 1.9) + 7.1) * 0.35; }`;

function addFibers(material, axis, amp, freq) {
  const uniforms = { uFibAxis: { value: axis }, uFibAmp: { value: amp }, uFibFreq: { value: freq } };
  material.customProgramCacheKey = () => "fibers";
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFibPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvFibPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + FIBER_GLSL)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      { float fp = length(fwidth(vFibPos)) * uFibFreq; float fade = 1.0 - smoothstep(0.35, 1.1, fp);
        if (fade > 0.0) { vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
          float h = fiberHeight(vFibPos) * uFibAmp * fade; vec3 r1 = cross(dpdy, normal), r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1) * faceDirection; vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad); } }`);
  };
}

// Stable 0–1 value per structure id, so neighbouring muscles differ a little.
function hash01(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function makeMaterial(layer, id, axis) {
  if (layer === "superficial" || layer === "deep") {
    const r = hash01(id);
    const r2 = hash01(id + "x");
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHSL(0.992 + (r - 0.5) * 0.025, 0.66 + r2 * 0.1, (layer === "deep" ? 0.19 : 0.215) + (r - 0.5) * 0.04),
      roughness: 0.46, clearcoat: 0.32, clearcoatRoughness: 0.38,
      sheen: 0.3, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xff7a6a)
    });
    addFibers(m, axis, 0.00042, 1100);
    return m;
  }
  if (layer === "ligament") {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xe6e0d3, roughness: 0.3, clearcoat: 0.75, clearcoatRoughness: 0.2,
      sheen: 0.4, sheenColor: new THREE.Color(0xeef4ff)
    });
    addFibers(m, axis, 0.0002, 1800);
    return m;
  }
  return new THREE.MeshPhysicalMaterial({ color: 0xd8cbb0, roughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.6 });
}

// Main axis of a part (power iteration on the covariance of a vertex sample):
// the fibre relief runs along it.
function principalAxis(geo) {
  const pos = geo.attributes.position;
  const step = Math.max(1, Math.floor(pos.count / 1500));
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  const pts = [];
  for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i); pts.push(v.clone()); c.add(v); }
  c.divideScalar(pts.length);
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
  for (const p of pts) {
    const x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
    xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z;
  }
  const a = new THREE.Vector3(0.3, 1, 0.2).normalize();
  for (let k = 0; k < 24; k++) {
    a.set(xx * a.x + xy * a.y + xz * a.z, xy * a.x + yy * a.y + yz * a.z, xz * a.x + yz * a.y + zz * a.z).normalize();
  }
  return { axis: a, center: c };
}

// Bakes the node transform (gltfpack quantisation) into a plain float
// geometry so picking, framing and separation work in model metres.
function bakeGeometry(mesh) {
  const src = mesh.geometry;
  const p = src.attributes.position;
  const P = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    P[i * 3] = p.getX(i); P[i * 3 + 1] = p.getY(i); P[i * 3 + 2] = p.getZ(i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  if (src.index) g.setIndex(src.index);
  g.applyMatrix4(mesh.matrixWorld);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

// ---------- Viewer ----------

class AnatomyViewer {
  constructor(dialog) {
    this.dialog = dialog;
    this.canvas = dialog.querySelector(".anat-canvas");
    this.stage = dialog.querySelector(".anat-stage");
    this.status = dialog.querySelector(".anat-status");
    this.titleEl = dialog.querySelector("#anat-title");
    this.metaEl = dialog.querySelector(".anat-meta");
    this.infoEl = dialog.querySelector(".anat-info");
    this.listEl = dialog.querySelector(".anat-list");
    this.layersBtn = dialog.querySelector("[data-layers]");
    this.viewBtns = [...dialog.querySelectorAll("[data-view]")];

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(STAGE_GREY);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.005, 20);
    this.scene.add(this.camera);

    // Warm key, cool rim behind the model and a soft fill. They ride with
    // the camera so the model is lit the same way from every angle.
    this.key = new THREE.DirectionalLight(0xfff0de, 2.3);
    this.rim = new THREE.DirectionalLight(0xb9d2ff, 1.4);
    this.fill = new THREE.DirectionalLight(0xffe6e0, 0.5);
    this.camera.add(this.key, this.rim, this.fill);
    this.scene.add(new THREE.HemisphereLight(0x8a9bb0, 0x2a1c18, 0.3));

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = !reducedMotion.matches;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.rotateSpeed = 0.8;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener("start", () => {
      this.camAnim = null;
      this.setViewPressed(null);
    });

    this.loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.parts = [];
    this.structures = new Map();
    this.selected = null;
    this.layersOpen = false;
    this.layerT = 0;
    this.layerAnim = null;
    this.camAnim = null;
    this.loadToken = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.bindEvents();
    new ResizeObserver(() => this.resize()).observe(this.stage);
  }

  bindEvents() {
    let down = null;
    this.canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener("pointerup", (e) => {
      if (!down || e.button !== 0) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 6) return;
      this.select(this.pick(e));
    });
    let hoverQueued = false;
    this.canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || hoverQueued) return;
      hoverQueued = true;
      requestAnimationFrame(() => {
        hoverQueued = false;
        this.canvas.style.cursor = this.pick(e) ? "pointer" : "grab";
      });
    });

    for (const btn of this.viewBtns) btn.addEventListener("click", () => this.setView(btn.dataset.view));
    this.layersBtn.addEventListener("click", () => this.toggleLayers());
    this.listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sid]");
      if (btn) this.select(btn.dataset.sid === this.selected ? null : btn.dataset.sid);
    });
    this.dialog.addEventListener("close", () => this.renderer.setAnimationLoop(null));
  }

  // ---------- Model ----------

  async show(regionId, side) {
    const model = MODEL_FOR[regionId];
    if (!model) throw new Error(`No anatomy model for ${regionId}`);
    const token = ++this.loadToken;
    this.status.textContent = "Loading 3D model…";
    this.status.hidden = false;

    const [gltf, meta] = await Promise.all([
      this.loader.loadAsync(`${MODELS_PATH}${model}.glb`),
      fetch(`${MODELS_PATH}${model}.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    ]);
    // A newer request (another area) won while this one was downloading.
    if (token !== this.loadToken || !this.dialog.open) return;

    this.meta = meta;
    this.paired = meta.side !== "midline";
    this.side = this.paired ? (side === "right" ? "right" : "left") : "right";
    this.titleEl.textContent = `${meta.label} anatomy`;
    const count = `${meta.structures.length} structures`;
    this.metaEl.textContent = this.paired ? `Patient's ${this.side} · ${count}` : count;
    this.canvas.setAttribute("aria-label", `3D model of the ${meta.label.toLowerCase()}. Use the structure list to select parts.`);

    this.build(gltf, meta);
    this.renderList(meta);
    this.select(null);
    this.layersOpen = false;
    this.layerT = 0;
    this.layerAnim = null;
    this.layersBtn.setAttribute("aria-pressed", "false");
    this.resize();
    this.frame();
    this.setView(meta.defaultView || "front", true);
    this.renderer.setAnimationLoop((time) => this.tick(time));
    this.status.hidden = true;
  }

  build(gltf, meta) {
    this.disposeModel();
    const model = new THREE.Group();
    if (this.side === "right") model.scale.x = -1;

    const byMesh = new Map();
    for (const s of meta.structures) {
      for (const name of s.meshes) byMesh.set(name, s);
      this.structures.set(s.id, { def: s, objects: [] });
    }
    gltf.scene.updateMatrixWorld(true);
    const meshes = [];
    gltf.scene.traverse((n) => { if (n.isMesh) meshes.push(n); });

    for (const mesh of meshes) {
      let node = mesh;
      while (node && !byMesh.has(node.name)) node = node.parent;
      if (!node) continue;
      const def = byMesh.get(node.name);
      const geometry = bakeGeometry(mesh);
      const { axis, center } = principalAxis(geometry);
      const material = makeMaterial(def.layer, def.id, axis);
      const obj = new THREE.Mesh(geometry, material);
      obj.userData.sid = def.id;
      // Each part sits in its own holder so separation can move it.
      const holder = new THREE.Group();
      holder.add(obj);
      model.add(holder);
      const dir = center.lengthSq() < 1e-8 ? new THREE.Vector3(0, 0, 1) : center.clone().normalize();
      this.parts.push({ obj, holder, dir, depth: LAYER_DEPTH[def.layer] ?? 3, base: material.color.clone() });
      this.structures.get(def.id).objects.push(obj);
    }
    // Drop entries the file lists but the model doesn't carry.
    for (const [id, s] of this.structures) if (!s.objects.length) this.structures.delete(id);

    this.gltfScene = gltf.scene;
    this.root.add(model);
    this.model = model;
  }

  disposeModel() {
    for (const p of this.parts) {
      p.obj.geometry.dispose();
      p.obj.material.dispose();
    }
    if (this.gltfScene) {
      this.gltfScene.traverse((n) => { if (n.isMesh) n.geometry.dispose(); });
      this.gltfScene = null;
    }
    if (this.model) this.root.remove(this.model);
    this.model = null;
    this.parts = [];
    this.structures.clear();
  }

  frame() {
    // focusSize is the box the region is about; bones running out of it
    // (femur, humerus…) are allowed to leave the frame. Limb boxes are tight
    // around the joint, so they get extra room to show what it connects.
    const room = this.paired ? 1.4 : 1;
    const [sx, sy, sz] = (this.meta.focusSize || [0.2, 0.2, 0.2]).map((v) => v * room);
    this.radius = Math.hypot(sx, sy, sz) / 2;
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const across = Math.max(sx, sz);
    const fitV = (sy / 2) / tanV;
    const fitH = (across / 2) / (tanV * this.camera.aspect);
    this.dist = Math.max(fitV, fitH) * 1.08 + across / 2;
    this.panLimit = this.radius * 0.75;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = this.radius * 0.4;
    this.controls.maxDistance = this.dist * 3;
    this.camera.near = this.radius / 50;
    this.camera.far = this.dist * 12;
    this.camera.updateProjectionMatrix();
    const r = this.radius;
    this.key.position.set(r * 1.6, r * 4.4, r * 3.2);
    this.rim.position.set(-r * 2.8, r * 2.2, -this.dist * 2);
    this.fill.position.set(-r * 3.2, r * 0.6, r * 2.6);
  }

  renderList(meta) {
    const frag = document.createDocumentFragment();
    for (const [layer, label] of LAYERS) {
      const items = meta.structures.filter((s) => s.layer === layer && this.structures.has(s.id));
      if (!items.length) continue;
      const section = document.createElement("section");
      const h = document.createElement("h3");
      h.textContent = label;
      const ul = document.createElement("ul");
      for (const s of items) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.sid = s.id;
        btn.dataset.kind = layer;
        btn.setAttribute("aria-pressed", "false");
        const dot = document.createElement("span");
        dot.className = "swatch";
        dot.setAttribute("aria-hidden", "true");
        btn.append(dot, document.createTextNode(s.label));
        li.append(btn);
        ul.append(li);
      }
      section.append(h, ul);
      frag.append(section);
    }
    this.listEl.replaceChildren(frag);
    this.listEl.scrollTop = 0;
  }

  // ---------- Selection ----------

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.parts.map((p) => p.obj), false)[0];
    return hit ? hit.object.userData.sid : null;
  }

  select(sid) {
    if (sid && !this.structures.has(sid)) sid = null;
    this.selected = sid;
    for (const p of this.parts) {
      const on = p.obj.userData.sid === sid;
      const m = p.obj.material;
      m.color.copy(p.base);
      if (on) m.color.lerp(PEACH, 0.55);
      m.emissive.copy(on ? PEACH : BLACK);
      m.emissiveIntensity = on ? 0.42 : 0;
    }
    for (const btn of this.listEl.querySelectorAll("[data-sid]")) {
      btn.setAttribute("aria-pressed", String(btn.dataset.sid === sid));
    }

    const kindEl = this.infoEl.querySelector(".anat-kind");
    const nameEl = this.infoEl.querySelector(".anat-name");
    const descEl = this.infoEl.querySelector(".anat-desc");
    const funcEl = this.infoEl.querySelector(".anat-func");
    const s = sid && this.structures.get(sid);
    if (!s) {
      delete this.infoEl.dataset.kind;
      kindEl.textContent = "";
      nameEl.textContent = "Tap a structure";
      descEl.textContent = "Touch any muscle, ligament or bone on the model, or choose one from the list, to see what it is and what it does.";
      funcEl.replaceChildren();
      funcEl.hidden = true;
      return;
    }
    const d = s.def;
    this.infoEl.dataset.kind = d.layer;
    kindEl.textContent = KIND_LABEL[d.layer] || "";
    nameEl.textContent = d.label;
    descEl.textContent = d.description || "";
    if (d.function) {
      const b = document.createElement("strong");
      b.textContent = "Function. ";
      funcEl.replaceChildren(b, document.createTextNode(d.function));
      funcEl.hidden = false;
    } else {
      funcEl.replaceChildren();
      funcEl.hidden = true;
    }
    const btn = this.listEl.querySelector(`[data-sid="${CSS.escape(sid)}"]`);
    if (btn) btn.scrollIntoView({ block: "nearest" });
  }

  // ---------- Views and layers ----------

  setViewPressed(view) {
    for (const btn of this.viewBtns) btn.setAttribute("aria-pressed", String(btn.dataset.view === view));
  }

  setView(view, instant = false) {
    this.setViewPressed(view);
    // Side looks at the lateral face: +x for the patient's left, −x for the right.
    const lateral = this.side === "left" ? Math.PI / 2 : -Math.PI / 2;
    const azimuth = view === "back" ? Math.PI : view === "side" ? lateral : 0;
    const target = this.controls.target;
    const offset = new THREE.Vector3().subVectors(this.camera.position, target);
    const from = new THREE.Spherical().setFromVector3(offset);
    if (instant || !from.radius) {
      from.radius = this.dist;
      from.phi = Math.PI / 2 - 0.08;
    }
    const to = new THREE.Spherical(instant ? this.dist : from.radius, Math.PI / 2 - 0.08, azimuth);
    let dTheta = to.theta - from.theta;
    dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    if (instant || reducedMotion.matches) {
      this.applySpherical(new THREE.Spherical(to.radius, to.phi, from.theta + dTheta));
      this.camAnim = null;
      return;
    }
    this.camAnim = { from, dTheta, dPhi: to.phi - from.phi, start: performance.now(), dur: 750 };
  }

  applySpherical(sph) {
    this.camera.position.setFromSpherical(sph).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
  }

  toggleLayers() {
    this.layersOpen = !this.layersOpen;
    this.layersBtn.setAttribute("aria-pressed", String(this.layersOpen));
    this.layerAnim = { from: this.layerT, to: this.layersOpen ? 1 : 0, start: performance.now(), dur: reducedMotion.matches ? 0 : 650 };
  }

  // ---------- Loop ----------

  resize() {
    const { clientWidth: w, clientHeight: h } = this.stage;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  tick(now) {
    const ease = (t) => 1 - Math.pow(1 - t, 4);

    if (this.camAnim) {
      const a = this.camAnim;
      const t = Math.min(1, (now - a.start) / a.dur);
      const k = ease(t);
      this.applySpherical(new THREE.Spherical(a.from.radius, a.from.phi + a.dPhi * k, a.from.theta + a.dTheta * k));
      if (t >= 1) this.camAnim = null;
    }

    if (this.layerAnim) {
      const a = this.layerAnim;
      const t = a.dur ? Math.min(1, (now - a.start) / a.dur) : 1;
      this.layerT = a.from + (a.to - a.from) * ease(t);
      // Parts move out from the centre; superficial ones furthest, bones stay.
      const reach = this.layerT * this.radius * 0.13;
      for (const p of this.parts) p.holder.position.copy(p.dir).multiplyScalar(reach * (3 - p.depth));
      if (t >= 1) this.layerAnim = null;
    }

    this.controls.update();

    // Panning is limited to moving up and down.
    const target = this.controls.target;
    const drift = new THREE.Vector3(target.x, 0, target.z);
    const over = target.y - THREE.MathUtils.clamp(target.y, -this.panLimit, this.panLimit);
    if (drift.lengthSq() > 1e-8 || over) {
      drift.y = over;
      target.sub(drift);
      this.camera.position.sub(drift);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
