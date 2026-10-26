/*
  BodyMap Rehab — anatomy models for the 3D viewer.

  One entry per body area, keyed by the same id as data.js. Everything the
  viewer draws comes from here: structures, curves, sizes, colours and the
  text shown when a structure is tapped.

  Coordinates are centimetres in a local frame for each area:
    +y up, +z anterior (towards the front of the body),
    +x towards the patient's LEFT (so lateral is -x for right-side areas).
  Paired areas are modeled on the RIGHT side; the viewer mirrors them for
  the left. Unpaired areas (neck, upper back, lower back) are modeled whole.

  view: the camera view the area opens in ("front" | "side" | "back").

  Structure kinds:
    muscle     path (CatmullRom control points), r (belly radius),
               w / d (cross-section width / depth multipliers),
               facing (the direction the muscle's broad face looks; also the
               direction it moves when layers are separated),
               layer ("superficial" | "deep"),
               tendon [start, end] (fraction of length that is tendon, optional)
    bone       parts: tube { tube: [[x,y,z]…], r }, ellipsoid { sphere: [x,y,z],
    cartilage  scale: [sx,sy,sz], rot: [deg x, y, z] }, ring { ring: [x,y,z],
               radius, axis: "x" | "y" | "z", r }

  The shapes are simplified teaching models, not patient imaging.
*/

export const COLORS = {
  muscle: "#B4382F",
  tendon: "#EFE7DA",
  bone: "#E4D8C0",
  cartilage: "#A9D2EA",
  highlight: "#F3D2AF",
  background: "#8B8B88"
};

// ---------- Helpers for repetitive anatomy ----------

// Mirrors a structure across the midline (x → -x) for left/right pairs.
function bilateral(def) {
  const mirrorPts = (pts) => pts.map(([x, y, z]) => [-x, y, z]);
  const mirrorPart = (p) => {
    const q = { ...p };
    if (p.tube) q.tube = mirrorPts(p.tube);
    if (p.sphere) q.sphere = [-p.sphere[0], p.sphere[1], p.sphere[2]];
    if (p.ring) q.ring = [-p.ring[0], p.ring[1], p.ring[2]];
    if (p.rot) q.rot = [p.rot[0], -p.rot[1], -p.rot[2]];
    return q;
  };
  const right = { ...def, id: `${def.id}-r`, name: `${def.name}, right` };
  const left = { ...def, id: `${def.id}-l`, name: `${def.name}, left` };
  if (def.path) left.path = mirrorPts(def.path);
  if (def.facing) left.facing = [-def.facing[0], def.facing[1], def.facing[2]];
  if (def.parts) left.parts = def.parts.map(mirrorPart);
  return [right, left];
}

// A simplified vertebra: body, arch, spinous and transverse processes.
function vertebra(y, s = 1, spineDrop = 0.6, spineLen = 3) {
  return [
    { sphere: [0, y, 0], scale: [2.3 * s, 1.15 * s, 1.75 * s] },
    { tube: [[-1.3 * s, y, -1.7 * s], [0, y - 0.2, -2.5 * s], [1.3 * s, y, -1.7 * s]], r: 0.42 * s },
    { tube: [[0, y - 0.1, -2.4 * s], [0, y - spineDrop, -(2.4 + spineLen) * s]], r: 0.48 * s },
    { tube: [[-1.1 * s, y + 0.1, -1.9 * s], [-3.6 * s, y + 0.3, -2.3 * s]], r: 0.36 * s },
    { tube: [[1.1 * s, y + 0.1, -1.9 * s], [3.6 * s, y + 0.3, -2.3 * s]], r: 0.36 * s }
  ];
}

function disc(y, s = 1) {
  return { sphere: [0, y, 0.05], scale: [2.2 * s, 0.5 * s, 1.65 * s] };
}

// ---------- Areas ----------

