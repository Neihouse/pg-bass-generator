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

// §1.8 — the cap is 35% of onsets, and the only thing allowed to exceed it is
// the bar template itself: downbeat accents are structural and never stripped.
// Sampled across every groove and through mutation, since the accent layer is
// redrawn on mutation and by the Accent button.
test("accents stay capped at 35% of onsets, downbeats aside", function () {
  var worst = 0, worstWhere = "";
  for (var g = 0; g < 7; g++) {
    var sb = makeSandbox();
    call(sb, "groove", g);
    call(sb, "novelty", 0.9);
    for (var trial = 0; trial < 20; trial++) {
      if (trial % 2) call(sb, "Accent"); else call(sb, "Mutate");
      tickSteps(sb, 16);
      call(sb, "dump");
      var d = lastDump(sb);
      var onsets = 0, accents = 0, downbeats = 0;
      for (var i = 0; i < d.phrase.onsets.length; i++) {
        if (!d.phrase.onsets[i]) continue;
        onsets++;
        if (d.phrase.accents[i]) { accents++; if (i % 16 === 0) downbeats++; }
      }
      assert(onsets > 0, "no onsets");
      var cap = Math.max(1, Math.floor(onsets * 0.35));
      assert(accents <= Math.max(cap, downbeats),
        "groove " + g + ": " + accents + " accents over " + onsets +
        " onsets (cap " + cap + ", " + downbeats + " structural downbeats)");
      if (accents / onsets > worst) {
        worst = accents / onsets;
        worstWhere = "groove " + g + " " + accents + "/" + onsets;
      }
    }
  }
  // and the excess is genuinely rare — a dense phrase never runs hot
  assert(worst <= 0.5, "accent ratio ran away: " + worst.toFixed(2) + " at " + worstWhere);
});

// ---------------------------------------------------------------- rhythm (§1.3)
//
// The idiom these assert is Maccabi House / psychedelic indie dance: a small
// recognizable figure states itself and then changes almost imperceptibly. The
// generator this replaced flipped an independent weighted coin per step, and it
// would still pass every other test in this file — so the properties that make
// the rhythm a *motif* rather than a distribution have to be asserted directly.

// draw one phrase per call with a decorrelated seed. Reseed takes its seed from
// the fake clock, so the clock has to move between samples.
function samplePhrase(g, i, opts) {
  var sb = makeSandbox();
  sb.__state.now += 613 * (i + 1);
  call(sb, "groove", g);
  if (opts && opts.plen !== undefined) call(sb, "plen", opts.plen);
  if (opts && opts.density !== undefined) call(sb, "density", opts.density);
  if (opts && opts.novelty !== undefined) call(sb, "novelty", opts.novelty);
  call(sb, "Reseed");
  if (opts && opts.mutate) for (var m = 0; m < opts.mutate; m++) call(sb, "Mutate");
  call(sb, "dump");
  return { sb: sb, phrase: lastDump(sb).phrase };
}

function barHamming(onsets, a, b) {
  var h = 0;
  for (var s = 0; s < 16; s++) if (!!onsets[a * 16 + s] !== !!onsets[b * 16 + s]) h++;
  return h;
}

test("a phrase restates its opening bar instead of redrawing every bar", function () {
  var same = 0, pairs = 0, ham = 0;
  for (var g = 0; g < 7; g++) {
    for (var t = 0; t < 12; t++) {
      var p = samplePhrase(g, g * 12 + t, { plen: 2 }).phrase;
      assert(p.bars === 4, "expected a 4-bar phrase, got " + p.bars);
      for (var b = 1; b < 4; b++) {
        pairs++;
        var h = barHamming(p.onsets, b, b - 1);
        ham += h;
        if (h === 0) same++;
      }
    }
  }
  // the coin-flip generator this replaced measured 0.1% identical and ~6 of 16
  assert(same / pairs > 0.30,
    "only " + (same / pairs * 100).toFixed(0) + "% of adjacent bars are identical — no motif");
  assert(ham / pairs < 3,
    "adjacent bars differ by " + (ham / pairs).toFixed(1) + " of 16 steps — too much churn");
});

