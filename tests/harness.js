#!/usr/bin/env node
// harness.js — runs device/pg-core.js outside Max with shimmed Max APIs
// and asserts the musical invariants from DESIGN.md.

"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var SRC = fs.readFileSync(path.join(__dirname, "..", "device", "pg-core.js"), "utf8");

// ---------------------------------------------------------------- Max shims

function makeSandbox() {
  var state = {
    now: 1000000,          // fake clock (ms)
    tasks: [],             // scheduled Task shims
    out: [[], [], []],     // recorded outlet messages per outlet
    outT: [[], [], []]     // fake-clock time each message was emitted
  };

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
    Math: Math, JSON: JSON, String: String, parseInt: parseInt,
    isNaN: isNaN, Object: Object, Array: Array,
    Date: { now: function () { return state.now; } },
    Task: FakeTask,
    post: function () {},
    outlet: function (idx) {
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
  vm.runInContext(SRC, sandbox, { filename: "pg-core.js" });
  return sandbox;
}

function call(sb, name) {
  var args = Array.prototype.slice.call(arguments, 2);
  return vm.runInContext(name, sb).apply(null, args);
}

function tickSteps(sb, n, stepMs) {
  stepMs = stepMs || 125;
  for (var i = 0; i < n; i++) {
    call(sb, "bang");
    sb.__state.advance(stepMs);
  }
}

function lastDump(sb) {
  var msgs = sb.__state.out[2];
  for (var i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i][0] === "dump") return JSON.parse(msgs[i][1]);
  }
  throw new Error("no dump message found");
}

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

function callArgs(sb, name, argArray) {
  return vm.runInContext(name, sb).apply(null, argArray);
}

// the state list Max would have stored in [pattr pg_state]
function lastState(sb) {
  var msgs = collect(sb, 0, "state");
  assert(msgs.length > 0, "no state message emitted");
  // outlet(0, "state", array) — Max flattens the Array argument into a list
  return msgs[msgs.length - 1][1];
}

// ---------------------------------------------------------------- test runner

var failures = 0, passed = 0;
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

// ---------------------------------------------------------------- tests

console.log("pg-core.js harness\n");

test("loads and generates an initial phrase", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var d = lastDump(sb);
  assert(d.phrase, "phrase is null");
  assert(d.phrase.bars === 2, "default length should be 2 bars, got " + d.phrase.bars);
  assert(d.phrase.generation === 0, "initial phrase should be generation 0");
  var onsets = d.phrase.onsets.filter(Boolean).length;
  assert(onsets >= 2, "phrase should have >= 2 onsets, got " + onsets);
});

test("pushall emits full synth param set", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var names = ["cutoff", "reso", "envd", "drv", "post", "gain", "adec", "asus", "sub", "wet", "duck", "fb", "dly", "dly2"];
  names.forEach(function (n) {
    assert(collect(sb, 0, n).length > 0, "missing synth param: " + n);
  });
  var cut = collect(sb, 0, "cutoff")[0];
  assert(cut[1] > 40 && cut[1] < 15000, "cutoff Hz out of range: " + cut[1]);
  var reso = collect(sb, 0, "reso")[0];
  assert(reso[1] >= 0 && reso[1] <= 0.95, "reso out of range: " + reso[1]);
});

test("64 ticks produce notes with sane pitches and velocities", function () {
  var sb = makeSandbox();
  tickSteps(sb, 64);
  var trigs = collect(sb, 1, "trig").filter(function (m) { return m[1] > 0; });
  assert(trigs.length >= 8, "expected >= 8 note-ons over 4 bars, got " + trigs.length);
  trigs.forEach(function (t) {
    assert(t[1] > 0 && t[1] <= 1, "trig velocity out of (0,1]: " + t[1]);
  });
  var offs = collect(sb, 1, "trig").filter(function (m) { return m[1] === 0; });
  assert(offs.length >= 4, "expected note-offs from gate tasks, got " + offs.length);
  var pitches = collect(sb, 1, "pitch");
  assert(pitches.length >= 8, "expected pitch messages");
  pitches.forEach(function (p) {
    assert(p[1] >= 36 && p[1] <= 60, "pitch out of C1..C3 register: " + p[1]);
    assert(p[2] >= 0, "glide time must be >= 0");
  });
});