const knee = {
  title: "Knee",
  structures: [
    // Bones
    {
      id: "femur", kind: "bone", name: "Femur (distal)",
      desc: "The thigh bone. Its two rounded condyles roll and glide on the tibia as the knee bends.",
      parts: [
        { tube: [[0.8, 40, -0.5], [0.4, 22, 0], [0, 8, 0.2]], r: 1.6 },
        { sphere: [0, 6, 0], scale: [3.4, 3, 2.6] },
        { sphere: [1.9, 2.2, -0.3], scale: [2, 2.2, 2.6] },
        { sphere: [-1.9, 2.2, -0.3], scale: [2, 2.2, 2.6] }
      ]
    },
    {
      id: "patella", kind: "bone", name: "Patella",
      desc: "The kneecap. It sits inside the quadriceps tendon and increases the muscle's leverage when straightening the knee.",
      parts: [{ sphere: [0, 4, 3.4], scale: [2.1, 2.4, 0.9] }]
    },
    {
      id: "tibia", kind: "bone", name: "Tibia (proximal)",
      desc: "The shin bone. Its flat upper surface, the tibial plateau, carries most of the body's weight through the knee.",
      parts: [
        { sphere: [0, -1.6, 0], scale: [3.8, 1.4, 3] },
        { tube: [[0, -2, 0], [0, -20, 0.3], [0.3, -38, 0]], r: 1.5 },
        { sphere: [0, -5, 2.2], scale: [1, 1.4, 0.8] }
      ]
    },
    {
      id: "fibula", kind: "bone", name: "Fibula (proximal)",
      desc: "The slender outer bone of the lower leg. It anchors the biceps femoris and the lateral collateral ligament.",
      parts: [
        { sphere: [-3.6, -3.2, -1.4], scale: [1, 1, 1] },
        { tube: [[-3.6, -3.5, -1.4], [-3.4, -20, -1.2], [-3, -38, -1]], r: 0.6 }
      ]
    },
    // Cartilage
    {
      id: "medial-meniscus", kind: "cartilage", name: "Medial meniscus",
      desc: "A C-shaped fibrocartilage pad on the inner tibial plateau that spreads load and steadies the joint.",
      parts: [{ tube: [[0.8, -0.1, 2], [2.6, -0.1, 1.4], [3.3, -0.1, 0], [2.6, -0.1, -1.5], [0.8, -0.1, -1.9]], r: 0.45 }]
    },
    {
      id: "lateral-meniscus", kind: "cartilage", name: "Lateral meniscus",
      desc: "A more circular fibrocartilage pad on the outer tibial plateau. It is more mobile than the medial meniscus.",
      parts: [{ tube: [[-0.8, -0.1, 1.8], [-2.5, -0.1, 1.4], [-3.2, -0.1, 0], [-2.5, -0.1, -1.4], [-0.9, -0.1, -1.7]], r: 0.45 }]
    },
    // Superficial muscles
    {
      id: "rectus-femoris", kind: "muscle", layer: "superficial", name: "Rectus femoris",
      desc: "The central quadriceps muscle. It straightens the knee and, because it crosses the hip, also helps lift the thigh.",
      path: [[0, 40, 3.2], [0, 30, 4.4], [0, 18, 4.6], [0, 9, 4.2], [0, 6.2, 3.8]], r: 2.2, w: 1.3, d: 0.8, facing: [0, 0, 1]
    },
    {
      id: "vastus-lateralis", kind: "muscle", layer: "superficial", name: "Vastus lateralis",
      desc: "The largest quadriceps muscle, on the outer thigh. It straightens the knee.",
      path: [[-3.2, 36, 0.5], [-4.3, 26, 1.5], [-3.8, 14, 2.5], [-2.2, 6.5, 3.2]], r: 2.3, w: 1.3, d: 0.9, facing: [-0.8, 0, 0.6]
    },
    {
      id: "vastus-medialis", kind: "muscle", layer: "superficial", name: "Vastus medialis",
      desc: "The inner quadriceps muscle. Its lowest fibers help guide the kneecap as the knee straightens.",
      path: [[2.2, 28, 1.2], [3.4, 18, 2], [3.6, 10, 2.4], [2.2, 5.8, 3.2]], r: 2.2, w: 1.3, d: 0.9, facing: [0.8, 0, 0.6]
    },
    {
      id: "sartorius", kind: "muscle", layer: "superficial", name: "Sartorius",
      desc: "A long, strap-like muscle that crosses the thigh to the inner knee. It helps bend both the hip and the knee.",
      path: [[-3, 40, 3.5], [0, 30, 4.8], [2.8, 18, 3.4], [3.6, 6, 0.6], [2.6, -4, 1.2]], r: 1, w: 1.5, d: 0.6, facing: [0.4, 0, 0.9]
    },
    {
      id: "biceps-femoris", kind: "muscle", layer: "superficial", name: "Biceps femoris",
      desc: "The outer hamstring. It bends the knee and attaches to the head of the fibula.",
      path: [[-0.5, 38, -3], [-2.5, 26, -3.8], [-3.6, 12, -3], [-3.7, -2, -1.8], [-3.6, -3.4, -1.5]], r: 2, w: 1.2, d: 0.9, facing: [-0.5, 0, -0.9]
    },
    {
      id: "semitendinosus", kind: "muscle", layer: "superficial", name: "Semitendinosus",
      desc: "An inner hamstring with a long tendon that wraps to the front of the tibia. It bends the knee.",
      path: [[0.5, 38, -3.2], [2, 26, -4], [2.8, 12, -3.2], [3, 0, -1.5], [2, -6, 1]], r: 1.6, w: 1.2, d: 0.9, facing: [0.5, 0, -0.9], tendon: [0.12, 0.3]
    },
    {
      id: "gastrocnemius-medial", kind: "muscle", layer: "superficial", name: "Gastrocnemius, medial head",
      desc: "The inner head of the calf muscle. It starts above the knee, so it helps bend the knee as well as point the foot.",
      path: [[2, 5, -2.2], [2.2, -6, -4.4], [1.4, -16, -4.2], [0.6, -26, -2.8]], r: 2.1, w: 1.2, d: 0.9, facing: [0.3, 0, -1]
    },
    {
      id: "gastrocnemius-lateral", kind: "muscle", layer: "superficial", name: "Gastrocnemius, lateral head",
      desc: "The outer head of the calf muscle. Together with the medial head it forms the bulk of the calf.",
      path: [[-2, 5, -2.2], [-2.1, -6, -4], [-1.3, -15, -3.9], [-0.6, -26, -2.8]], r: 1.8, w: 1.2, d: 0.9, facing: [-0.3, 0, -1]
    },
    // Deep muscles
    {
      id: "vastus-intermedius", kind: "muscle", layer: "deep", name: "Vastus intermedius",
      desc: "The deepest quadriceps muscle, lying under the rectus femoris on the front of the femur.",
      path: [[0, 34, 1.6], [0, 24, 2.1], [0, 13, 2.4], [0, 7, 2.6]], r: 1.9, w: 1.4, d: 0.7, facing: [0, 0, 1]
    },
    {
      id: "semimembranosus", kind: "muscle", layer: "deep", name: "Semimembranosus",
      desc: "The broad inner hamstring under the semitendinosus. It bends the knee and steadies its inner side.",
      path: [[0.8, 34, -2], [2, 24, -3], [2.8, 10, -2.6], [3, -0.5, -1.6]], r: 1.8, w: 1.3, d: 0.8, facing: [0.4, 0, -0.9]
    },
    {
      id: "popliteus", kind: "muscle", layer: "deep", name: "Popliteus",
      desc: "A small muscle behind the knee. It turns the tibia slightly to 'unlock' the fully straightened knee.",
      path: [[-2.8, 0.5, -2], [-1, -3, -2.6], [1.2, -6, -2.2], [1.8, -7.5, -1.8]], r: 0.9, w: 1.4, d: 0.6, facing: [0, 0, -1]
    }
  ]
};

const hip = {
  title: "Hip",
  structures: [
    {
      id: "hip-bone", kind: "bone", name: "Hip bone (pelvis)",
      desc: "Ilium, ischium and pubis fused into one bone. The cup-shaped acetabulum holds the head of the femur.",
      parts: [
        { sphere: [1.5, 9, -1], scale: [5.5, 6, 1], rot: [0, -20, 0] },
        { tube: [[-1.5, 9.5, 4], [-2.5, 13, 1], [0, 14.5, -3], [4, 13, -5]], r: 0.6 },
        { sphere: [-1.5, 9, 4], scale: [0.8, 0.8, 0.8] },
        { sphere: [0.6, 0.8, 0], scale: [2.8, 2.8, 2.6] },
        { tube: [[1.5, -0.5, 2], [5, -1.5, 3.5], [8, -2.5, 3.2]], r: 0.9 },
        { tube: [[0.8, -1, -1], [1.5, -5, -1.5], [2.8, -7.5, -0.5]], r: 1.2 },
        { sphere: [2.6, -7.6, -1.2], scale: [1.2, 1, 1.2] },
        { tube: [[2.8, -7.5, -0.5], [6, -5.5, 2], [8, -3, 3]], r: 0.7 }
      ]
    },
    {
      id: "femur-proximal", kind: "bone", name: "Femur (proximal)",
      desc: "The ball-shaped femoral head sits in the acetabulum; the neck angles it out to the shaft and the trochanters.",
      parts: [
        { sphere: [0, 0, 0], scale: [2.3, 2.3, 2.3] },
        { tube: [[0, 0, 0], [-2.6, -1.8, 0.2], [-4, -3, 0]], r: 1.4 },
        { sphere: [-5, -2, -0.6], scale: [1.6, 2.2, 1.6] },
        { sphere: [-2.6, -5.2, -0.6], scale: [0.8, 0.8, 0.8] },
        { tube: [[-4.2, -3, 0], [-3.4, -18, 0.4], [-2, -34, 0.6]], r: 1.5 }
      ]
    },
    {
      id: "acetabular-labrum", kind: "cartilage", name: "Acetabular labrum",
      desc: "A ring of fibrocartilage around the rim of the hip socket that deepens it and seals the joint.",
      parts: [{ ring: [-0.9, 0, 0], radius: 2.5, axis: "x", r: 0.32 }]
    },
    {
      id: "pubic-symphysis", kind: "cartilage", name: "Pubic symphysis disc",
      desc: "A fibrocartilage disc joining the two pubic bones at the front of the pelvis.",
      parts: [{ sphere: [8.7, -2.7, 3.2], scale: [0.4, 1.4, 0.9] }]
    },
    {
      id: "gluteus-maximus", kind: "muscle", layer: "superficial", name: "Gluteus maximus",
      desc: "The largest muscle of the buttock. It extends the hip, as in standing up or climbing stairs.",
      path: [[3, 8, -6], [0, 3, -6.5], [-3, -3, -5], [-4.6, -9, -2.2]], r: 2.8, w: 1.7, d: 0.55, facing: [-0.2, 0, -1]
    },
    {
      id: "gluteus-medius", kind: "muscle", layer: "superficial", name: "Gluteus medius",
      desc: "On the side of the hip. It moves the leg out to the side and keeps the pelvis level when standing on one leg.",
      path: [[0, 12, -1.5], [-3, 7, -1.2], [-5.2, 1, -0.8], [-5.6, -1.4, -0.6]], r: 2.2, w: 1.6, d: 0.55, facing: [-1, 0, 0]
    },
    {
      id: "tensor-fasciae-latae", kind: "muscle", layer: "superficial", name: "Tensor fasciae latae",
      desc: "A small muscle at the front of the hip that tightens the iliotibial band and helps flex and abduct the hip.",
      path: [[-1.6, 9, 3.6], [-3.8, 3, 2.6], [-5, -4, 1.4], [-5.4, -12, 0.6]], r: 1, w: 1.4, d: 0.6, facing: [-0.7, 0, 0.7], tendon: [0.12, 0.45]
    },
    {
      id: "sartorius-hip", kind: "muscle", layer: "superficial", name: "Sartorius",
      desc: "A long strap muscle running from the front of the pelvis across the thigh. It helps flex and rotate the hip.",
      path: [[-1.5, 8.8, 4.4], [0.5, 1, 4.8], [3, -12, 3.6], [4, -26, 1.4]], r: 0.9, w: 1.5, d: 0.6, facing: [0.3, 0, 0.95]
    },
    {
      id: "rectus-femoris-hip", kind: "muscle", layer: "superficial", name: "Rectus femoris",
      desc: "The quadriceps muscle that crosses the hip. It lifts the thigh forwards and straightens the knee.",
      path: [[-1.2, 7.5, 4], [-1.4, 0, 4.6], [-1.6, -14, 4.6], [-1.6, -30, 3.4]], r: 1.9, w: 1.3, d: 0.8, facing: [0, 0, 1]
    },
    {
      id: "adductor-longus", kind: "muscle", layer: "superficial", name: "Adductor longus",
      desc: "An inner-thigh muscle that pulls the leg towards the midline.",
      path: [[7.5, -2, 3.2], [4, -10, 2.6], [0.5, -20, 1.2]], r: 1.6, w: 1.3, d: 0.7, facing: [0.6, 0, 0.8]
    },
    {
      id: "gluteus-minimus", kind: "muscle", layer: "deep", name: "Gluteus minimus",
      desc: "The smallest gluteal muscle, under the gluteus medius. It also steadies the pelvis during walking.",
      path: [[0.5, 9, 0], [-2.4, 5, 0.2], [-4.6, 0.2, 0.2], [-5, -1.2, 0.4]], r: 1.6, w: 1.5, d: 0.55, facing: [-1, 0, 0]
    },
    {
      id: "piriformis", kind: "muscle", layer: "deep", name: "Piriformis",
      desc: "A deep hip rotator running from the sacrum to the greater trochanter. The sciatic nerve passes close by.",
      path: [[6, 5, -4.5], [3, 2.5, -3.4], [0, 0.8, -2.6], [-4.4, -0.8, -1.4]], r: 1, w: 1.3, d: 0.7, facing: [0, 0, -1]
    },
    {
      id: "iliopsoas", kind: "muscle", layer: "deep", name: "Iliopsoas",
      desc: "The main hip flexor, running from the lumbar spine and inner pelvis to the lesser trochanter.",
      path: [[2, 14, 0.5], [2, 6, 2.5], [1, 0, 3.2], [-1.6, -5.6, 0.8], [-2.4, -6, 0]], r: 1.8, w: 1.2, d: 0.9, facing: [0, 0, 1]
    }
  ]
};

