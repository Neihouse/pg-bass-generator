// pg-core.js — PG Bass Generator generative core
// Implements DESIGN.md §1 (generative core), §4 (novelty architecture),
// §5 (step metadata + reset/anchor). Runs inside [js] in the M4L device.
// ES5 only — must load in Max 8's legacy js as well as Max 9's.

autowatch = 1;
inlets = 1;
outlets = 3; // 0: synth params, 1: note events, 2: display/debug

// ---------------------------------------------------------------- constants

var STEPS_PER_BAR = 16;
var TICKS_PER_STEP = 120; // 480 ppq / 4

// §4.3 novelty budget weights (normalized against the largest weight)
var BUDGET = { pitch: 0.25, rhythm: 0.25, accent: 0.15, slide: 0.10, timbre: 0.15, wet: 0.10 };

// §1.6 tonal gravity: semitones above root -> attractor weight (2-octave field)
// §1.5 root octave = C1: the second octave is rare color, not structure
var GRAVITY = {
  0: 1.0, 12: 0.45, 24: 0.08,     // root / octaves
  7: 0.6, 19: 0.20,               // fifths
  10: 0.35, 22: 0.08,             // minor 7ths
  3: 0.2, 15: 0.06,               // minor 3rds
  5: 0.18, 17: 0.05,              // 4ths
  2: 0.12, 14: 0.04,              // 2nds (passing)
  8: 0.12, 20: 0.04               // b6 (passing)
};
var ANCHOR = { 0: 1, 7: 1, 10: 1, 12: 1, 19: 1, 22: 1, 24: 1 }; // §1.5

// contour names, ordered — the index is what gets serialized in the saved state
var CONTOURS = ["repeat", "pedal", "neighbor", "arch", "ascending", "descending", "leaprtn"];

// §1.10 groove states — each moves many parameters together.
// push = how far the groove leans forward (fraction of a step, applied as rush
// on accents and drag on ghosts); pick = anticipation probability per downbeat;
// bp  = lowpass/bandpass blend (§2.3); frz = probability of a repetition freeze.
var GROOVES = [
  { name: "restrained", dens: 0.35, off: 0.20, gate: 0.50, acc: 0.15, sld: 0.08, mut: 0.4, swing: 0.02,
    push: 0.025, pick: 0.12, bp: 0.00, frz: 0.20,
    contours: { repeat: 3, pedal: 3, neighbor: 2, arch: 1, descending: 1 } },
  { name: "rolling",    dens: 0.55, off: 0.75, gate: 0.45, acc: 0.30, sld: 0.15, mut: 0.5, swing: 0.07,
    push: 0.050, pick: 0.35, bp: 0.05, frz: 0.18,
    contours: { repeat: 3, pedal: 2, leaprtn: 2, arch: 1, neighbor: 1 } },
  { name: "syncopated", dens: 0.55, off: 0.85, gate: 0.55, acc: 0.45, sld: 0.25, mut: 0.9, swing: 0.10,
    push: 0.045, pick: 0.45, bp: 0.15, frz: 0.10,
    contours: { neighbor: 2, leaprtn: 2, arch: 2, repeat: 1, ascending: 1 } },
  { name: "driving",    dens: 0.80, off: 0.25, gate: 0.60, acc: 0.50, sld: 0.12, mut: 0.5, swing: 0.03,
    push: 0.080, pick: 0.25, bp: 0.05, frz: 0.22,
    contours: { repeat: 3, pedal: 2, ascending: 1, descending: 1 } },
  { name: "acidic",     dens: 0.65, off: 0.55, gate: 0.50, acc: 0.60, sld: 0.50, mut: 0.9, swing: 0.05,
    push: 0.060, pick: 0.35, bp: 0.30, frz: 0.08,
    contours: { leaprtn: 3, neighbor: 2, ascending: 2, arch: 1, repeat: 1 } },
  { name: "broken",     dens: 0.50, off: 0.60, gate: 0.55, acc: 0.55, sld: 0.25, mut: 1.3, swing: 0.09,
    push: 0.035, pick: 0.50, bp: 0.20, frz: 0.06,
    contours: { arch: 2, leaprtn: 2, descending: 2, neighbor: 1, ascending: 1 } },
  { name: "hypnotic",   dens: 0.55, off: 0.50, gate: 0.40, acc: 0.12, sld: 0.10, mut: 0.15, swing: 0.04,
    push: 0.018, pick: 0.15, bp: 0.00, frz: 0.35,
    contours: { repeat: 4, pedal: 3, neighbor: 1 } }
];

// ---------------------------------------------------------------- state

// macros / params (defaults match the device's parameter_initial values)
var P = {
  density: 0.5, novelty: 0.35, chunk: 0.55, squelch: 0.5, drive: 0.35,
  cutoff: 0.45, decay: 0.5, sub: 0.6, wet: 0.3,
  groove: 1, root: 36, bars: 2, lock: 0
};

var phrase = null;
var history = [];        // §1.2 phrase memory, most recent last, capped at 8
var idCounter = 0;
var letterIdx = 0;       // root-phrase letter, advances on Reseed

var seedRng = null;      // pattern stream
var chaosRng = null;     // §4.1 separate stream so chaos and pattern stay uncorrelated
var slow = { cut: 0, res: 0, wet: 0 }; // §4.2 slow walk: filter + wet character
var med = { dec: 0, drv: 0 };          // §4.2 medium walk: decay / drive
var fast = { tim: 0, wet: 0 };         // §4.2 fast walk: per-step timbre / wet

var freezeLeft = 0;      // §1.11 repetition freeze: phrase cycles left to hold
var lastReturnMs = -1;   // §5.3 double-press Return = return to the lineage root

var playStep = 0;
var lastTick = -1;
var stepMs = 125;
var deltas = [];
var firstCycle = true;
var pendingRegen = null; // "soft" (new density/groove) or "full" (new length)

var posStep = -1;        // transport phase correction
var posTime = -1;

var noteOn = false;
var offPending = false;
var pendingStep = -1;
var earlyStep = -1;      // step scheduled ahead of its own tick (rushed onset)
var skipStep = -1;       // step already fired early — its tick must not re-fire it
var lastEmittedDelayMs = -1;