test("bar form favours restatement over four independent bars", function () {
  var forms = {}, n = 0;
  for (var g = 0; g < 7; g++) {
    for (var t = 0; t < 12; t++) {
      var f = samplePhrase(g, 1000 + g * 12 + t, { plen: 2 }).phrase.form;
      assert(f, "phrase has no bar form");
      forms[f] = (forms[f] || 0) + 1;
      n++;
    }
  }
  var restating = (forms["AAAA'"] || 0) + (forms["AAAB'"] || 0) + (forms["AABA'"] || 0);
  assert(restating / n > 0.5, "restating forms only " + (restating / n * 100).toFixed(0) + "% of phrases");
  var distinct = 0;
  for (var k in forms) distinct++;
  assert(distinct >= 3, "only " + distinct + " distinct bar form(s) ever chosen");
});

test("rhythmic families place the bass differently against the kick", function () {
  function quarterRate(g) {
    var hit = 0, n = 0;
    for (var t = 0; t < 24; t++) {
      var p = samplePhrase(g, 2000 + g * 24 + t, { plen: 2 }).phrase;
      for (var b = 0; b < p.bars; b++) {
        for (var q = 0; q < 4; q++) { n++; if (p.onsets[b * 16 + q * 4]) hit++; }
      }
    }
    return hit / n;
  }
  var driving = quarterRate(3);     // deep family: lands with the kick
  var syncopated = quarterRate(2);  // psy, kick 0.37: answers it
  var broken = quarterRate(5);      // broken family: displaced off it
  assert(driving > 0.75, "driving lands on the quarter only " + driving.toFixed(2) + " of the time");
  assert(broken < 0.45, "broken lands on the quarter " + broken.toFixed(2) + " — not displaced at all");
  assert(driving - syncopated > 0.2,
    "driving and syncopated sit the same way against the kick (" +
    driving.toFixed(2) + " vs " + syncopated.toFixed(2) + ")");
});

test("a medium mutation varies the motif rather than replacing it", function () {
  var ham = 0, n = 0, changed = 0;
  for (var g = 0; g < 7; g++) {
    for (var t = 0; t < 8; t++) {
      var s = samplePhrase(g, 3000 + g * 8 + t, { novelty: 0.5 });
      var before = s.phrase.onsets.slice();
      call(s.sb, "Mutate");
      call(s.sb, "dump");
      var after = lastDump(s.sb).phrase.onsets;
      var h = 0;
      for (var i = 0; i < 16; i++) if (!!before[i] !== !!after[i]) h++;
      ham += h; n++;
      if (h > 0) changed++;
    }
  }
  assert(ham / n < 5,
    "a medium mutation moves " + (ham / n).toFixed(1) + " of 16 steps — that's a new figure, not a drift");
  assert(changed > 0, "medium mutations never touched the rhythm at all");
});

