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

// §2.1 filter modes. A mode is a coordinated recipe, not one more knob: the
// macros say where the player is standing, the mode says what kind of filter
// they are playing. Every value is an offset or multiplier applied on top of the
// Cutoff / Squelch / Drive / Decay macros, so those knobs still do exactly what
// they say — the mode moves the centre they move around.
//   cut = cutoff centre offset in octaves     res = resonance offset
//   drv = drive multiplier                    env = filter env depth multiplier
//   dec = filter decay multiplier             bp  = lowpass/bandpass blend
//   acc = how far an accent opens the filter (§2.1's coupling depth)
var MODES = {
  round:   { cut: -0.55, res: -0.16, drv: 0.80, env: 0.55, dec: 1.00, bp: 0.00, acc: 1.25 },
  wet:     { cut:  0.00, res:  0.00, drv: 0.85, env: 0.90, dec: 1.05, bp: 0.10, acc: 1.35 },
  squelch: { cut: -0.10, res:  0.18, drv: 1.15, env: 1.55, dec: 0.85, bp: 0.12, acc: 1.85 },
  bite:    { cut:  0.75, res:  0.02, drv: 1.55, env: 1.00, dec: 0.55, bp: 0.18, acc: 1.60 },
  hollow:  { cut:  0.10, res: -0.12, drv: 0.75, env: 0.60, dec: 1.70, bp: 0.34, acc: 1.20 },
  rubber:  { cut: -0.15, res:  0.04, drv: 1.00, env: 1.05, dec: 1.45, bp: 0.16, acc: 1.40 },
  acid:    { cut:  0.15, res:  0.26, drv: 1.45, env: 1.70, dec: 0.60, bp: 0.22, acc: 2.00 }
};
// ordered — the index is what the Mode menu sends and what the state serializes
var MODE_NAMES = ["round", "wet", "squelch", "bite", "hollow", "rubber", "acid"];

// §1.9 default directional slide weights, overridden per groove below
var SDIR = { up: 1, dn: 1, rtn: 1, oct: 1 };

// §1.10 groove states — each moves many parameters together.
// push  = how far the groove leans forward (fraction of a step, applied as rush
//         on accents and drag on ghosts); pick = anticipation probability per
//         downbeat; frz = probability of a repetition freeze.
// fam   = which rhythmic family (§1.3a) this groove draws its cells from.
// motif = probability that beats 3-4 restate beats 1-2 within the bar.
// modes = §2.1 filter-mode affinity (§1.10: groove state weights mode selection).
// sdir  = §1.9 which direction this groove likes to glide.
var GROOVES = [
  { name: "restrained", dens: 0.35, off: 0.20, gate: 0.50, acc: 0.15, sld: 0.08, mut: 0.4, swing: 0.02,
    push: 0.025, pick: 0.12, frz: 0.20, fam: "deep", motif: 0.55,
    modes: { round: 4, rubber: 2, wet: 1 },
    sdir: { up: 1.0, dn: 0.8, rtn: 1.4, oct: 0.4 },
    contours: { repeat: 3, pedal: 3, neighbor: 2, arch: 1, descending: 1 } },
  // rolling and syncopated share the psy vocabulary and are separated by how
  // they sit against the kick: rolling rides with it, syncopated answers it
  { name: "rolling",    dens: 0.55, off: 0.62, gate: 0.45, acc: 0.30, sld: 0.15, mut: 0.5, swing: 0.07,
    push: 0.050, pick: 0.35, frz: 0.18, fam: "psy", motif: 0.70, kick: 0.63,
    modes: { wet: 3, rubber: 3, round: 2, squelch: 1 },
    sdir: { up: 1.3, dn: 0.9, rtn: 1.2, oct: 0.6 },
    contours: { repeat: 3, pedal: 2, leaprtn: 2, arch: 1, neighbor: 1 } },
  { name: "syncopated", dens: 0.55, off: 0.92, gate: 0.55, acc: 0.45, sld: 0.25, mut: 0.9, swing: 0.10,
    push: 0.045, pick: 0.45, frz: 0.10, fam: "psy", motif: 0.55, kick: 0.37,
    modes: { squelch: 3, bite: 2, wet: 2, hollow: 1 },
    sdir: { up: 1.1, dn: 1.2, rtn: 1.0, oct: 0.8 },
    contours: { neighbor: 2, leaprtn: 2, arch: 2, repeat: 1, ascending: 1 } },
  { name: "driving",    dens: 0.80, off: 0.25, gate: 0.60, acc: 0.50, sld: 0.12, mut: 0.5, swing: 0.03,
    push: 0.080, pick: 0.25, frz: 0.22, fam: "deep", motif: 0.75,
    modes: { bite: 3, squelch: 2, round: 2 },
    sdir: { up: 1.4, dn: 0.6, rtn: 0.9, oct: 0.5 },
    contours: { repeat: 3, pedal: 2, ascending: 1, descending: 1 } },
  { name: "acidic",     dens: 0.65, off: 0.55, gate: 0.50, acc: 0.60, sld: 0.50, mut: 0.9, swing: 0.05,
    push: 0.060, pick: 0.35, frz: 0.08, fam: "acid", motif: 0.80,
    modes: { acid: 5, squelch: 3, bite: 1 },
    sdir: { up: 1.5, dn: 1.3, rtn: 0.7, oct: 1.4 },
    contours: { leaprtn: 3, neighbor: 2, ascending: 2, arch: 1, repeat: 1 } },
  { name: "broken",     dens: 0.50, off: 0.60, gate: 0.55, acc: 0.55, sld: 0.25, mut: 1.3, swing: 0.09,
    push: 0.035, pick: 0.50, frz: 0.06, fam: "broken", motif: 0.30,
    modes: { hollow: 3, bite: 2, rubber: 2, squelch: 1 },
    sdir: { up: 0.9, dn: 1.4, rtn: 0.8, oct: 1.0 },
    contours: { arch: 2, leaprtn: 2, descending: 2, neighbor: 1, ascending: 1 } },
  // hypnotic shares rolling's psy vocabulary; what separates them is that it says
  // less and changes less — sparser cells, a near-certain two-beat motif, and the
  // lowest mutation rate of any groove
  { name: "hypnotic",   dens: 0.45, off: 0.42, gate: 0.40, acc: 0.12, sld: 0.10, mut: 0.15, swing: 0.04,
    push: 0.018, pick: 0.15, frz: 0.35, fam: "psy", motif: 0.85,
    modes: { round: 3, rubber: 3, wet: 2 },
    sdir: { up: 1.0, dn: 0.9, rtn: 1.6, oct: 0.3 },
    contours: { repeat: 4, pedal: 3, neighbor: 1 } }
];

