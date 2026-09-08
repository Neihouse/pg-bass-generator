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
// sb.__state exposes {now, out, outT, advance(ms)} for tests that need them.

"use strict";
var fs = require("fs");
var vm = require("vm");

function loadCore(srcPath, opts) {
  opts = opts || {};
  var src = fs.readFileSync(srcPath, "utf8");
  var filename = srcPath.split("/").pop();
  var nOutlets = opts.outlets || 1;

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
      Math: Math, JSON: JSON, String: String, parseInt: parseInt, parseFloat: parseFloat,
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
function emittedSelectors(sb) {
  var seen = {};
  sb.__state.out.forEach(function (msgs) {
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

// every message a presentation control sends the core: [prepend <msg>] shims
// (dials, menus, toggles) as {name, value}, message-box buttons as {name}.
// `ignore` lists prepend selectors that are plumbing, not controls.
function patchControls(patcher, ignore) {
  ignore = ignore || ["set", "Restore", "pos"];
  var msgs = [], seen = {};
  patcher.boxes.forEach(function (b) {
    var t = b.box.text;
    if (!t) return;
    if (t.indexOf("prepend ") === 0) {
      var m = t.split(/\s+/)[1];
      if (ignore.indexOf(m) < 0 && !seen[m]) { seen[m] = 1; msgs.push({ name: m, value: 0.5 }); }
    } else if (b.box.maxclass === "message" && b.box.presentation === 1 &&
               /^[A-Z][A-Za-z]+$/.test(t) && !seen[t]) {
      seen[t] = 1; msgs.push({ name: t });
    }
  });
  return msgs;
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
  loadCore: loadCore,
  call: call, callArgs: callArgs, evalIn: evalIn, hasHandler: hasHandler, tick: tick,
  collect: collect, collectTimed: collectTimed, last: last, emittedSelectors: emittedSelectors,
  readPatch: readPatch, routedSelectors: routedSelectors, patchControls: patchControls,
  runner: runner
};