var offTask = null;
var noteTask = null;
var earlyTask = null;

// ---------------------------------------------------------------- utilities

function makeRng(seed) { // Park–Miller: safe in doubles, no imul needed
  var s = Math.floor(Math.abs(seed)) % 2147483647;
  if (s < 1) s = 1;
  var f = function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  f.get = function () { return s; };        // §5.4: the stream position is saved state
  f.set = function (v) {
    var n = Math.floor(Math.abs(v)) % 2147483647;
    s = n < 1 ? 1 : n;
  };
  return f;
}

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function gauss(d, sigma) { return Math.exp(-(d * d) / (2 * sigma * sigma)); }
function round3(v) { return Math.round((v || 0) * 1000) / 1000; }

function contourIdx(name) {
  for (var i = 0; i < CONTOURS.length; i++) if (CONTOURS[i] === name) return i;
  return 0;
}

function median(arr) {
  var a = arr.slice().sort(function (x, y) { return x - y; });
  return a[Math.floor(a.length / 2)];
}

function walkUpdate(v, range, rng) { // §4.2 bounded chaos random walk
  return clamp(v + (rng() - 0.5) * range * 0.7, -range, range);
}

function grooveNow() { return GROOVES[P.groove] || GROOVES[1]; }

function clonePhrase(p) {
  return {
    id: p.id, parentId: p.parentId, generation: p.generation,
    letter: p.letter, seed: p.seed, bars: p.bars, contour: p.contour,
    onsets: p.onsets.slice(), gates: p.gates.slice(), pitches: p.pitches.slice(),
    accents: p.accents.slice(), slides: p.slides.slice(), probs: p.probs.slice(),
    timbres: p.timbres.slice(), wets: p.wets.slice(), micros: p.micros.slice(),
    vels: p.vels ? p.vels.slice() : []
  };
}

function onsetList(p) {
  var out = [];
  for (var i = 0; i < p.onsets.length; i++) if (p.onsets[i]) out.push(i);
  return out;
}

function rememberPhrase(p) { // §1.2
  history.push(p);
  while (history.length > 8) history.shift();
}

// ---------------------------------------------------------------- generation

// §1.3 hierarchical timing + §1.4 rest logic
function genRhythm(rng, bars, dens, off) {
  var n = bars * STEPS_PER_BAR;
  var onsets = [];
  var consec = 0;
  for (var s = 0; s < n; s++) {
    var barPos = s % STEPS_PER_BAR;
    var beatPos = s % 4;
    var p;
    if (barPos === 0) p = clamp(dens * 2.2 + 0.25, 0, 0.97);          // the one
    else if (beatPos === 0) p = dens * 1.3;                            // quarter beats
    else if (beatPos === 2) p = dens * (0.55 + off * 1.2);             // 8th offbeats
    else p = dens * (0.22 + off * 0.9);                                // 16th offbeats
    if (s >= n - 2) p *= 0.45;                                         // phrase-end silence bias
    if (consec >= 6) p = 0;                                            // max consecutive notes
    if (rng() < clamp(p, 0, 0.97)) { onsets[s] = true; consec++; }
    else { onsets[s] = false; consec = 0; }
  }
  var count = 0;
  for (s = 0; s < n; s++) if (onsets[s]) count++;
  if (count < 2) { onsets[0] = true; onsets[8] = true; }               // never fully silent
  return onsets;
}

// §1.7 contour grammar: target offset (semitones above root) for onset k of m
function contourTarget(type, k, m) {
  var t = m > 1 ? k / (m - 1) : 0;
  if (type === "ascending") return 2 + t * 5;
  if (type === "descending") return 7 - t * 7;
  if (type === "arch") return Math.sin(Math.PI * t) * 7;
  if (type === "pedal") return (k % 4 === 3) ? 7 : 0;
  if (type === "leaprtn") return (k % 4 === 2) ? 12 : 0;
  if (type === "neighbor") return (k % 2) * 2;
  return 0; // repeat
}

function pickContour(rng, groove) {
  var total = 0, key;
  for (key in groove.contours) total += groove.contours[key];
  var r = rng() * total;
  for (key in groove.contours) {
    r -= groove.contours[key];
    if (r <= 0) return key;
  }
  return "repeat";
}

// §1.5 register discipline + §1.6 tonal gravity
function pickPitch(rng, root, prev, target, isFirst, isFinal, contour) {
  if ((contour === "repeat" || contour === "pedal") && prev >= 0 && rng() < 0.6) return prev;
  var best = root, total = 0, weights = [], pitches = [], semis;
  for (semis = 0; semis <= 24; semis++) {
    if (!(semis in GRAVITY)) continue;
    var pitch = root + semis;
    var w = GRAVITY[semis] * gauss(semis - target, 3.5);
    if (prev >= 0) {
      var d = Math.abs(pitch - prev);
      if (d === 0) w *= 0.7;
      else if (d <= 2) w *= 1.2;
      else if (d <= 4) w *= 1.0;
      else if (d <= 7) w *= 0.75;
      else if (d <= 12) w *= 0.4;
      else w *= 0.03; // max interval jump
    }
    if (isFinal && ANCHOR[semis]) w *= 2.2; // phrase endings resolve to anchors
    if (isFirst && semis === 0) w *= 3.5;   // §1.5 phrases open grounded on the root
    if (prev >= 0 && prev - root >= 10 && semis <= 5) w *= 1.6; // §1.5 register reset after a leap
    weights.push(w); pitches.push(pitch); total += w;
  }
  var r = rng() * total;
  for (var i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { best = pitches[i]; break; }
  }
  return best;
}