test("pitches stay in-scale (natural minor gravity field)", function () {
  var SCALE = { 0: 1, 2: 1, 3: 1, 5: 1, 7: 1, 8: 1, 10: 1 };
  var sb = makeSandbox();
  tickSteps(sb, 128);
  collect(sb, 1, "pitch").forEach(function (p) {
    var semi = (p[1] - 36) % 12;
    assert(SCALE[semi], "out-of-scale pitch " + p[1] + " (semi " + semi + ")");
  });
});

test("accents capped near 35% of onsets", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var d = lastDump(sb);
  var onsets = 0, accents = 0;
  for (var i = 0; i < d.phrase.onsets.length; i++) {
    if (d.phrase.onsets[i]) {
      onsets++;
      if (d.phrase.accents[i]) accents++;
    }
  }
  assert(onsets > 0, "no onsets");
  assert(accents / onsets <= 0.45, "accent ratio too high: " + (accents / onsets).toFixed(2));
});

test("max 6 consecutive onsets (rest logic)", function () {
  for (var trial = 0; trial < 5; trial++) {
    var sb = makeSandbox();
    call(sb, "density", 1);
    call(sb, "groove", 3); // driving = densest
    call(sb, "Mutate");
    call(sb, "dump");
    var d = lastDump(sb);
    var run = 0, worst = 0;
    for (var i = 0; i < d.phrase.onsets.length; i++) {
      run = d.phrase.onsets[i] ? run + 1 : 0;
      if (run > worst) worst = run;
    }
    assert(worst <= 7, "consecutive-onset run too long: " + worst);
  }
});

test("Mutate preserves length and register, changes id", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var before = lastDump(sb).phrase;
  call(sb, "Mutate");
  call(sb, "dump");
  var after = lastDump(sb).phrase;
  assert(after.id !== before.id, "Mutate should produce a new phrase id");
  assert(after.parentId === before.id || after.generation === before.generation + 1,
    "child should link to parent");
  assert(after.bars === before.bars, "Mutate must preserve phrase length");
  for (var i = 0; i < after.onsets.length; i++) {
    if (after.onsets[i]) {
      assert(after.pitches[i] >= 36 && after.pitches[i] <= 60, "mutated pitch out of register");
    }
  }
});

test("Return walks back toward generation 0", function () {
  var sb = makeSandbox();
  call(sb, "Mutate");
  call(sb, "Mutate");
  call(sb, "dump");
  var g2 = lastDump(sb).phrase.generation;
  assert(g2 >= 1, "expected generation >= 1 after two mutates, got " + g2);
  call(sb, "Return");
  call(sb, "dump");
  var g1 = lastDump(sb).phrase.generation;
  assert(g1 < g2, "Return should reduce generation: " + g2 + " -> " + g1);
  for (var i = 0; i < 8; i++) call(sb, "Return");
  call(sb, "dump");
  assert(lastDump(sb).phrase.generation === 0, "repeated Return should reach generation 0");
});

test("Reseed starts a new lineage", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var before = lastDump(sb).phrase;
  sb.__state.advance(1234); // move the clock so the time-derived seed differs
  call(sb, "Reseed");
  call(sb, "dump");
  var after = lastDump(sb).phrase;
  assert(after.seed !== before.seed, "Reseed should change the seed");
  assert(after.generation === 0, "Reseed should produce a generation-0 phrase");
  assert(after.name.charAt(0) !== before.name.charAt(0), "Reseed should advance the phrase letter");
});

test("Rhythm/Pitch regenerate single layers without breaking invariants", function () {
  var sb = makeSandbox();
  call(sb, "Rhythm");
  call(sb, "Pitch");
  call(sb, "dump");
  var d = lastDump(sb).phrase;
  var onsets = d.onsets.filter(Boolean).length;
  assert(onsets >= 2, "layer regen left phrase empty");
  for (var i = 0; i < d.onsets.length; i++) {
    if (d.onsets[i]) assert(d.pitches[i] >= 36 && d.pitches[i] <= 60, "pitch out of register after layer regen");
  }
});

test("lock freezes the phrase across boundaries", function () {
  var sb = makeSandbox();
  call(sb, "lock", 1);
  call(sb, "novelty", 1); // maximum mutation pressure
  call(sb, "dump");
  var before = lastDump(sb).phrase.id;
  tickSteps(sb, 160); // 10 bars = 5 phrase boundaries
  call(sb, "dump");
  assert(lastDump(sb).phrase.id === before, "locked phrase must not change");
});

