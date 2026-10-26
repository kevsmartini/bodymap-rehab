---
name: BodyMap Rehab
description: Rehab exercise videos by body area and phase, shown to the patient across the desk.
colors:
  forest: "#09251C"
  amber: "#A55704"
  peach: "#F3D2AF"
  cream: "#F8EADC"
  tan: "#D9A46A"
  ground: "#F3E2CE"
  ink-2: "#4B5A50"
  rule: "#E3C9AC"
  sample-dash: "#C8A682"
  rail-raised: "#133A2D"
  rail-line: "#24503F"
  rail-text-2: "#BCC4B3"
  stage: "#061A13"
  scene-muscle: "#B4382F"
  scene-tendon: "#EFE7DA"
  scene-bone: "#E4D8C0"
  scene-cartilage: "#A9D2EA"
  scene-stage: "#8B8B88"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.2vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  brand:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  segment:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  label:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
  band-tag:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  hairline: "1px"
  focus: "2px"
  sm: "4px"
  md: "6px"
  full: "50%"
spacing:
  xs: "0.375rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.75rem"
  xxl: "3rem"
components:
  button-light:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.forest}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-light-hover:
    backgroundColor: "{colors.peach}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.forest}"
  segment-dark:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.rail-text-2}"
    typography: "{typography.segment}"
    rounded: "{rounded.md}"
    padding: "3px"
  segment-dark-active:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.forest}"
    rounded: "{rounded.sm}"
    height: "2.5rem"
  segment-light:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink-2}"
    typography: "{typography.segment}"
    rounded: "{rounded.md}"
    padding: "3px"
  segment-light-hover:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.forest}"
  segment-light-active:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.ground}"
    rounded: "{rounded.sm}"
    height: "2.5rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-outline-hover:
    backgroundColor: "{colors.peach}"
  region-link:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.5rem"
  region-link-hover:
    backgroundColor: "{colors.rail-raised}"
  region-link-active:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.forest}"
  anat-row-button:
    backgroundColor: "transparent"
    textColor: "{colors.rail-text-2}"
    rounded: "{rounded.sm}"
  anat-row-button-hover:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.peach}"
  phase-row:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.forest}"
    rounded: "{rounded.md}"
    height: "4.5rem"
  band-tag-peach:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.forest}"
    typography: "{typography.band-tag}"
    width: "13rem"
  band-tag-tan:
    backgroundColor: "{colors.tan}"
    textColor: "{colors.forest}"
    typography: "{typography.band-tag}"
    width: "13rem"
  band-tag-amber:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.cream}"
    typography: "{typography.band-tag}"
    width: "13rem"
  band-tag-forest:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    typography: "{typography.band-tag}"
    width: "13rem"
  offline-chip:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.6rem"
  sample-note:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.9rem"
  player:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    width: "min(70rem, calc(100vw - 2rem))"
  player-stage:
    backgroundColor: "{colors.stage}"
    textColor: "{colors.rail-text-2}"
  anatomy-dialog:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    width: "min(84rem, calc(100vw - 2rem))"
    height: "min(54rem, calc(100dvh - 2rem))"
  anatomy-stage:
    backgroundColor: "{colors.scene-stage}"
    textColor: "{colors.forest}"
  anatomy-layers-toggle:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.cream}"
    typography: "{typography.segment}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  anatomy-layers-toggle-hover:
    backgroundColor: "{colors.rail-line}"
  anatomy-layers-toggle-active:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.forest}"
  anatomy-list-item:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0.4rem 0.5rem"
    height: "2.5rem"
  anatomy-list-item-hover:
    backgroundColor: "{colors.rail-raised}"
  anatomy-list-item-active:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.forest}"
---

# Design System: BodyMap Rehab

## Overview

**Creative North Star: "Resistance Bands"**

The phases of rehab wear the colours of elastic exercise bands, and the bands deepen as load rises: peach, tan, amber, forest. Progression is legible three ways at once: by tone running light to dark, by the "PHASE n" number, and by stripe density printed into the band itself. The palette is pinned by the client (forest, amber, peach, cream) and contains no white anywhere: every surface is warm and soft so the screen does not tire the eyes through a consultation.

