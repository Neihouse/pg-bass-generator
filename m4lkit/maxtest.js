// maxtest.js — run a legacy [js] core outside Max, and check the built patch
// against it. Node only; no dependencies.
//
//   var mt = require("../m4lkit/maxtest");
//   var core = mt.loadCore(path.join(__dirname, "..", "device", "my-core.js"), { outlets: 3 });
//   var sb = core();                      // fresh sandbox, core script already run
//   mt.call(sb, "cutoff", 0.5);           // call a handler
//   mt.tick(sb, 16, 125);                 // 16 × bang, advancing the fake clock 125 ms each
//   mt.collect(sb, 0, "cutoff");          // every "cutoff ..." message sent from outlet 0
//
// The sandbox shims the Max globals a core touches: outlet(), post(), Task
// (with schedule/cancel, fired in time order by the fake clock) and Date.now.
// Math.random is the sandbox's own seeded stream (opts.seed, default 1), so the
// same seed and inputs emit the same messages every run; vary it to sample others.
// sb.__state exposes {now, out, outT, advance(ms)} for tests that need them.
//
// loadJsui() is the same idea for a [jsui] display script: it shims mgraphics
// instead of the scheduler, so paint() runs headless and every primitive it
// draws — colour, geometry, text — is recorded for a test to read back.

"use strict";
var fs = require("fs");
var vm = require("vm");

// Math for one sandbox: the host's methods through the prototype, plus an own
// random drawn from a Park–Miller stream. Draws replay per seed, and neither the
// host's Math.random nor another sandbox's draws can move them.
function seededMath(seed) {
  var s = Math.floor(Math.abs(seed)) % 2147483646 + 1;   // 1 .. 2^31-2, never 0
  var m = Object.create(Math);
  m.random = function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return m;
}

function loadCore(srcPath, opts) {
  opts = opts || {};
  var src = fs.readFileSync(srcPath, "utf8");
  var filename = srcPath.split("/").pop();
  var nOutlets = opts.outlets || 1;
  var seed = opts.seed === undefined ? 1 : opts.seed;
  if (typeof seed !== "number" || !isFinite(seed)) throw new Error("seed must be a number, got " + opts.seed);

  return function makeSandbox() {
    var state = {
      now: opts.now || 1000000,   // fake clock (ms)
      tasks: [],                  // scheduled Task shims
      out: [],                    // recorded outlet messages per outlet
      outT: []                    // fake-clock time each message was emitted
    };
    for (var o = 0; o < nOutlets; o++) { state.out.push([]); state.outT.push([]); }

    function FakeTask(fn, owner) {
      this.fn = fn;
      this.owner = owner || null;
      this.at = -1;
    }
    FakeTask.prototype.schedule = function (ms) {
      this.at = state.now + (ms || 0);
      if (state.tasks.indexOf(this) < 0) state.tasks.push(this);
    };
    FakeTask.prototype.cancel = function () { this.at = -1; };

    var sandbox = {
      Math: seededMath(seed), JSON: JSON, String: String, parseInt: parseInt, parseFloat: parseFloat,
      isNaN: isNaN, Object: Object, Array: Array, Number: Number,
      Date: { now: function () { return state.now; } },
      Task: FakeTask,
      post: opts.post || function () {},
      outlet: function (idx) {
        if (!state.out[idx]) throw new Error("outlet " + idx + " does not exist (outlets: " + nOutlets + ")");
        state.out[idx].push(Array.prototype.slice.call(arguments, 1));
        state.outT[idx].push(state.now);
      }
    };
    sandbox.__state = state;

    // advance the fake clock, firing due Task shims in time order
    state.advance = function (ms) {
      var target = state.now + ms;
      for (;;) {
        var best = null;
        for (var i = 0; i < state.tasks.length; i++) {
          var t = state.tasks[i];
          if (t.at >= 0 && t.at <= target && (!best || t.at < best.at)) best = t;
        }
        if (!best) break;
        state.now = best.at;
        best.at = -1;
        best.fn.call(best.owner);
      }
      state.now = target;
    };

    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: filename });
    return sandbox;
  };
}