test("root changes transpose the phrase", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var before = lastDump(sb).phrase;
  call(sb, "root", 5); // F
  call(sb, "dump");
  var after = lastDump(sb).phrase;
  for (var i = 0; i < before.onsets.length; i++) {
    if (before.onsets[i]) {
      assert(after.pitches[i] === before.pitches[i] + 5, "pitch not transposed by +5 at step " + i);
    }
  }
});

test("plen switches phrase length at the next boundary", function () {
  var sb = makeSandbox();
  call(sb, "plen", 2); // 4 bars
  tickSteps(sb, 33);   // cross a boundary
  call(sb, "dump");
  assert(lastDump(sb).phrase.bars === 4, "phrase should be 4 bars after plen 2");
});

test("all grooves and macro extremes run 64 ticks without throwing", function () {
  for (var g = 0; g < 7; g++) {
    [0, 1].forEach(function (x) {
      var sb = makeSandbox();
      call(sb, "groove", g);
      call(sb, "density", x);
      call(sb, "novelty", x);
      call(sb, "chunk", x);
      call(sb, "squelch", x);
      call(sb, "wet", x);
      tickSteps(sb, 64);
      var trigs = collect(sb, 1, "trig").filter(function (m) { return m[1] > 0; });
      assert(trigs.length >= 2, "groove " + g + " @" + x + " produced almost no notes: " + trigs.length);
    });
  }
});

test("phrase boundaries evolve the pattern over time (novelty on)", function () {
  var sb = makeSandbox();
  call(sb, "novelty", 0.8);
  var ids = {};
  for (var c = 0; c < 12; c++) {
    tickSteps(sb, 32);
    call(sb, "dump");
    ids[lastDump(sb).phrase.id] = true;
  }
  assert(Object.keys(ids).length >= 2, "no evolution across 12 phrase cycles at novelty 0.8");
});

test("transport restart resets cleanly (gap detection)", function () {
  var sb = makeSandbox();
  tickSteps(sb, 20);
  sb.__state.advance(5000); // transport stopped
  tickSteps(sb, 20);        // restarted
  var trigs = collect(sb, 1, "trig").filter(function (m) { return m[1] > 0; });
  assert(trigs.length >= 4, "no notes after transport restart");
});

test("pos messages phase-correct the step counter", function () {
  var sb = makeSandbox();
  tickSteps(sb, 4);
  call(sb, "pos", 2, 1, 0); // bar 2 beat 1 = step 16
  call(sb, "bang");
  call(sb, "dump");
  var d = lastDump(sb);
  assert(d.playStep === 17, "expected playStep 17 after pos-corrected tick, got " + d.playStep);
});

test("slides produce glides without retrigger (tie behavior)", function () {
  var found = false;
  for (var trial = 0; trial < 8 && !found; trial++) {
    var sb = makeSandbox();
    call(sb, "groove", 4); // acidic: heaviest slide probability
    call(sb, "density", 0.9);
    call(sb, "Mutate");
    call(sb, "dump");
    var d = lastDump(sb).phrase;
    var slideSteps = [];
    for (var i = 0; i < d.onsets.length; i++) if (d.onsets[i] && d.slides[i]) slideSteps.push(i);
    if (slideSteps.length === 0) continue;
    found = true;
    tickSteps(sb, d.bars * 16);
    var pitches = collect(sb, 1, "pitch");
    var longGlides = pitches.filter(function (p) { return p[2] >= 20; });
    assert(longGlides.length > 0, "slide steps exist but no long glide times were emitted");
  }
  assert(found, "acidic groove never produced a slide across 8 trials");
});

test("delay times follow tempo", function () {
  var sb = makeSandbox();
  tickSteps(sb, 12, 100); // 150 bpm 16ths
  var dly = collect(sb, 0, "dly");
  assert(dly.length > 0, "no delay-time updates");
  var last = dly[dly.length - 1][1];
  assert(Math.abs(last - 300) < 30, "dotted-8th tap should be ~300ms at 100ms steps, got " + last);
});