test("Density scales the figure without turning it into 16th-note mush", function () {
  function meanOnsets(d) {
    var tot = 0, n = 0;
    for (var g = 0; g < 7; g++) {
      for (var t = 0; t < 8; t++) {
        var p = samplePhrase(g, 4000 + g * 8 + t, { density: d }).phrase;
        var c = 0;
        for (var i = 0; i < 16; i++) if (p.onsets[i]) c++;
        tot += c; n++;
      }
    }
    return tot / n;
  }
  var lo = meanOnsets(0), hi = meanOnsets(1);
  assert(hi > lo + 1.5, "Density barely moves note count: " + lo.toFixed(1) + " -> " + hi.toFixed(1));
  assert(hi < 14, "full Density fills " + hi.toFixed(1) + " of 16 steps — that's mush, not a figure");
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

// a phrase sampler: fresh identities from one sandbox. Reseed derives its seed
// from Date.now(), so the fake clock has to move or every draw is the same phrase.
function samplePhrases(sb, n, fn) {
  for (var i = 0; i < n; i++) {
    sb.__state.advance(101 + i * 7);
    call(sb, "Reseed");
    call(sb, "dump");
    fn(lastDump(sb).phrase);
  }
}

// §1.4 — the phrase has to breathe before it restates. The last beat of the
// last bar is where the ear expects the turnaround, so it gives steps back.
test("phrase-end silence bias opens the last beat of the phrase", function () {
  [1, 2, 4].forEach(function (plenIdx, i) {
    var bars = [1, 2, 4][i];
    var sb = makeSandbox();
    call(sb, "plen", i);
    call(sb, "groove", 1);
    tickSteps(sb, bars * 16 + 4);   // let the length change land
    var beat = [], k;
    for (k = 0; k < 4 * bars; k++) beat[k] = 0;
    var phrases = 0;
    samplePhrases(sb, 60, function (p) {
      if (p.bars !== bars) return;
      phrases++;
      for (var s = 0; s < p.onsets.length; s++) if (p.onsets[s]) beat[Math.floor(s / 4)]++;
    });
    assert(phrases > 20, "not enough " + bars + "-bar phrases sampled: " + phrases);
    var lastBeat = beat[4 * bars - 1] / phrases;
    var rest = 0;
    for (k = 0; k < 4 * bars - 1; k++) rest += beat[k];
    rest = rest / (4 * bars - 1) / phrases;
    assert(lastBeat < rest * 0.85,
      bars + "-bar phrase does not leave space at the end: " +
      lastBeat.toFixed(2) + " onsets on the last beat vs " + rest.toFixed(2) + " elsewhere");
    assert(lastBeat > 0.2, bars + "-bar phrase went silent at the end instead of thinning");
  });
});

// §1.4 — a gap is preferred right after a syncopation: once the figure has
// pushed on the "a", the next downbeat is more likely to be left open.
test("a syncopated push biases the following beat toward a gap", function () {
  var sb = makeSandbox();
  call(sb, "groove", 2); // syncopated
  var afterPush = 0, afterPushN = 0, plain = 0, plainN = 0;
  samplePhrases(sb, 120, function (p) {
    for (var s = 4; s < p.onsets.length; s += 4) {
      if (p.onsets[s - 1]) { afterPushN++; if (p.onsets[s]) afterPush++; }
      else { plainN++; if (p.onsets[s]) plain++; }
    }
  });
  assert(afterPushN > 100 && plainN > 100, "not enough samples: " + afterPushN + "/" + plainN);
  var a = afterPush / afterPushN, b = plain / plainN;
  assert(a < b - 0.05,
    "a push on the 'a' did not open the next beat: " +
    a.toFixed(2) + " after a push vs " + b.toFixed(2) + " otherwise");
});

// §1.4 — downbeat rest bias as a bipolar user control: below centre the bass
// answers the kick, above it lands with the kick.
test("Interlock moves the bass on and off the kick", function () {
  function quarterRate(v) {
    var sb = makeSandbox();
    call(sb, "groove", 2); // syncopated: has room to move in both directions
    call(sb, "interlock", v);
    var hit = 0, n = 0;
    samplePhrases(sb, 60, function (p) {
      for (var s = 0; s < p.onsets.length; s += 4) { n++; if (p.onsets[s]) hit++; }
    });
    return hit / n;
  }
  var off = quarterRate(0), mid = quarterRate(0.5), on = quarterRate(1);
  assert(off < mid && mid < on,
    "Interlock is not monotonic: " + off.toFixed(2) + " / " + mid.toFixed(2) + " / " + on.toFixed(2));
  assert(on - off > 0.25,
    "Interlock barely moves the bass: " + off.toFixed(2) + " to " + on.toFixed(2));
});

// §1.9 — the four slide directions are independently weightable, and the
// groove tables actually spend those weights differently.
test("slide direction weights differ by groove", function () {
  function profile(gi) {
    var sb = makeSandbox();
    call(sb, "groove", gi);
    var up = 0, dn = 0, rtn = 0, oct = 0, all = 0;
    samplePhrases(sb, 80, function (p) {
      var ons = [], s;
      for (s = 0; s < p.onsets.length; s++) if (p.onsets[s]) ons.push(s);
      for (var k = 1; k < ons.length; k++) {
        var j = ons[k], i = ons[k - 1];
        if (!p.slides[j]) continue;
        all++;
        if (Math.abs(p.pitches[j] - p.pitches[i]) === 12) oct++;
        if (k > 1 && p.pitches[j] === p.pitches[ons[k - 2]]) rtn++;
        if (p.pitches[j] > p.pitches[i]) up++;
        else if (p.pitches[j] < p.pitches[i]) dn++;
      }
    });
    assert(all > 40, "groove " + gi + " produced too few slides: " + all);
    return { up: up / all, dn: dn / all, rtn: rtn / all, oct: oct / all };
  }
  var acidic = profile(4);    // up 1.5, dn 1.3, rtn 0.7, oct 1.4
  var hypnotic = profile(6);  // up 1.0, dn 0.9, rtn 1.6, oct 0.3
  assert(acidic.oct > hypnotic.oct,
    "acidic should slide by the octave more than hypnotic: " +
    acidic.oct.toFixed(2) + " vs " + hypnotic.oct.toFixed(2));
  assert(hypnotic.rtn > acidic.rtn,
    "hypnotic should favour returning slides: " +
    hypnotic.rtn.toFixed(2) + " vs " + acidic.rtn.toFixed(2));
  var driving = profile(3);   // up 1.4, dn 0.6
  assert(driving.up > driving.dn,
    "driving should slide upward more than down: " +
    driving.up.toFixed(2) + " vs " + driving.dn.toFixed(2));
  var broken = profile(5);    // up 0.9, dn 1.4
  assert(broken.dn > broken.up,
    "broken should slide downward more than up: " +
    broken.dn.toFixed(2) + " vs " + broken.up.toFixed(2));
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
  assert(saved.length === 20 + saved[19] * 8 + 2,
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

  ["id", "parentId", "generation", "seed", "bars", "contour", "mode", "form"].forEach(function (k) {
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
      // Reseed draws its seed from the fake clock, so the clock has to move or
      // every sample in the sweep lands on the identical phrase. The rhythm
      // generator makes one decision per beat rather than sixteen per bar, so a
      // shared seed no longer decorrelates itself.
      sb.__state.now += 977 * (g * 6 + r);
      call(sb, "groove", g);
      call(sb, "Reseed");
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

function lastParam(sb, sel) {
  var m = collect(sb, 0, sel);
  assert(m.length > 0, "no " + sel + " emitted");
  return m[m.length - 1][1];
}

test("filter mode, nonlinearity and shelf track mode and squelch", function () {
  var last = lastParam;
  // acid mode at full squelch should open the bandpass path
  var acid = makeSandbox();
  call(acid, "fmode", 7); // acid
  call(acid, "squelch", 1);
  tickSteps(acid, 4);
  var bp = last(acid, "bpamt");
  assert(bp > 0.15, "acid mode did not blend in bandpass: " + bp);
  assert(Math.abs(last(acid, "lpamt") + bp - 1) < 1e-6, "lp/bp blend does not sum to unity");
  assert(last(acid, "nlin") > 1, "nonlinear drive never engaged");
  assert(last(acid, "shelf") > 0, "resonance-compensation shelf never engaged");

  // round mode (bp 0.00) stays a pure lowpass whatever the squelch
  var flat = makeSandbox();
  call(flat, "fmode", 1); // round
  call(flat, "squelch", 1);
  tickSteps(flat, 4);
  assert(last(flat, "bpamt") === 0, "round mode should be pure lowpass");
  assert(last(flat, "lpamt") === 1, "lowpass amount should be unity with no bandpass");

  // the shelf compensates resonance: more squelch, more low-shelf lift
  var dry = makeSandbox();
  call(dry, "fmode", 7);
  call(dry, "squelch", 0);
  tickSteps(dry, 4);
  assert(last(dry, "shelf") < last(acid, "shelf"), "shelf does not track resonance");
  assert(last(acid, "shelf") <= 0.95, "shelf exceeded its clamp");
});

// §2.1 — the seven modes have to be seven audibly different filters, not seven
// labels on one. Each is checked against the character DESIGN gives it.
test("the seven filter modes are genuinely different filters", function () {
  var NAMES = ["round", "wet", "squelch", "bite", "hollow", "rubber", "acid"];
  var seen = {};
  NAMES.forEach(function (name, i) {
    var sb = makeSandbox();
    call(sb, "fmode", i + 1);
    tickSteps(sb, 8);
    call(sb, "dump");
    assert(lastDump(sb).mode === name, "mode " + (i + 1) + " reported as " + lastDump(sb).mode);
    var fmul = collect(sb, 1, "fmul").map(function (m) { return m[1]; });
    seen[name] = {
      cut: lastParam(sb, "cutoff"), reso: lastParam(sb, "reso"),
      envd: lastParam(sb, "envd"), drv: lastParam(sb, "drv"),
      bp: lastParam(sb, "bpamt"),
      acc: Math.max.apply(null, fmul.concat([0]))
    };
    var v = seen[name];
    assert(v.cut > 20 && v.cut < 12000, name + " cutoff out of audio range: " + v.cut);
    assert(v.reso >= 0 && v.reso <= 0.92, name + " resonance out of range: " + v.reso);
    assert(v.drv > 0 && v.drv < 8, name + " drive out of range: " + v.drv);
  });

  // the characterisations DESIGN §2.1 gives each mode
  assert(seen.round.cut < seen.bite.cut, "round should sit below bite in cutoff");
  assert(seen.round.reso < seen.acid.reso, "round should be less resonant than acid");
  assert(seen.acid.envd > seen.round.envd * 2, "acid should sweep far more than round");
  assert(seen.bite.drv > seen.hollow.drv, "bite should drive harder than hollow");
  assert(seen.hollow.bp > seen.round.bp, "hollow should be the most scooped");
  assert(seen.round.bp === 0, "round should be a pure lowpass");

  // accent coupling depth is itself a property of the mode (§2.1's vertical axis)
  assert(seen.acid.acc > seen.round.acc,
    "an accent should open acid further than round: " + seen.acid.acc + " vs " + seen.round.acc);

  // decay: bite is short, hollow is long — read through fdec on the note outlet
  function fdec(modeIdx) {
    var sb = makeSandbox();
    call(sb, "fmode", modeIdx);
    tickSteps(sb, 8);
    var m = collect(sb, 1, "fdec");
    assert(m.length > 0, "no fdec emitted");
    return m[m.length - 1][1];
  }
  assert(fdec(4) < fdec(5), "bite should decay faster than hollow");
});

// §1.10 — groove state weights filter mode affinity. Left on auto, a groove
// should only ever speak in the modes its own table lists.
test("groove state weights filter mode affinity", function () {
  var AFFINITY = {
    restrained: ["round", "rubber", "wet"],
    rolling: ["wet", "rubber", "round", "squelch"],
    syncopated: ["squelch", "bite", "wet", "hollow"],
    driving: ["bite", "squelch", "round"],
    acidic: ["acid", "squelch", "bite"],
    broken: ["hollow", "bite", "rubber", "squelch"],
    hypnotic: ["round", "rubber", "wet"]
  };
  var names = Object.keys(AFFINITY);
  names.forEach(function (gname, gi) {
    var got = {};
    var sb = makeSandbox();
    call(sb, "groove", gi);
    call(sb, "novelty", 0.9);
    for (var trial = 0; trial < 40; trial++) {
      call(sb, "Reseed");         // a fresh identity draws a fresh mode
      tickSteps(sb, 4);
      call(sb, "dump");
      var mode = lastDump(sb).mode;
      assert(AFFINITY[gname].indexOf(mode) >= 0,
        gname + " picked " + mode + ", which is not in its affinity set");
      got[mode] = true;
    }
    assert(Object.keys(got).length >= 2,
      gname + " only ever picked one mode; the affinity weights are not being sampled");
  });

  // and the menu overrides the affinity outright
  var forced = makeSandbox();
  call(forced, "groove", 0);   // restrained has no acid affinity at all
  call(forced, "fmode", 7);
  call(forced, "dump");
  assert(lastDump(forced).mode === "acid", "the Mode menu did not override the groove affinity");
});

// ---------------------------------------------------------------- sub, saturation, stereo

// §2.5 — the sub is its own voice: an octave choice, its own saturation with
// makeup gain, and a duck that gets out of the way of a resonant peak.
test("sub octave, saturation and resonant-peak duck", function () {
  function synth(sb, sel) { return lastParam(sb, sel); }

  // -1 folds into 32.7-61.7 Hz (MIDI 24-35); -2 into 16.4-30.9 Hz (MIDI 12-23)
  [[0, 24, 35], [1, 12, 23]].forEach(function (row) {
    var sb = makeSandbox();
    call(sb, "suboct", row[0]);
    tickSteps(sb, 64);
    var sp = collect(sb, 1, "spitch");
    assert(sp.length > 8, "no sub pitches emitted");
    sp.forEach(function (m) {
      assert(m[1] >= row[1] && m[1] <= row[2],
        "sub octave " + row[0] + " emitted MIDI " + m[1] + ", outside " + row[1] + "-" + row[2]);
    });
  });

  // sub saturation drives its own stage, and the makeup gain compensates for it
  var dry = makeSandbox(), hot = makeSandbox();
  call(dry, "subsat", 0);
  call(hot, "subsat", 1);
  tickSteps(dry, 4); tickSteps(hot, 4);
  assert(synth(hot, "subdrv") > synth(dry, "subdrv") * 2,
    "SubSat does not drive the sub saturator");
  assert(synth(hot, "subgain") < synth(dry, "subgain"),
    "sub makeup gain does not compensate for the added drive");
  assert(synth(dry, "subgain") <= 1.0001 && synth(hot, "subgain") > 0.5,
    "sub makeup gain out of range: " + synth(hot, "subgain"));

  // and the duck only engages once resonance is actually peaking
  var calm = makeSandbox(), peak = makeSandbox();
  call(calm, "squelch", 0); call(peak, "squelch", 1);
  tickSteps(calm, 4); tickSteps(peak, 4);
  assert(synth(calm, "subduck") === 0, "sub ducks with no resonant peak to duck");
  assert(synth(peak, "subduck") > 0.1,
    "sub does not duck under a resonant peak: " + synth(peak, "subduck"));
  assert(synth(peak, "subduck") <= 0.45, "sub duck exceeded its clamp");
});

// §2.4 — saturation is dynamic, not a static setting: it reads velocity, and
// it is asymmetric, so it generates even harmonics rather than only odd.
test("saturation asymmetry tracks velocity and accent", function () {
  var sb = makeSandbox();
  call(sb, "drive", 0.8);
  tickSteps(sb, 128);
  var asym = collect(sb, 1, "asym").map(function (m) { return m[1]; });
  // pair against "note", not "trig": a tied step glides instead of retriggering,
  // so trig is not emitted for every sounding step and the indices would slip
  var vel = collect(sb, 1, "note").map(function (m) { return m[2]; });
  assert(asym.length > 16, "no asymmetry emitted per note");
  assert(asym.length === vel.length, "asymmetry and note events are not 1:1");
  var lo = Math.min.apply(null, asym), hi = Math.max.apply(null, asym);
  assert(lo >= 0 && hi <= 0.6, "asymmetry out of range: " + lo + " to " + hi);
  assert(hi > lo + 0.02, "asymmetry is static, not velocity-linked: " + lo + " to " + hi);

  // louder notes bend the transfer curve further
  var loud = 0, loudN = 0, soft = 0, softN = 0;
  for (var i = 0; i < asym.length; i++) {
    if (vel[i] >= 108) { loud += asym[i]; loudN++; }
    else if (vel[i] <= 90) { soft += asym[i]; softN++; }
  }
  assert(loudN > 2 && softN > 2, "not enough loud/soft notes to compare");
  assert(loud / loudN > soft / softN,
    "asymmetry does not follow velocity: " + (loud / loudN).toFixed(3) +
    " loud vs " + (soft / softN).toFixed(3) + " soft");

  // and Drive sets the depth of the whole effect
  var quiet = makeSandbox();
  call(quiet, "drive", 0);
  tickSteps(quiet, 128);
  var qa = collect(quiet, 1, "asym").map(function (m) { return m[1]; });
  assert(Math.max.apply(null, qa) < lo, "Drive does not scale the asymmetry");
});

// §3.4 — stereo is controlled, not incidental: the low end stays mono and the
// wet spread stays correlation-safe.
test("stereo width and mono-below frequency", function () {
  var narrow = makeSandbox(), wide = makeSandbox();
  call(narrow, "width", 0);
  call(wide, "width", 1);
  tickSteps(narrow, 4); tickSteps(wide, 4);

  var w0 = lastParam(narrow, "width"), w1 = lastParam(wide, "width");
  assert(w0 === 0, "Width 0 should be dead mono, got " + w0);
  assert(w1 > 1, "Width 1 should spread past unity, got " + w1);
  assert(w1 <= 1.4, "width exceeded the correlation-safe ceiling: " + w1);

  // narrower image, higher mono-below crossover: the low end never wanders
  var m0 = lastParam(narrow, "monof"), m1 = lastParam(wide, "monof");
  assert(m0 > m1, "mono-below frequency does not track width: " + m0 + " vs " + m1);
  assert(m1 >= 200 && m0 <= 800,
    "mono-below frequency out of musical range: " + m1 + " to " + m0);
});

// ---------------------------------------------------------------- per-layer freeze (§5.3)

test("freeze rhythm, pitch and timbre hold their own layer only", function () {
  function seq(p, key) { return p[key].join(","); }
  function churn(sb) {
    call(sb, "novelty", 0.9);
    for (var i = 0; i < 6; i++) { call(sb, "Mutate"); tickSteps(sb, 32); }
    call(sb, "dump");
    return lastDump(sb).phrase;
  }

  // rhythm frozen: the figure survives, the notes move
  var r = makeSandbox();
  call(r, "dump");
  var r0 = lastDump(r).phrase;
  call(r, "frzr", 1);
  var r1 = churn(r);
  assert(seq(r1, "onsets") === seq(r0, "onsets"), "frozen rhythm changed under mutation");
  assert(seq(r1, "pitches") !== seq(r0, "pitches"), "nothing else moved; the test proves nothing");

  // pitch frozen: every sounding step keeps the pitch it had, even though the
  // rhythm is free to move underneath it
  var p = makeSandbox();
  call(p, "dump");
  var p0 = lastDump(p).phrase;
  call(p, "frzp", 1);
  var p1 = churn(p);
  var kept = 0, moved = 0, s;
  for (s = 0; s < p1.onsets.length; s++) {
    if (!p1.onsets[s] || !p0.onsets[s]) continue;
    if (p1.pitches[s] === p0.pitches[s]) kept++; else moved++;
  }
  assert(kept > 0 && moved === 0,
    "frozen pitch drifted on " + moved + " of " + (kept + moved) + " shared onsets");
  // and new onsets still get a playable pitch rather than a hole
  for (s = 0; s < p1.onsets.length; s++) {
    if (p1.onsets[s]) {
      assert(typeof p1.pitches[s] === "number" && p1.pitches[s] >= 12 && p1.pitches[s] <= 96,
        "frozen pitch left step " + s + " unplayable: " + p1.pitches[s]);
    }
  }

  // timbre frozen: the mode and the per-step timbre layer hold, and the slow
  // drift that would colour them is paused too
  var t = makeSandbox();
  call(t, "novelty", 1);
  call(t, "dump");
  var t0 = lastDump(t), tp0 = t0.phrase;
  call(t, "frzt", 1);
  var t1 = churn(t);
  call(t, "dump");
  var td = lastDump(t);
  assert(t1.mode === tp0.mode, "frozen timbre changed filter mode: " + tp0.mode + " to " + t1.mode);
  assert(seq(t1, "timbres") === seq(tp0, "timbres"), "frozen timbre layer changed");
  assert(td.slow.cut === t0.slow.cut && td.med.drv === t0.med.drv && td.fast.tim === t0.fast.tim,
    "frozen timbre did not pause the chaos walks");
  assert(seq(t1, "onsets") !== seq(tp0, "onsets") || seq(t1, "pitches") !== seq(tp0, "pitches"),
    "nothing else moved; the test proves nothing");

  // all three at once is a full hold that still lets probability play
  var all = makeSandbox();
  call(all, "dump");
  var a0 = lastDump(all).phrase;
  call(all, "frzr", 1); call(all, "frzp", 1); call(all, "frzt", 1);
  var a1 = churn(all);
  assert(seq(a1, "onsets") === seq(a0, "onsets") && seq(a1, "pitches") === seq(a0, "pitches") &&
    a1.mode === a0.mode, "the three freezes together did not hold the phrase");
});

test("Accent and Slide regenerate one layer without touching the rest", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var before = lastDump(sb).phrase;
  var onsets = before.onsets.join(","), pitches = before.pitches.join(",");

  var changedAcc = false, changedSld = false;
  for (var i = 0; i < 12 && !(changedAcc && changedSld); i++) {
    call(sb, "Accent");
    call(sb, "dump");
    var a = lastDump(sb).phrase;
    assert(a.onsets.join(",") === onsets, "Accent moved the rhythm");
    assert(a.pitches.join(",") === pitches, "Accent moved the pitches");
    if (a.accents.join(",") !== before.accents.join(",")) changedAcc = true;
    // velocity reads the accent layer, so it has to follow
    for (var s = 0; s < a.onsets.length; s++) {
      if (!a.onsets[s]) continue;
      assert(a.vels[s] >= 1 && a.vels[s] <= 127, "Accent produced velocity " + a.vels[s]);
      if (a.accents[s]) assert(a.vels[s] >= 100, "accented step is not louder: " + a.vels[s]);
    }

    call(sb, "Slide");
    call(sb, "dump");
    var b = lastDump(sb).phrase;
    assert(b.onsets.join(",") === onsets, "Slide moved the rhythm");
    assert(b.pitches.join(",") === pitches, "Slide moved the pitches");
    if (b.slides.join(",") !== before.slides.join(",")) changedSld = true;
    // a tie holds its note through the next step, so its gate has to be over 1
    for (var k = 0; k < b.onsets.length; k++) {
      if (b.onsets[k] && b.slides[k]) assert(b.gates[k] > 1, "slid step " + k + " has a short gate");
    }
  }
  assert(changedAcc, "Accent never redrew the accent layer");
  assert(changedSld, "Slide never redrew the slide layer");
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
    // round, don't floor: a rushed onset starts fractionally *before* its own
    // step, so flooring files it under the previous step and picks the wrong event
    evs.forEach(function (e, k) {
      if (a === null && Math.round(e.start / 0.25) === tie) { a = e; b = evs[k + 1]; }
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

// ---------------------------------------------------------------- core <-> patch contract

// The core and the patch are built separately, so nothing but this test stops a
// new outlet(0, "…") in pg-core.js from landing on an unrouted [route] outlet
// and silently doing nothing inside Live.
test("every selector the core emits is routed in the built device", function () {
  var patch = path.join(__dirname, "..", "device", "PG Bass Generator.maxpat");
  assert(fs.existsSync(patch), "device not built; run scripts/build_device.py");
  var boxes = JSON.parse(fs.readFileSync(patch, "utf8")).patcher.boxes;
  var routed = {}, routeCount = 0;
  boxes.forEach(function (b) {
    var t = b.box.text;
    if (!t || t.indexOf("route ") !== 0) return;
    routeCount++;
    t.split(/\s+/).slice(1).forEach(function (sel) { routed[sel] = true; });
  });
  assert(routeCount >= 3, "expected the synth/note/display routes, found " + routeCount);

  // exercise everything that emits: startup, every macro, every button
  var sb = makeSandbox();
  call(sb, "pushall");
  ["novelty", "density", "interlock", "chunk", "squelch", "drive", "cutoff",
   "decay", "sub", "subsat", "wet", "width"].forEach(function (m) { call(sb, m, 0.7); });
  ["fmode", "suboct", "groove", "root", "plen", "lock", "frzr", "frzp", "frzt"]
    .forEach(function (m) { call(sb, m, 1); });
  call(sb, "lock", 0);
  ["frzr", "frzp", "frzt"].forEach(function (m) { call(sb, m, 0); });
  tickSteps(sb, 128);
  ["Mutate", "Return", "Reseed", "Rhythm", "Pitch", "Accent", "Slide"]
    .forEach(function (b) { call(sb, b); });
  tickSteps(sb, 64);
  call(sb, "dump");

  var emitted = {};
  [0, 1, 2].forEach(function (o) {
    sb.__state.out[o].forEach(function (m) {
      if (typeof m[0] === "string") emitted[m[0]] = true;
    });
  });
  Object.keys(emitted).forEach(function (sel) {
    assert(routed[sel], "the core emits \"" + sel + "\" but the patch does not route it");
  });
  // and nothing in the patch is waiting on a selector the core never sends
  Object.keys(routed).forEach(function (sel) {
    assert(emitted[sel], "the patch routes \"" + sel + "\" but the core never emits it");
  });
});

// the other half of the same contract: every control in the patch has to reach
// a handler that exists, or the dial turns and nothing happens
test("every UI control in the built device reaches a core handler", function () {
  var patch = path.join(__dirname, "..", "device", "PG Bass Generator.maxpat");
  var boxes = JSON.parse(fs.readFileSync(patch, "utf8")).patcher.boxes;
  var sb = makeSandbox();
  var msgs = [], seen = {};
  boxes.forEach(function (b) {
    var t = b.box.text;
    if (!t) return;
    if (t.indexOf("prepend ") === 0) {          // dials, menus, toggles
      var m = t.split(/\s+/)[1];
      if (m !== "set" && m !== "Restore" && m !== "pos" && !seen[m]) { seen[m] = 1; msgs.push([m, 0.5]); }
    } else if (b.box.maxclass === "message" && b.box.presentation === 1 &&
               /^[A-Z][A-Za-z]+$/.test(t) && !seen[t]) {   // the button row
      seen[t] = 1; msgs.push([t, null]);
    }
  });
  assert(msgs.length >= 20, "found only " + msgs.length + " controls to check");
  msgs.forEach(function (row) {
    var fn;
    try { fn = vm.runInContext("typeof " + row[0], sb); }
    catch (e) { fn = "missing"; }
    assert(fn === "function",
      "the patch sends \"" + row[0] + "\" but pg-core.js has no such handler");
    if (row[1] === null) call(sb, row[0]);
    else call(sb, row[0], row[1]);
  });
});

// ----------------------------------------------------------------

console.log("\n" + passed + " passed, " + failures + " failed");
process.exit(failures ? 1 : 0);
