// pg-mod.js — what the phrase did to the dials.
//
// Design (DESIGN.md §2.8) lets every phrase carry its own sound: six of the
// synth's controls get pushed away from where they were set, by an amount the
// Design dial scales. Drawn nowhere, that reads as a fault — dials moving on
// their own with no explanation. Serum and Vital settled this years ago: draw
// the pushed value as a second ring on the same control, so the set value and
// the value actually sounding are both visible, and the gap between them *is*
// the modulation.
//
// A live.dial cannot draw a second ring, so one of these lies over a row of
// them: a click-through [jsui] the builder sizes to span exactly the dials it
// rings. Where each ring goes arrives as creation arguments, four per ring, in
// this box's own coordinates:
//
//   jsui pg-mod.js <name> <cx> <cy> <r> <name> <cx> <cy> <r> ...
//
// so live.dial's knob geometry is worked out in one place — m4lkit/ui.py,
// dial_knob() — instead of being agreed on twice.
//
// Each ring is named for the selector that feeds it, and this box takes
// pg-core.js's synth outlet whole: the same numbers the oscillators hear, not
// a second opinion about them, so a ring cannot drift from what is audible.
// They arrive scaled for DSP, so each handler undoes exactly the scaling
// pushSynth() applied and nothing else. anything() swallows the rest of that
// outlet's traffic, which is most of it.
//
// ES5 only, like device/pg-core.js: the same idiom has to load in Max 8's
// legacy engine as well as Max 9's.

autowatch = 1;

mgraphics.init();
mgraphics.relative_coords = 0;   // pixel coordinates, origin top-left, y down
mgraphics.autofill = 0;

// ---------------------------------------------------------------- palette
// RAMP amber from m4lkit/ui.py. It is the one label colour no stage holding a
// modulated dial already owns — OSC is coral, SUB teal, SHAPE purple — so a
// ring never reads as its own stage's ink leaking onto the knob.
var RING  = [0.980, 0.780, 0.459, 0.95];
var TRACK = [1.000, 1.000, 1.000, 0.10];   // the sweep the ring moves along

// ---------------------------------------------------------------- geometry
// live.dial's own sweep: 270 degrees with the gap at the bottom, running from
// lower-left round to lower-right. Angles increase clockwise, because y is
// down. The ring is drawn inside the knob rather than around it — outside, it
// would reach into the parameter name above — so it shares live.dial's centre
// and its zero, and only the radius differs.
var A0 = Math.PI * 0.75;
var A_SPAN = Math.PI * 1.5;
var TRACK_LW = 1;
var RING_LW = 2;
var TIP = 2.2;       // the dot marking where the ring ends

// -------------------------------------------------------------- the rings
// jsarguments[0] is the script's own name; the rings follow it, four atoms
// each. v stays null until the core says otherwise, and a ring with nothing to
// report draws nothing at all.
var rings = [], byName = {};
for (var i = 1; i + 3 < jsarguments.length; i += 4) {
  var ring = { name: String(jsarguments[i]),
               cx: parseFloat(jsarguments[i + 1]),
               cy: parseFloat(jsarguments[i + 2]),
               r:  parseFloat(jsarguments[i + 3]),
               v:  null };
  rings.push(ring);
  byName[ring.name] = ring;
}

// -------------------------------------------------------- the synth outlet
// One handler per modulated control, each the inverse of what pushSynth() did
// on the way out. These two have to stay in step — this is the only place the
// display knows anything about the core's arithmetic:
//
//   pushSynth sends                       and this reads back
//   wave     S.wave                       v
//   pw       0.06 + S.pw * 0.88           (v - 0.06) / 0.88
//   fold     S.fold                       v
//   wobrate  0.06 * 2^(S.wobrate * 7.5)   log2(v / 0.06) / 7.5
//   wobcut   S.wobdepth * 2200            v / 2200
//   subdrv   0.6 + S.subsat * 2.6         (v - 0.6) / 2.6
//
// wobdepth and subsat each drive a second selector too (wobpitch, subgain);
// either of a pair recovers the same number, so the other one falls through
// anything(). Most of these carry a trailing ramp time for the [line~] that
// smooths them — the ring shows the value, not the trip to it.
function wave(v)    { set("wave", v); }
function pw(v)      { set("pw", (v - 0.06) / 0.88); }
function fold(v)    { set("fold", v); }
function wobrate(v) { set("wobrate", Math.log(v / 0.06) / Math.LN2 / 7.5); }
function wobcut(v)  { set("wobcut", v / 2200); }
function subdrv(v)  { set("subdrv", (v - 0.6) / 2.6); }

// Everything else on that outlet: the controls Design does not touch, the ramp
// targets for filter and space, the state dump. Max posts an error for any
// selector no function claims, so this exists to keep the Max window readable
// — there is nothing here to do.
function anything() {}

function set(name, v) {
  var ring = byName[name];
  if (!ring) return;
  v = clamp01(v);
  if (ring.v === v) return;     // the synth outlet repeats itself; the screen needn't
  ring.v = v;
  mgraphics.redraw();
}
set.local = 1;

// ----------------------------------------------------------------- drawing
function paint() {
  for (var n = 0; n < rings.length; n++) {
    var ring = rings[n];
    if (ring.v === null) continue;
    src(TRACK);
    sweep(ring, 1, TRACK_LW);   // the whole travel, so the arc reads as a value
    src(RING);
    sweep(ring, ring.v, RING_LW);
    tip(ring, ring.v);
  }
}

function sweep(ring, frac, lw) {
  mgraphics.set_line_width(lw);
  mgraphics.new_path();
  mgraphics.arc(ring.cx, ring.cy, ring.r, A0, A0 + A_SPAN * frac);
  mgraphics.stroke();
}
sweep.local = 1;

function tip(ring, frac) {
  var a = A0 + A_SPAN * frac;
  mgraphics.new_path();
  mgraphics.arc(ring.cx + ring.r * Math.cos(a), ring.cy + ring.r * Math.sin(a),
                TIP, 0, Math.PI * 2);
  mgraphics.fill();
}
tip.local = 1;

function src(c, a) {
  mgraphics.set_source_rgba(c[0], c[1], c[2], a === undefined ? c[3] : a);
}
src.local = 1;

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
clamp01.local = 1;