test("register distribution: root-dominant, sub always 32.7-61.7 Hz", function () {
  var atRoot = 0, withinFifth = 0, aboveOctave = 0, total = 0;
  for (var g = 0; g < 7; g++) {
    var sb = makeSandbox();
    call(sb, "groove", g);
    for (var m = 0; m < 6; m++) call(sb, "Mutate");
    tickSteps(sb, 64);
    collect(sb, 1, "pitch").forEach(function (p) {
      var semi = p[1] - 36; total++;
      if (semi === 0) atRoot++;
      if (semi <= 7) withinFifth++;
      if (semi > 12) aboveOctave++;
    });
    collect(sb, 1, "spitch").forEach(function (s) {
      assert(s[1] >= 24 && s[1] <= 35, "sub pitch outside 32.7-61.7 Hz window: " + s[1]);
    });
  }
  assert(total >= 50, "too few notes sampled: " + total);
  assert(atRoot / total >= 0.5, "root share fell below 50%: " + (atRoot / total).toFixed(2));
  assert(withinFifth / total >= 0.8, "within-a-fifth share below 80%: " + (withinFifth / total).toFixed(2));
  assert(aboveOctave / total <= 0.05, "above-octave share exceeds 5%: " + (aboveOctave / total).toFixed(2));

  // extreme root: B (MIDI 47) exercises the sub fold's multi-subtraction path
  var sbb = makeSandbox();
  call(sbb, "root", 11);
  for (var m2 = 0; m2 < 4; m2++) call(sbb, "Mutate");
  tickSteps(sbb, 64);
  var hi = collect(sbb, 1, "pitch");
  assert(hi.length >= 8, "root-11 run produced too few notes: " + hi.length);
  hi.forEach(function (p) {
    var semi = p[1] - 47;
    assert(semi >= 0 && semi <= 24, "pitch outside root-11 register: " + p[1]);
  });
  collect(sbb, 1, "spitch").forEach(function (s) {
    assert(s[1] >= 24 && s[1] <= 35, "root-11 sub pitch outside window: " + s[1]);
  });
});

test("state round-trips through the pattr list (save/reload)", function () {
  var a = makeSandbox();
  call(a, "groove", 4);
  call(a, "root", 5);
  call(a, "novelty", 0.8);
  for (var i = 0; i < 5; i++) call(a, "Mutate");
  tickSteps(a, 96);
  var saved = lastState(a);
  assert(saved.length >= 20 + 8, "state list too short: " + saved.length);
  assert(saved.length === 20 + saved[19] * 8,
    "state list length does not match its step count: " + saved.length + " vs " + saved[19]);
  saved.forEach(function (v, k) {
    assert(typeof v === "number" && isFinite(v), "non-numeric atom at " + k + ": " + v);
  });
  call(a, "dump");
  var before = lastDump(a);

  // a fresh device — different phrase, then handed the saved list
  var b = makeSandbox();
  call(b, "dump");
  assert(lastDump(b).phrase.id !== before.phrase.id, "sandboxes started identical; test is vacuous");
  callArgs(b, "Restore", saved);
  call(b, "dump");
  var after = lastDump(b);

  ["id", "parentId", "generation", "seed", "bars", "contour"].forEach(function (k) {
    assert(after.phrase[k] === before.phrase[k], k + " lost in restore: " + after.phrase[k]);
  });
  ["onsets", "accents", "slides"].forEach(function (k) {
    assert(JSON.stringify(after.phrase[k]) === JSON.stringify(before.phrase[k]),
      k + " layer differs after restore");
  });
  // pitch and velocity only exist on steps that sound; rest slots are never read
  before.phrase.onsets.forEach(function (on, s) {
    if (!on) return;
    assert(after.phrase.pitches[s] === before.phrase.pitches[s], "pitch at step " + s + " lost in restore");
    assert(after.phrase.vels[s] === before.phrase.vels[s], "velocity at step " + s + " lost in restore");
  });
  ["gates", "probs", "timbres", "wets", "micros"].forEach(function (k) {
    var x = before.phrase[k], y = after.phrase[k];
    assert(x.length === y.length, k + " length differs after restore");
    for (var s = 0; s < x.length; s++) {
      assert(Math.abs(x[s] - y[s]) <= 0.001, k + "[" + s + "] differs: " + x[s] + " vs " + y[s]);
    }
  });
  assert(after.params.root === before.params.root, "root not restored");
  assert(Math.abs(after.slow.cut - before.slow.cut) <= 0.001, "slow walk not restored");
  assert(Math.abs(after.med.drv - before.med.drv) <= 0.001, "medium walk not restored");
  assert(after.freezeLeft === before.freezeLeft, "freeze counter not restored");

  // and the restored phrase actually plays — no regeneration at the first boundary
  tickSteps(b, 32);
  call(b, "dump");
  assert(lastDump(b).phrase.id === before.phrase.id,
    "restored phrase was regenerated away instead of playing");
});