// ---------------------------------------------------------------- a [jsui] script

// mgraphics, recorded rather than drawn. Each fill/stroke/show_text appends one
// op carrying the current source colour, line width and transformed geometry,
// so a test can ask what a paint() actually put on screen: how many note
// rectangles, what colour, and whether any of it fell outside the box.
function mgraphicsShim(state) {
  var m = [1, 0, 0, 1, 0, 0];          // affine, canvas order: x' = ax+cy+e
  var src = [0, 0, 0, 1], lw = 1, size = 12, face = "";
  var path = [], stack = [];

  function xf(x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  function mul(n) {
    m = [n[0] * m[0] + n[1] * m[2], n[0] * m[1] + n[1] * m[3],
         n[2] * m[0] + n[3] * m[2], n[2] * m[1] + n[3] * m[3],
         n[4] * m[0] + n[5] * m[2] + m[4], n[4] * m[1] + n[5] * m[3] + m[5]];
  }
  function pt(x, y) { var p = xf(x, y); path.push(p); return p; }
  function rect(x, y, w, h) { pt(x, y); pt(x + w, y); pt(x + w, y + h); pt(x, y + h); }
  // An arc sampled along the path it actually sweeps, not boxed as the circle
  // it belongs to: a display that rings a dial draws a partial arc, and a test
  // asking where that ring ended has to see the sweep rather than its bounding
  // square. Angles are optional (a bare arc is the whole circle) and the sweep
  // is normalised in the direction the selector names, matching mgraphics.
  function arcPath(x, y, r, a0, a1, neg) {
    if (a0 === undefined) { a0 = 0; a1 = Math.PI * 2; }
    else if (a1 === undefined) a1 = a0;
    var span = a1 - a0;
    if (neg) { while (span > 0) span -= Math.PI * 2; }
    else { while (span < 0) span += Math.PI * 2; }
    var n = Math.max(1, Math.ceil(Math.abs(span) / (Math.PI / 36)));   // <= 5 deg
    for (var i = 0; i <= n; i++) {
      var a = a0 + span * (i / n);
      pt(x + r * Math.cos(a), y + r * Math.sin(a));
    }
  }
  function bbox(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, x1: x1, y1: y1 };
  }
  function emit(kind, keep) {
    if (path.length) {
      var b = bbox(path);
      state.ops.push({ op: kind, color: src.slice(), lineWidth: lw,
                       points: path.slice(), x: b.x, y: b.y, w: b.w, h: b.h,
                       x1: b.x1, y1: b.y1 });
    }
    if (!keep) path = [];
  }
  // a stand-in for the host's glyph metrics: enough to lay text out, never
  // claimed to be exact — tests assert containment, not pixel equality
  function measure(s) { return [String(s).length * size * 0.55, size]; }

  var g = {
    relative_coords: 1, autofill: 1,
    init: function () {}, redraw: function () { state.redraws++; },
    set_source_rgb: function (r, gg, b) {
      src = (r && r.length) ? [r[0], r[1], r[2], 1] : [r, gg, b, 1];
    },
    set_source_rgba: function (r, gg, b, a) {
      src = (r && r.length) ? [r[0], r[1], r[2], r[3] === undefined ? 1 : r[3]] : [r, gg, b, a];
    },
    set_line_width: function (v) { lw = v; },
    set_dash: function () {}, set_line_cap: function () {}, set_line_join: function () {},
    move_to: function (x, y) { pt(x, y); },
    line_to: function (x, y) { pt(x, y); },
    curve_to: function (a, b, c, d, e, f) { pt(a, b); pt(c, d); pt(e, f); },
    close_path: function () {}, new_path: function () { path = []; },
    rectangle: rect,
    rectangle_rounded: function (x, y, w, h) { rect(x, y, w, h); },
    arc: function (x, y, r, a0, a1) { arcPath(x, y, r, a0, a1, false); },
    arc_negative: function (x, y, r, a0, a1) { arcPath(x, y, r, a0, a1, true); },
    ellipse: rect,
    fill: function () { emit("fill", false); },
    fill_preserve: function () { emit("fill", true); },
    fill_with_alpha: function (a) { var s = src; src = [s[0], s[1], s[2], a]; emit("fill", false); src = s; },
    stroke: function () { emit("stroke", false); },
    stroke_preserve: function () { emit("stroke", true); },
    paint: function () { rect(0, 0, state.width, state.height); emit("fill", false); },
    select_font_face: function (f) { face = f; },
    set_font_size: function (v) { size = v; },
    text_measure: measure,
    font_extents: function () { return [size * 0.8, size * 0.2, size, size * 0.6, 0]; },
    show_text: function (s) {
      var wh = measure(s), a = xf(0, 0), b = xf(wh[0], 0);
      var x = path.length ? path[path.length - 1][0] : a[0];
      var y = path.length ? path[path.length - 1][1] : a[1];
      state.ops.push({ op: "text", text: String(s), color: src.slice(), size: size,
                       font: face, x: x, y: y - size * 0.8,
                       w: Math.abs(b[0] - a[0]), h: size,
                       x1: x + Math.abs(b[0] - a[0]), y1: y + size * 0.2 });
      path = [];
    },
    save: function () { stack.push([m.slice(), src.slice(), lw, size, face]); },
    restore: function () {
      var s = stack.pop();
      if (s) { m = s[0]; src = s[1]; lw = s[2]; size = s[3]; face = s[4]; }
    },
    translate: function (x, y) { mul([1, 0, 0, 1, x, y]); },
    scale: function (x, y) { mul([x, 0, 0, y === undefined ? x : y, 0, 0]); },
    rotate: function (a) { mul([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); }
  };
  return g;
}

// Load a [jsui] script headless. opts: {width, height, seed, args}. The returned
// factory builds a fresh sandbox per call, exactly like loadCore(). `args` are
// the box's creation arguments: Max puts the object's own name at
// jsarguments[0] and the arguments after it, so a script reads its first
// argument as jsarguments[1] — the shim keeps that offset.
function loadJsui(srcPath, opts) {
  opts = opts || {};
  var src = fs.readFileSync(srcPath, "utf8");
  var filename = srcPath.split("/").pop();
  var w = opts.width || 200, h = opts.height || 100;

  return function makeSandbox() {
    var state = { width: w, height: h, ops: [], redraws: 0, out: [], messages: [] };
    var sandbox = {
      Math: seededMath(opts.seed === undefined ? 1 : opts.seed),
      JSON: JSON, String: String, parseInt: parseInt, parseFloat: parseFloat,
      isNaN: isNaN, Object: Object, Array: Array, Number: Number,
      Date: { now: function () { return 1000000; } },
      mgraphics: mgraphicsShim(state),
      box: { rect: [0, 0, w, h], size: [w, h],
             message: function () { state.messages.push(Array.prototype.slice.call(arguments)); } },
      max: { getcolor: function () { return [0, 0, 0, 1]; } },
      jsarguments: [filename].concat(opts.args || []),
      arrayfromargs: function (a, b) {
        var src = (b !== undefined) ? b : a;
        return Array.prototype.slice.call(src);
      },
      post: opts.post || function () {},
      error: function () {},
      outlet: function (idx) { state.out.push([idx].concat(Array.prototype.slice.call(arguments, 1))); },
      notifyclients: function () {}
    };
    sandbox.__draw = state;
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: filename });
    return sandbox;
  };
}