const ankle = {
  title: "Ankle & foot",
  view: "side",
  structures: [
    {
      id: "tibia-distal", kind: "bone", name: "Tibia (distal)",
      desc: "The lower end of the shin bone. Its inner bump is the medial malleolus.",
      parts: [
        { tube: [[0.3, 16, 0], [0.3, 5, 0], [0.3, 1.6, 0]], r: 1.3 },
        { sphere: [0.3, 1.8, 0], scale: [1.8, 1.2, 1.6] },
        { sphere: [1.6, 0.2, 0], scale: [0.8, 1.3, 0.9] }
      ]
    },
    {
      id: "fibula-distal", kind: "bone", name: "Fibula (distal)",
      desc: "The lower end of the outer leg bone. Its tip is the lateral malleolus, the outer ankle bump.",
      parts: [
        { tube: [[-2, 16, -0.6], [-2, 5, -0.6], [-2, 1, -0.5]], r: 0.55 },
        { sphere: [-2.1, -0.4, -0.5], scale: [0.7, 1.5, 0.8] }
      ]
    },
    {
      id: "talus", kind: "bone", name: "Talus",
      desc: "The bone that links leg and foot. Its dome fits between the malleoli and carries the body's weight.",
      parts: [{ sphere: [0, -0.6, 0.6], scale: [1.6, 1.1, 2.2] }]
    },
    {
      id: "calcaneus", kind: "bone", name: "Calcaneus",
      desc: "The heel bone, the largest bone of the foot. The Achilles tendon attaches to its back.",
      parts: [{ sphere: [-0.2, -2.6, -1.2], scale: [1.5, 1.5, 3.2] }]
    },
    {
      id: "midfoot", kind: "bone", name: "Navicular, cuboid and cuneiforms",
      desc: "The midfoot bones that form the arch and transfer load from the ankle to the forefoot.",
      parts: [
        { sphere: [0.8, -1.4, 3], scale: [1.1, 0.8, 0.6] },
        { sphere: [-1.4, -2.2, 3.4], scale: [0.9, 0.8, 1] },
        { sphere: [0.3, -1.8, 4.4], scale: [1.6, 0.8, 0.7] }
      ]
    },
    {
      id: "metatarsals", kind: "bone", name: "Metatarsals",
      desc: "Five long bones of the forefoot. The first, under the big toe, is the thickest.",
      parts: [
        { tube: [[1.2, -1.8, 5], [1.6, -3.4, 11]], r: 0.55 },
        { tube: [[0.2, -1.9, 5], [0.2, -3.4, 11.4]], r: 0.4 },
        { tube: [[-0.7, -2.1, 5], [-1, -3.4, 11]], r: 0.4 },
        { tube: [[-1.5, -2.4, 4.6], [-2, -3.5, 10.4]], r: 0.4 },
        { tube: [[-2.2, -2.6, 4.2], [-3, -3.6, 9.6]], r: 0.4 }
      ]
    },
    {
      id: "toe-phalanges", kind: "bone", name: "Phalanges",
      desc: "The toe bones: two in the big toe and three in each of the others.",
      parts: [
        { tube: [[1.6, -3.5, 11.4], [1.8, -3.6, 14.4]], r: 0.45 },
        { tube: [[0.2, -3.5, 11.8], [0.2, -3.7, 14.4]], r: 0.3 },
        { tube: [[-1, -3.5, 11.4], [-1.1, -3.7, 13.8]], r: 0.3 },
        { tube: [[-2, -3.6, 10.8], [-2.2, -3.8, 13]], r: 0.28 },
        { tube: [[-3, -3.7, 10], [-3.3, -3.9, 11.9]], r: 0.26 }
      ]
    },
    {
      id: "talar-cartilage", kind: "cartilage", name: "Talar dome cartilage",
      desc: "Smooth articular cartilage over the top of the talus, where it glides against the tibia.",
      parts: [{ sphere: [0, -0.15, 0.6], scale: [1.5, 0.75, 1.7] }]
    },
    {
      id: "gastrocnemius-ankle", kind: "muscle", layer: "superficial", name: "Gastrocnemius and Achilles tendon",
      desc: "The calf muscle narrows into the Achilles tendon, which lifts the heel to push off when walking.",
      path: [[0.4, 16, -3.6], [0.3, 10, -3.8], [0, 4, -2.6], [-0.2, -0.8, -2.4], [-0.2, -3.4, -3.6]], r: 2, w: 1.4, d: 0.8, facing: [0, 0, -1], tendon: [0.05, 0.45]
    },
    {
      id: "tibialis-anterior", kind: "muscle", layer: "superficial", name: "Tibialis anterior",
      desc: "The muscle along the front of the shin. It lifts the foot up and supports the inner arch.",
      path: [[-0.8, 16, 1.6], [-0.6, 8, 1.8], [0.4, 2, 1.6], [1.2, -1.4, 2.8], [1, -2, 4.4]], r: 1.1, w: 1.2, d: 0.9, facing: [0, 0, 1], tendon: [0.05, 0.45]
    },
    {
      id: "fibularis-longus", kind: "muscle", layer: "superficial", name: "Fibularis (peroneus) longus",
      desc: "On the outside of the leg. Its tendon passes behind the outer ankle and under the foot; it turns the sole outwards.",
      path: [[-2.6, 16, -0.4], [-2.8, 6, -0.6], [-2.6, -0.6, -1.4], [-1.8, -2.8, 1.2], [0.8, -2.8, 4.6]], r: 1, w: 1.2, d: 0.9, facing: [-1, 0, 0], tendon: [0.05, 0.55]
    },
    {
      id: "extensor-digitorum-longus", kind: "muscle", layer: "superficial", name: "Extensor digitorum longus",
      desc: "Front-of-shin muscle whose tendons fan out over the top of the foot to lift the four lesser toes.",
      path: [[-1.6, 16, 1.2], [-1.4, 6, 1.6], [-0.8, 0, 1.8], [-0.8, -2.4, 6], [-1, -3.6, 11.6]], r: 0.8, w: 1.2, d: 0.8, facing: [0, 0.3, 1], tendon: [0.05, 0.6]
    },
    {
      id: "abductor-hallucis", kind: "muscle", layer: "superficial", name: "Abductor hallucis",
      desc: "Along the inner edge of the sole. It moves the big toe away from the others and supports the arch.",
      path: [[1.2, -3.2, -1], [1.6, -3.2, 2.6], [1.5, -3, 7.4]], r: 0.8, w: 1.3, d: 0.7, facing: [0.7, -0.7, 0]
    },
    {
      id: "soleus", kind: "muscle", layer: "deep", name: "Soleus",
      desc: "The broad calf muscle under the gastrocnemius. It joins the Achilles tendon and is key for standing and walking.",
      path: [[0, 14, -2.4], [0, 8, -2.8], [-0.1, 3, -2.2], [-0.2, -2.6, -3]], r: 1.8, w: 1.6, d: 0.6, facing: [0, 0, -1], tendon: [0.08, 0.35]
    },
    {
      id: "tibialis-posterior", kind: "muscle", layer: "deep", name: "Tibialis posterior",
      desc: "The deepest calf muscle. Its tendon runs behind the inner ankle and is a main support of the arch.",
      path: [[0, 14, -1], [0.4, 6, -1.2], [1.6, 0.6, -0.8], [1.4, -1.4, 2.4]], r: 0.9, w: 1.2, d: 0.8, facing: [0.6, 0, -0.6], tendon: [0.08, 0.4]
    },
    {
      id: "fibularis-brevis", kind: "muscle", layer: "deep", name: "Fibularis (peroneus) brevis",
      desc: "A shorter outer-leg muscle. Its tendon attaches to the base of the fifth metatarsal and steadies the ankle.",
      path: [[-2.4, 10, -0.2], [-2.6, 3, -0.6], [-2.5, -1, -1.2], [-2.6, -2.6, 3.6]], r: 0.8, w: 1.2, d: 0.8, facing: [-1, 0, 0], tendon: [0.08, 0.45]
    },
    {
      id: "flexor-digitorum-brevis", kind: "muscle", layer: "deep", name: "Flexor digitorum brevis",
      desc: "A muscle in the middle of the sole that curls the four lesser toes and supports the arch.",
      path: [[-0.2, -4, 0], [-0.4, -3.9, 4], [-0.6, -3.8, 8.6]], r: 0.8, w: 1.5, d: 0.5, facing: [0, -1, 0]
    }
  ]
};

