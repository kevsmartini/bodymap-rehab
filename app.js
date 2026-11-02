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
          ? h("ul", { class: "videos" }, ...list.map((ex, i) => videoItem(ex, phase, list, i, region)))
          : h("p", { class: "phase-empty", text: "No exercises in this phase for this area yet." })
      );
      const panel = h("div", { class: "phase-panel", id: panelId, role: "region", "aria-label": `Phase ${phase.id}: ${phase.name}` }, inner);
      panel.inert = !isOpen;

      return h("section", { class: "phase", "data-band": phase.band, "data-phase": phase.id, "data-open": isOpen },
        h("h2", {}, toggle), panel);
    }));
  }

  function videoItem(ex, phase, list, index, region) {
    const li = h("li", { class: "vid" }, videoCard(ex, phase, list, index));
    if (ex.url) {
      const key = shareKey(region.id, state.side, ex);
      const btn = h("button", {
        type: "button",
        class: "pick",
        "data-key": key,
        onclick: () => toggleShare({ region: region.id, side: state.side, phase: ex.phase, title: ex.title })
      });
      li.append(btn);
      syncPick(li, btn, ex.title, share.keys.has(key));
    }
    return li;
  }

  function syncPick(li, btn, title, picked) {
    li.toggleAttribute("data-picked", picked);
    btn.setAttribute("aria-pressed", String(picked));
    btn.setAttribute("aria-label", `${picked ? "Remove from" : "Add to"} the list to send: ${title}`);
    btn.title = picked ? "In the list to send" : "Add to the list to send";
    btn.replaceChildren(icon(picked ? "i-check" : "i-plus"));
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

    syncPlayerPick();

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

  function playerItem() {
    const ex = player.list[player.index];
    return { region: state.region, side: state.side, phase: ex.phase, title: ex.title, url: ex.url };
  }

  function syncPlayerPick() {
    const btn = $(".player-pick", els.dialog);
    const item = playerItem();
    btn.hidden = !item.url;
    const picked = share.keys.has(shareKey(item.region, item.side, item));
    btn.setAttribute("aria-pressed", String(picked));
    btn.firstElementChild.replaceWith(icon(picked ? "i-check" : "i-plus"));
    btn.lastElementChild.textContent = picked ? "In the list" : "Add to list";
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

  // ---------- Lista para enviar por WhatsApp ----------
  // Se guarda en sessionStorage: sobrevive a una recarga pero no pasa al
  // día siguiente ni a otra pestaña.

  const SHARE_STORE = "bodymap-share";
  const share = { items: [], keys: new Set() };
  const shareEls = {
    dock: $(".share-dock"),
    count: $(".share-count"),
    dockLabel: $(".share-dock-label"),
    dialog: $(".share"),
    meta: $(".share-meta"),
    list: $(".share-list"),
    text: $(".share-text"),
    send: $(".share-send"),
    clear: $("[data-share-clear]"),
    status: $(".share-status"),
    preview: $(".share-preview")
  };

  function shareKey(regionId, side, ex) {
    return [regionId, side || "", ex.phase, ex.title].join("|");
  }

  function findExercise(item) {
    const region = regionsById.get(item.region);
    const ex = region && region.exercises.find((e) => e.phase === item.phase && e.title === item.title);
    return ex && ex.url ? { region, ex } : null;
  }

  function loadShare() {
    let saved = [];
    try { saved = JSON.parse(sessionStorage.getItem(SHARE_STORE)) || []; } catch {}
    // Si el catálogo cambió, se descartan los ejercicios que ya no existen.
    setShare(Array.isArray(saved) ? saved.filter(findExercise) : [], false);
  }

  function setShare(items, persist = true) {
    share.items = items;
    share.keys = new Set(items.map((i) => shareKey(i.region, i.side, i)));
    if (persist) {
      try { sessionStorage.setItem(SHARE_STORE, JSON.stringify(items)); } catch {}
    }
    syncShare();
  }

  function toggleShare(item) {
    const key = shareKey(item.region, item.side, item);
    const had = share.keys.has(key);
    setShare(had
      ? share.items.filter((i) => shareKey(i.region, i.side, i) !== key)
      : [...share.items, item]);
    if (!had) {
      shareEls.count.classList.remove("bump");
      void shareEls.count.offsetWidth;
      shareEls.count.classList.add("bump");
    }
  }

  // Ordenado como el catálogo: zona, lado, fase y orden de los ejercicios.
  function sortedShare() {
    const regionOrder = DATA.regions.map((r) => r.id);
    return share.items
      .map((item) => ({ item, ...findExercise(item) }))
      .filter((x) => x.ex)
      .sort((a, b) =>
        regionOrder.indexOf(a.item.region) - regionOrder.indexOf(b.item.region) ||
        (a.item.side || "").localeCompare(b.item.side || "") ||
        a.item.phase - b.item.phase ||
        a.region.exercises.indexOf(a.ex) - b.region.exercises.indexOf(b.ex));
  }

  function shareGroups() {
    const groups = [];
    for (const entry of sortedShare()) {
      const id = `${entry.item.region}|${entry.item.side || ""}`;
      let g = groups[groups.length - 1];
      if (!g || g.id !== id) groups.push(g = { id, region: entry.region, side: entry.item.side, phases: [] });
      let p = g.phases[g.phases.length - 1];
      if (!p || p.phase.id !== entry.item.phase) g.phases.push(p = { phase: phasesById.get(entry.item.phase), entries: [] });
      p.entries.push(entry);
    }
    return groups;
  }

  function areaName(region, side) {
    return region.paired && side ? `${side === "left" ? "Left" : "Right"} ${region.name.toLowerCase()}` : region.name;
  }

  function shareMessage(groups) {
    const lines = ["*Your rehab exercises*", "Tap a link to watch how each one is done."];
    for (const g of groups) {
      lines.push("", `*${areaName(g.region, g.side)}*`);
      for (const p of g.phases) {
        lines.push(`_Phase ${p.phase.id} · ${p.phase.name}_`);
        for (const { ex } of p.entries) {
          lines.push(`• ${ex.title}${ex.duration ? ` (${clock(ex.duration)})` : ""}`, ex.url);
        }
      }
    }
    return lines.join("\n");
  }

  function syncShare() {
    const n = share.items.length;
    const all = sortedShare();
    const time = all.reduce((sum, x) => sum + (x.ex.duration || 0), 0);

    shareEls.dock.hidden = n === 0;
    body.classList.toggle("has-share", n > 0);
    shareEls.count.textContent = String(n);
    shareEls.dockLabel.textContent = n === 1 ? "exercise to send" : "exercises to send";
    shareEls.dock.setAttribute("aria-label", `Review and send ${plural(n, "exercise", "exercises")}`);

    // Botones de los vídeos que hay en pantalla y del reproductor.
    for (const btn of els.phases.querySelectorAll(".pick")) {
      syncPick(btn.parentElement, btn, btn.parentElement.querySelector(".v-title").textContent, share.keys.has(btn.dataset.key));
    }
    if (els.dialog.open) syncPlayerPick();

    if (shareEls.dialog.open) renderShare(all, time);
  }

  function renderShare(all = sortedShare(), time = all.reduce((sum, x) => sum + (x.ex.duration || 0), 0)) {
    const groups = shareGroups();
    const empty = !all.length;
    shareEls.meta.textContent = empty
      ? "No exercises in the list"
      : `${plural(all.length, "exercise", "exercises")} · ${clock(time)} of video`;

    shareEls.list.replaceChildren(empty
      ? h("p", { class: "share-empty" }, "The list is empty. Add exercises with the ", icon("i-plus"), " button on each video.")
      : h("div", {}, ...groups.map((g) => h("section", { class: "share-group" },
          h("h3", {}, g.region.name, g.region.paired && g.side ? h("span", { text: ` · ${sideLabel(g.side).toLowerCase()}` }) : null),
          ...g.phases.map((p) => h("div", { class: "share-phase", "data-band": p.phase.band },
            h("p", { class: "share-tag" },
              h("b", { class: "tag-n", text: `Phase ${p.phase.id}` }),
              h("span", { class: "tag-name", text: p.phase.name }),
              meter(p.phase.id)
            ),
            h("ul", {}, ...p.entries.map(({ item, ex }) => h("li", {},
              h("span", { class: "share-title", text: ex.title }),
              ex.duration ? h("span", { class: "share-dur", text: clock(ex.duration), "aria-label": spokenDuration(ex.duration) }) : null,
              h("button", {
                type: "button",
                class: "icon-btn share-remove",
                "aria-label": `Remove ${ex.title}`,
                onclick: (e) => removeFromShare(item, e.currentTarget)
              }, icon("i-close"))
            )))
          ))
        ))));

    shareEls.text.textContent = empty ? "" : shareMessage(groups);
    shareEls.preview.hidden = empty;
    shareEls.clear.disabled = empty;
    // WhatsApp abre su selector de contactos con el mensaje ya escrito.
    shareEls.send.href = `https://wa.me/?text=${encodeURIComponent(shareEls.text.textContent)}`;
    shareEls.send.toggleAttribute("aria-disabled", empty);
  }

  function removeFromShare(item, btn) {
    const buttons = [...shareEls.list.querySelectorAll(".share-remove")];
    const at = buttons.indexOf(btn);
    toggleShare(item);
    const next = shareEls.list.querySelectorAll(".share-remove");
    (next[Math.min(at, next.length - 1)] || $("[data-share-close]", shareEls.dialog)).focus();
  }

  function openShare() {
    shareEls.status.textContent = "";
    renderShare();
    shareEls.dialog.showModal();
  }

  shareEls.dock.addEventListener("click", openShare);
  shareEls.dialog.addEventListener("click", (e) => {
    if (e.target === shareEls.dialog || e.target.closest("[data-share-close]")) shareEls.dialog.close();
  });

  shareEls.send.addEventListener("click", (e) => {
    if (!share.items.length) return e.preventDefault();
    shareEls.status.textContent = "WhatsApp opened in a new window. Clear the list when you’re done with this patient.";
  });

  shareEls.clear.addEventListener("click", () => {
    setShare([]);
    shareEls.status.textContent = "List cleared.";
    $("[data-share-close]", shareEls.dialog).focus();
  });

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
  $(".player-pick", els.dialog).addEventListener("click", () => {
    const { url, ...item } = playerItem();
    toggleShare(item);
  });

  function syncOnline() {
    body.classList.toggle("is-offline", !navigator.onLine);
    if (els.dialog.open) renderPlayer();
  }
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);
  window.addEventListener("hashchange", route);

  // ---------- Arranque ----------

  $(".sample-note").hidden = !DATA.sample;
  loadShare();
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
