// pg-knob.js — the knobs themselves, drawn.
//
// live.dial's whole appearance is four colours on a flat arc, which is why
// every Live device's knobs look like every other Live device's knobs. A
// script can draw anything; the catch is that a [jsui] is not a Live
// parameter, and automation, MIDI mapping, Push and undo all speak to live.*
// objects and nothing else. Drawing the controls here and wiring them here
// would cost the device all four.
//
// So nothing is replaced. The live.dial stays exactly where m4lkit/ui.py put
// it, keeps its parameter, and is turned transparent (ui.py, dial_look with
// hidden=True — alpha-zero colours, never `invisible`, because a colour cannot
// change hit-testing). This box covers it and is `ignoreclick`, so the mouse
// falls straight through to the dial underneath: native drag, shift-drag for
// fine adjustment, right-click-to-map and automation write are all still the
// real control's. This file only paints.
//
// Which leaves it needing to be told what the dial knows. Each control arrives
// as `set <msg> <value>` from a [prepend] hung off that dial's own outlet —
// the same outlet the core listens to, so the drawing cannot disagree with
// what is audible — and its resting value comes in as a creation argument, so
// the knob is right on the first frame instead of blank until someone moves
// it. (pg-mod.js does the opposite on purpose: a ring with nothing to report
// draws nothing. A knob with nothing to report would just be a hole.)
//
//   jsui pg-knob.js <r> <g> <b> (<msg> <label> <cx> <cy> <radius> <initial>)...
//
// The stage's ink leads, once, so one script serves any stage; the geometry is
// ui.py's dial_knob() measurement of where live.dial actually puts its knob,
// worked out in one place rather than agreed on twice.
//
// ES5 only, like device/pg-core.js: the same idiom has to load in Max 8's
// legacy engine as well as Max 9's.

autowatch = 1;

mgraphics.init();
mgraphics.relative_coords = 0;   // pixel coordinates, origin top-left, y down
mgraphics.autofill = 0;

// ---------------------------------------------------------------- palette
// The stage colour arrives as the first three arguments; everything else is
// neutral, so a knob reads as a knob and only the value it is at carries the
// stage's identity. NEUTRAL is RAMP gray's label200 from m4lkit/ui.py — the
// same ink live.dial's own text would have used.
var INK = [0.827, 0.820, 0.780];
var TRACK = [1.000, 1.000, 1.000, 0.11];   // the travel, unfilled
var BODY  = [0.000, 0.000, 0.000, 0.38];   // darkens the panel, keeps its hue
var RIM   = [1.000, 1.000, 1.000, 0.10];   // light from above, on the top edge
var PTR   = [1.000, 1.000, 1.000, 0.88];   // where it is pointing

// ---------------------------------------------------------------- geometry
// live.dial's own sweep: 270 degrees with the gap at the bottom, running from
// lower-left round to lower-right. Angles increase clockwise, because y is
// down. Everything here is a fraction of the radius dial_knob() measured, so a
// stage that draws its knobs larger gets the same knob, bigger.
var A0 = Math.PI * 0.75;
var A_SPAN = Math.PI * 1.5;

var R_TRACK = 0.95;   // the arc, at the outside
var R_BODY  = 0.80;   // the disc, inside it
var PTR_IN  = 0.30;   // the pointer, as a fraction of the body
var PTR_OUT = 0.92;

var TRACK_LW = 1.5;
var GLOW_LW  = 5;     // the value, twice: a wide dim pass under a crisp one,
var VALUE_LW = 2.5;   // which is the nearest thing to a glow without gradients
var GLOW_A   = 0.18;
var PTR_LW   = 2;

var NAME_SIZE = 9;    // above the knob, where live.dial would have put it
var NAME_GAP = 4;
var VALUE_SIZE = 10;  // below it, brighter: this is the live reading
var VALUE_GAP = 13;

// ------------------------------------------------------------- the knobs
// jsarguments[0] is the script's own name, then the stage colour, then six
// atoms per knob. A knob always has a value — its initial one until it hears
// otherwise — so there is no null case to draw around.
var accent = [parseFloat(jsarguments[1]),
              parseFloat(jsarguments[2]),
              parseFloat(jsarguments[3])];