const shoulder = {
  title: "Shoulder",
  structures: [
    {
      id: "humerus-proximal", kind: "bone", name: "Humerus (proximal)",
      desc: "The upper arm bone. Its rounded head is much larger than the socket, which allows a wide range of movement.",
      parts: [
        { sphere: [-1, 0, 0.2], scale: [2.4, 2.5, 2.4] },
        { tube: [[-1.6, -1, 0], [-2, -14, 0], [-2.2, -28, 0.2]], r: 1.2 }
      ]
    },
    {
      id: "scapula", kind: "bone", name: "Scapula",
      desc: "The shoulder blade. It glides on the back of the ribcage and provides the shallow socket of the shoulder.",
      parts: [
        { sphere: [3.5, -6, -5.5], scale: [4.5, 7, 0.5], rot: [0, -30, 0] },
        { tube: [[-1.5, 1.8, -2.5], [2, -0.5, -5.5], [7, -2, -7]], r: 0.55 },
        { sphere: [-1.8, 2.8, -1], scale: [1.6, 0.5, 1.4] },
        { sphere: [0.8, 1, 2.4], scale: [0.5, 0.5, 1.4] }
      ]
    },
    {
      id: "clavicle", kind: "bone", name: "Clavicle",
      desc: "The collarbone. It acts as a strut that holds the shoulder out from the chest.",
      parts: [{ tube: [[-1.2, 3, 0.5], [3, 3.5, 2.4], [8, 3.2, 1], [12, 2.6, 1.6]], r: 0.7 }]
    },
    {
      id: "glenoid-labrum", kind: "cartilage", name: "Glenoid labrum",
      desc: "A ring of fibrocartilage around the shoulder socket that deepens it and helps keep the humeral head centered.",
      parts: [{ ring: [0.9, 0, 0], radius: 1.6, axis: "x", r: 0.3 }]
    },
    {
      id: "deltoid-anterior", kind: "muscle", layer: "superficial", name: "Deltoid, anterior part",
      desc: "The front of the deltoid. It raises the arm forwards.",
      path: [[0.5, 3, 2.2], [-2, 1, 3], [-3, -6, 1.5], [-3.1, -11, 0.4]], r: 2, w: 1.4, d: 0.55, facing: [-0.4, 0, 0.9]
    },
    {
      id: "deltoid-middle", kind: "muscle", layer: "superficial", name: "Deltoid, middle part",
      desc: "The side of the deltoid. It lifts the arm out to the side.",
      path: [[-1.8, 3.2, 0], [-4, 0.5, 0], [-4, -6, 0], [-3.2, -11, 0]], r: 2, w: 1.4, d: 0.55, facing: [-1, 0, 0]
    },
    {
      id: "deltoid-posterior", kind: "muscle", layer: "superficial", name: "Deltoid, posterior part",
      desc: "The back of the deltoid. It draws the arm backwards.",
      path: [[-0.5, 2.5, -3], [-2.6, 0.5, -3.2], [-3.3, -6, -1.4], [-3.2, -11, -0.3]], r: 2, w: 1.4, d: 0.55, facing: [-0.4, 0, -0.9]
    },
    {
      id: "pectoralis-major", kind: "muscle", layer: "superficial", name: "Pectoralis major",
      desc: "The large chest muscle. It brings the arm across the body and turns it inwards.",
      path: [[10, -3, 4], [6, -2.5, 4.5], [1.5, -2, 3.5], [-2, -4, 1.2]], r: 2.2, w: 1.8, d: 0.5, facing: [0, 0, 1]
    },
    {
      id: "biceps-long-head", kind: "muscle", layer: "superficial", name: "Biceps brachii",
      desc: "The front arm muscle. Its long-head tendon runs over the top of the humeral head into the joint.",
      path: [[-0.6, 1.5, 0.6], [-1.6, -4, 2.4], [-2, -14, 2.8], [-2.2, -26, 2]], r: 1.6, w: 1.2, d: 0.9, facing: [0, 0, 1], tendon: [0.18, 0.1]
    },
    {
      id: "trapezius-upper", kind: "muscle", layer: "superficial", name: "Trapezius, upper fibers",
      desc: "Runs from the neck to the outer clavicle and scapula. It lifts and rotates the shoulder blade.",
      path: [[12, 10, -2], [8, 6, -3], [3, 3.5, -3], [-0.8, 3, -2]], r: 1.8, w: 1.6, d: 0.5, facing: [0, 1, -0.6]
    },
    {
      id: "supraspinatus", kind: "muscle", layer: "deep", name: "Supraspinatus",
      desc: "Rotator cuff muscle above the spine of the scapula. It starts lifting the arm and centers the humeral head.",
      path: [[7, 0.5, -6.5], [3.5, 1.2, -4.2], [0, 1.6, -1.6], [-2, 1.4, 0]], r: 1.1, w: 1.3, d: 0.7, facing: [0, 1, 0]
    },
    {
      id: "infraspinatus", kind: "muscle", layer: "deep", name: "Infraspinatus",
      desc: "Rotator cuff muscle on the back of the scapula. It turns the arm outwards.",
      path: [[6.5, -7, -6.8], [3, -3, -4.6], [0, -0.5, -2.6], [-2.2, 0.2, -1]], r: 1.4, w: 1.5, d: 0.6, facing: [0, 0, -1]
    },
    {
      id: "teres-minor", kind: "muscle", layer: "deep", name: "Teres minor",
      desc: "A small rotator cuff muscle below the infraspinatus that also turns the arm outwards.",
      path: [[4, -9, -5.5], [1.5, -4, -3.6], [-1.6, -1.2, -1.6]], r: 0.9, w: 1.3, d: 0.7, facing: [0, 0, -1]
    },
    {
      id: "subscapularis", kind: "muscle", layer: "deep", name: "Subscapularis",
      desc: "Rotator cuff muscle on the front of the scapula, against the ribs. It turns the arm inwards.",
      path: [[5, -6, -4], [2.5, -3, -2], [0, -0.8, 0.4], [-0.6, -0.3, 1.4]], r: 1.4, w: 1.4, d: 0.6, facing: [0, 0, 1]
    }
  ]
};