function genPitches(rng, p) {
  var ons = onsetList(p);
  var pitches = [];
  var prev = -1;
  for (var k = 0; k < ons.length; k++) {
    var target = contourTarget(p.contour, k, ons.length);
    var pitch = pickPitch(rng, P.root, prev, target,
      k === 0, k === ons.length - 1, p.contour);
    pitches[ons[k]] = pitch;
    prev = pitch;
  }
  // §1.5: enforce 80/20 anchor vs passing tones
  var anchors = 0;
  for (k = 0; k < ons.length; k++) if (ANCHOR[pitches[ons[k]] - P.root]) anchors++;
  k = 0;
  while (ons.length > 0 && anchors / ons.length < 0.8 && k < ons.length) {
    var idx = ons[Math.floor(rng() * ons.length)];
    if (!ANCHOR[pitches[idx] - P.root]) {
      var semi = pitches[idx] - P.root;
      var bestA = 0, bestD = 99, a;
      for (a in ANCHOR) { a = parseInt(a, 10); if (Math.abs(a - semi) < bestD) { bestD = Math.abs(a - semi); bestA = a; } }
      pitches[idx] = P.root + bestA;
      anchors++;
    }
    k++;
  }
  return pitches;
}

// §1.8 accent hierarchy: bar template + syncopation + surprise, capped
function genAccents(rng, p, groove) {
  var n = p.onsets.length;
  var accents = [];
  var s;
  for (s = 0; s < n; s++) accents[s] = false;
  var count = 0, onsets = 0;
  for (s = 0; s < n; s++) {
    if (!p.onsets[s]) continue;
    onsets++;
    var barPos = s % STEPS_PER_BAR;
    if (barPos === 0 && rng() < 0.8) { accents[s] = true; count++; }
    else if (groove.name === "driving" && barPos % 4 === 0 && rng() < 0.5) { accents[s] = true; count++; }
    else if ((barPos === 3 || barPos === 6 || barPos === 10 || barPos === 14) && rng() < groove.acc) { accents[s] = true; count++; }
    else if (rng() < 0.05 + groove.acc * 0.05) {
      if (!(s > 0 && accents[s - 1])) { accents[s] = true; count++; } // no adjacent surprises
    }
  }
  var cap = Math.max(1, Math.floor(onsets * 0.35));
  var guard = 0;
  while (count > cap && guard < 200) {
    s = Math.floor(rng() * n);
    if (accents[s] && s % STEPS_PER_BAR !== 0) { accents[s] = false; count--; }
    guard++;
  }
  return accents;
}

// §1.9 slide conditions: conditional, never arbitrary
function genSlides(rng, p, groove, densActual) {
  var n = p.onsets.length;
  var slides = [];
  for (var s = 0; s < n; s++) slides[s] = false;
  var ons = onsetList(p);
  for (var k = 0; k + 1 < ons.length; k++) {
    var i = ons[k], j = ons[k + 1];
    var interval = Math.abs(p.pitches[j] - p.pitches[i]);
    var prob = groove.sld * (1 + 0.7 * densActual);
    prob *= (j === i + 1) ? 1.6 : 0.25;             // legato strongly preferred
    if (interval <= 3) prob *= 1.4;                  // small intervals slide more
    if (p.accents[j]) prob *= 1.3;                   // accented targets slide more
    if (p.pitches[j] < p.pitches[i]) prob *= 0.9;    // slight upward bias
    if (interval === 12) prob *= 0.7;                // octave slides allowed, rarer
    if (interval === 0) prob *= 0.3;
    if (rng() < clamp(prob, 0, 0.85)) slides[j] = true;
  }
  return slides;
}

// per-step metadata layers (§5.1): velocity, gate, probability, timbre, wet, micro
function genStepMeta(rng, p, groove) {
  var n = p.onsets.length;
  p.gates = []; p.probs = []; p.timbres = []; p.wets = []; p.micros = [];
  var vels = [];
  var gateFrac = clamp(groove.gate * (1.7 - 1.1 * P.chunk), 0.15, 0.98);
  for (var s = 0; s < n; s++) {
    var barPos = s % STEPS_PER_BAR;
    var beatPos = s % 4;
    if (!p.onsets[s]) {
      p.gates[s] = 0; p.probs[s] = 0; p.timbres[s] = 0; p.wets[s] = 0; p.micros[s] = 0; vels[s] = 0;
      continue;
    }
    if (p.accents[s]) vels[s] = Math.floor(112 + rng() * 12);
    else if (beatPos !== 0 && rng() < 0.25) vels[s] = Math.floor(58 + rng() * 12); // ghosts
    else vels[s] = Math.floor(82 + rng() * 18);
    p.gates[s] = p.slides[s] ? 1.02 : gateFrac * (0.9 + rng() * 0.2);
    p.probs[s] = (barPos % 4 === 0) ? 1.0 : clamp(1 - P.novelty * 0.3 * rng(), 0.7, 1);
    p.timbres[s] = p.accents[s] ? 0.15 + rng() * 0.15 : (rng() - 0.5) * 0.3;
    p.wets[s] = (beatPos === 2 ? 0.12 : 0) + rng() * 0.15;
    // §1.12 microtiming is signed: swing drags the 8th offbeats, accents lean
    // forward onto the beat, ghosts lay back behind it.
    var micro = (beatPos === 2 ? groove.swing : 0);
    if (p.accents[s]) micro -= groove.push;
    else if (vels[s] < 72) micro += groove.push * 0.8;
    micro += (rng() - 0.5) * 0.04;
    p.micros[s] = clamp(micro, -0.25, 0.35); // fraction of a step
  }
  p.vels = vels;
}

// §1.13 pickups: a 16th before a downbeat that anticipates its pitch and, most
// of the time, ties through it — the bar arrives before the bar line does.
function addPickups(rng, p, groove) {
  var n = p.onsets.length;
  for (var b = 0; b < p.bars; b++) {
    var down = b * STEPS_PER_BAR;
    var pre = (down - 1 + n) % n;
    if (!p.onsets[down] || p.onsets[pre]) continue;
    if (rng() >= groove.pick) continue;
    p.onsets[pre] = true;
    p.pitches[pre] = p.pitches[down];
    p.accents[pre] = false;
    p.slides[pre] = false;
    if (rng() < 0.6) p.slides[down] = true; // tie: the pickup sustains through
  }
}