// Run the script's paint() against a cleared record, and hand back what it drew.
// paint() reads this.box; the script is sloppy-mode, so `this` inside a plain
// call is the sandbox global, where box lives — the same resolution Max gives it.
function paint(sb) {
  sb.__draw.ops = [];
  vm.runInContext("paint", sb).call(sb);
  return sb.__draw.ops;
}

// the ops whose colour matches, within tol — how a test names "the amber ones"
function opsColored(ops, rgb, tol) {
  tol = tol === undefined ? 0.02 : tol;
  return ops.filter(function (o) {
    return Math.abs(o.color[0] - rgb[0]) <= tol &&
           Math.abs(o.color[1] - rgb[1]) <= tol &&
           Math.abs(o.color[2] - rgb[2]) <= tol;
  });
}

// ---------------------------------------------------------------- driving the core

function call(sb, name) {
  return callArgs(sb, name, Array.prototype.slice.call(arguments, 2));
}

function callArgs(sb, name, argArray) {
  return vm.runInContext(name, sb).apply(null, argArray);
}

// evaluate an expression inside the sandbox (reach the core's own globals)
function evalIn(sb, expr) {
  return vm.runInContext(expr, sb);
}

function hasHandler(sb, name) {
  try { return vm.runInContext("typeof " + name, sb) === "function"; }
  catch (e) { return false; }
}