var knobs = [], byName = {};
for (var i = 4; i + 5 < jsarguments.length; i += 6) {
  var knob = { name:  String(jsarguments[i]),
               label: String(jsarguments[i + 1]),
               cx:    parseFloat(jsarguments[i + 2]),
               cy:    parseFloat(jsarguments[i + 3]),
               r:     parseFloat(jsarguments[i + 4]),
               v:     clamp01(parseFloat(jsarguments[i + 5])) };
  knobs.push(knob);
  byName[knob.name] = knob;
}

// ------------------------------------------------------------- the inlet
// One selector, carrying the message name the control already answers to:
// `set <msg> <value>`. Max resolves an incoming selector against this script's
// globals, and a jsui starts with Max's own already in there, so a script that
// dispatched on the control names themselves would be one `post` or `scale`
// away from silently calling something else. `set` is not a name Max owns, and
// it is the only one this box can be sent, so no control this device grows can
// collide with anything.
function set(name, v) {
  var knob = byName[name];
  if (!knob) return;
  v = clamp01(v);
  if (knob.v === v) return;    // live.dial repeats itself while dragging
  knob.v = v;
  mgraphics.redraw();
}

// Max posts an error for any selector no function claims. Nothing else is
// wired here, so this is belt and braces — but it is the cheap kind.
function anything() {}

// ----------------------------------------------------------------- drawing
function paint() {
  for (var n = 0; n < knobs.length; n++) {
    var k = knobs[n];
    var rb = k.r * R_BODY;

    src(TRACK);
    arc(k.cx, k.cy, k.r * R_TRACK, A0, A0 + A_SPAN, TRACK_LW);

    src(accent, GLOW_A);
    arc(k.cx, k.cy, k.r * R_TRACK, A0, A0 + A_SPAN * k.v, GLOW_LW);
    src(accent, 1);
    arc(k.cx, k.cy, k.r * R_TRACK, A0, A0 + A_SPAN * k.v, VALUE_LW);

    src(BODY);
    disc(k.cx, k.cy, rb);
    src(RIM);
    arc(k.cx, k.cy, rb, Math.PI, Math.PI * 2, 1.5);

    var a = A0 + A_SPAN * k.v;
    src(PTR);
    mgraphics.set_line_width(PTR_LW);
    mgraphics.new_path();
    mgraphics.move_to(k.cx + rb * PTR_IN * Math.cos(a),
                      k.cy + rb * PTR_IN * Math.sin(a));
    mgraphics.line_to(k.cx + rb * PTR_OUT * Math.cos(a),
                      k.cy + rb * PTR_OUT * Math.sin(a));
    mgraphics.stroke();

    mgraphics.select_font_face("Arial");
    src(INK, 0.62);
    centred(k.label, NAME_SIZE, k.cx, k.cy - k.r - NAME_GAP);
    src(INK, 0.92);
    centred(k.v.toFixed(2), VALUE_SIZE, k.cx, k.cy + k.r + VALUE_GAP);
  }
}

function arc(cx, cy, r, a0, a1, lw) {
  mgraphics.set_line_width(lw);
  mgraphics.new_path();
  mgraphics.arc(cx, cy, r, a0, a1);
  mgraphics.stroke();
}
arc.local = 1;

function disc(cx, cy, r) {
  mgraphics.new_path();
  mgraphics.arc(cx, cy, r, 0, Math.PI * 2);
  mgraphics.fill();
}
disc.local = 1;

// mgraphics has no text alignment: show_text draws from wherever the path
// currently is, so a centred string has to be measured first.
function centred(s, size, cx, baseline) {
  mgraphics.set_font_size(size);
  mgraphics.new_path();
  mgraphics.move_to(cx - mgraphics.text_measure(s)[0] / 2, baseline);
  mgraphics.show_text(s);
}
centred.local = 1;

function src(c, a) {
  mgraphics.set_source_rgba(c[0], c[1], c[2], a === undefined ? c[3] : a);
}
src.local = 1;

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
clamp01.local = 1;