function generatePhrase(seed, parent) {
  var rng = makeRng(seed);
  var groove = grooveNow();
  var dens = clamp(groove.dens * (0.4 + P.density * 1.4), 0.05, 0.95);
  var p = {
    id: ++idCounter,
    parentId: parent ? parent.id : -1,
    generation: parent ? parent.generation + 1 : 0,
    letter: parent ? parent.letter : String.fromCharCode(65 + (letterIdx % 26)),
    seed: seed, bars: P.bars,
    contour: pickContour(rng, groove)
  };
  p.onsets = genRhythm(rng, P.bars, dens, groove.off);
  p.pitches = genPitches(rng, p);
  p.accents = genAccents(rng, p, groove);
  p.slides = genSlides(rng, p, groove, dens);
  addPickups(rng, p, groove);
  genStepMeta(rng, p, groove);
  return p;
}

// ---------------------------------------------------------------- mutation (§1.1 + §4.3)

function mutatePhrase(parent, novelty) {
  var rng = makeRng(parent.seed * 31 + parent.generation * 7 + idCounter * 13 + 1);
  var groove = grooveNow();
  var depth = novelty < 0.33 ? 0 : (novelty < 0.7 ? 1 : 2);
  var alloc = {}, k;
  for (k in BUDGET) alloc[k] = clamp(novelty * BUDGET[k] / 0.25, 0, 1); // §4.3

  if (depth === 2) {
    // high: regenerate most layers; retain root / scale / phrase length
    var fresh = generatePhrase(Math.floor(rng() * 2147483646), parent);
    fresh.letter = parent.letter;
    return fresh;
  }

  var child = clonePhrase(parent);
  child.id = ++idCounter;
  child.parentId = parent.id;
  child.generation = parent.generation + 1;
  var ons = onsetList(child);

  if (depth === 0) {
    // low: preserve rhythm; alter 1–2 pitches; maybe move one accent
    var nChanges = 1 + (rng() < alloc.pitch ? 1 : 0);
    for (var c = 0; c < nChanges && ons.length > 0; c++) {
      var kIdx = Math.floor(rng() * ons.length);
      var s = ons[kIdx];
      var prev = kIdx > 0 ? child.pitches[ons[kIdx - 1]] : -1;
      child.pitches[s] = pickPitch(rng, P.root, prev,
        contourTarget(child.contour, kIdx, ons.length), false, kIdx === ons.length - 1, child.contour);
    }
    if (rng() < alloc.accent * 0.8 && ons.length > 1) {
      var from = ons[Math.floor(rng() * ons.length)];
      var to = ons[Math.floor(rng() * ons.length)];
      if (child.accents[from] && from % STEPS_PER_BAR !== 0) {
        child.accents[from] = false; child.accents[to] = true;
      }
    }
    if (rng() < alloc.slide) child.slides = genSlides(rng, child, groove, 0.5);
  } else {
    // medium: preserve contour; alter rhythm density; alter slide placement
    var dens = clamp(groove.dens * (0.4 + P.density * 1.4) * (1 + (rng() - 0.5) * alloc.rhythm * 0.5), 0.05, 0.95);
    child.onsets = genRhythm(rng, child.bars, dens, groove.off);
    child.pitches = genPitches(rng, child);       // same contour type = preserved identity
    child.accents = genAccents(rng, child, groove);
    child.slides = genSlides(rng, child, groove, dens);
    addPickups(rng, child, groove);
  }

  // §4.3: a low-depth mutation spends only its timbre/wet allocation on the
  // sound layers; a rhythm change has new steps and needs the full metadata pass.
  if (depth === 0) mutateMeta(rng, child, alloc);
  else genStepMeta(rng, child, groove);
  return child;
}

// §4.3 novelty budget applied to the per-step sound layers
function mutateMeta(rng, p, alloc) {
  var n = p.onsets.length;
  var gateFrac = clamp(grooveNow().gate * (1.7 - 1.1 * P.chunk), 0.15, 0.98);
  for (var s = 0; s < n; s++) {
    if (!p.onsets[s]) {
      p.gates[s] = 0; p.probs[s] = 0; p.timbres[s] = 0;
      p.wets[s] = 0; p.micros[s] = 0; p.vels[s] = 0;
      continue;
    }
    if (!(p.vels[s] > 0)) p.vels[s] = Math.floor(82 + rng() * 18);
    p.gates[s] = p.slides[s] ? 1.02 : gateFrac * (0.9 + rng() * 0.2);
    if (rng() < alloc.timbre) p.timbres[s] = clamp(p.timbres[s] + (rng() - 0.5) * 0.5, -0.6, 0.6);
    if (rng() < alloc.wet) p.wets[s] = clamp(p.wets[s] + (rng() - 0.5) * 0.35, 0, 0.6);
  }
}

// ---------------------------------------------------------------- lineage (§1.2 / §5.3)

function adoptPhrase(p) {
  phrase = p;
  rememberPhrase(p);
  updateDisplay();
  pushState();
}

function returnToParent() {
  if (!phrase || phrase.generation === 0) return;
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i].id === phrase.parentId) { phrase = history[i]; updateDisplay(); pushState(); return; }
  }
  for (i = 0; i < history.length; i++) {
    if (history[i].generation === 0) { phrase = history[i]; updateDisplay(); pushState(); return; }
  }
}

// §1.2: skip the lineage and snap straight back to the phrase everything grew from
function returnToRoot() {
  if (!phrase) return;
  for (var i = 0; i < history.length; i++) {
    if (history[i].generation === 0) { phrase = history[i]; updateDisplay(); pushState(); return; }
  }
  returnToParent();
}

function phraseBoundary() {
  phraseAdvance();
  pushState(); // §5.4: the walks drift every cycle, so the saved state follows them
}