const elbow = {
  title: "Elbow",
  structures: [
    {
      id: "humerus-distal", kind: "bone", name: "Humerus (distal)",
      desc: "The lower end of the upper arm bone: the trochlea meets the ulna and the capitulum meets the radius.",
      parts: [
        { tube: [[0, 28, -0.5], [0, 12, -0.3], [0, 4, 0]], r: 1.2 },
        { sphere: [1, 1.5, 0.3], scale: [1.6, 1.3, 1.4] },
        { sphere: [-1.4, 1.6, 0.6], scale: [1.1, 1.1, 1.1] },
        { sphere: [3, 2.5, -0.3], scale: [1, 0.8, 0.8] },
        { sphere: [-2.4, 2.6, -0.2], scale: [0.7, 0.7, 0.7] }
      ]
    },
    {
      id: "ulna", kind: "bone", name: "Ulna",
      desc: "The inner forearm bone. Its olecranon is the point of the elbow and hinges around the trochlea.",
      parts: [
        { sphere: [0.8, 1.5, -1.6], scale: [1.3, 1.8, 1.2] },
        { tube: [[0.8, 0, -0.8], [1.4, -12, -0.4], [1.8, -24, 0]], r: 0.75 }
      ]
    },
    {
      id: "radius", kind: "bone", name: "Radius",
      desc: "The outer forearm bone. Its disc-shaped head spins against the ulna to turn the palm up and down.",
      parts: [
        { sphere: [-1.4, -0.4, 0.4], scale: [1.1, 0.7, 1.1] },
        { tube: [[-1.4, -1, 0.4], [-1.6, -12, 0.8], [-2.2, -24, 0.6]], r: 0.8 }
      ]
    },
    {
      id: "trochlea-cartilage", kind: "cartilage", name: "Articular cartilage, trochlea",
      desc: "Smooth cartilage on the spool-shaped trochlea, where the ulna hinges.",
      parts: [{ sphere: [1, 1.2, 0.9], scale: [1.4, 1, 0.5] }]
    },
    {
      id: "capitulum-cartilage", kind: "cartilage", name: "Articular cartilage, capitulum",
      desc: "Smooth cartilage on the rounded capitulum, where the head of the radius glides and spins.",
      parts: [{ sphere: [-1.45, 1.35, 0.95], scale: [1, 0.9, 0.5] }]
    },
    {
      id: "biceps-brachii", kind: "muscle", layer: "superficial", name: "Biceps brachii",
      desc: "Bends the elbow and is the strongest muscle for turning the palm up.",
      path: [[0, 26, 2.6], [0, 16, 3.4], [-0.3, 6, 2.6], [-1, 0.6, 1.4], [-1.4, -2, 0.6]], r: 1.8, w: 1.2, d: 0.9, facing: [0, 0, 1], tendon: [0.08, 0.22]
    },
    {
      id: "triceps-brachii", kind: "muscle", layer: "superficial", name: "Triceps brachii",
      desc: "The back of the arm. It straightens the elbow and attaches to the olecranon.",
      path: [[0.2, 26, -2.6], [0.3, 16, -3.2], [0.5, 6, -2.6], [0.8, 1.6, -2.2]], r: 2, w: 1.4, d: 0.8, facing: [0, 0, -1], tendon: [0.08, 0.2]
    },
    {
      id: "brachioradialis", kind: "muscle", layer: "superficial", name: "Brachioradialis",
      desc: "On the thumb side of the forearm. It bends the elbow, especially with the thumb pointing up.",
      path: [[-2.2, 9, 0.2], [-3.2, 2, 1], [-3, -8, 1.4], [-2.4, -22, 1]], r: 1.3, w: 1.3, d: 0.8, facing: [-0.7, 0, 0.7]
    },
    {
      id: "pronator-teres", kind: "muscle", layer: "superficial", name: "Pronator teres",
      desc: "Runs diagonally across the front of the forearm and turns the palm down.",
      path: [[3, 2.6, 0.3], [1.8, -2, 1.6], [-0.4, -6, 1.6], [-1.8, -9, 1]], r: 1, w: 1.3, d: 0.7, facing: [0, 0, 1]
    },
    {
      id: "flexor-carpi-radialis", kind: "muscle", layer: "superficial", name: "Flexor carpi radialis",
      desc: "Starts at the inner elbow (medial epicondyle) and bends the wrist.",
      path: [[2.9, 2.2, 0.4], [2.2, -6, 1.8], [0.6, -14, 1.8], [-0.8, -24, 1]], r: 1, w: 1.2, d: 0.8, facing: [0, 0, 1], tendon: [0.08, 0.4]
    },
    {
      id: "extensor-carpi-radialis-longus", kind: "muscle", layer: "superficial", name: "Extensor carpi radialis longus",
      desc: "Starts above the outer elbow and extends the wrist. Its neighbor, the brevis, is involved in tennis elbow.",
      path: [[-2.6, 5, -0.2], [-3.2, -2, 0.4], [-3, -10, 0.2], [-2.6, -24, -0.2]], r: 1, w: 1.2, d: 0.8, facing: [-1, 0, 0], tendon: [0.08, 0.4]
    },
    {
      id: "brachialis", kind: "muscle", layer: "deep", name: "Brachialis",
      desc: "Lies under the biceps and is the main elbow flexor whatever the forearm position.",
      path: [[0, 16, 1.4], [0, 8, 2], [0.4, 1.5, 1.6], [0.8, -2.2, 0.6]], r: 1.6, w: 1.4, d: 0.7, facing: [0, 0, 1]
    },
    {
      id: "supinator", kind: "muscle", layer: "deep", name: "Supinator",
      desc: "Wraps around the upper radius and turns the palm up.",
      path: [[-2.4, 1, -0.8], [-2.2, -2, -0.6], [-1.6, -5, 0.4]], r: 0.8, w: 1.4, d: 0.6, facing: [-0.7, 0, -0.7]
    },
    {
      id: "anconeus", kind: "muscle", layer: "deep", name: "Anconeus",
      desc: "A small muscle behind the outer elbow that assists the triceps and steadies the joint.",
      path: [[-2.2, 2.4, -1.2], [-1, 0, -1.8], [0.4, -3, -1.6]], r: 0.7, w: 1.4, d: 0.6, facing: [0, 0, -1]
    }
  ]
};

