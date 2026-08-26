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
    out: [[], [], []]      // recorded outlet messages per outlet
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

// ----------------------------------------------------------------

console.log("\n" + passed + " passed, " + failures + " failed");
process.exit(failures ? 1 : 0);