function phraseAdvance() {
  slow.cut = walkUpdate(slow.cut, 0.08, chaosRng); // §4.2 clamps
  slow.res = walkUpdate(slow.res, 0.03, chaosRng);
  slow.wet = walkUpdate(slow.wet, 0.10, chaosRng);
  if (firstCycle) { firstCycle = false; pushSynth(); updateDisplay(); return; }
  if (P.lock) { pushSynth(); return; } // §5.3 lock phrase

  if (pendingRegen) {
    if (pendingRegen === "full") adoptPhrase(generatePhrase(Math.floor(chaosRng() * 2147483646), null));
    else adoptPhrase(mutatePhrase(phrase, Math.max(P.novelty, 0.4)));
    pendingRegen = null;
    freezeLeft = 0;
    pushSynth();
    return;
  }

  // §1.11 freeze: hold the identity for a few cycles so a good phrase gets to land
  if (freezeLeft > 0) { freezeLeft--; pushSynth(); return; }

  var r = chaosRng(); // phrase-level chaos domain (§4.1)
  var pReturn = phrase.generation > 0 ? (0.10 + 0.35 * (1 - P.novelty)) : 0;
  var pMut = clamp((0.2 + 0.6 * P.novelty) * grooveNow().mut, 0, 0.9);
  if (r < pReturn) {
    // deep in a lineage, the pull is toward the root, not just one step back
    if (phrase.generation >= 3 && chaosRng() < 0.45) returnToRoot();
    else returnToParent();
  } else if (r < pReturn + pMut) {
    adoptPhrase(mutatePhrase(phrase, P.novelty));
  } else if (chaosRng() < grooveNow().frz * (1.2 - P.novelty)) {
    freezeLeft = 1 + Math.floor(chaosRng() * 3);
  }
  // else: repeat as-is — repetition is a feature
  pushSynth();
}

function barBoundary() {
  med.dec = walkUpdate(med.dec, 0.12, chaosRng);
  med.drv = walkUpdate(med.drv, 0.05, chaosRng);
  pushSynth();
  pushState(); // the medium walk drifts every bar; the saved state follows it
}

// ---------------------------------------------------------------- synth coupling (§2 / §5.1)

function pushSynth() {
  // voicing note: the filter sustains near ~311 Hz at default cutoff and the
  // envelope sweeps ~1.2 kHz above it — the squelch rides ON TOP of a solid
  // fundamental instead of parking every note in the midrange.
  var cutoffHz = 45 * Math.pow(2, P.cutoff * 6.2) * (1 + slow.cut);
  var reso = clamp(0.06 + P.squelch * 0.68 + slow.res, 0, 0.92);
  var envd = 180 + Math.pow(P.squelch, 1.4) * 2800;
  var drv = (0.7 + P.drive * 2.6) * (1 + med.drv);
  // §2.3 filter mode: each groove blends a little bandpass into the lowpass,
  // and squelch opens that blend further — capped so the fundamental survives.
  var bpmix = clamp(grooveNow().bp * (0.35 + 0.65 * P.squelch), 0, 0.35);
  outlet(0, "cutoff", cutoffHz, 30);
  outlet(0, "reso", reso);
  outlet(0, "envd", envd, 30);
  outlet(0, "drv", drv, 30);
  outlet(0, "lpamt", 1 - bpmix);
  outlet(0, "bpamt", bpmix);
  // §2.3 nonlinear filter: resonance drives the post-filter saturator harder, so
  // resonant peaks compress and bloom harmonics instead of just getting louder
  outlet(0, "nlin", 1 + reso * 1.9);
  outlet(0, "nlout", 1 / (1 + reso * 1.1));
  // §2.2 resonance-tracking low shelf: a resonant lowpass thins its own passband,
  // so the low shelf comes up exactly as far as the resonance (and bandpass) takes it away
  outlet(0, "shelf", clamp(reso * 0.7 + bpmix * 0.9, 0, 0.95));
  outlet(0, "post", 1 + P.drive * 0.8);
  outlet(0, "gain", 0.55 * (1 + reso * 0.15)); // §2.2 residual broadband compensation
  outlet(0, "adec", lerp(430, 120, P.chunk) * (1 + med.dec * 0.5));
  outlet(0, "asus", lerp(0.5, 0.12, P.chunk));
  outlet(0, "sub", 0.45 + P.sub * 0.55); // §2.2: floor keeps low-end energy at any Sub setting
  outlet(0, "wet", Math.pow(P.wet, 1.25), 60);
  outlet(0, "duck", 0.45 + 0.4 * P.wet);
  outlet(0, "fb", 0.28 + P.wet * 0.22);
  // §3.2 envelope-shaped send: the send opens with its own envelope per note, so
  // the tail is what gets thrown into the delay rather than the transient
  outlet(0, "wamt", 0.35 + P.wet * 0.4);
  outlet(0, "wflr", clamp(0.55 - P.wet * 0.25, 0.2, 0.7));
  outlet(0, "wdec", lerp(240, 900, P.wet));
  outlet(0, "dmod", 0.8 + P.wet * 3.2); // §3.2 tap modulation depth in ms (diffusion)
}

function pushDelays() {
  // clamped to the tapin~ buffer: at very slow tempos 5 steps would run past it
  outlet(0, "dly", clamp(stepMs * 3, 20, 1800));  // dotted 8th
  outlet(0, "dly2", clamp(stepMs * 5, 20, 1900)); // 5/16 polymetric tap
  lastEmittedDelayMs = stepMs;
}

function fdecBase() {
  // short enough that the squelch resolves inside a 16th at default Decay
  return (40 + Math.pow(P.decay, 1.5) * 520) * (1 + med.dec);
}

// ---------------------------------------------------------------- playback

function sendOff() {
  outlet(1, "trig", 0);
  noteOn = false;
  offPending = false;
}

function restHold() { // a rest (or dropped tie) while a note is held: close it
  if (noteOn && !offPending) sendOff();
}

