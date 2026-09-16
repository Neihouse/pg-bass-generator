// pg-lane.js — the phrase, drawn.
//
// A read-only step lane: one column per 16th, notes placed by pitch, accent
// and slide drawn as themselves. Mutate and the four layer rerolls all change
// the phrase in ways two bars of audio only half-report; this is where they
// become legible (DESIGN.md §5.4).
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

var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ---------------------------------------------------------------- state
var head = null;   // the phrase header, as sent
var lane = [];     // one entry per step, onsets and rests alike

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
  mgraphics.redraw();
}

// ---------------------------------------------------------------- drawing
function paint() {
  var r = this.box.rect;
  var w = r[2] - r[0], h = r[3] - r[1];

  background(w, h);
  mgraphics.select_font_face("Arial");
  if (!head || !lane.length) { placeholder(w, h); return; }

  var headH = COMPACT ? 0 : HEAD_H;
  var gx = PAD_X, gw = w - PAD_X * 2;
  var gy = headH, gh = h - headH - FOOT_H;
  var n = lane.length, cw = gw / n, span = pitchSpan();

  if (!COMPACT) header(w, gx);
  grid(gx, gy, gw, gh, n, cw, span);
  ties(gx, gy, gw, gh, cw, span);
  notes(gx, gy, gw, gh, cw, span);
  ruler(gx, gy + gh, w, n, cw);
}

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
function header(w, gx) {
  mgraphics.set_font_size(10);
  var base = 13;

  src(ACCENT);
  text(gx, base, head.name);
  src(INK_DIM);
  text(gx + textWidth(head.name) + 8,
       base, head.groove + "  ·  " + head.mode + "  ·  " + head.contour);

  src(INK_FAINT);
  rightText(w, base, counts());
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

function grid(gx, gy, gw, gh, n, cw, span) {
  // beats 1 and 3, shaded: the piano-roll zebra, so a count is a glance
  src(BEAT);
  for (var s = 0; s < n; s += 8) {
    var bw = Math.min(4, n - s) * cw;
    mgraphics.rectangle(gx + s * cw, gy, bw, gh);
    mgraphics.fill();
  }

  // the tonic, ghosted: every note then reads as an interval off it, not as a
  // height on an unlabelled axis
  src(ROOTLINE);
  line(gx, hair(yOf(head.root, gy, gh, span)), gx + gw, hair(yOf(head.root, gy, gh, span)));

  src(BARLINE);
  for (var b = 16; b < n; b += 16) line(hair(gx + b * cw), gy, hair(gx + b * cw), gy + gh);
}
grid.local = 1;

// Slides first, so each one runs out from under the note that starts it.
// Sloped, because that is what a slide does: the pitch travels.
function ties(gx, gy, gw, gh, cw, span) {
  src(SLIDE);
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on || !lane[s].sl) continue;
    var t = nextOnset(s);
    if (t < 0) continue;
    var a = bodyOf(s, gx, gy, gw, gh, cw, span), b = bodyOf(t, gx, gy, gw, gh, cw, span);
    line(a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2, 2);
  }
}
ties.local = 1;

function notes(gx, gy, gw, gh, cw, span) {
  for (var s = 0; s < lane.length; s++) {
    if (!lane[s].on) continue;
    var b = bodyOf(s, gx, gy, gw, gh, cw, span);
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

function ruler(gx, y, w, n, cw) {
  mgraphics.set_font_size(9);
  src(INK_FAINT);
  // The counts ride the ruler when there is no header to carry them, so the
  // beat ticks stop where that text starts rather than striking through it.
  var stop = w, label = COMPACT ? counts() : "";
  if (COMPACT) stop = w - PAD_X - textWidth(label) - 6;
  for (var b = 0; b * 16 < n; b++) text(gx + b * 16 * cw + 2, y + 11, String(b + 1));
  for (var s = 4; s < n; s += 4) {
    if (s % 16 === 0) continue;                  // that column already has a bar line
    if (gx + s * cw > stop) break;
    line(hair(gx + s * cw), y + 2, hair(gx + s * cw), y + 6);
  }
  if (COMPACT) rightText(w, y + 11, label);
}
ruler.local = 1;

// ---------------------------------------------------------------- geometry
// One note body, used by both the notes and the slides that join them, so the
// two can never disagree about where a step is.
function bodyOf(s, gx, gy, gw, gh, cw, span) {
  var a = lane[s];
  var h = a.acc ? ACC_H : NOTE_H;
  var x = gx + (s + a.micro) * cw;              // microtiming: swing, drawn
  if (x < gx) x = gx;
  var w = a.gate * cw - 1.5;                    // gate: how long the note holds
  if (w < 2.5) w = 2.5;
  if (x + w > gx + gw) w = gx + gw - x;
  if (w < 1) w = 1;
  return { x: x, y: yOf(a.pitch, gy, gh, span) - h / 2, w: w, h: h };
}
bodyOf.local = 1;

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

function yOf(p, gy, gh, span) {
  var m = ACC_H / 2 + 1;                                  // keep bodies inside
  return gy + m + (1 - clamp01((p - span.lo) / (span.hi - span.lo))) * (gh - m * 2);
}
yOf.local = 1;

function nextOnset(s) {
  for (var t = s + 1; t < lane.length; t++) if (lane[t].on) return t;
  return -1;
}
nextOnset.local = 1;

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

function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
plural.local = 1;

function noteName(m) {
  return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 2);   // 36 = C1
}
noteName.local = 1;
