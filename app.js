(() => {
  "use strict";

  const DATA = window.BODYMAP_DATA;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const mobileQuery = window.matchMedia("(max-width: 56rem)");

  // Puntos del mapa en coordenadas del SVG (200 × 440).
  // De frente, la derecha del paciente queda a la izquierda de la pantalla.
  const PAIRED_SPOTS = [
    { region: "shoulder", x: 64, y: 84 },
    { region: "elbow", x: 48, y: 160 },
    { region: "wrist", x: 40, y: 230 },
    { region: "hip", x: 82, y: 222 },
    { region: "knee", x: 82, y: 320 },
    { region: "ankle", x: 84, y: 404 }
  ];
  const SPOTS = {
    front: [
      { region: "neck", x: 100, y: 62 },
      ...mirror(PAIRED_SPOTS, "right", "left")
    ],
    back: [
      { region: "neck", x: 100, y: 62 },
      { region: "thoracic", x: 100, y: 120 },
      { region: "lumbar", x: 100, y: 190 },
      ...mirror(PAIRED_SPOTS, "left", "right")
    ]
  };
  const BACK_ONLY = new Set(["thoracic", "lumbar"]);

  const regionsById = new Map(DATA.regions.map((r) => [r.id, r]));
  const groupsById = new Map(DATA.groups.map((g) => [g.id, g]));
  const phasesById = new Map(DATA.phases.map((p) => [p.id, p]));
  const openPhaseByRegion = new Map();

  const state = { region: null, side: null, face: "front" };
  const player = { list: [], index: 0, phase: null };

  const $ = (sel, root = document) => root.querySelector(sel);
  const body = document.body;
  const els = {
    spots: $(".spots"),
    regions: $(".regions"),
    legend: $(".legend"),
    title: $("#region-title"),
    meta: $(".region-meta"),
    sideSwitch: $(".side-switch"),
    phases: $(".phases"),
    content: $("#content"),
    dialog: $(".player"),
    stage: $(".player-stage"),
    playerTitle: $("#player-title"),
    playerMeta: $(".player-meta"),
    playerExt: $(".player-ext"),
    lateralL: $("[data-l]"),
    lateralR: $("[data-r]")
  };

  // ---------- Utilidades ----------

  function mirror(spots, leftSide, rightSide) {
    return spots.flatMap((s) => [
      { region: s.region, side: leftSide, x: s.x, y: s.y },
      { region: s.region, side: rightSide, x: 200 - s.x, y: s.y }
    ]);
  }

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value == null) continue;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...children.filter((c) => c != null && c !== false));
    return el;
  }

  function svg(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }

  function icon(id, cls = "icon") {
    const el = svg("svg", { class: cls, "aria-hidden": "true" });
    el.append(svg("use", { href: `#${id}` }));
    return el;
  }

  function meter(level) {
    return h("span", { class: "meter", "aria-hidden": "true" },
      ...[1, 2, 3, 4].map((n) => h("i", { class: n <= level ? "on" : null })));
  }

  function clock(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // Para lectores de pantalla: "26 seconds", "1 minute 4 seconds".
  function spokenDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const parts = [];
    if (m) parts.push(plural(m, "minute", "minutes"));
    if (s || !m) parts.push(plural(s, "second", "seconds"));
    return parts.join(" ");
  }

  function total(exercises) {
    return exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
  }

  function plural(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function sideLabel(side) {
    return side === "left" ? "Patient's left" : "Patient's right";
  }

  function regionHash(regionId, side) {
    const region = regionsById.get(regionId);
    if (!region) return "#/";
    return region.paired ? `#/${regionId}/${side || "right"}` : `#/${regionId}`;
  }

  function parseVideo(url) {
    if (!url) return null;
    let u;
    try { u = new URL(url); } catch { return { kind: "other", url }; }
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      id = u.searchParams.get("v") || (u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/) || [])[1];
    }
    if (id) {
      return {
        kind: "youtube",
        url,
        embed: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1`,
        thumb: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
      };
    }
    if (host.endsWith("vimeo.com")) {
      // Unlisted videos carry a privacy hash: vimeo.com/ID/HASH or ?h=HASH.
      const [, vid, hash] = u.pathname.match(/(\d{5,})(?:\/([0-9a-f]{6,}))?/) || [];
      const h = hash || u.searchParams.get("h");
      if (vid) return { kind: "vimeo", url, embed: `https://player.vimeo.com/video/${vid}${h ? `?h=${encodeURIComponent(h)}` : ""}` };
    }
    return { kind: "other", url };
  }

  // ---------- Selector ----------

  function renderRegionList() {
    const frag = document.createDocumentFragment();
    for (const group of DATA.groups) {
      const items = DATA.regions.filter((r) => r.group === group.id);
      if (!items.length) continue;
      frag.append(h("div", { class: "group" },
        h("h2", { text: group.name }),
        h("ul", {}, ...items.map((r) => h("li", { class: "region-row" },
          h("a", { class: "region-link", href: regionHash(r.id, state.side), "data-region": r.id },
            h("span", { text: r.name }),
            h("small", { text: String(r.exercises.length), "aria-label": plural(r.exercises.length, "exercise", "exercises") })
          ),
          h("button", {
            type: "button",
            class: "anat-row-btn",
            title: "Anatomy",
            "aria-label": `Anatomy of the ${r.name.toLowerCase()}`,
            onclick: () => openAnatomy(r.id)
          }, icon("i-anatomy"))
        )))
      ));
    }
    els.regions.replaceChildren(frag);
  }

  function renderSpots() {
    const face = state.face;
    body.dataset.face = face;
    const lat = (side) => [h("small", { text: "Patient's" }), h("span", { text: side })];
    els.lateralL.replaceChildren(...lat(face === "front" ? "right" : "left"));
    els.lateralR.replaceChildren(...lat(face === "front" ? "left" : "right"));
    for (const btn of document.querySelectorAll(".seg-dark button")) {
      btn.setAttribute("aria-pressed", String(btn.dataset.face === face));
    }

    const frag = document.createDocumentFragment();
    for (const spot of SPOTS[face]) {
      const region = regionsById.get(spot.region);
      if (!region) continue;
      const label = spot.side ? `${region.name}, ${spot.side}` : region.name;
      const current = state.region === spot.region && (!region.paired || state.side === spot.side);
      const a = svg("a", {
        class: "spot",
        href: regionHash(spot.region, spot.side),
        "aria-label": label,
        "aria-current": String(current)
      });
      const title = svg("title");
      title.textContent = label;
      a.append(
        title,
        svg("circle", { class: "hit", cx: spot.x, cy: spot.y, r: 16 }),
        svg("circle", { class: "pulse", cx: spot.x, cy: spot.y, r: 7 }),
        svg("circle", { class: "dot", cx: spot.x, cy: spot.y, r: current ? 8.5 : 7 })
      );
      frag.append(a);
    }
    els.spots.replaceChildren(frag);
  }

  function syncRegionList() {
    for (const link of els.regions.querySelectorAll(".region-link")) {
      const id = link.dataset.region;
      link.href = regionHash(id, state.region === id ? state.side : null);
      if (id === state.region) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  // ---------- Inicio ----------

  function renderLegend() {
    els.legend.replaceChildren(...DATA.phases.map((p) =>
      h("li", { "data-band": p.band },
        h("span", { class: "tag-n", text: `Phase ${p.id}` }),
        h("span", { class: "tag-name", text: p.name }),
        meter(p.id)
      )
    ));
  }

  // ---------- Zona ----------

  function renderRegion() {
    const region = regionsById.get(state.region);
    const group = groupsById.get(region.group);
    const all = region.exercises;

    els.title.textContent = region.name;
    els.sideSwitch.hidden = !region.paired;
    for (const btn of els.sideSwitch.querySelectorAll("button")) {
      btn.setAttribute("aria-pressed", String(btn.dataset.side === state.side));
    }

    const phasesWithContent = DATA.phases.filter((p) => all.some((e) => e.phase === p.id));
    const metaParts = [];
    if (group) metaParts.push(group.name);
    if (region.paired) metaParts.push(sideLabel(state.side));
    metaParts.push(plural(all.length, "exercise", "exercises"));
    if (all.length) metaParts.push(`${clock(total(all))} total`);
    els.meta.textContent = metaParts.join(" · ");

    if (!all.length) {
      els.phases.replaceChildren(h("p", { class: "region-empty", text: "No exercises for this area yet." }));
      return;
    }

    if (!openPhaseByRegion.has(region.id)) {
      openPhaseByRegion.set(region.id, phasesWithContent[0] ? phasesWithContent[0].id : null);
    }
    const openId = openPhaseByRegion.get(region.id);

    els.phases.replaceChildren(...DATA.phases.map((phase) => {
      const list = all.filter((e) => e.phase === phase.id);
      const isOpen = phase.id === openId;
      const panelId = `phase-${region.id}-${phase.id}`;

      const toggle = h("button", {
        type: "button",
        class: "phase-toggle",
        "aria-expanded": String(isOpen),
        "aria-controls": panelId,
        onclick: () => togglePhase(region.id, phase.id)
      },
        h("span", { class: "tag" },
          h("b", { class: "tag-n", text: `Phase ${phase.id}` }),
          h("span", { class: "tag-name", text: phase.name }),
          meter(phase.id)
        ),
        h("span", { class: "phase-sum" },
          list.length
            ? h("b", { text: plural(list.length, "exercise", "exercises") })
            : h("span", { text: "No exercises" })
        ),
        h("span", { class: "phase-total" }, list.length ? clock(total(list)) : null),
        icon("i-chevron", "icon chev")
      );

      const inner = h("div", { class: "phase-inner" },
        list.length
          ? h("ul", { class: "videos" }, ...list.map((ex, i) => h("li", {}, videoCard(ex, phase, list, i))))
          : h("p", { class: "phase-empty", text: "No exercises in this phase for this area yet." })
      );
      const panel = h("div", { class: "phase-panel", id: panelId, role: "region", "aria-label": `Phase ${phase.id}: ${phase.name}` }, inner);
      panel.inert = !isOpen;

      return h("section", { class: "phase", "data-band": phase.band, "data-phase": phase.id, "data-open": isOpen },
        h("h2", {}, toggle), panel);
    }));
  }

  function videoCard(ex, phase, list, index) {
    const video = parseVideo(ex.url);
    return h("button", {
      type: "button",
      class: "video",
      onclick: () => openPlayer(list, index, phase)
    },
      h("span", { class: video ? "thumb" : "thumb is-empty" },
        video && video.thumb ? h("img", { src: video.thumb, alt: "", loading: "lazy", decoding: "async" }) : null,
        h("span", { class: "play" }, icon("i-play")),
        video ? null : h("span", { class: "no-video", text: "No video" })
      ),
      h("span", { class: "v-row" },
        h("span", { class: "v-title", text: ex.title }),
        ex.duration ? h("span", { class: "v-dur", text: clock(ex.duration), "aria-label": spokenDuration(ex.duration) }) : null
      )
    );
  }

  function togglePhase(regionId, phaseId) {
    const current = openPhaseByRegion.get(regionId);
    const next = current === phaseId ? null : phaseId;
    openPhaseByRegion.set(regionId, next);
    for (const section of els.phases.querySelectorAll(".phase")) {
      const open = Number(section.dataset.phase) === next;
      section.toggleAttribute("data-open", open);
      section.querySelector(".phase-toggle").setAttribute("aria-expanded", String(open));
      section.querySelector(".phase-panel").inert = !open;
    }
  }

  // ---------- Reproductor ----------

  function openPlayer(list, index, phase) {
    player.list = list;
    player.index = index;
    player.phase = phase;
    renderPlayer();
    if (!els.dialog.open) els.dialog.showModal();
  }

  function renderPlayer() {
    const ex = player.list[player.index];
    const phase = player.phase;
    const region = regionsById.get(state.region);
    const video = parseVideo(ex.url);

    els.dialog.dataset.band = phase.band;
    $(".player-bar .tag-n", els.dialog).textContent = `Phase ${phase.id}`;
    $(".player-bar .tag-name", els.dialog).textContent = phase.name;
    $(".player-bar .meter", els.dialog).replaceWith(meter(phase.id));

    els.playerTitle.textContent = ex.title;
    const meta = [region.paired ? `${region.name}, ${state.side}` : region.name];
    if (ex.duration) meta.push(clock(ex.duration));
    if (ex.equipment) meta.push(ex.equipment);
    if (ex.source) meta.push(ex.source);
    meta.push(`${player.index + 1} of ${player.list.length} in this phase`);
    els.playerMeta.textContent = meta.join(" · ");
    if (DATA.sample) els.playerMeta.append(h("span", { class: "sample-mark", text: "Sample · placeholder" }));

    els.playerExt.hidden = !video;
    if (video) {
      els.playerExt.href = video.url;
      els.playerExt.lastChild.textContent = video.embed ? "Open on platform" : "Open source page";
    }

    let stage;
    if (!video) {
      stage = message(null, "No video yet", "This exercise doesn't have a demonstration video yet.");
    } else if (!navigator.onLine) {
      stage = message("i-offline", "You're offline", "Videos stream from the internet. Try again once you're back online.");
    } else if (video.embed) {
      stage = h("iframe", {
        src: video.embed,
        title: ex.title,
        allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        allowfullscreen: true,
        referrerpolicy: "strict-origin-when-cross-origin"
      });
    } else {
      stage = message("i-external", "This demonstration opens outside the app", "It lives on the source page and can't play here. Use “Open source page”.");
    }
    els.stage.replaceChildren(stage);

    $("[data-step='-1']", els.dialog).disabled = player.index === 0;
    $("[data-step='1']", els.dialog).disabled = player.index === player.list.length - 1;
  }

  function message(iconId, title, text) {
    return h("div", { class: "stage-msg" },
      iconId ? icon(iconId) : null,
      h("strong", { text: title }),
      h("span", { text })
    );
  }

  function step(delta) {
    const next = player.index + delta;
    if (next < 0 || next >= player.list.length) return;
    player.index = next;
    renderPlayer();
  }

  // ---------- Anatomía 3D ----------

  const anatDialog = $(".anatomy");
  const anatStatus = $(".anat-status", anatDialog);
  let viewerModule = null;

  async function openAnatomy(regionId) {
    const region = regionsById.get(regionId);
    if (!region) return;
    const side = region.paired ? (state.region === regionId ? state.side : "right") : null;
    anatStatus.textContent = "Loading 3D view…";
    anatStatus.hidden = false;
    if (!anatDialog.open) anatDialog.showModal();
    try {
      viewerModule = viewerModule || await import("./anatomy-viewer.js");
      viewerModule.showAnatomy(anatDialog, regionId, side);
    } catch (err) {
      anatStatus.textContent = /webgl/i.test(String(err && err.message))
        ? "The 3D view needs WebGL, which this browser or device doesn’t support."
        : "Couldn’t load the 3D view. Check your connection and try again.";
    }
  }

  anatDialog.addEventListener("click", (e) => {
    if (e.target === anatDialog || e.target.closest("[data-anat-close]")) anatDialog.close();
  });
  $("[data-anatomy]").addEventListener("click", () => openAnatomy(state.region));

  // ---------- Navegación ----------

  function route(event) {
    const [id, side] = location.hash.replace(/^#\/?/, "").split("/");
    const region = regionsById.get(id);
    const wasView = body.dataset.view;
    const prevRegion = state.region;

    if (region) {
      state.region = region.id;
      state.side = region.paired ? (side === "left" ? "left" : "right") : null;
      if (BACK_ONLY.has(region.id)) state.face = "back";
      body.dataset.view = "region";
      renderRegion();
      if (prevRegion !== region.id) els.content.scrollTop = 0;
    } else {
      state.region = null;
      state.side = null;
      body.dataset.view = "home";
    }

    renderSpots();
    syncRegionList();

    if (event && mobileQuery.matches && wasView !== body.dataset.view) {
      window.scrollTo(0, 0);
      if (body.dataset.view === "region") els.title.setAttribute("tabindex", "-1"), els.title.focus({ preventScroll: true });
      else if (prevRegion) {
        const link = els.regions.querySelector(`[data-region="${prevRegion}"]`);
        if (link) link.focus({ preventScroll: true });
      }
    }
  }

  // ---------- Eventos ----------

  $(".seg-dark").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-face]");
    if (!btn || btn.dataset.face === state.face) return;
    state.face = btn.dataset.face;
    renderSpots();
  });

  els.sideSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-side]");
    if (!btn || !state.region) return;
    location.hash = regionHash(state.region, btn.dataset.side);
  });

  els.dialog.addEventListener("click", (e) => {
    if (e.target === els.dialog || e.target.closest("[data-close]")) els.dialog.close();
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) step(Number(stepBtn.dataset.step));
  });
  els.dialog.addEventListener("keydown", (e) => {
    if (e.target.closest("iframe")) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  els.dialog.addEventListener("close", () => els.stage.replaceChildren());

  function syncOnline() {
    body.classList.toggle("is-offline", !navigator.onLine);
    if (els.dialog.open) renderPlayer();
  }
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);
  window.addEventListener("hashchange", route);

  // ---------- Arranque ----------

  $(".sample-note").hidden = !DATA.sample;
  renderRegionList();
  renderLegend();
  syncOnline();
  route();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    setupUpdates();
  }

  // ---------- Aviso de nueva versión ----------

  function setupUpdates() {
    const sw = navigator.serviceWorker;
    const toast = $(".update-toast");
    let dismissed = false;

    sw.addEventListener("message", (e) => {
      if (e.data?.type === "update-ready" && !dismissed) toast.hidden = false;
    });

    $("[data-update-dismiss]", toast).addEventListener("click", () => {
      dismissed = true;
      toast.hidden = true;
    });

    $("[data-update-reload]", toast).addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      const reg = await sw.getRegistration();
      if (!reg?.active) return location.reload();
      // Se recarga cuando el service worker termina de bajar la app, o a los 8 s.
      sw.addEventListener("message", (m) => { if (m.data?.type === "refreshed") location.reload(); });
      setTimeout(() => location.reload(), 8000);
      reg.active.postMessage({ type: "refresh" });
    });

    // Las tablets de la clínica pueden tener la app abierta horas: se revisa
    // al volver a la app y cada 30 minutos.
    const check = async () => {
      if (document.hidden || !navigator.onLine) return;
      const reg = await sw.getRegistration();
      if (!reg) return;
      reg.update().catch(() => {});
      for (const url of ["index.html", "app.js", "data.js", "styles.css"]) {
        fetch(url, { cache: "no-cache" }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", check);
    setInterval(check, 30 * 60 * 1000);
  }
})();