// n clock steps: bang the core, then let stepMs of fake time pass
function tick(sb, n, stepMs) {
  stepMs = stepMs || 125;
  for (var i = 0; i < n; i++) {
    call(sb, "bang");
    sb.__state.advance(stepMs);
  }
}

// ---------------------------------------------------------------- reading outlets

function collect(sb, outletIdx, selector) {
  return sb.__state.out[outletIdx].filter(function (m) { return m[0] === selector; });
}

// same as collect(), but pairs each message with the fake-clock time it fired
function collectTimed(sb, outletIdx, selector) {
  var out = [];
  sb.__state.out[outletIdx].forEach(function (m, i) {
    if (m[0] === selector) out.push({ msg: m, t: sb.__state.outT[outletIdx][i] });
  });
  return out;
}

// the most recent "<selector> ..." message on an outlet, or throws
function last(sb, outletIdx, selector) {
  var m = collect(sb, outletIdx, selector);
  if (!m.length) throw new Error("no " + selector + " message emitted on outlet " + outletIdx);
  return m[m.length - 1];
}

// every distinct selector the core has emitted, across all outlets
// Every selector the core has put on an outlet, or — given one — on that outlet
// alone. The distinction matters wherever a test speaks for a single stream: a
// display is wired to one outlet and answers for what comes out of it, so a
// check about that outlet must not be able to pass on another one's traffic.
function emittedSelectors(sb, outletIdx) {
  var seen = {};
  sb.__state.out.forEach(function (msgs, idx) {
    if (outletIdx !== undefined && idx !== outletIdx) return;
    msgs.forEach(function (m) { if (typeof m[0] === "string") seen[m[0]] = true; });
  });
  return Object.keys(seen);
}

// ---------------------------------------------------------------- the built patch

function readPatch(patchPath) {
  if (!fs.existsSync(patchPath)) throw new Error("device not built: " + patchPath);
  return JSON.parse(fs.readFileSync(patchPath, "utf8")).patcher;
}

// every selector some [route ...] in the patch is listening for
function routedSelectors(patcher) {
  var routed = {}, count = 0;
  patcher.boxes.forEach(function (b) {
    var t = b.box.text;
    if (!t || t.indexOf("route ") !== 0) return;
    count++;
    t.split(/\s+/).slice(1).forEach(function (sel) { routed[sel] = true; });
  });
  return { selectors: Object.keys(routed), routes: count };
}

// Does everything this box's output eventually reaches within its own patcher
// turn out to be window plumbing? [pcontrol] opens a window, [thispatcher]
// closes one; a button wired only into those is a page tab, not a musical
// control, whatever its caption reads. Following the cords rather than keeping
// a list of captions is what stops the check rotting when a page gets renamed.
var PLUMBING = { pcontrol: 1, thispatcher: 1 };