function fireStep(s) {
  var p = phrase;
  if (!p || !p.onsets[s]) { restHold(); return; }
  if (Math.random() > p.probs[s]) { restHold(); return; } // §5.1 probability at play time

  var acc = p.accents[s];
  var tie = p.slides[s] && noteOn;
  var glide = p.slides[s] ? Math.max(20, stepMs * 0.45) : 4;
  var tim = clamp(p.timbres[s] + fast.tim, -0.8, 0.8); // §4.2 fast walk rides the step layer

  // does the next onset slide into this one? decides both the gate below and how
  // long the MIDI note has to be to read as a slide downstream
  var n = p.onsets.length;
  var next = -1;
  for (var i = s + 1; i < s + 3 && i < n; i++) if (p.onsets[i]) { next = i; break; }
  var willTie = next >= 0 && p.slides[next];
  var gateMs = Math.max(15, p.gates[s] * stepMs);

  // §2.1 filter state machine: accent drives coupled env/drive/decay changes
  outlet(1, "fdec", fdecBase() * (acc ? 0.8 : 1));
  outlet(1, "fmul", (acc ? 1.55 : 1.0) * (1 + tim * 0.4));
  outlet(1, "dmul", (acc ? 1.35 : 1.0) * (1 + (p.vels[s] / 127) * 0.2));
  outlet(1, "pitch", p.pitches[s], glide);
  // §2.2 sub reinforcement + §2.5: sub pitch folded into 32.7–61.7 Hz (MIDI 24–35)
  // so every note — including octave/fifth excursions — carries a true sub fundamental
  var sp = p.pitches[s] - 12;
  while (sp > 35) sp -= 12;
  while (sp < 24) sp += 12;
  outlet(1, "spitch", sp, glide);
  if (!tie) outlet(1, "trig", p.vels[s] / 127); // slide = glide without retrigger
  noteOn = true;

  // §5.1 per-step wet, offset by the fast and slow chaos walks (§4.2)
  outlet(0, "wet",
    clamp(Math.pow(P.wet, 1.25) + (p.wets[s] + fast.wet + slow.wet) * P.wet, 0, 1), 25);

  // §6 MIDI note for the MIDI-effect build. The instrument build leaves this
  // unrouted. A tie becomes a legato overlap into the next note rather than a
  // held note: that is what makes a downstream mono synth glide instead of
  // retrigger, which is the same thing the tie does to our own voice.
  outlet(1, "note", p.pitches[s], p.vels[s],
    Math.round(willTie ? (next - s) * stepMs + 30 : gateMs));

  // hold through a tie, otherwise schedule the gate off
  if (offTask) offTask.cancel();
  offPending = false;
  if (!willTie && offTask) { offTask.schedule(gateMs); offPending = true; }
}

function firePending() { fireStep(pendingStep); }
function fireEarly() { fireStep(earlyStep); }

function microMs(s) { // §1.12 signed offset in ms, bounded either side of the grid
  var lim = Math.min(30, stepMs * 0.35);
  return clamp(phrase.micros[s] * stepMs, -lim, lim);
}

// a step that drags: schedule it after its own tick
function scheduleFire(s) {
  var p = phrase;
  if (!p || !p.onsets[s]) { restHold(); return; }
  var ms = microMs(s);
  if (ms < 2 || !noteTask) { fireStep(s); return; }
  pendingStep = s;
  noteTask.cancel();
  noteTask.schedule(ms);
}

// a step that rushes: schedule it from the PREVIOUS tick, before its own arrives.
// Without this the device could only ever lay back, never push.
function scheduleEarly(s) {
  skipStep = -1;
  if (s === 0) return; // never rush across a phrase boundary — the phrase may change
  var p = phrase;
  if (!p || !p.onsets[s] || !earlyTask) return;
  var ms = microMs(s);
  if (ms > -2) return;
  earlyStep = s;
  skipStep = s;
  earlyTask.cancel();
  earlyTask.schedule(Math.max(1, stepMs + ms));
}

function onRestart(total) {
  deltas = [];
  firstCycle = true;
  skipStep = -1;
  if (earlyTask) earlyTask.cancel();
  playStep = (posTime > 0 && Date.now() - posTime < 60 && posStep >= 0) ? posStep % total : 0;
  restHold();
}

function stepWalk() { // §4.2 fast walk: drifts every step, bounded and novelty-scaled
  var amt = 0.35 + P.novelty * 0.65;
  fast.tim = walkUpdate(fast.tim, 0.18 * amt, chaosRng);
  fast.wet = walkUpdate(fast.wet, 0.14 * amt, chaosRng);
}

function tick() {
  if (!phrase) return;
  var total = phrase.bars * STEPS_PER_BAR;
  var now = Date.now();
  if (lastTick < 0) onRestart(total);
  else {
    var d = now - lastTick;
    if (d > stepMs * 2.5) onRestart(total);
    else {
      deltas.push(d);
      if (deltas.length > 5) deltas.shift();
      stepMs = clamp(median(deltas), 40, 1000);
      if (lastEmittedDelayMs < 0 || Math.abs(stepMs - lastEmittedDelayMs) / stepMs > 0.03) pushDelays();
    }
  }
  lastTick = now;

  // transport phase correction when a fresh, sane position is available
  if (posTime > 0 && now - posTime < 60 && posStep >= 0) {
    var expected = posStep % total;
    if (expected !== playStep) playStep = expected;
  }

  if (playStep === 0) phraseBoundary();
  else if (playStep % STEPS_PER_BAR === 0) barBoundary();
  stepWalk();
  if (playStep === skipStep) skipStep = -1; // already fired ahead of this tick
  else scheduleFire(playStep);
  var next = (playStep + 1) % total;
  scheduleEarly(next);
  playStep = next;
}

// ---------------------------------------------------------------- display

function phraseName(p) { return p.letter + p.generation; }

function updateDisplay() {
  if (!phrase) return;
  outlet(2, "disp", phraseName(phrase),
    "·", grooveNow().name,
    "·", phrase.bars + (phrase.bars === 1 ? " bar" : " bars"),
    "·", phrase.contour);
}

// ---------------------------------------------------------------- MIDI capture (§6)
// The device is an instrument, so its notes never existed as MIDI — Live had
// nothing to arm-record or Capture. This writes the phrase into a Live clip
// directly instead, which also means the capture is exact: the microtiming and
// the slide overlaps go in as written, not as one dice roll of a live pass.

