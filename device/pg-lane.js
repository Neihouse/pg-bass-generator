// pg-lane.js — the phrase, drawn, and edited.
//
// A step lane: one column per 16th, notes placed by pitch, accent and slide
// drawn as themselves. Mutate and the four layer rerolls all change the phrase
// in ways two bars of audio only half-report; this is where they become
// legible (DESIGN.md §5.4) — and, since the picture is already exact, where
// they become editable (§5.6).
//
// Two boxes load this script, and a creation argument says which is which:
//
//   jsui pg-lane.js rack     the device strip in Live's rack
//   jsui pg-lane.js window   the hero lane in the sound-design window
//
// "rack" draws no identity line, because the rack's status display sits one
// row above it saying the same thing; the counts move down to the ruler so
// nothing is lost and the notes get the 20 px back.
//
// It reads the two messages pg-core.js pushes on its phrase outlet:
//
//   phrase <name> <bars> <steps> <root> <groove> <mode> <contour>
//   steps  <flags> <pitch> <vel> <gate> <prob> <timbre> <wet> <micro> x steps
//
// "steps" lands last and is the redraw trigger, so the header and the grid are
// never a frame out of step with each other. flags is a bitmask: 1 onset,
// 2 accent, 4 slide. Of the eight lanes per step this draws five — onset,
// pitch, accent/slide, velocity and microtiming; prob, timbre and wet ride
// along in the same message for a later pass.
//
// ---------------------------------------------------------------- editing
// Three gestures, on the notes themselves:
//
//   click a note          toggle its accent
//   shift-click a note    toggle the slide into it
//   drag a note           move it in time and in pitch
//
// each of which leaves by this box's outlet as one message back to the core:
//
//   stepedit accent <step>
//   stepedit slide  <step>
//   stepedit move   <from> <to> <pitch>
//
// The core owns the phrase; this script never edits `lane` itself. A drag
// draws a ghost locally and sends nothing until the button comes up, for the
// reason pushPhrase() gives on its own side: the phrase dump is button-rate,
// and a drag that sent per-pixel would flood the drawer with full phrase
// dumps. One gesture, one message, one redraw — and a refused edit (an
// occupied column, a slide with no note in front of it) simply never comes
// back, so the ghost drops and the note is where it was.
//
// ES5 only, like device/pg-core.js: the same idiom has to load in Max 8's
// legacy engine as well as Max 9's.

autowatch = 1;

mgraphics.init();
mgraphics.relative_coords = 0;   // pixel coordinates, origin top-left, y down
mgraphics.autofill = 0;

// ---------------------------------------------------------------- palette
// The window's own colors, so the lane reads as part of the device instead of
// a panel bolted onto it: the scope~ black it sits above, and the label colors
// from RAMP in m4lkit/ui.py — amber for an accent (the identity row's color),
// teal for a plain note, coral for a slide.
var GROUND     = [0.020, 0.020, 0.020, 1.00];   // scope~ bgcolor
var EDGE       = [0.125, 0.125, 0.141, 1.00];
var BEAT       = [1.000, 1.000, 1.000, 0.030];
var BARLINE    = [1.000, 1.000, 1.000, 0.140];
var ROOTLINE   = [0.624, 0.882, 0.796, 0.130];  // RAMP teal, ghosted to a rule
var NOTE       = [0.059, 0.314, 0.267, 1.00];
var NOTE_EDGE  = [0.435, 0.749, 0.690, 1.00];   // the cyan scope~ itself draws
var ACCENT     = [0.980, 0.780, 0.459, 1.00];   // RAMP amber
var ACCENT_EDGE= [1.000, 0.878, 0.659, 1.00];
var SLIDE      = [0.961, 0.769, 0.702, 0.90];   // RAMP coral
var INK_DIM    = [0.616, 0.612, 0.596, 1.00];
var INK_FAINT  = [0.431, 0.427, 0.416, 1.00];