function onlyPlumbing(pat, id) {
  var byId = {}, seen = {}, queue = [id], reached = 0;
  pat.boxes.forEach(function (b) { byId[b.box.id] = b.box; });
  while (queue.length) {
    var from = queue.shift();
    if (seen[from]) continue;
    seen[from] = 1;
    (pat.lines || []).forEach(function (l) {
      if (l.patchline.source[0] !== from) return;
      var dst = byId[l.patchline.destination[0]];
      if (!dst) return;
      if (dst.maxclass === "message") { queue.push(dst.id); return; }
      reached++;
      if (!PLUMBING[String(dst.text || "").split(/\s+/)[0]]) reached = -Infinity;
    });
  }
  return reached > 0;
}

// every message a presentation control sends the core: [prepend <msg>] shims
// (dials, menus, toggles) as {name, value}, message-box buttons as {name}.
// `ignore` lists prepend selectors that are plumbing, not controls; buttons
// that only drive [pcontrol]/[thispatcher] drop out on their own wiring.
// Recurses into embedded subpatchers (e.g. a floating sound-design window, and
// the compose page nested inside it) — Max and Live discover live.* controls
// the same way, regardless of nesting depth.
function patchControls(patcher, ignore) {
  ignore = ignore || ["set", "Restore", "pos"];
  var msgs = [], seen = {};
  function walk(pat) {
    pat.boxes.forEach(function (b) {
      var t = b.box.text;
      if (t) {
        if (t.indexOf("prepend ") === 0) {
          var m = t.split(/\s+/)[1];
          if (ignore.indexOf(m) < 0 && !seen[m]) { seen[m] = 1; msgs.push({ name: m, value: 0.5 }); }
        } else if (b.box.maxclass === "message" && b.box.presentation === 1 &&
                   /^[A-Z][A-Za-z]+$/.test(t) && ignore.indexOf(t) < 0 && !seen[t] &&
                   !onlyPlumbing(pat, b.box.id)) {
          seen[t] = 1; msgs.push({ name: t });
        }
      }
      if (b.box.patcher) walk(b.box.patcher);
    });
  }
  walk(patcher);
  return msgs;
}

// Every message name a [jsui] in the patch answers to. Max treats a top-level
// function as a message handler unless the script marks it `f.local = 1`, so
// the same rule decides it here — which makes a jsui's handlers count as
// consumers of the core's selectors, exactly like a [route] does. `dir` is
// where the box's filename resolves from (the device folder); a jsui pointing
// at a script that isn't there is a build error, so it throws.
function jsuiHandlers(patcher, dir) {
  var names = {};
  jsuiBoxes(patcher).forEach(function (j) {
    if (!j.filename) return;
    jsHandlers(scriptPath(dir, j.filename)).forEach(function (n) { names[n] = true; });
  });
  return Object.keys(names);
}

// The message names one script answers to, on its own. Same rule as above: a
// top-level function is a handler unless the script marks it `f.local = 1`.
function jsHandlers(srcPath) {
  if (!fs.existsSync(srcPath)) throw new Error("js script missing: " + srcPath);
  var src = fs.readFileSync(srcPath, "utf8");
  var names = [], local = {}, m, re = /^\s*([A-Za-z_$][\w$]*)\.local\s*=\s*1/gm;
  while ((m = re.exec(src))) local[m[1]] = true;
  re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((m = re.exec(src))) if (!local[m[1]]) names.push(m[1]);
  return names;
}

function scriptPath(dir, filename) {
  return dir ? dir.replace(/\/$/, "") + "/" + filename : filename;
}

