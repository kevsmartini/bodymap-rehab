// 3D anatomy viewer. One instance is created on first use and reused for
// every area; switching areas only rebuilds the model inside the scene.
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { REGIONS, COLORS } from "./anatomy-data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const KIND_LABEL = { muscle: "Muscle", bone: "Bone", cartilage: "Cartilage" };

let instance = null;

export function showAnatomy(dialog, regionId, side) {
  if (!instance) instance = new AnatomyViewer(dialog);
  instance.show(regionId, side);
}

// ---------- Geometry ----------

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Seeded random so the fibre texture looks the same on every load.
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function fiberTexture(renderer) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const rand = seeded(7);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, size, size);
  // Fine vertical lines: they run along the muscle's length.
  for (let x = 0; x < size; x += 1.6 + rand() * 1.8) {
    const dark = rand() > 0.25;
    g.strokeStyle = dark
      ? `rgba(70, 12, 10, ${0.1 + rand() * 0.2})`
      : `rgba(255, 245, 235, ${0.25 + rand() * 0.25})`;
    g.lineWidth = 0.5 + rand() * 0.9;
    const drift = (rand() - 0.5) * 3;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + drift, size * 0.33, x - drift, size * 0.66, x, size);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// A tube along a CatmullRom curve with an elliptical, spindle-shaped section:
// thin at both ends, thickest at the belly, coloured muscle-red in the middle
// and fading to tendon-white at the ends.
function muscleGeometry(def) {
  const curve = new THREE.CatmullRomCurve3(def.path.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const length = curve.getLength();
  const facing = new THREE.Vector3(...(def.facing || [0, 0, 1])).normalize();
  const [ts, te] = def.tendon || [0.12, 0.12];
  const w = def.w || 1.2;
  const d = def.d || 0.8;
  const muscleColor = new THREE.Color(def.color || COLORS.muscle);
  const tendonColor = new THREE.Color(COLORS.tendon);

  const segs = 80;
  const radial = 24;
  const pos = [];
  const nor = [];
  const col = [];
  const uv = [];
  const idx = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const depthAxis = new THREE.Vector3();
  const widthAxis = new THREE.Vector3();
  const tmp = new THREE.Color();
  const circumference = Math.PI * def.r * (w + d);

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    curve.getTangentAt(t, T);
    depthAxis.copy(facing).addScaledVector(T, -facing.dot(T));
    if (depthAxis.lengthSq() < 1e-4) depthAxis.set(T.y, -T.x, 0);
    depthAxis.normalize();
    widthAxis.crossVectors(T, depthAxis).normalize();

    // 1 = muscle belly, 0 = tendon
    const m = smoothstep(ts * 0.45, ts * 1.35, t) * smoothstep(te * 0.45, te * 1.35, 1 - t);
    const spindle = 0.16 + 0.84 * Math.pow(Math.sin(Math.PI * t), 0.75);
    const tip = Math.sqrt(Math.min(1, Math.min(t, 1 - t) / 0.025));
    const radius = def.r * spindle * (0.42 + 0.58 * m) * tip;
    const rw = Math.max(radius * w, 1e-4);
    const rd = Math.max(radius * d, 1e-4);
    tmp.copy(tendonColor).lerp(muscleColor, m);

    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pos.push(
        P.x + widthAxis.x * c * rw + depthAxis.x * s * rd,
        P.y + widthAxis.y * c * rw + depthAxis.y * s * rd,
        P.z + widthAxis.z * c * rw + depthAxis.z * s * rd
      );
      const nx = widthAxis.x * c * rd + depthAxis.x * s * rw;
      const ny = widthAxis.y * c * rd + depthAxis.y * s * rw;
      const nz = widthAxis.z * c * rd + depthAxis.z * s * rw;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nor.push(nx / nl, ny / nl, nz / nl);
      col.push(tmp.r, tmp.g, tmp.b);
      uv.push((j / radial) * (circumference / 4), t * (length / 6));
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

const unitSphere = new THREE.SphereGeometry(1, 36, 24);

function partMeshes(part, material) {
  const meshes = [];
  if (part.tube) {
    const pts = part.tube.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    meshes.push(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(12, pts.length * 14), part.r, 16, false), material));
    // Rounded ends
    for (const end of [pts[0], pts[pts.length - 1]]) {
      const cap = new THREE.Mesh(unitSphere, material);
      cap.position.copy(end);
      cap.scale.setScalar(part.r);
      meshes.push(cap);
    }
  } else if (part.ring) {
    const [cx, cy, cz] = part.ring;
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const u = Math.cos(a) * part.radius;
      const v = Math.sin(a) * part.radius;
      if (part.axis === "x") pts.push(new THREE.Vector3(cx, cy + u, cz + v));
      else if (part.axis === "z") pts.push(new THREE.Vector3(cx + u, cy + v, cz));
      else pts.push(new THREE.Vector3(cx + u, cy, cz + v));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    meshes.push(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, part.r, 12, true), material));
  } else if (part.sphere) {
    const mesh = new THREE.Mesh(unitSphere, material);
    mesh.position.set(...part.sphere);
    mesh.scale.set(...(part.scale || [1, 1, 1]));
    if (part.rot) mesh.rotation.set(...part.rot.map(THREE.MathUtils.degToRad));
    meshes.push(mesh);
  }
  return meshes;
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
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    this.scene.add(this.camera);

    // Hemisphere fill, warm key light and a cool rim light behind the model.
    // Key and rim ride with the camera so the model is always lit the same way.
    this.scene.add(new THREE.HemisphereLight(0xf3efe8, 0x4f4740, 1.15));
    this.key = new THREE.DirectionalLight(0xffd9b0, 2.6);
    this.rim = new THREE.DirectionalLight(0xd6e4ff, 2.2);
    this.camera.add(this.key, this.rim);

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

    this.fiberTex = fiberTexture(this.renderer);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.structures = new Map();
    this.pickables = [];
    this.selected = null;
    this.layersOpen = false;
    this.layerT = 0;
    this.layerAnim = null;
    this.camAnim = null;
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

  show(regionId, side) {
    const region = REGIONS[regionId];
    if (!region) return;
    this.region = region;
    this.side = side || "right";
    this.paired = Boolean(side);
    this.titleEl.textContent = `${region.title} anatomy`;
    this.metaEl.textContent = (this.paired ? `Patient's ${this.side} · ` : "") + "Simplified teaching model";
    this.canvas.setAttribute("aria-label", `3D model of the ${region.title.toLowerCase()}. Use the structure list to select parts.`);

    this.build(region);
    this.renderList(region);
    this.select(null);
    this.layersOpen = false;
    this.layerT = 0;
    this.layersBtn.setAttribute("aria-pressed", "false");
    this.resize();
    this.frame();
    this.setView(region.view || "front", true);
    this.renderer.setAnimationLoop((time) => this.tick(time));
    this.status.hidden = true;
  }

  build(region) {
    this.disposeModel();
    const model = new THREE.Group();
    // Paired areas are modelled on the right; mirror them for the left side.
    if (this.paired && this.side === "left") model.scale.x = -1;

    for (const def of region.structures) {
      let material;
      const meshes = [];
      if (def.kind === "muscle") {
        material = new THREE.MeshStandardMaterial({ vertexColors: true, map: this.fiberTex, roughness: 0.6, metalness: 0 });
        meshes.push(new THREE.Mesh(muscleGeometry(def), material));
      } else {
        const isBone = def.kind === "bone";
        material = new THREE.MeshStandardMaterial({
          color: def.color || (isBone ? COLORS.bone : COLORS.cartilage),
          roughness: isBone ? 0.78 : 0.32,
          metalness: 0
        });
        for (const part of def.parts) meshes.push(...partMeshes(part, material));
      }
      const holder = new THREE.Group();
      for (const mesh of meshes) {
        mesh.userData.sid = def.id;
        holder.add(mesh);
        this.pickables.push(mesh);
      }
      model.add(holder);
      const dir = new THREE.Vector3(...(def.facing || [0, 0, 1])).normalize();
      this.structures.set(def.id, {
        def, material, holder,
        sep: def.layer === "superficial" ? dir.multiplyScalar(def.sep || Math.max(2.6, def.r * 2.2)) : null
      });
    }

    // Centre the model on the origin so orbiting turns around its middle.
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    this.root.add(model);
    this.model = model;
    this.bounds = box.getBoundingSphere(new THREE.Sphere());
    this.size = box.getSize(new THREE.Vector3());
  }

  disposeModel() {
    if (!this.model) return;
    this.model.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry !== unitSphere) obj.geometry.dispose();
      }
    });
    for (const s of this.structures.values()) s.material.dispose();
    this.root.remove(this.model);
    this.model = null;
    this.structures.clear();
    this.pickables = [];
  }

  frame() {
    // Fit the model's height (and its widest horizontal extent, since it
    // turns) into the view, leaving room for the toolbar.
    const r = this.bounds.radius;
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const across = Math.max(this.size.x, this.size.z);
    const fitV = (this.size.y / 2) / tanV;
    const fitH = (across / 2) / (tanV * this.camera.aspect);
    this.dist = Math.max(fitV, fitH) * 1.12 + across / 2;
    this.panLimit = r * 0.75;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = r * 0.5;
    this.controls.maxDistance = this.dist * 2.4;
    this.camera.near = r / 50;
    this.camera.far = this.dist * 10;
    this.camera.updateProjectionMatrix();
    this.key.position.set(r * 1.2, r * 1.6, r * 0.6);
    this.rim.position.set(-r * 0.8, r * 1.2, -this.dist * 2);
  }

  renderList(region) {
    const groups = [
      ["Superficial muscles", (s) => s.kind === "muscle" && s.layer === "superficial"],
      ["Deep muscles", (s) => s.kind === "muscle" && s.layer !== "superficial"],
      ["Bones", (s) => s.kind === "bone"],
      ["Cartilage", (s) => s.kind === "cartilage"]
    ];
    const frag = document.createDocumentFragment();
    for (const [label, test] of groups) {
      const items = region.structures.filter(test);
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
        btn.dataset.kind = s.kind;
        btn.setAttribute("aria-pressed", "false");
        const dot = document.createElement("span");
        dot.className = "swatch";
        dot.setAttribute("aria-hidden", "true");
        btn.append(dot, document.createTextNode(s.name));
        li.append(btn);
        ul.append(li);
      }
      section.append(h, ul);
      frag.append(section);
    }
    this.listEl.replaceChildren(frag);
  }

  // ---------- Selection ----------

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    return hit ? hit.object.userData.sid : null;
  }

  select(sid) {
    this.selected = sid;
    const highlight = new THREE.Color(COLORS.highlight);
    for (const [id, s] of this.structures) {
      const on = id === sid;
      s.material.emissive.copy(on ? highlight : new THREE.Color(0x000000));
      s.material.emissiveIntensity = on ? 0.42 : 0;
    }
    for (const btn of this.listEl.querySelectorAll("[data-sid]")) {
      btn.setAttribute("aria-pressed", String(btn.dataset.sid === sid));
    }

    const kindEl = this.infoEl.querySelector(".anat-kind");
    const nameEl = this.infoEl.querySelector(".anat-name");
    const descEl = this.infoEl.querySelector(".anat-desc");
    const s = sid && this.structures.get(sid);
    this.infoEl.dataset.kind = s ? s.def.kind : "";
    if (!s) {
      kindEl.textContent = "";
      nameEl.textContent = "Tap a structure";
      descEl.textContent = "Touch any muscle, bone or cartilage on the model, or choose one from the list, to see what it is and what it does.";
      return;
    }
    const d = s.def;
    kindEl.textContent = d.kind === "muscle" ? `${KIND_LABEL.muscle} · ${d.layer === "superficial" ? "superficial" : "deep"}` : KIND_LABEL[d.kind];
    nameEl.textContent = d.name;
    descEl.textContent = d.desc;
    const btn = this.listEl.querySelector(`[data-sid="${CSS.escape(sid)}"]`);
    if (btn) btn.scrollIntoView({ block: "nearest" });
  }

  // ---------- Views and layers ----------

  setViewPressed(view) {
    for (const btn of this.viewBtns) btn.setAttribute("aria-pressed", String(btn.dataset.view === view));
  }

  setView(view, instant = false) {
    this.setViewPressed(view);
    const lateral = this.side === "left" ? Math.PI / 2 : -Math.PI / 2;
    const azimuth = view === "back" ? Math.PI : view === "side" ? lateral : 0;
    const target = this.controls.target;
    const offset = new THREE.Vector3().subVectors(this.camera.position, target);
    const from = new THREE.Spherical().setFromVector3(offset);
    if (instant || !from.radius) {
      from.radius = this.dist;
      from.phi = Math.PI / 2 - 0.1;
    }
    const to = new THREE.Spherical(instant ? this.dist : from.radius, Math.PI / 2 - 0.1, azimuth);
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
      for (const s of this.structures.values()) {
        if (s.sep) s.holder.position.copy(s.sep).multiplyScalar(this.layerT);
      }
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