// ---------------------------------------------------------------- layout
var PAD_X = 10;      // gutter either side of the grid
var HEAD_H = 20;     // the identity line above it
var FOOT_H = 14;     // the bar ruler below it
var NOTE_H = 7;
var ACC_H = 9;       // an accent is taller as well as brighter
var MIN_SPAN = 8;    // semitones drawn at minimum, so a pedal phrase stays flat

// A note body is 7 px tall in a lane 100 px high: asking the mouse to land on
// it exactly would make the rack strip unusable. So a click reaches for the
// nearest note instead — up to half a column either side of the body, up to
// HIT_Y px above or below its middle — and x counts four times as much as y,
// because the column is what the eye aimed at.
var HIT_X = 0.5;     // columns, past either end of the body
var HIT_Y = 16;      // pixels, from the body's middle
var DEAD = 3;        // pixels of travel before a click becomes a drag
var RANGE = 24;      // semitones above the root a note may be dragged to

var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ---------------------------------------------------------------- state
var head = null;   // the phrase header, as sent
var lane = [];     // one entry per step, onsets and rests alike

// The gesture in progress, and the pitch range held still for its duration —
// without the freeze, dragging a note upward would rescale the axis under it
// and the note would never catch the pointer.
var grab = null;
var frozen = null;

// jsarguments[0] is the object's own name; the view is the one after it.
var COMPACT = String(jsarguments[1] || "") === "rack";

// ---------------------------------------------------------------- inbound
function phrase(name, bars, nsteps, root, groove, mode, contour) {
  head = { name: String(name), bars: bars, steps: nsteps, root: root,
           groove: String(groove), mode: String(mode), contour: String(contour) };
  // no redraw here on purpose: "steps" is right behind this one and carries
  // the grid the header describes.
}

function steps() {
  var a = arrayfromargs(arguments), out = [];
  for (var i = 0; i + 7 < a.length; i += 8) {
    var f = a[i];
    out.push({ on: (f & 1) !== 0, acc: (f & 2) !== 0, sl: (f & 4) !== 0,
               pitch: a[i + 1], vel: a[i + 2], gate: a[i + 3], micro: a[i + 7] });
  }
  lane = out;
  // A new phrase replaces whatever was under the pointer, so the gesture goes
  // with it: this also lands as the answer to an accepted edit, where the
  // ghost has just been overwritten by the real thing.
  grab = null;
  frozen = null;
  mgraphics.redraw();
}

// ---------------------------------------------------------------- drawing
function paint() {
  var L = layout();
  background(L.w, L.h);
  mgraphics.select_font_face("Arial");
  if (!L.span) { placeholder(L.w, L.h); return; }

  if (!COMPACT) header(L);
  grid(L);
  ties(L);
  notes(L);
  ruler(L);
}

// Everything the drawing and the mouse both need, worked out once. paint()
// and hitTest() disagreeing about where a step is would show up as notes that
// take the click one column over, so neither gets to compute it alone.
function layout() {
  var r = this.box.rect;
  var w = r[2] - r[0], h = r[3] - r[1];
  var headH = COMPACT ? 0 : HEAD_H;
  var gw = w - PAD_X * 2, n = lane.length;
  return { w: w, h: h, n: n,
           gx: PAD_X, gw: gw, cw: gw / (n || 1),
           gy: headH, gh: h - headH - FOOT_H,
           span: (head && n) ? (frozen || pitchSpan()) : null };
}
layout.local = 1;

function background(w, h) {
  src(GROUND);
  mgraphics.rectangle(0, 0, w, h);
  mgraphics.fill();
  src(EDGE);
  mgraphics.set_line_width(1);
  mgraphics.rectangle(0.5, 0.5, w - 1, h - 1);
  mgraphics.stroke();
}
background.local = 1;