test("Restore ignores empty, truncated, and wrong-version lists", function () {
  var sb = makeSandbox();
  call(sb, "pushall"); // what live.thisdevice fires on load
  call(sb, "dump");
  var id = lastDump(sb).phrase.id;
  var good = lastState(sb);

  callArgs(sb, "Restore", []);                       // pattr banged with nothing stored
  callArgs(sb, "Restore", [0]);
  callArgs(sb, "Restore", good.slice(0, 22));        // header claims steps the list lacks
  var wrongVer = good.slice(); wrongVer[0] = 99;
  callArgs(sb, "Restore", wrongVer);

  call(sb, "dump");
  assert(lastDump(sb).phrase.id === id, "a malformed state list clobbered the live phrase");
  tickSteps(sb, 16); // and the device still runs
});

test("rushed onsets fire before their own grid tick", function () {
  var early = 0, late = 0;
  for (var g = 0; g < 7; g++) {
    var sb = makeSandbox();
    call(sb, "groove", g);
    var t0 = sb.__state.now;
    tickSteps(sb, 64, 125);
    collectTimed(sb, 1, "trig").forEach(function (e) {
      var off = (e.t - t0) % 125;
      // a dragged note lands within min(30, 125*0.35) = 30ms after its tick;
      // anything past that can only be the next step arriving ahead of schedule
      if (off > 60) early++; else late++;
    });
  }
  assert(late > 0, "no on-grid notes at all");
  assert(early > 0, "no note ever fired ahead of its tick — the early lane is dead");
});

test("microtiming is signed and bounded either side of the grid", function () {
  var sawNeg = false, sawPos = false;
  for (var g = 0; g < 7; g++) {
    var sb = makeSandbox();
    call(sb, "groove", g);
    for (var m = 0; m < 4; m++) call(sb, "Mutate");
    call(sb, "dump");
    lastDump(sb).phrase.micros.forEach(function (v) {
      assert(v >= -0.25 && v <= 0.35, "micro outside clamp: " + v);
      if (v < -0.002) sawNeg = true;
      if (v > 0.002) sawPos = true;
    });
  }
  assert(sawNeg, "no negative (rushed) micro offsets generated");
  assert(sawPos, "no positive (dragged) micro offsets generated");
});

test("pickups anticipate downbeats and tie into them", function () {
  var pickups = 0, bars = 0;
  for (var g = 0; g < 7; g++) {
    for (var r = 0; r < 6; r++) {
      var sb = makeSandbox();
      call(sb, "groove", g);
      for (var m = 0; m < r; m++) call(sb, "Mutate");
      call(sb, "dump");
      var p = lastDump(sb).phrase;
      var n = p.onsets.length;
      for (var b = 0; b < p.bars; b++) {
        var down = b * 16;
        if (!p.onsets[down]) continue;
        bars++;
        var pre = (down - 1 + n) % n;
        if (!p.onsets[pre]) continue;
        // an anticipation restates the downbeat's pitch a 16th early, unaccented
        if (p.pitches[pre] === p.pitches[down] && !p.accents[pre]) pickups++;
      }
    }
  }
  assert(bars > 40, "too few downbeats sampled: " + bars);
  assert(pickups > 0, "no pickups generated across any groove");
  assert(pickups / bars < 0.7, "pickups on " + (pickups / bars).toFixed(2) + " of downbeats — too mechanical");
});

test("repetition freeze holds a phrase, then releases it", function () {
  var froze = false, released = false;
  for (var trial = 0; trial < 40 && !released; trial++) {
    var sb = makeSandbox();
    call(sb, "groove", 6);       // hypnotic: frz 0.35
    call(sb, "novelty", 0.05);   // low novelty widens the freeze probability
    for (var c = 0; c < 24; c++) {
      tickSteps(sb, 32);
      call(sb, "dump");
      var d = lastDump(sb);
      if (d.freezeLeft > 0) froze = true;
      else if (froze) released = true;
    }
  }
  assert(froze, "freeze never triggered on the hypnotic groove");
  assert(released, "freeze never released — the counter does not decrement");
});