The interface is a consulting-room tool, used live by a clinician while the patient watches the same screen across a desk. It is dense in the way a good instrument is dense: a persistent forest rail holds the body map and the area list, the content pane holds stacked band rows on a warm ground, and every exercise carries a right-aligned tabular duration. Type is set for reading at a distance, in one hyperlegible family; the condensed uppercase face appears only on the band tag, where it reads like the print on a real band.

Surfaces are flat. Depth comes from the dark forest rail against the warm ground, hairline borders and cream panels, never from shadows. Peach is the one light touch on the rail: it marks what is currently selected. Motion is short and elastic, with one signature: opening a phase stretches its band.

One place steps outside the client palette on purpose: the 3D anatomy viewer. Inside its stage the body is drawn in anatomical colours the user asked for (red muscle fading to off-white tendon, bone, light-blue cartilage) on a neutral grey ground, lit like a model. Everything around that stage, the dialog, the list, the controls, stays forest, cream and peach.

**Key Characteristics:**
- Four phase bands running light to dark with load: peach, tan, amber, forest.
- No white anywhere; cream is the lightest value in the system.
- Stripe density as a non-colour phase encoding (22 / 14 / 9 / 6px repeat), with a per-band stripe colour.
- Persistent forest rail with body map and area list; peach marks the current selection on it.
- Atkinson Hyperlegible Next for everything read; Barlow Condensed uppercase only on band tags.
- Flat, hairline-bordered, 4–6px corners, no shadows outside the floating controls over the 3D stage.
- A scoped anatomical scene palette, used only inside the 3D anatomy stage.
- Tabular, right-aligned durations and totals.

## Colors

A warm, low-glare palette of four client-pinned colours (forest, amber, peach, cream), one derived band tone (tan) and warm derived neutrals, with no white.