function placeholder(w, h) {
  mgraphics.set_font_size(10);
  var s = "no phrase yet";
  src(INK_FAINT);
  text((w - textWidth(s)) / 2, h / 2 + 4, s);
}
placeholder.local = 1;

// The phrase's identity on the left, what is in it on the right.
function header(L) {
  mgraphics.set_font_size(10);
  var base = 13;

  src(ACCENT);
  text(L.gx, base, head.name);
  src(INK_DIM);
  text(L.gx + textWidth(head.name) + 8,
       base, head.groove + "  ·  " + head.mode + "  ·  " + head.contour);

  src(INK_FAINT);
  rightText(L.w, base, counts());
}
header.local = 1;

// What is in the phrase, as a line: the one readout the rack's status display
// does not already carry, so it follows the header down when there isn't one.
function counts() {
  var on = 0, acc = 0, sl = 0;
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on) continue;
    on++;
    if (lane[s].acc) acc++;
    if (lane[s].sl) sl++;
  }
  return plural(on, "note") + "  ·  " + plural(acc, "accent") +
         "  ·  " + plural(sl, "slide") + "  ·  " + noteName(head.root);
}
counts.local = 1;

function grid(L) {
  // beats 1 and 3, shaded: the piano-roll zebra, so a count is a glance
  src(BEAT);
  for (var s = 0; s < L.n; s += 8) {
    var bw = Math.min(4, L.n - s) * L.cw;
    mgraphics.rectangle(L.gx + s * L.cw, L.gy, bw, L.gh);
    mgraphics.fill();
  }

  // the tonic, ghosted: every note then reads as an interval off it, not as a
  // height on an unlabelled axis
  src(ROOTLINE);
  line(L.gx, hair(yOf(head.root, L)), L.gx + L.gw, hair(yOf(head.root, L)));

  src(BARLINE);
  for (var b = 16; b < L.n; b += 16) {
    line(hair(L.gx + b * L.cw), L.gy, hair(L.gx + b * L.cw), L.gy + L.gh);
  }
}
grid.local = 1;

// Slides first, so each one runs into the note it belongs to from behind.
// Sloped, because that is what a slide does: the pitch travels.
//
// Direction matters and is easy to get backwards: slides[s] means step s is
// slid *into* from the onset before it, which is how fireStep() reads it when
// it decides whether to tie. So the line is drawn from the previous onset,
// and the first note of a phrase is never the far end of one.
function ties(L) {
  src(SLIDE);
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on || !lane[s].sl) continue;
    var t = prevOnset(s);
    if (t < 0) continue;
    var a = bodyOf(t, L), b = bodyOf(s, L);
    line(a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2, 2);
  }
}
ties.local = 1;

function notes(L) {
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on) continue;
    // while a note is being dragged, an outline where it started: the gesture
    // then reads as a distance rather than as a note that jumped
    if (grab && grab.moved && grab.s === s) {
      var o = bodyAt(s, s, lane[s].pitch, L);
      src(INK_FAINT, 0.55);
      mgraphics.set_line_width(1);
      mgraphics.rectangle(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
      mgraphics.stroke();
    }
    var b = bodyOf(s, L);
    // velocity as weight, so a ghost note sits behind the note it answers
    var v = 0.45 + 0.55 * clamp01(lane[s].vel / 127);
    src(lane[s].acc ? ACCENT : NOTE, v);
    mgraphics.rectangle(b.x, b.y, b.w, b.h);
    mgraphics.fill();
    src(lane[s].acc ? ACCENT_EDGE : NOTE_EDGE, 0.9);
    mgraphics.set_line_width(1);
    mgraphics.rectangle(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    mgraphics.stroke();
  }
}
notes.local = 1;