// ---------------------------------------------------------------- state

// macros / params (defaults match the device's parameter_initial values)
var P = {
  density: 0.5, novelty: 0.35, chunk: 0.55, squelch: 0.5, drive: 0.35,
  cutoff: 0.45, decay: 0.5, sub: 0.6, wet: 0.3,
  interlock: 0.5,          // §1.4 bipolar downbeat rest bias (0.5 = as the family)
  subsat: 0.35, width: 0.6, // §2.5 sub saturation, §3.4 stereo width
  groove: 1, root: 36, bars: 2,
  fmode: 0,                // §2.1 filter mode: 0 = follow the groove, 1..7 = forced
  suboct: 0,               // §2.5 sub octave: 0 = -1, 1 = -2
  lock: 0, frzr: 0, frzp: 0, frzt: 0   // §5.3 global lock + per-layer freezes
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

// §2.1 / §1.10 — which filter mode is speaking right now. A phrase carries its
// own mode so the timbre is part of phrase identity (§5.2) rather than a global
// setting the phrase happens to be playing under; the Mode menu overrides it.
function pickMode(rng, groove) {
  var total = 0, key;
  for (key in groove.modes) total += groove.modes[key];
  var r = rng() * total;
  for (key in groove.modes) { r -= groove.modes[key]; if (r <= 0) return key; }
  return "round";
}
function modeName() {
  if (P.fmode > 0) return MODE_NAMES[P.fmode - 1] || "round";
  return (phrase && phrase.mode) || "round";
}
function modeOf() { return MODES[modeName()] || MODES.round; }
function modeIdx(name) {
  for (var i = 0; i < MODE_NAMES.length; i++) if (MODE_NAMES[i] === name) return i;
  return 0;
}

function clonePhrase(p) {
  return {
    id: p.id, parentId: p.parentId, generation: p.generation,
    letter: p.letter, seed: p.seed, bars: p.bars, contour: p.contour, form: p.form,
    mode: p.mode,
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

// ---------------------------------------------------------------- rhythm (§1.3 / §1.4)
//
// The target idiom is Maccabi House / psychedelic indie dance — Adam Ten, Mita
// Gami, Rafael, Yamagucci and adjacent records — not generic four-on-the-floor
// house. That music is hypnotic because a small recognizable machine states
// itself and then changes almost imperceptibly, which means randomness destroys
// the exact thing that makes it work.
//
// So the rhythm is built the way the style is: a bar is assembled from a
// vocabulary of one-beat cells, and the phrase repeats that bar and varies it.
// The generator this replaced flipped an independent weighted coin per step,
// which measured at a 0.1% bar-repeat rate and used all 16 possible cells at
// near-uniform entropy — technically competent, and with no motif to remember.

// One-beat (4-step) cells as bit patterns: bit 0 is the beat, bit 1 the "e",
// bit 2 the "&", bit 3 the "a". So 13 = 0b1101 = "x.xx", the rolling 16th push.

// §1.3a rhythmic families. Each groove belongs to one. The family is what makes
// "syncopated" and "rolling" genuinely different ideas rather than the same
// generator with different scalars; kick = how willingly the family lands with
// the kick rather than answering it, on a 0..1 scale where 0.5 is neutral, 1
// locks to the quarter and 0 avoids it. It reads as odds, not as a multiplier
// (see pickCell), so it is not linear in the resulting downbeat rate.
var FAMILIES = {
  // rolling 16th pushes, offbeat 8ths, dotted 3-step movement, sparse
  // syncopated stabs, late-beat anticipations
  psy: { kick: 0.55,
    cells: { 5: 10, 13: 9, 12: 7, 9: 7, 4: 6, 1: 5, 8: 4, 11: 3,
             6: 3, 3: 2, 15: 2, 0: 2, 10: 2, 7: 2 } },
  // simpler offbeats, root-quarter figures, fewer 16ths
  deep: { kick: 0.60,
    cells: { 1: 10, 5: 8, 4: 6, 0: 5, 9: 3, 3: 2, 13: 2, 12: 2, 7: 1, 11: 1, 15: 1 } },
  // repetitive 16th cells; this family mutates through pitch and filter, not onsets
  acid: { kick: 0.50,
    cells: { 15: 9, 13: 8, 5: 7, 7: 6, 11: 6, 1: 4, 9: 4, 14: 3, 3: 3, 12: 2 } },
  // displaced cells, more silence, weak four-on-the-floor dependency — weak, not
  // absent: the downbeat still has to arrive often enough to be worth displacing
  broken: { kick: 0.42,
    cells: { 0: 5, 12: 6, 8: 6, 6: 6, 10: 5, 4: 5, 2: 3, 14: 3, 9: 5, 5: 4, 1: 5, 11: 3 } }
};

// §1.3b bar form. Heavily biased toward one bar restating itself, because this
// idiom lives on motif identity and groove persistence rather than on four
// independently interesting bars. Roles: 0 = A verbatim, 1 = A' (one small
// change), 2 = B (a derived bar, still built from A).
var FORMS = {
  1: [{ name: "A", roles: [0], w: 1 }],
  2: [{ name: "AA", roles: [0, 0], w: 3 },
      { name: "AA'", roles: [0, 1], w: 5 },
      { name: "AB", roles: [0, 2], w: 2 }],
  4: [{ name: "AAAA'", roles: [0, 0, 0, 1], w: 5 },
      { name: "AAAB'", roles: [0, 0, 0, 2], w: 5 },
      { name: "AABA'", roles: [0, 0, 2, 1], w: 4 },
      { name: "AA'AA''", roles: [0, 1, 0, 1], w: 3 },
      { name: "ABAB'", roles: [0, 2, 0, 2], w: 1 }]
};

function popcount4(c) { return (c & 1) + ((c >> 1) & 1) + ((c >> 2) & 1) + ((c >> 3) & 1); }

function offness(c) { // how much of the cell sits off the beat — what "off" means
  var n = popcount4(c);
  return n === 0 ? 0.5 : (n - (c & 1)) / n;
}

function barCells(onsets, bar) { // read a bar back out as four cells
  var cells = [];
  for (var c = 0; c < 4; c++) {
    var v = 0;
    for (var k = 0; k < 4; k++) if (onsets[bar * STEPS_PER_BAR + c * 4 + k]) v |= (1 << k);
    cells[c] = v;
  }
  return cells;
}

function writeCells(onsets, bar, cells) {
  for (var c = 0; c < 4; c++) {
    for (var k = 0; k < 4; k++) {
      onsets[bar * STEPS_PER_BAR + c * 4 + k] = (cells[c] & (1 << k)) !== 0;
    }
  }
}

// Density selects *denser cells* rather than raising every step's coin, so a
// high Density reads as a busier figure instead of 16th-note mush.
// prev is the cell on the beat before, or -1 at the start of a bar (§1.4).
function pickCell(rng, fam, dens, off, beat, kick, prev) {
  var target = clamp(dens * 4, 0, 4);            // wanted onsets within this beat
  var pool = [], weights = [], total = 0, key;
  for (key in fam.cells) {
    var c = parseInt(key, 10);
    // the family preference is raised to a power: without it the density term
    // spreads weight evenly across every cell of the right size, and the family
    // stops being a vocabulary
    var w = Math.pow(fam.cells[key], 1.35);
    w *= gauss(popcount4(c) - target, 0.95);
    w *= 0.35 + 1.3 * (off * offness(c) + (1 - off) * (1 - offness(c)));
    // kick interlock: the kick is on all four quarters, but 1 and 3 carry it,
    // so whether the bass lands with it or answers it is a family trait rather
    // than a coin flip. kick is an odds exponent, not a multiplier — as a plain
    // multiplier, kick/(2-kick), the value 1.0 came out exactly neutral and the
    // two families that are meant to lock hardest to the kick got no bias at all.
    var lean = (2 * kick - 1) * (beat % 2 === 0 ? 1 : 0.5);
    w *= Math.pow(6, (c & 1) ? lean : -lean);
    // §1.4 syncopated gap preference: a cell that ends on the "a" has already
    // anticipated the next beat, so that beat wants to be a gap rather than a
    // second attack — the hole is what makes the syncopation read as syncopation.
    if (prev >= 0 && (prev & 8)) w *= (c & 1) ? 0.45 : 1.35;
    if (w <= 0) continue;
    pool.push(c); weights.push(w); total += w;
  }
  if (!total) return 1;
  var r = rng() * total;
  for (var i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

// §1.3a one bar, with a two-beat motif repeat — the repeated two-beat figure is
// the signature of this vocabulary.
function genBar(rng, fam, dens, off, kick, motifP) {
  var cells = [pickCell(rng, fam, dens, off, 0, kick, -1)];
  cells[1] = pickCell(rng, fam, dens, off, 1, kick, cells[0]);
  if (rng() < motifP) {                          // beats 3-4 restate beats 1-2
    cells[2] = cells[0];
    cells[3] = cells[1];
  } else {
    cells[2] = pickCell(rng, fam, dens, off, 2, kick, cells[1]);
    cells[3] = pickCell(rng, fam, dens, off, 3, kick, cells[2]);
  }
  // the bar has to start somewhere the ear can find it; a wholly empty first
  // beat belongs to broken, which is defined by exactly that
  if (!cells[0] && kick > 0.7) cells[0] = 1;
  return cells;
}

// §1.3b variation: A' has to still be A. A small change lands on the last beat,
// where the ear already expects the turnaround, so the motif survives it.
function varyCells(rng, cells, fam, dens, off, kick, strength) {
  var out = cells.slice();
  var ops = strength >= 2 ? 2 : 1;
  for (var i = 0; i < ops; i++) {
    var beat = strength >= 2 ? Math.floor(rng() * 4) : (rng() < 0.75 ? 3 : 2);
    var r = rng();
    if (r < 0.4) {                                              // swap the cell
      out[beat] = pickCell(rng, fam, dens, off, beat, kick, beat > 0 ? out[beat - 1] : -1);
    } else if (r < 0.7) {
      out[beat] = out[beat] | (1 << Math.floor(rng() * 4));     // add a 16th
    } else if (r < 0.9) {
      var bits = [];
      for (var b = 0; b < 4; b++) if (out[beat] & (1 << b)) bits.push(b);
      if (bits.length > 1) out[beat] &= ~(1 << bits[Math.floor(rng() * bits.length)]);
    } else {
      out[beat] = ((out[beat] << 1) | (out[beat] >> 3)) & 15;   // displace the cell
    }
  }
  return out;
}

function pickForm(rng, bars) {
  var list = FORMS[bars] || FORMS[2];
  var total = 0, i;
  for (i = 0; i < list.length; i++) total += list[i].w;
  var r = rng() * total;
  for (i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) return list[i]; }
  return list[0];
}

// §1.4 rest logic — the two hard guards the cell bank can still walk into.
function repairRhythm(onsets) {
  var n = onsets.length, s, run = 0;
  for (s = 0; s < n; s++) {
    if (!onsets[s]) { run = 0; continue; }
    if (++run > 6) { onsets[s] = false; run = 0; }        // max consecutive notes
  }
  var count = 0;
  for (s = 0; s < n; s++) if (onsets[s]) count++;
  if (count < 2) { onsets[0] = true; onsets[8] = true; }  // never fully silent
  return onsets;
}

// §1.4 phrase-end silence bias. The last beat of the phrase gives ground back so
// the loop point can breathe and the restatement lands as a restatement. Only the
// late 16ths go and never the beat itself, so the motif is still recognisable
// across the turnaround — this is a rest bias, not a truncation.
function endSpace(rng, onsets, bars, amount) {
  if (amount <= 0) return onsets;
  var base = (bars - 1) * STEPS_PER_BAR + 12, live = 0, s;
  for (s = base; s < base + 4; s++) if (onsets[s]) live++;
  if (live < 2) return onsets;                     // nothing to give back
  for (s = base + 3; s > base && live > 1; s--) {
    if (onsets[s] && rng() < amount) { onsets[s] = false; live--; }
  }
  return onsets;
}

// grooves that live on restatement give less ground back at the turnaround
function endSpaceAmt(groove) { return 0.65 * (1 - groove.motif * 0.4); }

function layOutForm(rng, bars, form, A, fam, dens, off, kick, groove) {
  var onsets = [];
  for (var b = 0; b < bars; b++) {
    var role = form.roles[b % form.roles.length];
    writeCells(onsets, b, role === 0 ? A : varyCells(rng, A, fam, dens, off, kick, role));
  }
  endSpace(rng, onsets, bars, endSpaceAmt(groove));
  return repairRhythm(onsets);
}

// a groove may override its family's kick affinity — that is what separates two
// grooves drawing from the same vocabulary
function famOf(groove) { return FAMILIES[groove.fam] || FAMILIES.psy; }
function kickOf(groove) {
  var k = typeof groove.kick === "number" ? groove.kick : famOf(groove).kick;
  // §1.4 downbeat rest bias/avoidance as a bipolar control: 0.5 leaves the groove
  // where its family put it, 0 pushes it to rest on the one and answer the kick,
  // 1 pushes it to land on the one. It rides the same odds exponent as the family
  // value, so the control and the table speak the same units.
  return clamp(k + (P.interlock - 0.5) * 0.9, 0.02, 0.98);
}

function genRhythm(rng, bars, dens, groove) {
  var fam = famOf(groove), kick = kickOf(groove);
  var form = pickForm(rng, bars);
  var A = genBar(rng, fam, dens, groove.off, kick, groove.motif);
  var onsets = layOutForm(rng, bars, form, A, fam, dens, groove.off, kick, groove);
  onsets.form = form.name;      // for the dump/display; not part of the step data
  return onsets;
}

// §4.3 a medium mutation should sound like the same machine drifting rather than
// a new one, so it varies the phrase's own opening bar instead of drawing a
// fresh figure. This is what "changes almost imperceptibly" has to mean in code.
function mutateRhythm(rng, p, groove, dens) {
  var fam = famOf(groove), kick = kickOf(groove);
  var form = pickForm(rng, p.bars);
  var A = varyCells(rng, barCells(p.onsets, 0), fam, dens, groove.off, kick, 1);
  var onsets = layOutForm(rng, p.bars, form, A, fam, dens, groove.off, kick, groove);
  onsets.form = form.name;
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

// §1.9 slide conditions: conditional, never arbitrary. The four directional
// biases (upward / downward / return / octave) are weighted independently and
// per groove, because which way a line glides is as much of its character as how
// often — acidic climbs and octave-jumps, hypnotic keeps returning to where it
// just was, broken falls.
function genSlides(rng, p, groove, densActual) {
  var n = p.onsets.length;
  var slides = [];
  for (var s = 0; s < n; s++) slides[s] = false;
  var ons = onsetList(p);
  var sd = groove.sdir || SDIR;
  for (var k = 0; k + 1 < ons.length; k++) {
    var i = ons[k], j = ons[k + 1];
    var interval = Math.abs(p.pitches[j] - p.pitches[i]);
    var prob = groove.sld * (1 + 0.7 * densActual);
    prob *= (j === i + 1) ? 1.6 : 0.25;             // legato strongly preferred
    if (interval <= 3) prob *= 1.4;                  // small intervals slide more
    if (p.accents[j]) prob *= 1.3;                   // accented targets slide more
    if (p.pitches[j] > p.pitches[i]) prob *= sd.up;
    else if (p.pitches[j] < p.pitches[i]) prob *= sd.dn;
    // a return slide lands back on the pitch the line left one onset ago
    if (k > 0 && p.pitches[j] === p.pitches[ons[k - 1]]) prob *= sd.rtn;
    if (interval === 12) prob *= sd.oct * 0.7;       // octave slides allowed, rarer
    if (interval === 0) prob *= 0.3;
    if (rng() < clamp(prob, 0, 0.85)) slides[j] = true;
  }
  return slides;
}

// §5.3 regenerating one layer still has to leave the phrase playable: velocity
// and gate read the accent and slide layers, so they follow when those change.
// Timbre, wet and microtiming are left alone — they belong to other layers.
function refreshDynamics(rng, p, groove) {
  var gateFrac = clamp(groove.gate * (1.7 - 1.1 * P.chunk), 0.15, 0.98);
  for (var s = 0; s < p.onsets.length; s++) {
    if (!p.onsets[s]) { p.vels[s] = 0; p.gates[s] = 0; continue; }
    if (p.accents[s]) p.vels[s] = Math.floor(112 + rng() * 12);
    else if ((s % 4) !== 0 && rng() < 0.25) p.vels[s] = Math.floor(58 + rng() * 12);
    else p.vels[s] = Math.floor(82 + rng() * 18);
    p.gates[s] = p.slides[s] ? 1.02 : gateFrac * (0.9 + rng() * 0.2);
  }
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
    contour: pickContour(rng, groove),
    mode: pickMode(rng, groove)   // §2.1 filter mode, drawn from the groove's affinity
  };
  p.onsets = genRhythm(rng, P.bars, dens, groove);
  p.form = p.onsets.form;
  p.pitches = genPitches(rng, p);
  p.accents = genAccents(rng, p, groove);
  p.slides = genSlides(rng, p, groove, dens);
  addPickups(rng, p, groove);
  genStepMeta(rng, p, groove);
  return p;
}

// ---------------------------------------------------------------- mutation (§1.1 + §4.3)

// §5.3 per-layer freezes. Lock freezes everything; these freeze one layer while
// the others go on evolving, which is how you hold a rhythm you like and let the
// pitches move under it. A frozen layer is grafted back onto the child after the
// mutation has run, so the mutation never has to know about it.
function anyFreeze() { return P.frzr || P.frzp || P.frzt; }

function repairPitches(p, root) {
  // if rhythm moved under a frozen pitch layer, new onsets have no pitch yet —
  // carry the last sounding pitch forward rather than dropping a note
  var last = root;
  for (var s = 0; s < p.onsets.length; s++) {
    if (!p.onsets[s]) continue;
    if (typeof p.pitches[s] !== "number") p.pitches[s] = last;
    else last = p.pitches[s];
  }
}

function applyFreezes(child, parent) {
  if (P.frzr) {                       // rhythm layer immutable
    child.onsets = parent.onsets.slice();
    child.form = parent.form;
  }
  if (P.frzp) {                       // pitch layer immutable
    child.pitches = parent.pitches.slice();
    repairPitches(child, P.root);
  }
  if (P.frzt) {                       // timbre drift paused
    child.mode = parent.mode;
    child.timbres = parent.timbres.slice();
    child.wets = parent.wets.slice();
  }
  return child;
}

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
    if (anyFreeze()) {
      applyFreezes(fresh, parent);
      genStepMeta(rng, fresh, groove);
      applyFreezes(fresh, parent);   // step meta rewrites timbre/wet; put them back
    }
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
    child.onsets = mutateRhythm(rng, child, groove, dens); // vary the motif, don't replace it
    child.form = child.onsets.form;
    child.pitches = genPitches(rng, child);       // same contour type = preserved identity
    child.accents = genAccents(rng, child, groove);
    child.slides = genSlides(rng, child, groove, dens);
    addPickups(rng, child, groove);
  }

  // §5.2 phrase-level timbre evolution: a mutation may move the filter mode, but
  // only inside the groove's affinity and only when the timbre layer is free.
  if (!P.frzt && depth >= 1 && rng() < alloc.timbre) child.mode = pickMode(rng, groove);

  if (anyFreeze()) applyFreezes(child, parent);

  // §4.3: a low-depth mutation spends only its timbre/wet allocation on the
  // sound layers; a rhythm change has new steps and needs the full metadata pass.
  if (depth === 0) mutateMeta(rng, child, alloc);
  else genStepMeta(rng, child, groove);
  if (anyFreeze()) applyFreezes(child, parent);
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
  if (!P.frzt) {                                   // §5.3 freeze timbre pauses the drift
    slow.cut = walkUpdate(slow.cut, 0.08, chaosRng); // §4.2 clamps
    slow.res = walkUpdate(slow.res, 0.03, chaosRng);
    slow.wet = walkUpdate(slow.wet, 0.10, chaosRng);
  }
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
  if (!P.frzt) {                                   // §5.3 freeze timbre pauses the drift
    med.dec = walkUpdate(med.dec, 0.12, chaosRng);
    med.drv = walkUpdate(med.drv, 0.05, chaosRng);
  }
  pushSynth();
  pushState(); // the medium walk drifts every bar; the saved state follows it
}

// ---------------------------------------------------------------- synth coupling (§2 / §5.1)

// §2.4 dynamic asymmetric saturation. A DC offset into the saturator clips one
// half of the wave harder than the other, which is what puts even harmonics —
// the growl — into a bass instead of the pure odd-order buzz a symmetric tanh
// gives. Velocity scales it, so playing harder changes the timbre and not only
// the level; a DC blocker after the saturator removes the offset itself.
function asymFor(vel, acc) {
  return clamp((0.08 + P.drive * 0.40) * (0.55 + (vel / 127) * (acc ? 1.05 : 0.75)), 0, 0.6);
}

function pushSynth() {
  // voicing note: the filter sustains near ~311 Hz at default cutoff and the
  // envelope sweeps ~1.2 kHz above it — the squelch rides ON TOP of a solid
  // fundamental instead of parking every note in the midrange.
  var M = modeOf(); // §2.1 the mode moves the centre the macros move around
  var cutoffHz = 45 * Math.pow(2, P.cutoff * 6.2 + M.cut) * (1 + slow.cut);
  var reso = clamp(0.06 + P.squelch * 0.68 + M.res + slow.res, 0, 0.92);
  var envd = (180 + Math.pow(P.squelch, 1.4) * 2800) * M.env;
  var drv = (0.7 + P.drive * 2.6) * M.drv * (1 + med.drv);
  // §2.3 filter voicing: each mode blends a little bandpass into the lowpass,
  // and squelch opens that blend further — capped so the fundamental survives.
  var bpmix = clamp(M.bp * (0.35 + 0.65 * P.squelch), 0, 0.40);
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
  // §2.5 sub layer. Mix keeps a floor so there is low-end energy at any Sub
  // setting; saturation gives the sine harmonics that let it read on a small
  // speaker, with makeup so the control is a timbre and not a second level knob;
  // and the sub ducks under resonant peaks so a blooming filter and the sub
  // don't stack up into the same few dB of headroom.
  outlet(0, "sub", 0.45 + P.sub * 0.55);
  outlet(0, "subdrv", 0.6 + P.subsat * 2.6);
  outlet(0, "subgain", 1 / (1 + P.subsat * 0.55));
  outlet(0, "subduck", clamp((reso - 0.45) * 0.9, 0, 0.45));
  outlet(0, "asym", asymFor(96, false)); // §2.4 idle value; each note re-sends its own
  // §3.4 stereo: the low end is mono, always. Only the wet return spreads, and
  // it spreads as mid/side, so a fold to mono can attenuate it but never cancel
  // it. monof is the mono-below crossover — everything under it stays in the dry
  // (mono) path and never reaches the delay network at all.
  outlet(0, "width", P.width * 1.4);
  outlet(0, "monof", 320 + (1 - P.width) * 380, 60);
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
  // short enough that the squelch resolves inside a 16th at default Decay; the
  // mode scales it, which is most of what separates bite (0.55) from hollow (1.7)
  return (40 + Math.pow(P.decay, 1.5) * 520) * modeOf().dec * (1 + med.dec);
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

  // §2.1 filter state machine: accent drives coupled env/drive/decay changes, and
  // how far an accent opens the filter is itself a property of the mode — that is
  // the difference between round (barely) and acid (a full sweep per accent).
  outlet(1, "fdec", fdecBase() * (acc ? 0.8 : 1));
  outlet(1, "fmul", (acc ? modeOf().acc : 1.0) * (1 + tim * 0.4));
  outlet(1, "dmul", (acc ? 1.35 : 1.0) * (1 + (p.vels[s] / 127) * 0.2));
  outlet(1, "asym", asymFor(p.vels[s], acc)); // §2.4 velocity-linked saturation
  outlet(1, "pitch", p.pitches[s], glide);
  // §2.2 sub reinforcement + §2.5: sub pitch folded into a fixed octave window so
  // every note — including octave/fifth excursions — carries a true sub
  // fundamental. -1 lands in 32.7–61.7 Hz (MIDI 24–35); -2 in 16.4–30.9 Hz, for
  // systems that can actually move air down there.
  var lo = P.suboct ? 12 : 24, hi = lo + 11;
  var sp = p.pitches[s] - 12;
  while (sp > hi) sp -= 12;
  while (sp < lo) sp += 12;
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
  if (P.frzt) return;                              // §5.3 freeze timbre pauses the drift
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
    "·", phrase.contour,
    "·", modeName());
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
function subsat(v) { P.subsat = clamp(v, 0, 1); pushSynth(); }   // §2.5
function width(v) { P.width = clamp(v, 0, 1); pushSynth(); }     // §3.4
function suboct(i) { P.suboct = Math.floor(i) ? 1 : 0; }         // §2.5 -1 / -2

function fmode(i) { // §2.1 — 0 follows the groove's affinity, 1..7 force a mode
  P.fmode = clamp(Math.floor(i), 0, MODE_NAMES.length);
  pushSynth();
  updateDisplay();
}

// §1.4 bipolar downbeat rest bias. It changes the vocabulary the next phrase is
// built from, so it queues a regeneration rather than editing the current one.
function interlock(v) {
  P.interlock = clamp(v, 0, 1);
  pendingRegen = pendingRegen || "soft";
}

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

// §5.3 — lock freezes everything; the three layer freezes hold one layer while
// the rest goes on evolving, which is how you keep a rhythm you like and let the
// pitches move under it.
function lock(v) { P.lock = v ? 1 : 0; }
function frzr(v) { P.frzr = v ? 1 : 0; }
function frzp(v) { P.frzp = v ? 1 : 0; }
function frzt(v) { P.frzt = v ? 1 : 0; }

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
  phrase.onsets = genRhythm(rng, phrase.bars, dens, groove); // the button asks for a new figure
  phrase.form = phrase.onsets.form;
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
function Accent() { // §5.3 regenerate one layer only: accent
  if (!phrase) return;
  var rng = makeRng(Math.floor(chaosRng() * 2147483646) + 1);
  var groove = grooveNow();
  phrase.accents = genAccents(rng, phrase, groove);
  refreshDynamics(rng, phrase, groove); // velocity reads the accent layer
  updateDisplay();
  pushState();
}
function Slide() { // §5.3 regenerate one layer only: slide
  if (!phrase) return;
  var rng = makeRng(Math.floor(chaosRng() * 2147483646) + 1);
  var groove = grooveNow();
  var dens = clamp(groove.dens * (0.4 + P.density * 1.4), 0.05, 0.95);
  phrase.slides = genSlides(rng, phrase, groove, dens);
  refreshDynamics(rng, phrase, groove); // a tie is a gate of 1.02, so gates follow
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
// Anything added after v0.4 goes in a trailing block instead of the header, so
// the version doesn't have to move and sets saved by older builds still restore:
// a short list simply has no tail and those fields fall back to their defaults.
var STATE_TAIL = 2;     // [ §2.1 filter mode index, §1.3b bar form index ]

function formIdx(bars, name) {
  var list = FORMS[bars] || FORMS[2];
  for (var i = 0; i < list.length; i++) if (list[i].name === name) return i;
  return -1;
}

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
  a.push(modeIdx(p.mode || "round"));
  a.push(formIdx(p.bars, p.form));
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

  var tail = STATE_HEAD + steps * STATE_STRIDE;
  if (n >= tail + STATE_TAIL) {
    p.mode = MODE_NAMES[a[tail]] || "round";
    var fi = a[tail + 1], list = FORMS[p.bars] || FORMS[2];
    if (fi >= 0 && list[fi]) p.form = list[fi].name;
  } else {
    // saved by a build that predates the tail: fall back rather than fail
    p.mode = "round";
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
    mode: modeName(),
    historyLen: history.length,
    freezeLeft: freezeLeft,
    slow: { cut: slow.cut, res: slow.res, wet: slow.wet },
    med: { dec: med.dec, drv: med.drv },
    fast: { tim: fast.tim, wet: fast.wet },
    phrase: phrase ? {
      id: phrase.id, parentId: phrase.parentId, generation: phrase.generation,
      name: phraseName(phrase), seed: phrase.seed, bars: phrase.bars, contour: phrase.contour,
      form: phrase.form, mode: phrase.mode,
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