// The phrase as plain note events, in beats from the phrase start. Pure: no
// Live API, no outlets, so the harness can check it.
function noteEvents(p) {
  p = p || phrase;
  var evs = [];
  if (!p || !p.vels) return evs;
  var n = p.onsets.length;
  // the microtiming bound in fractional steps, matching microMs()
  var lim = Math.min(30 / Math.max(1, stepMs), 0.35);
  for (var s = 0; s < n; s++) {
    if (!p.onsets[s]) continue;
    var start = (s + clamp(p.micros[s], -lim, lim)) * 0.25;
    if (start < 0) start = 0;               // step 0 never rushes past the clip start

    var next = -1;
    for (var i = s + 1; i < s + 3 && i < n; i++) if (p.onsets[i]) { next = i; break; }
    var dur;
    if (next >= 0 && p.slides[next]) {
      // tie: overlap into the next note so a mono synth glides rather than retriggers
      var nStart = (next + clamp(p.micros[next], -lim, lim)) * 0.25;
      dur = nStart - start + 0.03;
    } else {
      dur = Math.max(15 / Math.max(1, stepMs), p.gates[s]) * 0.25;
    }
    evs.push({ pitch: p.pitches[s], start: start,
               dur: Math.max(0.02, dur), vel: p.vels[s] });
  }
  return evs;
}

function apiNoop() {} // LiveAPI wants a callback even when nothing observes

function captureSlot(track) { // first empty slot on our own track, or -1
  var count = track.getcount("clip_slots");
  for (var i = 0; i < count; i++) {
    var slot = new LiveAPI(apiNoop, "this_device canonical_parent clip_slots " + i);
    if (Number(slot.get("has_clip")) === 0) return i;
  }
  return -1;
}

function Capture() { // §5.3 button: write the current phrase into a clip
  var evs = noteEvents(phrase);
  if (!evs.length) return;
  try {
    var track = new LiveAPI(apiNoop, "this_device canonical_parent");
    var idx = captureSlot(track);
    if (idx < 0) { outlet(2, "disp", "capture:", "no", "empty", "slot"); return; }

    var base = "this_device canonical_parent clip_slots " + idx;
    var slot = new LiveAPI(apiNoop, base);
    slot.call("create_clip", phrase.bars * 4);
    var clip = new LiveAPI(apiNoop, base + " clip");
    clip.set("name", "PG " + phraseName(phrase));
    writeNotes(clip, evs);
    outlet(2, "disp", "captured", phraseName(phrase), "→", "slot", idx + 1);
  } catch (e) {
    post("PG capture failed: " + e + "\n");
    outlet(2, "disp", "capture", "failed", "—", "see", "Max", "Console");
  }
}

function writeNotes(clip, evs) {
  // Live 11+ takes a dict of notes; older sets only understand the note/done
  // sequence, so fall back rather than fail on a machine we can't test here.
  try {
    var notes = [];
    for (var i = 0; i < evs.length; i++) {
      notes.push({ pitch: evs[i].pitch, start_time: evs[i].start,
                   duration: evs[i].dur, velocity: evs[i].vel, mute: 0 });
    }
    var d = new Dict();
    d.parse(JSON.stringify({ notes: notes }));
    clip.call("add_new_notes", d);
  } catch (e) {
    clip.call("set_notes");
    clip.call("notes", evs.length);
    for (var k = 0; k < evs.length; k++) {
      clip.call("note", evs[k].pitch, evs[k].start, evs[k].dur, evs[k].vel, 0);
    }
    clip.call("done");
  }
}

// ---------------------------------------------------------------- messages (patch → js)

function bang() { tick(); }

function pos(b, bt, u) { // from [transport]: bars, beats, units
  if (b >= 1 && bt >= 1 && bt <= 16 && u >= 0 && u < 1920) {
    posStep = ((b - 1) * 4 + (bt - 1)) * 4 + Math.floor(u / TICKS_PER_STEP);
    posTime = Date.now();
  }
}

function density(v) { P.density = clamp(v, 0, 1); pendingRegen = pendingRegen || "soft"; }
function novelty(v) { P.novelty = clamp(v, 0, 1); }
function chunk(v) { P.chunk = clamp(v, 0, 1); pushSynth(); }
function squelch(v) { P.squelch = clamp(v, 0, 1); pushSynth(); }
function drive(v) { P.drive = clamp(v, 0, 1); pushSynth(); }
function cutoff(v) { P.cutoff = clamp(v, 0, 1); pushSynth(); }
function decay(v) { P.decay = clamp(v, 0, 1); }
function sub(v) { P.sub = clamp(v, 0, 1); pushSynth(); }
function wet(v) { P.wet = clamp(v, 0, 1); pushSynth(); }

function groove(i) {
  P.groove = clamp(Math.floor(i), 0, GROOVES.length - 1);
  pendingRegen = pendingRegen || "soft";
  updateDisplay();
}

function root(i) { // §5.3-adjacent: live transpose, phrase identity intact
  var newRoot = 36 + clamp(Math.floor(i), 0, 11);
  var delta = newRoot - P.root;
  P.root = newRoot;
  if (phrase && delta !== 0) {
    for (var s = 0; s < phrase.pitches.length; s++) {
      if (phrase.onsets[s]) phrase.pitches[s] += delta;
    }
    pushState();
  }
}

function plen(i) {
  var bars = [1, 2, 4][clamp(Math.floor(i), 0, 2)];
  if (bars !== P.bars) { P.bars = bars; pendingRegen = "full"; }
}

function lock(v) { P.lock = v ? 1 : 0; } // §5.3 lock phrase

function Mutate() { if (phrase) adoptPhrase(mutatePhrase(phrase, Math.max(P.novelty, 0.25))); } // §5.3
function Return() { // §5.3 — one press steps back a generation, two in a row go to the root
  var now = Date.now();
  if (lastReturnMs > 0 && now - lastReturnMs < 700) returnToRoot();
  else returnToParent();
  lastReturnMs = now;
}
function Reseed() { // §5.3: new seed, new root phrase, lineage restarts
  letterIdx++;
  adoptPhrase(generatePhrase((Date.now() % 2147483646) + 1, null));
}
function Rhythm() { // §5.3 regenerate one layer only: rhythm
  if (!phrase) return;
  var rng = makeRng(Math.floor(chaosRng() * 2147483646) + 1);
  var groove = grooveNow();
  var dens = clamp(groove.dens * (0.4 + P.density * 1.4), 0.05, 0.95);
  var oldPitchSeq = [];
  var ons = onsetList(phrase), k;
  for (k = 0; k < ons.length; k++) oldPitchSeq.push(phrase.pitches[ons[k]]);
  phrase.onsets = genRhythm(rng, phrase.bars, dens, groove.off);
  ons = onsetList(phrase);
  phrase.pitches = [];
  for (k = 0; k < ons.length; k++) {
    phrase.pitches[ons[k]] = oldPitchSeq.length > 0 ? oldPitchSeq[k % oldPitchSeq.length]
      : pickPitch(rng, P.root, -1, 0, k === 0, false, phrase.contour);
  }
  phrase.accents = genAccents(rng, phrase, groove);
  phrase.slides = genSlides(rng, phrase, groove, dens);
  addPickups(rng, phrase, groove);
  genStepMeta(rng, phrase, groove);
  updateDisplay();
  pushState();
}
function Pitch() { // §5.3 regenerate one layer only: pitch
  if (!phrase) return;
  var rng = makeRng(Math.floor(chaosRng() * 2147483646) + 1);
  phrase.pitches = genPitches(rng, phrase);
  phrase.slides = genSlides(rng, phrase, grooveNow(), 0.5);
  updateDisplay();
  pushState();
}