function ruler(L) {
  var y = L.gy + L.gh;
  mgraphics.set_font_size(9);
  src(INK_FAINT);
  // The counts ride the ruler when there is no header to carry them, so the
  // beat ticks stop where that text starts rather than striking through it.
  var stop = L.w, label = COMPACT ? counts() : "";
  if (COMPACT) stop = L.w - PAD_X - textWidth(label) - 6;
  for (var b = 0; b * 16 < L.n; b++) text(L.gx + b * 16 * L.cw + 2, y + 11, String(b + 1));
  for (var s = 4; s < L.n; s += 4) {
    if (s % 16 === 0) continue;                  // that column already has a bar line
    if (L.gx + s * L.cw > stop) break;
    line(hair(L.gx + s * L.cw), y + 2, hair(L.gx + s * L.cw), y + 6);
  }
  if (COMPACT) rightText(L.w, y + 11, label);
}
ruler.local = 1;

// ---------------------------------------------------------------- the mouse
// Mouse-down picks a note up. Nothing leaves here yet — which gesture this is
// isn't known until the button comes back up.
function onclick(x, y, button, cmd, shift) {
  grab = null;
  var L = layout();
  if (!L.span) return;
  var s = hitTest(x, y, L);
  if (s < 0) return;
  frozen = L.span;
  grab = { s: s, x0: x, y0: y, step: s, pitch: lane[s].pitch,
           shift: !!shift, moved: false };
}

// Called while the button is down, and once more with button 0 on release.
function ondrag(x, y, button, cmd, shift) {
  if (!grab) return;
  if (!button) { release(); return; }
  if (grab.shift) return;            // shift-click is a slide, not a move

  var dx = x - grab.x0, dy = y - grab.y0;
  if (!grab.moved) {
    if (Math.abs(dx) < DEAD && Math.abs(dy) < DEAD) return;
    grab.moved = true;
  }

  var L = layout();
  // A column that already holds a note is a hole to pass over, not a wall:
  // keep the last free column so dragging across a run doesn't stick.
  var step = clampInt(grab.s + Math.round(dx / L.cw), 0, lane.length - 1);
  if (step === grab.s || !lane[step].on) grab.step = step;
  // The drawn span is padded past the notes and the core's range is not, so the
  // two disagree at the edges. Clamp to both: to the grid, so the ghost cannot
  // leave the drawing, and to RANGE — pg-core.js editMove()'s own clamp, which
  // is GRAVITY's range — so it cannot promise a pitch the core will refuse.
  grab.pitch = clampInt(lane[grab.s].pitch - Math.round(dy / semiPx(L)),
                        Math.max(L.span.lo, head.root),
                        Math.min(L.span.hi, head.root + RANGE));
  mgraphics.redraw();
}

// Mouse-up: the one place a gesture turns into a message.
function release() {
  var g = grab;
  grab = null;
  frozen = null;
  if (!g) return;
  if (g.shift) outlet(0, "stepedit", "slide", g.s);
  else if (!g.moved) outlet(0, "stepedit", "accent", g.s);
  else if (g.step !== g.s || g.pitch !== lane[g.s].pitch) {
    outlet(0, "stepedit", "move", g.s, g.step, g.pitch);
  }
  mgraphics.redraw();
}
release.local = 1;

// The onset nearest the pointer, or -1. See HIT_X / HIT_Y above for why this
// is a reach rather than a containment test.
function hitTest(x, y, L) {
  var best = -1, bestD = 1e9;
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on) continue;
    var b = bodyOf(s, L);
    var dx = x < b.x ? b.x - x : (x > b.x + b.w ? x - (b.x + b.w) : 0);
    var dy = Math.abs(y - (b.y + b.h / 2));
    if (dx > L.cw * HIT_X || dy > HIT_Y) continue;
    var d = dx * 4 + dy;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
hitTest.local = 1;