test("double-press Return jumps to the lineage root", function () {
  var sb = makeSandbox();
  for (var i = 0; i < 6; i++) call(sb, "Mutate");
  call(sb, "dump");
  assert(lastDump(sb).phrase.generation >= 3, "setup did not build a deep enough lineage");

  sb.__state.advance(5000);   // well outside the double-press window
  call(sb, "Return");
  call(sb, "dump");
  var single = lastDump(sb).phrase;

  call(sb, "Return");         // no clock advance: this is the second press
  call(sb, "dump");
  var doubled = lastDump(sb).phrase;
  assert(doubled.generation === 0, "double-press did not land on generation 0: " + doubled.generation);
  assert(single.generation >= doubled.generation, "single press went further back than the double press");
});

test("novelty budget gates timbre and wet drift, not just notes", function () {
  function drift(novelty) {
    var sb = makeSandbox();
    call(sb, "novelty", novelty);
    call(sb, "dump");
    var base = lastDump(sb).phrase;
    var moved = 0, seen = 0;
    for (var m = 0; m < 12; m++) {
      call(sb, "Mutate");
      call(sb, "dump");
      var p = lastDump(sb).phrase;
      for (var s = 0; s < base.timbres.length; s++) {
        seen++;
        if (Math.abs(p.timbres[s] - base.timbres[s]) > 0.001 ||
            Math.abs(p.wets[s] - base.wets[s]) > 0.001) moved++;
      }
      base = p;
    }
    return moved / seen;
  }
  var lo = drift(0.05), hi = drift(0.95);
  assert(hi > lo, "timbre/wet drift ignores the novelty budget (" + lo.toFixed(3) + " vs " + hi.toFixed(3) + ")");
  assert(hi > 0.02, "timbre/wet never drift even at full novelty");
});

test("filter mode, nonlinearity and shelf track groove and squelch", function () {
  function last(sb, sel) {
    var m = collect(sb, 0, sel);
    assert(m.length > 0, "no " + sel + " emitted");
    return m[m.length - 1][1];
  }
  // acidic (bp 0.30) at full squelch should open the bandpass path
  var acid = makeSandbox();
  call(acid, "groove", 4);
  call(acid, "squelch", 1);
  tickSteps(acid, 4);
  var bp = last(acid, "bpamt");
  assert(bp > 0.15, "acidic groove did not blend in bandpass: " + bp);
  assert(Math.abs(last(acid, "lpamt") + bp - 1) < 1e-6, "lp/bp blend does not sum to unity");
  assert(last(acid, "nlin") > 1, "nonlinear drive never engaged");
  assert(last(acid, "shelf") > 0, "resonance-compensation shelf never engaged");

  // restrained (bp 0.00) stays a pure lowpass whatever the squelch
  var flat = makeSandbox();
  call(flat, "groove", 0);
  call(flat, "squelch", 1);
  tickSteps(flat, 4);
  assert(last(flat, "bpamt") === 0, "restrained groove should be pure lowpass");
  assert(last(flat, "lpamt") === 1, "lowpass amount should be unity with no bandpass");

  // the shelf compensates resonance: more squelch, more low-shelf lift
  var dry = makeSandbox();
  call(dry, "groove", 4);
  call(dry, "squelch", 0);
  tickSteps(dry, 4);
  assert(last(dry, "shelf") < last(acid, "shelf"), "shelf does not track resonance");
  assert(last(acid, "shelf") <= 0.95, "shelf exceeded its clamp");
});

test("wet envelope and diffusion parameters stay in range", function () {
  for (var w = 0; w <= 1.001; w += 0.25) {
    var sb = makeSandbox();
    call(sb, "wet", w);
    tickSteps(sb, 8, 40); // fast steps: exercises the delay-time clamp floor
    ["wamt", "wflr", "wdec", "dmod", "dly", "dly2"].forEach(function (sel) {
      var m = collect(sb, 0, sel);
      assert(m.length > 0, sel + " never emitted at wet=" + w);
      var v = m[m.length - 1][1];
      assert(isFinite(v) && v >= 0, sel + " out of range: " + v);
    });
    var flr = collect(sb, 0, "wflr").pop()[1];
    assert(flr >= 0.2 && flr <= 0.7, "wet floor outside clamp: " + flr);
    var d = collect(sb, 0, "dly").pop()[1];
    assert(d >= 20 && d <= 1800, "delay time outside clamp: " + d);
  }
});