### Primary
- **Deep Forest** (forest): the structural ink of the system. The rail background, all primary text on light surfaces (the stylesheet's `ink` and `rail` both alias it), the active light-segment fill, the focus ring on light surfaces, text on the peach and tan bands, and the fourth and heaviest phase band.

### Secondary
- **Burnt Amber** (amber): Phase 3. Appears only as a phase band; takes cream text.

### Tertiary
- **Soft Peach** (peach): Phase 1, the lightest load, with forest text. On the forest rail it is also the selection colour: the selected Front/Back segment, the current area link and the current map dot. In the player it is the light button's hover; on light surfaces it is the outline button's hover. In the anatomy viewer it marks the pressed view segment, the pressed "Separate layers" toggle, the selected structure in the list and the selected structure's kind label, and it is the emissive glow on the selected structure in the scene.
- **Warm Tan** (tan): Phase 2, derived between peach and amber to complete the light-to-dark run. Forest text. Appears only as a phase band.

Each band is set per element via `data-band` (peach, tan, amber, forest), which supplies the band colour, the text colour on the band, the stripe colour and the stripe gap. The thumbnail tint inside a phase is derived, not stored: `color-mix(in oklab, band 30%, panel)`. The solid band fills the play button.

### Neutral
- **Cream** (cream): phase rows, the light segmented control and the light button; primary text on the rail and in the player (the stylesheet's `panel` and `rail-text` alias it); text on the amber and forest bands.
- **Warm Ground** (ground): page background; text on the active light segment and the light-surface selection highlight.
- **Moss Graphite** (ink-2): secondary text on light surfaces: lede, metadata, summaries, durations, chevrons, sample notes, the empty play ring.
- **Sand Hairline** (rule): borders on phase rows and the light segmented control.
- **Placeholder Dash** (sample-dash): the 1px dashed border on sample notes and empty-region boxes, the dashed variant of the hairline role reserved for placeholder content.
- **Rail Raised** (rail-raised): one step up from forest: body silhouette, dark segmented control, rail hover fill, offline chip, and the player surface.
- **Rail Line** (rail-line): dividers and borders on the rail and in the player; ghost-button border; the dashed spine on the back view.
- **Rail Sage** (rail-text-2): secondary text on the rail and in the player: group headings, counts, unselected segments, map-dot strokes, player metadata.
- **Stage Black-Green** (stage): the 16:9 video stage inside the player, one step below the rail, so video sits in the darkest well without using black.

### Anatomical Scene (scoped)
Used only inside the 3D anatomy stage, set as material and background colours in the scene; requested explicitly by the user so the model reads as anatomy, not as brand.
- **Muscle Red** (scene-muscle): muscle bellies, with a fibre texture running along each muscle's length.
- **Tendon Ivory** (scene-tendon): tendons; each muscle fades from red into tendon at both ends. The muscle swatch in the structure list repeats this as tendon / muscle / tendon.
- **Bone** (scene-bone): bones.
- **Cartilage Blue** (scene-cartilage): cartilage, menisci and discs.
- **Neutral Stage Grey** (scene-stage): the stage background and the loading/status screen behind the canvas, a neutral mid grey so the anatomical colours read true. Text on it is forest.
- **Selection glow:** the selected structure glows peach (emissive at 0.42); no new hue.

Lighting is part of the scene material: a hemisphere fill (warm light sky over a warm dark ground), a warm key light and a cool rim light, with key and rim attached to the camera so the model is lit the same way from every angle.

### Named Rules
**The No White Rule.** There is no #FFFFFF, and no near-white cooler than cream, anywhere in the system. Cream is the lightest surface and the lightest text; new light surfaces are cream or ground.

**The Anatomical Scene Exception.** Inside the 3D anatomy stage, and only there, the scene palette applies: tendon ivory, bone, cartilage blue and the neutral grey stage sit outside the No White and Three Neutral Roles rules because the user asked for anatomical colour. The exception ends at the canvas edge: app chrome, including the viewer's own dialog, list and controls, stays on the client palette, and no scene colour is used as a UI colour.

**The Light To Dark Rule.** Phase tone deepens with load: peach (1), tan (2), amber (3), forest (4). A new phase surface takes its band from `data-band`, never a free-picked hue.

**The Band Hues Rule.** Amber and tan appear only where they identify a phase: legend tiles, band tags, the player bar, thumbnail tints and play buttons. Peach is a band and, on the forest rail, in the player and in the anatomy viewer, the selection, pressed and hover highlight; forest is a band and the system's ink. None of them is used for status, errors, success or decoration.

**The Three Neutral Roles Rule.** Outside the bands, each surface uses three neutral roles: primary text, secondary text, hairline. On light surfaces these are forest, ink-2 and rule over ground and cream (with sample-dash as the dashed hairline for placeholders); on the rail and in the player they are cream, rail-text-2 and rail-line over forest and rail-raised. A new neutral maps onto one of these roles.

**The Stripe Density Rule.** Every band surface carries a 2px vertical stripe whose gap tightens with load: peach 22px, tan 14px, amber 9px, forest 6px. The stripe colour is tuned per band: forest at 10% on peach, 12% on tan, 16% on amber, and cream at 10% on forest. The four-step meter (filled bars = phase number) repeats the encoding. Phase must stay readable with colour removed.

## Typography

**Body Font:** Atkinson Hyperlegible Next (variable 200–800, self-hosted), with system-ui fallback
**Label Font:** Barlow Condensed 700 (self-hosted), with Arial Narrow fallback

**Character:** A hyperlegible humanist sans does all the reading, chosen so the patient can read it across the desk; a condensed athletic uppercase plays the role of the print on a band and nothing else.

### Hierarchy
- **Display** (800, clamp(2rem → 2.75rem), 1.1, -0.02em, balanced wrap): the page title: the home question and the region name. 1.75rem on the phone home view.
- **Headline** (800, 1.5rem, 1.2, -0.01em): the video title in the player.
- **Brand** (800, 1.375rem, -0.01em): the brand mark in the rail header; the same size and weight titles the anatomy dialog and names the selected structure (1.25rem below 56rem).
- **Lede** (400, 1.25rem): the one-line instruction under the home title, in moss graphite. The player's stage message heading uses the same size.
- **Title** (600, 1rem, 1.25–1.3): phase names inside tags, video titles, legend heading, region links, button labels.
- **Body** (400, 1.0625rem, 1.45): summaries, metadata and messages. Durations, counts and totals use tabular figures.
- **Body Small** (400, 0.9375rem): video durations, sample notes, anatomy structure-list items, and the phase summary and total below 56rem.
- **Segment** (600, 0.9375rem): segmented-control labels; 0.875rem on the rail control at 75rem and below.
- **Label** (600, 0.875rem, 1.2): rail group headings, area counts, laterality labels, the offline chip; in the anatomy viewer, list group headings, the dialog meta line (regular weight) and the peach kind label.
- **Caption** (600, 0.8125rem): placeholder marks (the "No video" label on an empty thumbnail and the sample mark in the player, regular weight there) and the interaction hint over the 3D stage.
- **Band Tag** (Barlow Condensed 700, 1.75rem, line-height 1, 0.04em, uppercase): "PHASE n" on band tags; 1.5rem in the player bar and below 56rem.

### Named Rules
**The One Reading Face Rule.** Everything a person reads (titles, lists, buttons, durations, messages) is Atkinson Hyperlegible Next. Barlow Condensed is used only for the "PHASE n" tag on a band and is always uppercase.

**The Tabular Time Rule.** Durations, exercise counts and phase totals use tabular figures and sit right-aligned, so a column of times reads like a track list.

## Layout

A two-column console: a persistent forest rail (25rem) on the left and a scrolling content pane on the right, both full viewport height and scrolling independently. Inside the rail, a two-column body: the map column (10.5rem: Front/Back control, laterality labels, silhouette, sticky) beside the grouped area list. Content tops out at 76rem; the legend at 56rem.

Phase rows stack with a 0.75rem gap. Each row is a grid: band tag at a fixed width (13rem) on the left, then summary, right-aligned total and chevron. When open, the video grid (auto-fill, min 12rem, 16:9 thumbnails) is indented to start past the band column.

Spacing is rem-based and repeats a small set of steps: 0.375, 0.75, 1, 1.25, 1.75 and 3rem. Content padding is fluid: clamp(1.25rem, 3vw, 3rem). Touch targets are at least 2.5rem (segments) and 2.75rem (buttons, back link, play).

**Breakpoints:**
- **≤ 75rem (tablet landscape):** rail narrows to 22.5rem, map column to 8.5rem, band tag to 10rem, video minimum to 10rem.
- **≤ 56rem (tablet portrait and phone):** single column, list then detail. The home view shows the rail (map and list) inline above the legend; choosing an area routes to its own page, hides the rail and shows an "Areas" back link. Band tags turn horizontal across the full row width (4.25rem tall), with summary and total on a second line. The player and the anatomy viewer go full-screen with square corners; the player gets a two-column button grid, the viewer stacks its structure panel under the stage (capped at 40dvh) and keeps the floating controls on one line. The Anatomy button moves after the region title's line. Legend drops to two columns.
- **≤ 22rem:** map stacks above the list, capped at 12rem and centred.

### Named Rules
**The Persistent Rail Rule.** Above 56rem the rail never scrolls away or collapses; choosing an area changes only the content pane.

## Elevation & Depth

Flat. Apart from one scoped exception, there are no box-shadows in the system. Depth is tonal and structural: the forest rail against the warm ground, cream panels with sand hairlines on that ground, and one step of raise on the forest (rail-raised) for hover, controls and the player surface. The player's video stage drops one step below the rail (stage). The two overlays, the video player and the anatomy viewer, are modals over a backdrop of forest at 72% opacity. Over the 3D stage, the interaction hint sits on cream at 86% so it reads against the grey.

### Shadow Vocabulary
- **Floating control** (`box-shadow: 0 6px 18px rgba(9, 37, 28, .25)`): the camera-view segment and the "Separate layers" toggle floating over the 3D canvas, and nothing else. The moving model passes behind them, so a soft forest shadow keeps them legible as a layer above it.

### Named Rules
**The No-Shadow Rule.** Surfaces separate by tone and hairline, never by shadow. A new layer is either a tonal step or a modal over the forest backdrop.

**The Floating Control Exception.** Controls that float over the live 3D canvas carry the floating-control shadow. It is not used on any flat app surface, panel, card or dialog.

## Shapes

Gently squared corners: 6px on containers (phase rows, segmented controls, legend tiles, player, dashed notes), 4px on things inside them (segments, buttons, links, thumbnails, chips, the sample mark). Focus outlines carry a 2px corner so the ring softens without reading as a pill. The meter bars use 1px. The only circles are the play button and the body-map dots. Borders are 1px hairlines; dashed borders (1px, or 2px on an empty play button) mark placeholder or sample content. The band fill inside a phase row is clipped by the row's own corners, so the band reads as a strip inset into the card. The anatomy list swatches are 0.75rem circles with a forest hairline ring, the one other circle, since they stand for materials, not controls. Below 56rem the player and the anatomy viewer lose their radius and go edge to edge.

## Components

### Buttons
Plain, firm controls that live in the player, on the rail-raised surface.
- **Shape:** gently squared (4px), minimum height 2.75rem, padding 0.5rem 1rem, 600 weight, inline SVG icon with a 0.375rem gap.
- **Light (primary):** cream fill, forest text; hover warms to peach.
- **Ghost:** transparent with a rail-line border, cream text; hover sinks to the forest fill.
- **Outline:** on light surfaces only (the Anatomy button beside the region title). Transparent with a forest 1px border and forest text, minimum height 2.5rem, a 1.125rem inline icon; hover fills peach.
- **Disabled:** 40% opacity with no hover change.
- **Focus:** 3px solid outline offset 2px with a 2px corner; cream on the rail and in the player, forest on light surfaces.

### Segmented Control
Two variants of the same shape: a 6px track with 3px padding and gap holding equal-width 4px segments, labels in segment type.
- **Dark (rail):** rail-raised track, rail-line border, rail-sage labels that brighten to cream on hover; the selected segment fills peach with forest text.
- **Light (content):** cream track, sand hairline border, moss-graphite labels with a warm-ground hover; the selected segment fills forest with ground text.
- State is `aria-pressed`; background and colour transition over 0.2s.

### Area List (rail navigation)
- Group headings in rail-sage label type, with a rail-line rule beneath.
- Links: 1rem cream, name left, tabular count right in rail sage. Hover fills rail-raised; the current area fills peach with forest text at 600 and a moss-graphite count.
- Each area row ends in an icon-only Anatomy button (a 1.125rem cube icon, labelled for screen readers): transparent with a rail-sage icon, hover fills rail-raised and turns the icon peach. It opens the anatomy viewer on that area without changing the selected area.

### Body Map
- Silhouette in rail-raised; on the back view a dashed rail-line spine appears.
- Region dots: forest fill with a rail-sage 1.5px stroke; hover fills rail-line with a cream stroke; the selected dot fills peach and plays a single cream ping ring (1.6s).
- Laterality labels ("Patient's Right / Left") sit above the figure in cream label type, mirrored to the patient's sides.

### Band Tag and Meter (signature)
The band tag is the system's identity mark. It stacks "PHASE n" in Barlow Condensed, the phase name in 600 title type, and the four-step meter, on the striped band fill with the band's text colour. It appears identically in the legend tiles, the phase rows and the player bar (horizontal there). The meter is four 6×14px outlined bars, filled up to the phase number.

### Phase Row (signature)
- Cream panel, sand hairline border, 6px radius, minimum 4.5rem tall, band fill as a left strip under the tag.
- Closed: band tag, "n exercises" summary in moss graphite with the count in forest, tabular total, chevron. Hover underlines the count.
- **Stretch on open:** the band strip widens by 1rem and plays an elastic scaleX (0.86 → 1.06 → 0.985 → 1) over 0.7s on the system ease; the panel opens via a grid-rows transition (0.45s) and the chevron rotates 180° (0.35s).

### Video Tile
- 16:9 thumbnail on the derived band tint, 4px radius, a 2.75rem round play button in the band colour with the band's text colour, centred.
- Title (600) left and tabular duration (moss graphite, body small) right beneath.
- Hover scales the play button to 1.08 and underlines the title. With no video linked, the play button becomes a 2px dashed moss-graphite ring with a "No video" caption.

### Video Player
- Modal dialog on rail-raised with cream text, 6px radius, up to 70rem wide, rises 12px and fades in over 0.4s, over the forest backdrop.
- Striped band bar on top with a horizontal tag and a close icon button (hover lays forest at 14% over the band); a stage-coloured 16:9 stage whose messages use rail sage with a cream heading; footer with headline title, rail-sage metadata and Previous / Next / Open on platform buttons.

### Anatomy Viewer
A modal 3D model of the area's anatomy, opened from the Anatomy outline button or the row button in the area list.
- **Dialog:** forest surface with cream text, 6px radius, up to 84 × 54rem, rises in like the player (0.4s) over the forest backdrop. A header bar (rail-line rule beneath) carries the title in brand type, a rail-sage meta line and a close icon button.
- **Stage:** the neutral stage-grey canvas, drawn in the scoped scene palette (see Colors). Drag rotates, scroll or pinch zooms, right-drag or two-finger drag pans; a tap without movement selects the structure under it, and hover shows a pointer over structures. A caption-type hint on cream chips sits top left, with mouse and touch wording.
- **Floating controls:** centred along the stage's bottom edge. A dark segmented control (Front / Side / Back) and the "Separate layers" toggle, a rail-raised button with a rail-line border and 6px corners, hover rail-line, pressed peach with forest text. Both carry the floating-control shadow.
- **Structure panel:** a 21rem column with a rail-line left border. The info block shows the peach kind label, the structure name in brand type and a rail-sage description (cream once a structure is selected). Below it, the scrolling list groups structures under rail-sage label headings; each item is a 2.5rem row with a kind swatch and body-small text, hover rail-raised, pressed peach with forest text at 600. Selecting in the list or the scene keeps both in step; selecting again clears.
- **Motion:** a camera view turn takes 750ms and the layer separation 650ms, both on an ease-out quart (1 − (1 − t)⁴); under reduced motion both land instantly.

### Chips and Notes
- **Offline chip:** rail-raised fill, rail-line border, cream label type with an inline icon, 4px radius; shown only while offline.
- **Sample notes:** 1px placeholder-dash borders around moss-graphite body-small text, 6px radius, in the content pane; the empty-region box uses the same border. In the player the sample mark is a 4px box with a rail-sage dashed border and cream caption text.

## Do's and Don'ts

### Do:
- **Do** set a phase surface through `data-band` so band colour, text colour, stripe colour and stripe gap travel together, and derive the thumbnail tint with `color-mix(in oklab, band 30%, panel)`.
- **Do** keep phases light to dark with load: peach, tan, amber, forest.
- **Do** keep the stripe gaps at 22 / 14 / 9 / 6px and show the four-step meter wherever a phase is named, so phase reads without colour.
- **Do** use forest text on peach and tan, and cream text on amber and forest.
- **Do** mark the current selection on the forest rail with peach and forest text.
- **Do** set every duration, count and total in tabular figures, right-aligned.
- **Do** use the system ease (cubic-bezier(.16, 1, .3, 1)) for every CSS transition, and keep the band stretch as the one expressive motion. Camera and layer motion inside the 3D stage uses an ease-out quart (750ms turns, 650ms separation).
- **Do** honour `prefers-reduced-motion`: all animations and transitions are switched off, and state changes land instantly.
- **Do** keep touch targets at 2.5rem minimum and focus rings at 3px solid.
- **Do** keep the anatomical scene palette inside the 3D stage, and mark selection there with the peach glow.

### Don't:
- **Don't** use white (#FFFFFF) or any cool near-white; cream is the lightest value. The only exception is the anatomical scene inside the 3D stage.
- **Don't** use amber or tan for anything but phase identity, and don't use any band hue for errors, success, links or decoration.
- **Don't** add a neutral outside the three roles per surface (primary text, secondary text, hairline).
- **Don't** use Barlow Condensed for anything but the uppercase "PHASE n" band tag.
- **Don't** add box-shadows; separate with tone and hairlines. The only shadow is the floating-control shadow on controls over the 3D canvas.
- **Don't** use a scene colour (muscle red, tendon ivory, bone, cartilage blue, stage grey) anywhere in the app chrome.
- **Don't** go past 6px on container corners; circles are reserved for the play button, map dots and anatomy material swatches.
- **Don't** collapse or hide the rail above 56rem.