// The globals a Max js or jsui script is born with that are *callable*. This is
// the sharp edge behind anything(): Max dispatches an incoming selector by
// looking the name up among the script's globals, so a selector that matches
// one of these is not an unhandled message at all — it runs Max's own function
// and never reaches anything(). Sending `post 1.4` prints 1.4 to the Max
// window; `outlet 1 2` would fire a real outlet. A script fed a stream it does
// not fully route has to claim every name on this list that the stream can
// carry, and a test is the only thing that notices when the stream grows one.
//
// Only the callable ones are listed. Names Max calls *on* a script — bang,
// list, msg_int, msg_float, anything, loadbang, paint, getvalueof — are not
// globals it inherits, so they collide with nothing.
var MAX_JS_GLOBALS = [
  // Max's own
  "post", "error", "cpost", "messnamed", "sendnamed", "arrayfromargs", "outlet",
  "notifyclients", "setinletassist", "setoutletassist", "declareattribute",
  "embedmessage", "include",
  // Max's constructors
  "Task", "File", "Folder", "Dict", "Buffer", "Global", "LiveAPI", "Patcher",
  "Maxobj", "MaxobjListener", "SQLite", "Image", "Wind", "Sketch", "MGraphics",
  // and the ECMAScript ones, which are globals here like anywhere else
  "Object", "Array", "String", "Number", "Boolean", "Function", "Date", "RegExp",
  "Error", "Math", "JSON", "eval", "parseInt", "parseFloat", "isNaN", "isFinite",
  "escape", "unescape", "encodeURI", "decodeURI", "encodeURIComponent",
  "decodeURIComponent"
];

// Every [jsui] box in the patch, subpatchers included: its script, its creation
// arguments, its presentation rect and the patcher it sits in — so a test can
// ask where a display ended up and how it was configured, not just that one
// exists somewhere.
function jsuiBoxes(patcher) {
  var found = [];
  function walk(pat, where) {
    pat.boxes.forEach(function (b) {
      if (b.box.maxclass === "jsui") {
        found.push({ varname: b.box.varname, filename: b.box.filename,
                     args: b.box.jsarguments || [], id: b.box.id,
                     rect: b.box.presentation_rect || b.box.patching_rect,
                     patcher: pat, where: where });
      }
      if (b.box.patcher) walk(b.box.patcher, b.box.varname || b.box.id);
    });
  }
  walk(patcher, "");
  return found;
}

// What feeds a box's inlets. A built patch identifies boxes by id and by what
// they are — the builder's own key for a box is not written out unless it also
// needs a Max scripting name — so this takes an id (jsuiBoxes and the patcher's
// own boxes both carry one) and describes each source the same way:
// [{id, maxclass, text, filename, outlet, inlet}].
function feeders(patcher, boxId) {
  var byId = {}, found = false;
  patcher.boxes.forEach(function (b) {
    byId[b.box.id] = b.box;
    if (b.box.id === boxId || b.box.varname === boxId) { found = b.box.id; }
  });
  if (found === false) throw new Error("no box " + boxId + " in this patcher");
  return (patcher.lines || []).filter(function (l) {
    return l.patchline.destination[0] === found;
  }).map(function (l) {
    var src = byId[l.patchline.source[0]] || {};
    return { id: l.patchline.source[0], maxclass: src.maxclass,
             text: src.text, filename: src.filename,
             outlet: l.patchline.source[1], inlet: l.patchline.destination[1] };
  });
}

// ---------------------------------------------------------------- a minimal runner

function runner(title) {
  var failures = 0, passed = 0;
  if (title) console.log(title + "\n");
  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log("  ok  " + name);
    } catch (e) {
      failures++;
      console.log("FAIL  " + name + "\n      " + (e && e.message ? e.message : e));
    }
  }
  function assert(cond, msg) { if (!cond) throw new Error(msg); }
  function finish() {
    console.log("\n" + passed + " passed, " + failures + " failed");
    process.exit(failures ? 1 : 0);
  }
  return { test: test, assert: assert, finish: finish };
}

module.exports = {
  loadCore: loadCore, loadJsui: loadJsui, paint: paint, opsColored: opsColored,
  call: call, callArgs: callArgs, evalIn: evalIn, hasHandler: hasHandler, tick: tick,
  collect: collect, collectTimed: collectTimed, last: last, emittedSelectors: emittedSelectors,
  readPatch: readPatch, routedSelectors: routedSelectors, patchControls: patchControls,
  jsuiHandlers: jsuiHandlers, jsHandlers: jsHandlers, jsuiBoxes: jsuiBoxes,
  MAX_JS_GLOBALS: MAX_JS_GLOBALS, feeders: feeders,
  runner: runner
};