const wrist = {
  title: "Wrist & hand",
  structures: [
    {
      id: "radius-distal", kind: "bone", name: "Radius (distal)",
      desc: "The wide lower end of the radius forms most of the wrist joint with the carpal bones.",
      parts: [
        { tube: [[-1.2, 14, 0], [-1.2, 4, 0.1], [-1.4, 0.6, 0.2]], r: 0.8 },
        { sphere: [-1.2, 0.6, 0.1], scale: [1.5, 0.9, 1] }
      ]
    },
    {
      id: "ulna-distal", kind: "bone", name: "Ulna (distal)",
      desc: "The narrow lower end of the ulna, on the little-finger side. Its head is the bump on the back of the wrist.",
      parts: [
        { tube: [[1.4, 14, -0.2], [1.4, 3, -0.2], [1.3, 0.8, -0.2]], r: 0.55 },
        { sphere: [1.3, 0.8, -0.2], scale: [0.7, 0.6, 0.7] }
      ]
    },
    {
      id: "carpals", kind: "bone", name: "Carpal bones",
      desc: "Eight small bones in two rows. The scaphoid, on the thumb side, is the one most often fractured.",
      parts: [
        { sphere: [-1.4, -0.8, 0.2], scale: [0.7, 0.5, 0.6] },
        { sphere: [-0.3, -0.7, 0.1], scale: [0.55, 0.5, 0.6] },
        { sphere: [0.8, -0.8, -0.1], scale: [0.5, 0.45, 0.5] },
        { sphere: [1, -0.9, 0.7], scale: [0.3, 0.3, 0.3] },
        { sphere: [-1.8, -2.1, 0.4], scale: [0.6, 0.5, 0.55] },
        { sphere: [-0.8, -2.2, 0.2], scale: [0.45, 0.5, 0.5] },
        { sphere: [0.1, -2.3, 0.1], scale: [0.55, 0.7, 0.6] },
        { sphere: [1, -2.2, 0], scale: [0.55, 0.6, 0.55] }
      ]
    },
    {
      id: "metacarpals", kind: "bone", name: "Metacarpals",
      desc: "Five long bones of the palm, one for each finger. The thumb's is shorter and much more mobile.",
      parts: [
        { tube: [[-1.9, -2.6, 0.6], [-3.6, -5.6, 1.6]], r: 0.42 },
        { tube: [[-0.9, -2.8, 0.2], [-1.2, -8.2, 0.2]], r: 0.38 },
        { tube: [[0.1, -3, 0.1], [0.1, -8.6, 0.1]], r: 0.38 },
        { tube: [[0.9, -2.9, 0], [1.3, -8, 0]], r: 0.36 },
        { tube: [[1.6, -2.7, -0.1], [2.4, -7.4, 0]], r: 0.34 }
      ]
    },
    {
      id: "finger-phalanges", kind: "bone", name: "Phalanges",
      desc: "The finger bones: two in the thumb and three in each finger.",
      parts: [
        { tube: [[-3.6, -5.6, 1.6], [-4.6, -8.2, 2.2], [-5.1, -10.2, 2.5]], r: 0.34 },
        { tube: [[-1.2, -8.6, 0.2], [-1.4, -12.6, 0.3], [-1.5, -15.4, 0.4]], r: 0.3 },
        { tube: [[0.1, -9, 0.1], [0.1, -13.4, 0.2], [0.1, -16.4, 0.3]], r: 0.3 },
        { tube: [[1.3, -8.4, 0], [1.6, -12.2, 0.1], [1.8, -15, 0.2]], r: 0.29 },
        { tube: [[2.4, -7.8, 0], [2.9, -10.8, 0.1], [3.2, -13, 0.2]], r: 0.27 }
      ]
    },
    {
      id: "tfcc", kind: "cartilage", name: "Triangular fibrocartilage (TFCC)",
      desc: "A cartilage cushion between the ulna and the carpal bones that stabilizes the little-finger side of the wrist.",
      parts: [{ sphere: [1.15, 0.15, -0.1], scale: [0.7, 0.2, 0.6] }]
    },
    {
      id: "fcr", kind: "muscle", layer: "superficial", name: "Flexor carpi radialis",
      desc: "Its tendon runs down the thumb side of the front of the wrist. It bends the wrist.",
      path: [[-0.2, 14, 1.4], [-0.8, 7, 1.4], [-1.4, 1, 0.9], [-1, -3, 0.5]], r: 0.9, w: 1.2, d: 0.8, facing: [0, 0, 1], tendon: [0.05, 0.55]
    },
    {
      id: "fcu", kind: "muscle", layer: "superficial", name: "Flexor carpi ulnaris",
      desc: "On the little-finger side. It bends the wrist and attaches to the pisiform.",
      path: [[1.6, 14, 0.8], [1.6, 6, 0.9], [1.1, -0.3, 0.9]], r: 0.9, w: 1.2, d: 0.8, facing: [0.6, 0, 0.8], tendon: [0.05, 0.35]
    },
    {
      id: "thenar", kind: "muscle", layer: "superficial", name: "Thenar muscles",
      desc: "The pad at the base of the thumb. These muscles move the thumb across the palm for gripping and pinching.",
      path: [[-1.6, -1.8, 1], [-2.6, -3.6, 1.6], [-3.6, -5.8, 1.9]], r: 0.8, w: 1.3, d: 0.7, facing: [-0.4, 0, 0.9]
    },
    {
      id: "hypothenar", kind: "muscle", layer: "superficial", name: "Hypothenar muscles",
      desc: "The pad on the little-finger side of the palm. They move and steady the little finger.",
      path: [[1.2, -1.4, 0.9], [1.9, -3.8, 0.8], [2.4, -6.6, 0.4]], r: 0.7, w: 1.3, d: 0.7, facing: [0.5, 0, 0.8]
    },
    {
      id: "extensor-digitorum", kind: "muscle", layer: "superficial", name: "Extensor digitorum",
      desc: "On the back of the forearm. Its tendons spread over the back of the hand to straighten the fingers.",
      path: [[0.2, 14, -1.2], [0.2, 6, -1.3], [0.1, -1, -0.9], [0.1, -6, -0.6]], r: 1, w: 1.6, d: 0.5, facing: [0, 0, -1], tendon: [0.05, 0.55]
    },
    {
      id: "ecu", kind: "muscle", layer: "superficial", name: "Extensor carpi ulnaris",
      desc: "On the back of the forearm, little-finger side. It extends the wrist and tilts it towards the little finger.",
      path: [[1.7, 14, -0.8], [1.7, 6, -0.9], [1.5, 0, -0.7], [2, -3, -0.4]], r: 0.7, w: 1.2, d: 0.8, facing: [0.6, 0, -0.8], tendon: [0.05, 0.5]
    },
    {
      id: "fds", kind: "muscle", layer: "deep", name: "Flexor digitorum superficialis",
      desc: "Lies under the wrist flexors. Its tendons pass through the carpal tunnel to bend the fingers.",
      path: [[0.4, 14, 0.9], [0.3, 6, 1.1], [0.2, -1, 0.8], [0.1, -5, 0.6]], r: 1, w: 1.6, d: 0.5, facing: [0, 0, 1], tendon: [0.05, 0.55]
    },
    {
      id: "apl", kind: "muscle", layer: "deep", name: "Abductor pollicis longus",
      desc: "A deep forearm muscle whose tendon runs along the thumb side of the wrist to move the thumb outwards.",
      path: [[0.6, 13, -1], [-0.8, 7, -0.6], [-1.8, 1, 0.1], [-2.2, -2.4, 0.6]], r: 0.6, w: 1.3, d: 0.7, facing: [-0.6, 0, -0.6], tendon: [0.05, 0.5]
    },
    {
      id: "pronator-quadratus", kind: "muscle", layer: "deep", name: "Pronator quadratus",
      desc: "A flat, square muscle across the lower forearm that turns the palm down.",
      path: [[1.5, 2.4, 0.6], [0, 2.6, 0.9], [-1.4, 2.4, 0.7]], r: 0.6, w: 1.8, d: 0.5, facing: [0, 0, 1]
    }
  ]
};