// ---------------------------------------------------------------- geometry
// One note body, used by the notes, the slides that join them and the mouse
// that reaches for them, so none of the three can disagree about where a step
// is. bodyAt places step s's shape at an arbitrary column and pitch — which is
// the ghost — and bodyOf asks for wherever that step is right now.
function bodyAt(s, step, pitch, L) {
  var a = lane[s];
  var h = a.acc ? ACC_H : NOTE_H;
  var x = L.gx + (step + a.micro) * L.cw;       // microtiming: swing, drawn
  if (x < L.gx) x = L.gx;
  var w = a.gate * L.cw - 1.5;                  // gate: how long the note holds
  if (w < 2.5) w = 2.5;
  if (x + w > L.gx + L.gw) w = L.gx + L.gw - x;
  if (w < 1) w = 1;
  return { x: x, y: yOf(pitch, L) - h / 2, w: w, h: h };
}
bodyAt.local = 1;

function bodyOf(s, L) { return bodyAt(s, stepOf(s), pitchOf(s), L); }
bodyOf.local = 1;

// Where a step is drawn: the phrase's own value, or the drag's, for the one
// note under the pointer.
function stepOf(s) {
  return (grab && grab.moved && grab.s === s) ? grab.step : s;
}
stepOf.local = 1;

function pitchOf(s) {
  return (grab && grab.moved && grab.s === s) ? grab.pitch : lane[s].pitch;
}
pitchOf.local = 1;

// The drawn pitch range: what the phrase uses, padded, never narrower than
// MIN_SPAN and always wide enough to include the tonic rule.
function pitchSpan() {
  var lo = 1e9, hi = -1e9;
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on) continue;
    if (lane[s].pitch < lo) lo = lane[s].pitch;
    if (lane[s].pitch > hi) hi = lane[s].pitch;
  }
  if (lo > hi) { lo = head.root; hi = head.root; }       // nothing playing yet
  if (head.root < lo) lo = head.root;
  if (head.root > hi) hi = head.root;
  lo -= 1; hi += 1;
  var short = MIN_SPAN - (hi - lo);
  if (short > 0) { lo -= Math.floor(short / 2); hi += Math.ceil(short / 2); }
  return { lo: lo, hi: hi };
}
pitchSpan.local = 1;

function yOf(p, L) {
  var m = ACC_H / 2 + 1;                                  // keep bodies inside
  return L.gy + m +
         (1 - clamp01((p - L.span.lo) / (L.span.hi - L.span.lo))) * (L.gh - m * 2);
}
yOf.local = 1;

// Pixels per semitone — the inverse of yOf, and what turns a drag's vertical
// travel into an interval.
function semiPx(L) {
  var m = ACC_H / 2 + 1;
  return (L.gh - m * 2) / (L.span.hi - L.span.lo);
}
semiPx.local = 1;

function prevOnset(s) {
  for (var t = s - 1; t >= 0; t--) if (lane[t].on) return t;
  return -1;
}
prevOnset.local = 1;

// ---------------------------------------------------------------- helpers
function src(c, a) {
  mgraphics.set_source_rgba(c[0], c[1], c[2], a === undefined ? c[3] : a);
}
src.local = 1;

function line(x1, y1, x2, y2, lw) {
  mgraphics.set_line_width(lw || 1);
  mgraphics.move_to(x1, y1);
  mgraphics.line_to(x2, y2);
  mgraphics.stroke();
}
line.local = 1;

function text(x, y, s) {
  mgraphics.move_to(x, y);          // y is the baseline, Cairo-style
  mgraphics.show_text(s);
}
text.local = 1;

function rightText(w, y, s) { text(w - PAD_X - textWidth(s), y, s); }
rightText.local = 1;

function textWidth(s) { return mgraphics.text_measure(s)[0]; }
textWidth.local = 1;

function hair(v) { return Math.round(v) + 0.5; }   // a 1px line that stays 1px
hair.local = 1;

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
clamp01.local = 1;

function clampInt(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
clampInt.local = 1;

function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
plural.local = 1;

function noteName(m) {
  return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 2);   // 36 = C1
}
noteName.local = 1;