// pushall runs on device load, after [pattr] has already had its say — so a set
// that was saved before the device ever played still ends up with a stored phrase.
function pushall() { pushSynth(); pushDelays(); updateDisplay(); pushState(); }

// ---------------------------------------------------------------- state persistence (§5.4)
// A Live Set has to reopen with the bassline it was saved with, so the whole
// working state — both RNG stream positions, the lineage counters, the chaos
// walks and every per-step layer — is flattened into one list of numbers and
// parked in a [pattr], which Live saves with the set. Nothing here regenerates:
// a restored phrase is the phrase itself, not a replay of the seed that made it.

var STATE_VERSION = 1;
var STATE_HEAD = 20;    // header atoms before the per-step block
var STATE_STRIDE = 8;   // atoms per step

function pushState() {
  var p = phrase;
  if (!p || !p.vels) return;
  var n = p.onsets.length;
  var a = [STATE_VERSION, seedRng.get(), chaosRng.get(), idCounter, letterIdx,
           P.root, p.bars, p.id, p.parentId, p.generation,
           p.letter.charCodeAt(0), p.seed, contourIdx(p.contour),
           round3(slow.cut), round3(slow.res), round3(slow.wet),
           round3(med.dec), round3(med.drv), freezeLeft, n];
  for (var s = 0; s < n; s++) {
    a.push((p.onsets[s] ? 1 : 0) | (p.accents[s] ? 2 : 0) | (p.slides[s] ? 4 : 0));
    a.push(p.pitches[s] || 0);
    a.push(p.vels[s] || 0);
    a.push(round3(p.gates[s]));
    a.push(round3(p.probs[s]));
    a.push(round3(p.timbres[s]));
    a.push(round3(p.wets[s]));
    a.push(round3(p.micros[s]));
  }
  outlet(0, "state", a);
}

function Restore() { // list from [pattr] on device load
  var n = arguments.length;
  if (n < STATE_HEAD + STATE_STRIDE) return;   // empty or truncated: keep the fresh phrase
  var a = [];
  for (var i = 0; i < n; i++) a[i] = arguments[i];
  if (a[0] !== STATE_VERSION) return;
  var steps = a[19];
  if (!(steps > 0) || n < STATE_HEAD + steps * STATE_STRIDE) return;

  seedRng.set(a[1]);
  chaosRng.set(a[2]);
  idCounter = a[3];
  letterIdx = a[4];
  P.root = a[5];
  P.bars = a[6];
  slow.cut = a[13]; slow.res = a[14]; slow.wet = a[15];
  med.dec = a[16]; med.drv = a[17];
  freezeLeft = a[18];

  var p = {
    id: a[7], parentId: a[8], generation: a[9],
    letter: String.fromCharCode(a[10]), seed: a[11], bars: a[6],
    contour: CONTOURS[a[12]] || "repeat",
    onsets: [], pitches: [], accents: [], slides: [],
    gates: [], vels: [], probs: [], timbres: [], wets: [], micros: []
  };
  for (var s = 0; s < steps; s++) {
    var o = STATE_HEAD + s * STATE_STRIDE, f = a[o];
    p.onsets[s] = (f & 1) !== 0;
    p.accents[s] = (f & 2) !== 0;
    p.slides[s] = (f & 4) !== 0;
    p.pitches[s] = a[o + 1];
    p.vels[s] = a[o + 2];
    p.gates[s] = a[o + 3];
    p.probs[s] = a[o + 4];
    p.timbres[s] = a[o + 5];
    p.wets[s] = a[o + 6];
    p.micros[s] = a[o + 7];
  }

  phrase = p;
  history = [p];
  // the dial/menu parameters Live restored have already fired by now; drop the
  // regeneration they queued so the restored phrase is what actually plays
  pendingRegen = null;
  firstCycle = true;
  updateDisplay();
  pushSynth();
}

function dump() { // debug/test hook: full state snapshot on outlet 2
  var snap = {
    params: P, stepMs: stepMs, playStep: playStep,
    historyLen: history.length,
    freezeLeft: freezeLeft,
    slow: { cut: slow.cut, res: slow.res, wet: slow.wet },
    med: { dec: med.dec, drv: med.drv },
    fast: { tim: fast.tim, wet: fast.wet },
    phrase: phrase ? {
      id: phrase.id, parentId: phrase.parentId, generation: phrase.generation,
      name: phraseName(phrase), seed: phrase.seed, bars: phrase.bars, contour: phrase.contour,
      onsets: phrase.onsets, pitches: phrase.pitches, accents: phrase.accents,
      slides: phrase.slides, gates: phrase.gates, vels: phrase.vels,
      probs: phrase.probs, timbres: phrase.timbres, wets: phrase.wets, micros: phrase.micros
    } : null
  };
  outlet(2, "dump", JSON.stringify(snap));
}

// ---------------------------------------------------------------- init

function initCore() {
  seedRng = makeRng(20260825);
  chaosRng = makeRng(777001);
  offTask = new Task(sendOff, this);
  noteTask = new Task(firePending, this);
  earlyTask = new Task(fireEarly, this);
  phrase = generatePhrase(Math.floor(seedRng() * 2147483646) + 1, null);
  rememberPhrase(phrase);
}

initCore();