const lumbar = {
  title: "Lower back",
  view: "back",
  structures: [
    { id: "l1", kind: "bone", name: "L1 vertebra", desc: "The first lumbar vertebra, where the lumbar spine meets the thoracic spine.", parts: vertebra(8) },
    { id: "l2", kind: "bone", name: "L2 vertebra", desc: "Lumbar vertebrae have large bodies to carry the weight of the upper body.", parts: vertebra(4.4) },
    { id: "l3", kind: "bone", name: "L3 vertebra", desc: "The middle lumbar vertebra, at the deepest point of the lower-back curve.", parts: vertebra(0.8) },
    { id: "l4", kind: "bone", name: "L4 vertebra", desc: "A common level for disc problems, along with L5.", parts: vertebra(-2.8) },
    { id: "l5", kind: "bone", name: "L5 vertebra", desc: "The lowest lumbar vertebra, resting on the sacrum.", parts: vertebra(-6.4, 1.05) },
    {
      id: "sacrum", kind: "bone", name: "Sacrum",
      desc: "Five fused vertebrae forming the back of the pelvis. It joins the hip bones at the sacroiliac joints.",
      parts: [{ sphere: [0, -11.6, -1], scale: [3.8, 3.6, 1.6], rot: [-20, 0, 0] }]
    },
    {
      id: "lumbar-discs", kind: "cartilage", name: "Intervertebral discs",
      desc: "Cushions of fibrocartilage between the vertebral bodies that absorb load and allow the spine to bend.",
      parts: [disc(6.2), disc(2.6), disc(-1), disc(-4.6), disc(-8.3, 1.05)]
    },
    ...bilateral({
      id: "erector-spinae-lumbar", kind: "muscle", layer: "superficial", name: "Erector spinae",
      desc: "Long muscle columns either side of the spine. They straighten the back and control bending forwards.",
      path: [[2.4, 12, -4.5], [2.8, 4, -5.6], [2.8, -4, -5.4], [2.2, -11, -3.8]], r: 1.8, w: 1.2, d: 0.8, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "latissimus-lumbar", kind: "muscle", layer: "superficial", name: "Latissimus dorsi",
      desc: "A broad, flat back muscle that starts from the lower spine and pelvis and pulls the arm down and back.",
      path: [[1, 8, -6.4], [5, 10, -5.6], [9, 14, -3.2]], r: 2, w: 1.8, d: 0.4, facing: [0.3, 0, -1]
    }),
    ...bilateral({
      id: "multifidus", kind: "muscle", layer: "deep", name: "Multifidus",
      desc: "Short, deep muscles hugging the spine. They stiffen each segment and support the lower back.",
      path: [[1.1, 11, -3.6], [1.2, 2, -4], [1.2, -8, -3.4], [1.3, -12, -2.4]], r: 0.9, w: 1.2, d: 0.8, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "quadratus-lumborum", kind: "muscle", layer: "deep", name: "Quadratus lumborum",
      desc: "A deep, flat muscle between the lowest rib and the pelvis. It bends the trunk to the side and steadies the pelvis.",
      path: [[2.8, 10, -1.8], [5, 4, -2], [6, -4, -1.6], [5.4, -8, -1]], r: 1.3, w: 1.5, d: 0.5, facing: [0.4, 0, -0.9]
    }),
    ...bilateral({
      id: "psoas-major", kind: "muscle", layer: "deep", name: "Psoas major",
      desc: "Runs from the front of the lumbar vertebrae down to the thigh. It is the main hip flexor.",
      path: [[2.4, 9, 1], [3, 2, 1.6], [3.6, -6, 2.2], [4, -14, 3.4]], r: 1.4, w: 1.2, d: 0.9, facing: [0, 0, 1]
    })
  ]
};

const thoracicVertebrae = [8, 5.4, 2.8, 0.2, -2.4, -5].map((y, i) => ({
  id: `t${i + 5}`, kind: "bone", name: `T${i + 5} vertebra`,
  desc: i === 0
    ? "Thoracic vertebrae each carry a pair of ribs. Their long spinous processes slope downwards like roof tiles."
    : `A thoracic vertebra. Each one joins a pair of ribs, which limits bending but allows rotation.`,
  parts: vertebra(y, 0.85, 2, 2.4)
}));

const thoracic = {
  title: "Upper back",
  view: "back",
  structures: [
    ...thoracicVertebrae,
    {
      id: "ribs", kind: "bone", name: "Ribs (posterior)",
      desc: "The back parts of the ribs curve out from the vertebrae to form the ribcage.",
      parts: [8, 5.4, 2.8, 0.2, -2.4, -5].flatMap((y) => [
        { tube: [[1.6, y, -2.2], [5, y - 0.6, -3.2], [9, y - 1.6, -1.6], [11, y - 3, 2]], r: 0.42 },
        { tube: [[-1.6, y, -2.2], [-5, y - 0.6, -3.2], [-9, y - 1.6, -1.6], [-11, y - 3, 2]], r: 0.42 }
      ])
    },
    ...bilateral({
      id: "scapula-thoracic", kind: "bone", name: "Scapula",
      desc: "The shoulder blade, gliding over the back of the ribs. Its medial border faces the spine.",
      parts: [{ sphere: [9, 4, -5.2], scale: [3.6, 6, 0.5], rot: [0, 25, 0] }]
    }),
    {
      id: "thoracic-discs", kind: "cartilage", name: "Intervertebral discs",
      desc: "Thinner than in the lower back, these discs cushion the thoracic vertebrae.",
      parts: [6.7, 4.1, 1.5, -1.1, -3.7].map((y) => disc(y, 0.82))
    },
    ...bilateral({
      id: "trapezius-middle", kind: "muscle", layer: "superficial", name: "Trapezius, middle fibers",
      desc: "Draws the shoulder blades together towards the spine.",
      path: [[0.5, 10, -5.4], [5, 8, -6], [8.5, 7, -5.6]], r: 1.8, w: 1.6, d: 0.4, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "trapezius-lower", kind: "muscle", layer: "superficial", name: "Trapezius, lower fibers",
      desc: "Pulls the shoulder blade down and helps rotate it as the arm lifts overhead.",
      path: [[0.5, 0, -5], [4, 4, -5.8], [7.5, 7.5, -5.6]], r: 1.6, w: 1.6, d: 0.4, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "latissimus-thoracic", kind: "muscle", layer: "superficial", name: "Latissimus dorsi",
      desc: "A broad back muscle sweeping up to the arm. It pulls the arm down and back, as in rowing.",
      path: [[1, -6, -5.2], [6, -2, -5.6], [10, 4, -4]], r: 1.8, w: 1.8, d: 0.4, facing: [0.2, 0, -1]
    }),
    ...bilateral({
      id: "rhomboid-major", kind: "muscle", layer: "deep", name: "Rhomboid major",
      desc: "Lies under the trapezius and pulls the shoulder blade in and up towards the spine.",
      path: [[0.6, 6, -4.6], [4, 4, -4.8], [7.4, 1, -4.9]], r: 1.3, w: 1.5, d: 0.5, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "erector-spinae-thoracic", kind: "muscle", layer: "deep", name: "Erector spinae",
      desc: "Columns of muscle along the spine that hold the upper back upright.",
      path: [[2.2, 12, -3.6], [2.6, 4, -4.2], [2.6, -6, -4]], r: 1.3, w: 1.2, d: 0.8, facing: [0, 0, -1]
    })
  ]
};