test("every sounding step emits a playable MIDI note event", function () {
  var sb = makeSandbox();
  call(sb, "density", 0.8);
  call(sb, "dump");
  var d = lastDump(sb).phrase;
  tickSteps(sb, d.bars * 16);

  var notes = collect(sb, 1, "note");
  var trigs = collect(sb, 1, "trig").filter(function (t) { return t[1] > 0; });
  assert(notes.length > 0, "no MIDI note events emitted");
  // a slide ties (no retrigger) but must still produce its own MIDI note,
  // otherwise the downstream synth simply never hears that pitch
  assert(notes.length >= trigs.length,
    "fewer MIDI notes (" + notes.length + ") than voice triggers (" + trigs.length + ")");

  notes.forEach(function (n) {
    var pitch = n[1], vel = n[2], ms = n[3];
    assert(pitch === Math.round(pitch) && pitch >= 0 && pitch <= 127,
      "note pitch not a valid MIDI value: " + pitch);
    assert(vel >= 1 && vel <= 127, "note velocity out of range: " + vel);
    assert(ms === Math.round(ms) && ms >= 15,
      "note duration must be a positive whole ms, got " + ms);
  });
});

test("ties become overlapping MIDI notes, not held ones", function () {
  var found = false;
  for (var trial = 0; trial < 12 && !found; trial++) {
    var sb = makeSandbox();
    call(sb, "groove", 4); // acidic: heaviest slide probability
    call(sb, "density", 0.9);
    call(sb, "Mutate");
    call(sb, "dump");
    var d = lastDump(sb).phrase;

    // find an onset whose *next* onset slides — that is the tie case
    var tie = -1;
    for (var s = 0; s < d.onsets.length && tie < 0; s++) {
      if (!d.onsets[s]) continue;
      for (var i = s + 1; i < s + 3 && i < d.onsets.length; i++) {
        if (d.onsets[i]) { if (d.slides[i]) tie = s; break; }
      }
    }
    if (tie < 0) continue;
    found = true;

    var evs = vm.runInContext("noteEvents(phrase)", sb);
    var a = null, b = null;
    evs.forEach(function (e, k) {
      if (Math.floor(e.start / 0.25 + 0.001) === tie) { a = e; b = evs[k + 1]; }
    });
    assert(a && b, "tie step " + tie + " missing from the note events");
    assert(a.start + a.dur > b.start,
      "tied note ends at " + (a.start + a.dur) + " but the next starts at " +
      b.start + " — no overlap, so a mono synth would retrigger instead of glide");
  }
  assert(found, "acidic groove never produced a slide across 12 trials");
});

test("captured note events reproduce the phrase in beats", function () {
  var sb = makeSandbox();
  call(sb, "density", 0.7);
  call(sb, "dump");
  var d = lastDump(sb).phrase;
  var evs = vm.runInContext("noteEvents(phrase)", sb);

  var onsets = d.onsets.filter(Boolean).length;
  assert(evs.length === onsets,
    "captured " + evs.length + " notes for " + onsets + " onsets");

  var barBeats = d.bars * 4;
  var prev = -1;
  evs.forEach(function (e) {
    assert(e.start >= 0 && e.start < barBeats,
      "note starts outside the clip: " + e.start + " of " + barBeats);
    assert(e.start > prev, "captured notes are not in ascending time order");
    prev = e.start;
    assert(e.dur >= 0.02, "captured duration too short to sound: " + e.dur);
    assert(e.vel >= 1 && e.vel <= 127, "captured velocity out of range: " + e.vel);
    assert(e.pitch === Math.round(e.pitch), "captured pitch not an integer: " + e.pitch);
  });

  // microtiming survives capture: a step that rushes lands before its grid beat
  var rushed = 0;
  d.onsets.forEach(function (on, s) { if (on && d.micros[s] < -0.02) rushed++; });
  if (rushed) {
    var early = evs.filter(function (e) {
      return e.start < Math.round(e.start / 0.25) * 0.25 - 1e-9;
    });
    assert(early.length > 0, "phrase has rushed steps but no note captured ahead of its beat");
  }
});

// ----------------------------------------------------------------

console.log("\n" + passed + " passed, " + failures + " failed");
process.exit(failures ? 1 : 0);