const cervicalY = [6.2, 4.2, 2.2, 0.2, -1.8];

const neck = {
  title: "Neck",
  structures: [
    {
      id: "occipital", kind: "bone", name: "Occipital bone",
      desc: "The base of the skull. The atlas (C1) rocks on it when you nod.",
      parts: [{ sphere: [0, 13, -1.6], scale: [4.4, 1.9, 4.2] }]
    },
    {
      id: "c1", kind: "bone", name: "C1 (atlas)",
      desc: "A ring-shaped vertebra with no body. It carries the skull and allows nodding.",
      parts: [
        { ring: [0, 10.4, -0.4], radius: 1.8, axis: "y", r: 0.45 },
        { tube: [[-1.6, 10.4, -0.2], [-3.2, 10.5, -0.4]], r: 0.4 },
        { tube: [[1.6, 10.4, -0.2], [3.2, 10.5, -0.4]], r: 0.4 }
      ]
    },
    {
      id: "c2", kind: "bone", name: "C2 (axis)",
      desc: "Its upward peg, the dens, is the pivot the atlas turns around when you shake your head.",
      parts: [
        { sphere: [0, 8.2, 0], scale: [1.4, 1, 1.2] },
        { tube: [[0, 8.6, 0.3], [0, 10.6, 0.3]], r: 0.45 },
        { tube: [[0, 8.2, -1.6], [0, 7.6, -3.8]], r: 0.5 }
      ]
    },
    ...cervicalY.map((y, i) => ({
      id: `c${i + 3}`, kind: "bone", name: i === 4 ? "C7 (vertebra prominens)" : `C${i + 3} vertebra`,
      desc: i === 4
        ? "The lowest neck vertebra. Its long spinous process is the bump you can feel at the base of the neck."
        : "A cervical vertebra: small and light, built for a wide range of neck movement.",
      parts: vertebra(y, 0.62, 0.8, i === 4 ? 3.6 : 2.2)
    })),
    ...bilateral({
      id: "first-rib", kind: "bone", name: "First rib",
      desc: "The short, curved top rib. The scalene muscles attach to it.",
      parts: [{ tube: [[1.4, -2.6, -1.4], [4.5, -3, -0.6], [5.5, -4, 2]], r: 0.45 }]
    }),
    {
      id: "cervical-discs", kind: "cartilage", name: "Intervertebral discs",
      desc: "Small fibrocartilage discs between the cervical vertebrae, from C2–C3 down to C7–T1.",
      parts: [7.2, 5.2, 3.2, 1.2, -0.8].map((y) => disc(y, 0.6))
    },
    {
      id: "thyroid-cartilage", kind: "cartilage", name: "Thyroid cartilage",
      desc: "The largest cartilage of the larynx, at the front of the neck. It forms the Adam's apple.",
      parts: [{ sphere: [0, 3, 4.6], scale: [1.4, 1.2, 0.9] }]
    },
    {
      id: "tracheal-rings", kind: "cartilage", name: "Tracheal cartilage rings",
      desc: "C-shaped rings of cartilage that keep the windpipe open.",
      parts: [0.6, -0.6, -1.8, -3].map((y) => ({ ring: [0, y, 4.1], radius: 1, axis: "y", r: 0.2 }))
    },
    ...bilateral({
      id: "sternocleidomastoid", kind: "muscle", layer: "superficial", name: "Sternocleidomastoid",
      desc: "Runs from behind the ear to the sternum and clavicle. It turns the head to the opposite side and bends the neck.",
      path: [[4.2, 12.4, -0.6], [3.2, 7, 1.8], [1.6, 1, 4], [0.8, -3.5, 5]], r: 1.2, w: 1.3, d: 0.7, facing: [0.6, 0, 0.8]
    }),
    ...bilateral({
      id: "trapezius-neck", kind: "muscle", layer: "superficial", name: "Trapezius, upper fibers",
      desc: "Runs from the skull and neck to the shoulder. It lifts the shoulders and extends the head.",
      path: [[0.5, 12.8, -4], [1.8, 6, -3.6], [5, -1, -3.4], [8, -3.2, -1.6]], r: 1.6, w: 1.6, d: 0.5, facing: [0.3, 0.3, -0.9]
    }),
    ...bilateral({
      id: "splenius-capitis", kind: "muscle", layer: "deep", name: "Splenius capitis",
      desc: "Lies under the trapezius. It extends the head and turns it to the same side.",
      path: [[0.5, 0, -3], [1.6, 5, -3.2], [3.4, 11, -2.6], [4.4, 12.6, -1.4]], r: 1, w: 1.4, d: 0.6, facing: [0, 0, -1]
    }),
    ...bilateral({
      id: "levator-scapulae", kind: "muscle", layer: "deep", name: "Levator scapulae",
      desc: "Runs from the upper neck vertebrae to the top corner of the shoulder blade, which it lifts.",
      path: [[2.2, 10, -1.4], [3, 5, -1.8], [4.4, 0, -2.6], [5.6, -3.4, -3]], r: 0.9, w: 1.2, d: 0.8, facing: [0.7, 0, -0.7]
    }),
    ...bilateral({
      id: "scalenes", kind: "muscle", layer: "deep", name: "Scalenes",
      desc: "Deep side-neck muscles running to the first ribs. They bend the neck sideways and help lift the ribs when breathing hard.",
      path: [[2.2, 7, 0.6], [3, 3, 0.8], [3.8, -1, 0.6], [4.4, -3, 0.4]], r: 0.8, w: 1.2, d: 0.8, facing: [1, 0, 0]
    }),
    ...bilateral({
      id: "longus-colli", kind: "muscle", layer: "deep", name: "Longus colli",
      desc: "A deep flexor on the front of the cervical spine that supports the neck's natural curve.",
      path: [[0.6, 9, 1.4], [0.7, 4, 1.6], [0.7, -2, 1.4]], r: 0.55, w: 1.3, d: 0.7, facing: [0, 0, 1]
    })
  ]
};

export const REGIONS = {
  neck,
  thoracic,
  lumbar,
  shoulder,
  elbow,
  wrist,
  hip,
  knee,
  ankle
};
