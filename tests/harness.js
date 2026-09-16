#!/usr/bin/env node
// harness.js — runs device/pg-core.js outside Max with shimmed Max APIs
// and asserts the musical invariants from DESIGN.md.
//
// The Max shims, sandbox and runner live in m4lkit/maxtest.js; this file is
// only the PG-specific tests and a few PG-specific readers.

"use strict";
var path = require("path");
var mt = require("../m4lkit/maxtest");

var DEVICE = path.join(__dirname, "..", "device");
var CORE = path.join(DEVICE, "pg-core.js");
var LANE = path.join(DEVICE, "pg-lane.js");
var PATCH = path.join(DEVICE, "PG Bass Generator.maxpat");
var MIDI_PATCH = path.join(DEVICE, "PG Bass Generator MIDI.maxpat");

var makeSandbox = mt.loadCore(CORE, { outlets: 4 });   // 0 synth, 1 note, 2 display, 3 phrase
var call = mt.call, callArgs = mt.callArgs, tickSteps = mt.tick;
var collect = mt.collect, collectTimed = mt.collectTimed;

var run = mt.runner("pg-core.js harness");
var test = run.test, assert = run.assert;

// the JSON blob the core answers "dump" with on the display outlet
function lastDump(sb) {
  return JSON.parse(mt.last(sb, 2, "dump")[1]);
}

// the state list Max would have stored in [pattr pg_state]
// outlet(0, "state", array) — Max flattens the Array argument into a list
function lastState(sb) {
  return mt.last(sb, 0, "state")[1];
}

// §2.8 the phrase sound parameters, in the order the saved state stores them
var SOUND_KEYS = ["wave", "pw", "fold", "wobrate", "wobdepth", "subsat"];

// outlet 3: the phrase as the lane display will read it. "steps" carries one
// flat list of 8 numbers per step, which Max flattens the same way as "state".
var LANES = ["flags", "pitch", "vel", "gate", "prob", "timbre", "wet", "micro"];
function lastPhrase(sb) {
  var h = mt.last(sb, 3, "phrase"), flat = mt.last(sb, 3, "steps")[1];
  var n = h[3], lane = {};
  LANES.forEach(function (k) { lane[k] = []; });
  for (var s = 0; s < n; s++) {
    for (var k = 0; k < LANES.length; k++) lane[LANES[k]].push(flat[s * LANES.length + k]);
  }
  return { name: h[1], bars: h[2], steps: n, root: h[4],
           groove: h[5], mode: h[6], contour: h[7], lane: lane, flat: flat };
}
function r3(v) { return Math.round((v || 0) * 1000) / 1000; }

// device/pg-lane.js drawing the phrase above, run headless: a jsui sandbox fed
// the same two messages Max would deliver, painted, and handed back as the list
// of primitives it drew. Two boxes load the script and each gets its built
// size and creation argument: the hero lane in the sound-design window, and
// the rack strip that fills what Live's 169 px leave under the title row.
var LANE_W = 944, LANE_H = 152;
var RACK_W = 952, RACK_H = 138;
var makeLane = mt.loadJsui(LANE, { width: LANE_W, height: LANE_H, args: ["window"] });
var makeRack = mt.loadJsui(LANE, { width: RACK_W, height: RACK_H, args: ["rack"] });
function drawPhrase(sb, make) {
  var h = mt.last(sb, 3, "phrase"), lane = (make || makeLane)();
  callArgs(lane, "phrase", h.slice(1));
  callArgs(lane, "steps", mt.last(sb, 3, "steps")[1]);
  return { ops: mt.paint(lane), sb: lane };
}
function laneTexts(ops) {
  return ops.filter(function (o) { return o.op === "text"; })
            .map(function (o) { return o.text; }).join("  ");
}
// the lane's own note colours, from the top of pg-lane.js
var C_NOTE = [0.059, 0.314, 0.267], C_ACCENT = [0.980, 0.780, 0.459],
    C_SLIDE = [0.961, 0.769, 0.702];
// a note body is a filled rectangle in one of the two note colours
function noteBodies(ops) {
  return ops.filter(function (o) {
    return o.op === "fill" && o.points.length === 4 &&
           (mt.opsColored([o], C_NOTE).length || mt.opsColored([o], C_ACCENT).length);
  });
}

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
    // a seed per groove: sandboxes on one seed drop the same steps, so pooling
    // them would count one draw seven times and double the spread of the shares
    var sb = mt.loadCore(CORE, { outlets: 4, seed: g + 1 })();
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
  // header, 8 atoms a step, then the tail: mode, form and the six §2.8 sound values
  assert(saved.length === 20 + saved[19] * 8 + 2 + SOUND_KEYS.length,
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
  // §2.8 the phrase's own sound, and so what the synth is sent once Design applies
  assert(before.phrase.sound, "saved phrase carries no sound; the sound checks prove nothing");
  SOUND_KEYS.forEach(function (k) {
    assert(Math.abs(after.phrase.sound[k] - before.phrase.sound[k]) <= 0.001,
      "sound." + k + " lost in restore: " + before.phrase.sound[k] + " vs " + after.phrase.sound[k]);
    assert(Math.abs(after.sound[k] - before.sound[k]) <= 0.001,
      "restored phrase plays a different " + k + ": " + before.sound[k] + " vs " + after.sound[k]);
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

// the most recent value of a synth parameter (outlet 0)
function lastParam(sb, sel) { return mt.last(sb, 0, sel)[1]; }

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
  assert(JSON.stringify(t1.sound) === JSON.stringify(tp0.sound),
    "frozen timbre changed the phrase sound (§2.8)");
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

// ---------------------------------------------------------------- parametric sound design (§2.8)

function near(a, b, eps) { return Math.abs(a - b) <= (eps || 1e-9); }

test("every phrase carries a complete sound through mutation and reseed", function () {
  var sb = makeSandbox();
  assert(JSON.stringify(mt.evalIn(sb, "SOUND_KEYS")) === JSON.stringify(SOUND_KEYS),
    "the harness's sound key order no longer matches the core's");
  function check(label) {
    call(sb, "dump");
    var d = lastDump(sb);
    assert(d.phrase.sound, label + ": phrase has no sound");
    SOUND_KEYS.forEach(function (k) {
      var v = d.phrase.sound[k], w = d.sound[k];
      assert(typeof v === "number" && v >= 0 && v <= 1, label + ": sound." + k + " = " + v);
      assert(typeof w === "number" && w >= 0 && w <= 1, label + ": plays " + k + " = " + w);
    });
  }
  check("initial phrase");
  call(sb, "novelty", 0.9);
  for (var i = 1; i <= 6; i++) { call(sb, "Mutate"); check("mutation " + i); }
  for (var j = 1; j <= 4; j++) {
    sb.__state.advance(1000 + j * 37); // the reseed is time-derived
    call(sb, "Reseed");
    check("reseed " + j);
  }
});

test("Design sets how far the phrase's sound moves the dials", function () {
  var sb = makeSandbox();
  var SOUND = mt.evalIn(sb, "SOUND"), P = mt.evalIn(sb, "P");
  // the reference is the dial defaults, so Design 1 at the defaults is the phrase's own sound
  SOUND_KEYS.forEach(function (k) {
    assert(SOUND[k][0] === P[k], "the " + k + " reference " + SOUND[k][0] + " is not its dial default " + P[k]);
  });
  call(sb, "dump");
  var s = lastDump(sb).phrase.sound;

  call(sb, "design", 1);
  assert(near(lastParam(sb, "wave"), s.wave), "Design 1 wave " + lastParam(sb, "wave") + " vs phrase " + s.wave);
  assert(near(lastParam(sb, "pw"), 0.06 + s.pw * 0.88), "Design 1 does not play the phrase's pulse width");
  assert(near(lastParam(sb, "fold"), s.fold), "Design 1 does not play the phrase's fold");
  assert(near(lastParam(sb, "wobcut"), s.wobdepth * 2200, 1e-6), "Design 1 does not play the phrase's wobble");
  assert(near(lastParam(sb, "subdrv"), 0.6 + s.subsat * 2.6), "Design 1 does not play the phrase's sub drive");
  call(sb, "dump");
  var at1 = lastDump(sb).sound;
  SOUND_KEYS.forEach(function (k) {
    assert(near(at1[k], s[k]), "Design 1 reports " + k + " " + at1[k] + ", phrase has " + s[k]);
  });

  // Design 0 plays whatever the dials say, exactly
  var dials = { wave: 0.8, pw: 0.2, fold: 0.6, wobrate: 0.7, wobdepth: 0.4, subsat: 0.9 };
  SOUND_KEYS.forEach(function (k) { call(sb, k, dials[k]); });
  call(sb, "design", 0);
  assert(near(lastParam(sb, "wave"), 0.8), "Design 0 wave is " + lastParam(sb, "wave"));
  assert(near(lastParam(sb, "pw"), 0.06 + 0.2 * 0.88), "Design 0 pw is " + lastParam(sb, "pw"));
  assert(near(lastParam(sb, "fold"), 0.6), "Design 0 fold is " + lastParam(sb, "fold"));
  assert(near(lastParam(sb, "wobrate"), 0.06 * Math.pow(2, 0.7 * 7.5)), "Design 0 wobble rate moved");
  assert(near(lastParam(sb, "wobcut"), 880, 1e-6), "Design 0 wobble cutoff depth moved");
  assert(near(lastParam(sb, "wobpitch"), 0.24), "Design 0 wobble pitch depth moved");
  assert(near(lastParam(sb, "subdrv"), 0.6 + 0.9 * 2.6), "Design 0 sub drive moved");
  assert(near(lastParam(sb, "subgain"), 1 / (1 + 0.9 * 0.55)), "Design 0 sub makeup moved");

  // in between, the phrase offsets each dial by Design × its distance from the reference
  call(sb, "design", 0.5);
  call(sb, "dump");
  var half = lastDump(sb).sound;
  SOUND_KEYS.forEach(function (k) {
    var want = Math.min(1, Math.max(0, dials[k] + 0.5 * (s[k] - SOUND[k][0])));
    assert(near(half[k], want), "Design 0.5 " + k + " is " + half[k] + ", expected " + want);
  });
});

test("each groove's phrases sit where its sound table puts them", function () {
  var N = 24;
  function meanSound(g) {
    var sb = makeSandbox(), mean = {};
    call(sb, "groove", g);
    SOUND_KEYS.forEach(function (k) { mean[k] = 0; });
    for (var i = 0; i < N; i++) {
      sb.__state.advance(1000 + i * 97);
      call(sb, "Reseed");
      call(sb, "dump");
      var s = lastDump(sb).phrase.sound;
      SOUND_KEYS.forEach(function (k) { mean[k] += s[k] / N; });
    }
    return mean;
  }
  var restrained = meanSound(0), driving = meanSound(3), broken = meanSound(5), hypnotic = meanSound(6);
  assert(broken.wave > restrained.wave + 0.2,
    "broken is not buzzier than restrained: wave " + broken.wave.toFixed(3) + " vs " + restrained.wave.toFixed(3));
  assert(broken.fold > restrained.fold + 0.1,
    "broken does not fold harder than restrained: " + broken.fold.toFixed(3) + " vs " + restrained.fold.toFixed(3));
  assert(driving.subsat > restrained.subsat + 0.1,
    "driving's sub is not hotter than restrained's: " + driving.subsat.toFixed(3) + " vs " + restrained.subsat.toFixed(3));
  assert(hypnotic.wobdepth > restrained.wobdepth,
    "hypnotic does not wobble more than restrained: " + hypnotic.wobdepth.toFixed(3) + " vs " + restrained.wobdepth.toFixed(3));
});

test("phrase sound drifts on the novelty budget and never leaves its groove's range", function () {
  // how often one mutation moves the sound, sampled straight from a single parent
  // (a lineage mutates too rarely at low Novelty to show it)
  function driftRate(novelty) {
    var sb = makeSandbox(), parent = JSON.stringify(mt.evalIn(sb, "phrase.sound")), moved = 0;
    for (var i = 0; i < 60; i++) {
      if (JSON.stringify(mt.evalIn(sb, "mutatePhrase(phrase, " + novelty + ").sound")) !== parent) moved++;
    }
    return moved / 60;
  }
  var r0 = driftRate(0), r3 = driftRate(0.3), r1 = driftRate(1);
  assert(r0 === 0, "the sound drifts with Novelty at 0: " + r0.toFixed(2) + " of mutations");
  assert(r3 > 0 && r1 > r3 && r1 >= 0.6, "sound drift does not follow the timbre budget: " +
    r3.toFixed(2) + " at Novelty 0.3, " + r1.toFixed(2) + " at 1");

  // a long lineage at full Novelty wanders around its groove's sound, never out of it
  var sb = makeSandbox();                     // default groove, so the root was drawn from it
  var table = JSON.parse(JSON.stringify(mt.evalIn(sb, "grooveNow().sound")));
  call(sb, "novelty", 1);
  var seen = {}, distinct = 0;
  for (var cycle = 0; cycle < 48; cycle++) {
    tickSteps(sb, 32);
    call(sb, "dump");
    var s = lastDump(sb).phrase.sound;
    SOUND_KEYS.forEach(function (k) {
      var lo = Math.max(0, table[k][0] - table[k][1]), hi = Math.min(1, table[k][0] + table[k][1]);
      assert(s[k] >= lo - 0.001 && s[k] <= hi + 0.001, "sound." + k + " " + s[k] +
        " wandered out of the groove's range [" + lo.toFixed(3) + ", " + hi.toFixed(3) + "]");
    });
    var key = JSON.stringify(s);
    if (!seen[key]) { seen[key] = true; distinct++; }
  }
  assert(distinct >= 4, "the phrase sound barely drifts at full Novelty: " + distinct + " sounds in 48 cycles");
});

test("the sound draws on its own streams, so a seed still writes the same bassline", function () {
  // if a sound draw shared the mutation's random stream, every pattern draw after
  // it would shift. So make each sound draw burn extra randomness from whatever
  // stream it is handed: the lineage's sounds change, its notes must not.
  var BURN = "(function () { var draw = soundDraw; soundDraw = function (rng, groove, key) {" +
             " rng(); rng(); rng(); return draw(rng, groove, key); }; })()";
  function lineage(burn) {
    var sb = makeSandbox(), out = [];
    if (burn) mt.evalIn(sb, BURN);
    // every depth, then again with rhythm frozen: a frozen high mutation re-rolls
    // its step metadata from the mutation's stream after the sound is decided
    [0, 1].forEach(function (frozen) {
      call(sb, "frzr", frozen);
      [0.1, 0.4, 1, 0.1, 0.4, 1, 0.2, 0.5, 0.9, 0.15, 0.45, 1].forEach(function (novelty) {
        out.push(JSON.parse(JSON.stringify(
          mt.evalIn(sb, "adoptPhrase(mutatePhrase(phrase, " + novelty + ")), phrase"))));
      });
    });
    return out;
  }
  var plain = lineage(false), burnt = lineage(true), soundsMoved = 0;
  plain.forEach(function (p, i) {
    var q = burnt[i];
    if (JSON.stringify(p.sound) !== JSON.stringify(q.sound)) soundsMoved++;
    delete p.sound; delete q.sound;
    assert(JSON.stringify(p) === JSON.stringify(q),
      "mutation " + (i + 1) + ": extra randomness spent on the sound moved the pattern");
  });
  // otherwise the burn never ran and the check above proves nothing
  assert(soundsMoved > 0, "no mutation drew a sound, so the stream check was vacuous");
});

test("Sound redraws the phrase's sound and filter mode without touching the notes", function () {
  var sb = makeSandbox();
  call(sb, "dump");
  var before = lastDump(sb).phrase;
  var modes = Object.keys(mt.evalIn(sb, "grooveNow().modes"));
  var layers = ["onsets", "pitches", "accents", "slides", "vels", "gates", "timbres"];
  var soundChanged = false, modeChanged = false;
  for (var i = 0; i < 12; i++) {
    call(sb, "Sound");
    call(sb, "dump");
    var d = lastDump(sb), p = d.phrase;
    assert(p.id === before.id && p.generation === before.generation,
      "Sound replaced the phrase instead of redrawing its sound");
    layers.forEach(function (k) {
      assert(JSON.stringify(p[k]) === JSON.stringify(before[k]), "Sound moved the " + k + " layer");
    });
    assert(modes.indexOf(p.mode) >= 0, "Sound picked " + p.mode + ", outside the groove's affinity " + modes);
    // the synth hears the new sound at once, not at the next bar line
    assert(near(lastParam(sb, "wave"), d.sound.wave) && near(lastParam(sb, "fold"), d.sound.fold),
      "Sound did not re-send the synth");
    if (JSON.stringify(p.sound) !== JSON.stringify(before.sound)) soundChanged = true;
    if (p.mode !== before.mode) modeChanged = true;
  }
  assert(soundChanged, "Sound never redrew the phrase sound");
  assert(modeChanged, "Sound never redrew the filter mode");

  // and the redraw is what the set saves
  call(sb, "dump");
  var now = lastDump(sb).phrase, fresh = makeSandbox();
  callArgs(fresh, "Restore", lastState(sb));
  call(fresh, "dump");
  assert(JSON.stringify(lastDump(fresh).phrase.sound) === JSON.stringify(now.sound),
    "the redrawn sound was not saved");
});

test("Mutate, Return and Reseed send the new phrase's sound at once", function () {
  var sb = makeSandbox();
  call(sb, "novelty", 1);
  ["Mutate", "Mutate", "Return", "Reseed"].forEach(function (b) {
    sb.__state.advance(1500); // outside Return's double-press window; a distinct reseed
    call(sb, b);
    call(sb, "dump");
    var S = lastDump(sb).sound;
    assert(near(lastParam(sb, "wave"), S.wave) && near(lastParam(sb, "pw"), 0.06 + S.pw * 0.88) &&
      near(lastParam(sb, "fold"), S.fold) && near(lastParam(sb, "subdrv"), 0.6 + S.subsat * 2.6),
      b + " left the synth playing the previous phrase's sound");
  });
});

test("a set saved before §2.8 restores without a sound and plays its dials", function () {
  var a = makeSandbox();
  call(a, "novelty", 0.8);
  for (var i = 0; i < 3; i++) call(a, "Mutate");
  call(a, "dump");
  var before = lastDump(a).phrase;
  var saved = lastState(a);
  var legacy = saved.slice(0, 20 + saved[19] * 8 + 2); // mode and form, no sound

  var b = makeSandbox();
  call(b, "wave", 0.8);   // Live restores the dials before [pattr] speaks
  call(b, "fold", 0.25);
  callArgs(b, "Restore", legacy);
  call(b, "dump");
  var d = lastDump(b);
  assert(d.phrase.id === before.id, "the legacy list did not restore");
  assert(d.phrase.mode === before.mode, "mode lost from a legacy list");
  assert(d.phrase.sound === null, "a legacy phrase grew a sound it was never saved with");
  SOUND_KEYS.forEach(function (k) {
    assert(d.sound[k] === d.params[k], "legacy phrase plays " + k + " " + d.sound[k] + ", not the dial's " + d.params[k]);
  });
  assert(lastParam(b, "wave") === 0.8 && lastParam(b, "fold") === 0.25, "legacy restore did not play the dials");

  // saved again, it still has no sound, and the list says so
  call(b, "pushall");
  var resaved = lastState(b);
  assert(resaved.length === legacy.length + SOUND_KEYS.length, "resaved list has the wrong length");
  assert(resaved.slice(-SOUND_KEYS.length).every(function (v) { return v === -1; }),
    "a phrase with no sound did not save the no-sound marker");
  var c = makeSandbox();
  callArgs(c, "Restore", resaved);
  call(c, "dump");
  assert(lastDump(c).phrase.sound === null, "the no-sound marker restored as a sound");

  // and its first mutation gives the lineage a sound of its own
  call(b, "Mutate");
  call(b, "dump");
  assert(lastDump(b).phrase.sound, "a legacy lineage never gained a sound");
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

    var evs = mt.evalIn(sb, "noteEvents(phrase)");
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
  var evs = mt.evalIn(sb, "noteEvents(phrase)");

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

// ---------------------------------------------------------------- phrase view (outlet 3)

// The lane display is only as honest as this outlet, so it is checked against
// dump() — the same phrase, read straight off the generator.
test("the phrase outlet emits every step, matching the generator", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  call(sb, "dump");
  var v = lastPhrase(sb), d = lastDump(sb).phrase;

  assert(v.name === d.name, "lane name " + v.name + " != dump name " + d.name);
  assert(v.bars === d.bars, "lane bars " + v.bars + " != dump bars " + d.bars);
  assert(v.contour === d.contour, "lane contour " + v.contour + " != " + d.contour);
  assert(v.steps === d.onsets.length,
    "lane has " + v.steps + " steps, phrase has " + d.onsets.length);
  assert(v.steps === v.bars * 16, "steps should be 16/bar, got " + v.steps);
  assert(v.flat.length === v.steps * LANES.length,
    "expected " + v.steps * LANES.length + " numbers, got " + v.flat.length);

  for (var s = 0; s < v.steps; s++) {
    var f = v.lane.flags[s];
    assert((f & 1 ? 1 : 0) === (d.onsets[s] ? 1 : 0), "onset mismatch at step " + s);
    assert((f & 2 ? 1 : 0) === (d.accents[s] ? 1 : 0), "accent mismatch at step " + s);
    assert((f & 4 ? 1 : 0) === (d.slides[s] ? 1 : 0), "slide mismatch at step " + s);
    assert(v.lane.pitch[s] === (d.pitches[s] || 0), "pitch mismatch at step " + s);
    assert(v.lane.vel[s] === (d.vels[s] || 0), "velocity mismatch at step " + s);
    assert(v.lane.gate[s] === r3(d.gates[s]), "gate mismatch at step " + s);
    assert(v.lane.prob[s] === r3(d.probs[s]), "prob mismatch at step " + s);
    assert(v.lane.timbre[s] === r3(d.timbres[s]), "timbre mismatch at step " + s);
    assert(v.lane.wet[s] === r3(d.wets[s]), "wet mismatch at step " + s);
    assert(v.lane.micro[s] === r3(d.micros[s]), "micro mismatch at step " + s);
  }
});

// §5.3 the point of the lane: a layer reroll has to be visible, and has to
// leave the layers it did not touch alone.
test("a layer reroll re-emits the phrase with only that layer moved", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var before = lastPhrase(sb);

  call(sb, "Accent");
  var after = lastPhrase(sb);
  assert(after.flat !== before.flat, "Accent did not re-emit the phrase");

  var onsetsMoved = 0, accentsMoved = 0, pitchesMoved = 0;
  for (var s = 0; s < before.steps; s++) {
    if ((before.lane.flags[s] & 1) !== (after.lane.flags[s] & 1)) onsetsMoved++;
    if ((before.lane.flags[s] & 2) !== (after.lane.flags[s] & 2)) accentsMoved++;
    if (before.lane.pitch[s] !== after.lane.pitch[s]) pitchesMoved++;
  }
  assert(onsetsMoved === 0, "Accent moved " + onsetsMoved + " onsets");
  assert(pitchesMoved === 0, "Accent moved " + pitchesMoved + " pitches");
  assert(accentsMoved > 0, "Accent changed nothing the lane can show");

  // Rhythm is allowed to move onsets, and has to
  call(sb, "Rhythm");
  var rh = lastPhrase(sb), rhythmMoved = 0;
  for (s = 0; s < before.steps; s++) {
    if ((after.lane.flags[s] & 1) !== (rh.lane.flags[s] & 1)) rhythmMoved++;
  }
  assert(rhythmMoved > 0, "Rhythm changed nothing the lane can show");
});

// root() transposes the phrase in place and never touches the status line, so
// it is the one phrase change that does not ride updateDisplay()
test("transposing the root moves the lane pitches with it", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var before = lastPhrase(sb);
  call(sb, "root", 5);                       // root is a semitone index, 0 = C1
  var after = lastPhrase(sb);

  var delta = 36 + 5 - before.root;
  assert(delta !== 0, "the phrase already sat on that root — nothing to transpose");
  assert(after.root === before.root + delta, "lane root did not follow: " + after.root);
  var checked = 0;
  for (var s = 0; s < before.steps; s++) {
    if (!(before.lane.flags[s] & 1)) continue;
    assert(after.lane.pitch[s] === before.lane.pitch[s] + delta,
      "step " + s + " pitch did not transpose: " + before.lane.pitch[s] +
      " -> " + after.lane.pitch[s]);
    checked++;
  }
  assert(checked > 0, "phrase had no onsets to transpose");
});

// The lane redraw rides updateDisplay(), which is menu- and button-rate. A dial
// drag sends a message per pixel, so if any dial handler reached it the drawer
// would get a full phrase dump per pixel too.
test("turning dials never re-emits the phrase", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var quiet = collect(sb, 3, "steps").length;

  ["novelty", "density", "interlock", "chunk", "squelch", "drive", "cutoff",
   "decay", "sub", "subsat", "wet", "width", "wave", "pw", "fold", "wobrate",
   "wobdepth", "design"].forEach(function (m) {
    for (var v = 0; v <= 1.0001; v += 0.02) call(sb, m, v);   // one drag each
  });

  var after = collect(sb, 3, "steps").length;
  assert(after === quiet, "dials pushed " + (after - quiet) + " phrase dumps");
});

// ---------------------------------------------------------------- the lane (device/pg-lane.js)

// The jsui runs in Max, where a test cannot follow it, so maxtest shims
// mgraphics and records what paint() draws. These check the drawing is a true
// reading of the phrase — not that it is pretty, which is what the eye is for.

test("the lane draws one body per onset, in accent or plain colour", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb), ops = drawPhrase(sb).ops;

  var onsets = 0, accents = 0;
  for (var s = 0; s < p.steps; s++) {
    if (!(p.lane.flags[s] & 1)) continue;
    onsets++;
    if (p.lane.flags[s] & 2) accents++;
  }
  assert(onsets > 0, "the phrase has no onsets to draw");

  var bodies = noteBodies(ops);
  assert(bodies.length === onsets,
    "drew " + bodies.length + " note bodies for " + onsets + " onsets");
  var amber = mt.opsColored(bodies, C_ACCENT).length;
  assert(amber === accents, "drew " + amber + " accented notes for " + accents + " accents");
  assert(bodies.length - amber === onsets - accents, "a plain note drew in neither colour");
});

test("the lane draws a slide back to the note it glides from", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb), ops = drawPhrase(sb).ops;

  // slides[s] means s is slid *into* from the onset before it, which is how
  // fireStep() ties the two notes together. So a slide is drawn backwards, and
  // the phrase's first onset has nothing behind it to be drawn from.
  var joinable = 0;
  for (var s = 0; s < p.steps; s++) {
    if (!(p.lane.flags[s] & 1) || !(p.lane.flags[s] & 4)) continue;
    for (var t = s - 1; t >= 0; t--) {
      if (p.lane.flags[t] & 1) { joinable++; break; }
    }
  }
  var lines = mt.opsColored(ops, C_SLIDE).filter(function (o) {
    return o.op === "stroke" && o.points.length === 2;
  });
  assert(lines.length === joinable,
    "drew " + lines.length + " slides for " + joinable + " that glide from a note");
  lines.forEach(function (o) {
    assert(o.x1 <= LANE_W, "a slide ran past the right edge, to x " + o.x1);
  });
});

test("the lane puts a higher pitch higher, and the tonic on its guide line", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb);
  var ops = drawPhrase(sb).ops, bodies = noteBodies(ops);

  var pitches = [], i = 0;
  for (var s = 0; s < p.steps; s++) if (p.lane.flags[s] & 1) pitches.push(p.lane.pitch[s]);
  assert(pitches.length === bodies.length, "pitch list and body list disagree");

  // bodies come out in step order, so pitch and y can be compared pairwise
  var pairs = 0;
  for (i = 1; i < pitches.length; i++) {
    if (pitches[i] === pitches[i - 1]) continue;
    pairs++;
    var hi = pitches[i] > pitches[i - 1];
    var up = bodies[i].y + bodies[i].h / 2 < bodies[i - 1].y + bodies[i - 1].h / 2;
    assert(hi === up, "pitch " + pitches[i] + " after " + pitches[i - 1] +
      " drew at y " + bodies[i].y.toFixed(1) + " after " + bodies[i - 1].y.toFixed(1));
  }
  assert(pairs > 0, "this phrase is all one pitch — nothing checked");
});

test("the lane header names the phrase the core sent", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb), ops = drawPhrase(sb).ops;
  var texts = laneTexts(ops);

  [p.name, p.groove, p.mode, p.contour].forEach(function (word) {
    assert(texts.indexOf(word) >= 0, "the header never names \"" + word + "\"");
  });
  var onsets = 0;
  for (var s = 0; s < p.steps; s++) if (p.lane.flags[s] & 1) onsets++;
  assert(texts.indexOf(onsets + " note") >= 0, "the header miscounts the notes");
  assert(texts.indexOf("1") >= 0 && texts.indexOf("2") >= 0, "the bar ruler is missing");
});

// Whatever the phrase does, the drawing stays inside the box: Max clips
// silently, so an overflow shows up as a note that is simply not there.
test("nothing the lane draws falls outside the box", function () {
  [1, 2, 3, 4, 5].forEach(function (seed) {
    var sb = mt.loadCore(CORE, { outlets: 4, seed: seed })();
    call(sb, "pushall");
    call(sb, "plen", seed % 2);                 // 1, 2 and 4 bar phrases
    tickSteps(sb, 128);
    ["Mutate", "Rhythm", "Pitch", "Accent", "Slide"].forEach(function (b) { call(sb, b); });
    tickSteps(sb, 64);

    [[makeLane, LANE_W, LANE_H, "window"],
     [makeRack, RACK_W, RACK_H, "rack"]].forEach(function (v) {
      drawPhrase(sb, v[0]).ops.forEach(function (o) {
        assert(o.x >= -0.01 && o.y >= -0.01 && o.x1 <= v[1] + 0.01 && o.y1 <= v[2] + 0.01,
          "seed " + seed + ", " + v[3] + ": a " + o.op + " " +
          (o.text ? "(\"" + o.text + "\") " : "") +
          "ran to " + o.x.toFixed(1) + "," + o.y.toFixed(1) + " .. " +
          o.x1.toFixed(1) + "," + o.y1.toFixed(1) + " in a " + v[1] + "x" + v[2] + " box");
      });
    });
  });
});

// §5.4 the rack view. Live gives the device 169 px and the status display
// already spells out "A0 · rolling · 2 bars · repeat · wet" one row above the
// lane, so repeating it there would cost 20 px of pitch range to say nothing
// new. The counts are new, so they move down to the ruler rather than go.
test("the rack lane drops the identity line but keeps the counts", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb);
  var win = laneTexts(drawPhrase(sb, makeLane).ops);
  var rack = laneTexts(drawPhrase(sb, makeRack).ops);

  assert(win.indexOf(p.name) >= 0, "the window lane lost its header");
  assert(rack.indexOf(p.name) < 0,
    "the rack lane repeats the status display's phrase name: " + rack);
  [p.groove, p.mode, p.contour].forEach(function (word) {
    assert(rack.indexOf(word) < 0, "the rack lane repeats the status display's " + word);
  });

  var onsets = 0;
  for (var i = 0; i < p.steps; i++) if (p.lane.flags[i] & 1) onsets++;
  [win, rack].forEach(function (t, k) {
    assert(t.indexOf(onsets + " note") >= 0,
      (k ? "the rack" : "the window") + " lane lost the note count");
  });
  assert(rack.indexOf("1") >= 0, "the rack lane lost the bar ruler");
});

// The 20 px the header gave up go to the notes, not to empty space.
test("the rack lane spends the header's space on pitch", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  function top(make) {
    return Math.min.apply(null, noteBodies(drawPhrase(sb, make).ops)
      .map(function (o) { return o.y; }));
  }
  assert(top(makeRack) < top(makeLane) - 5,
    "the rack lane's notes start no higher than the window's, header or not");
});

// The counts sit on the ruler in the rack view, in the same band the beat ticks
// occupy. Nothing else in the lane draws over anything, and this line is the
// one place it could start.
test("the rack ruler's ticks stop short of the counts", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var ops = drawPhrase(sb, makeRack).ops;
  var label = ops.filter(function (o) {
    return o.op === "text" && o.text.indexOf(" note") > 0;
  })[0];
  assert(label, "the rack lane drew no counts");
  ops.forEach(function (o) {                       // a tick is a 4 px hairline
    if (o.op !== "stroke" || o.w > 1 || o.h > 8) return;
    assert(o.x1 <= label.x, "a ruler tick at " + o.x.toFixed(1) +
      " strikes through the counts, which start at " + label.x.toFixed(1));
  });
});

test("the lane redraws on steps, not on the header alone", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var h = mt.last(sb, 3, "phrase"), lane = makeLane();

  assert(mt.paint(lane).length <= 3, "an empty lane drew more than its ground and label");
  callArgs(lane, "phrase", h.slice(1));
  assert(lane.__draw.redraws === 0, "the header alone asked for a redraw");
  callArgs(lane, "steps", mt.last(sb, 3, "steps")[1]);
  assert(lane.__draw.redraws === 1, "the grid did not ask for a redraw");
  assert(noteBodies(mt.paint(lane)).length > 0, "nothing drew once both messages landed");
});

test("Mutate changes what the lane draws", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  function shape() {
    return noteBodies(drawPhrase(sb).ops).map(function (o) {
      return [o.x, o.y, o.w].map(function (v) { return v.toFixed(1); }).join(",");
    }).join(" ");
  }
  var before = shape();
  for (var i = 0; i < 6 && shape() === before; i++) { call(sb, "Mutate"); tickSteps(sb, 32); }
  assert(shape() !== before, "six mutations later the lane draws the same phrase");
});

// ------------------------------------------------------- editing the lane

// A gesture, as Max delivers one: onclick on the way down, ondrag while the
// button is held, and one last ondrag with button 0 on release — which is the
// call that turns a gesture into a message. Nothing leaves the lane before it.
function press(lane, x, y, shift) {
  callArgs(lane, "onclick", [x, y, 1, 0, shift ? 1 : 0]);
}
function release(lane, x, y, shift) {
  callArgs(lane, "ondrag", [x, y, 0, 0, shift ? 1 : 0]);
}
function clickAt(lane, x, y, shift) {
  press(lane, x, y, shift);
  release(lane, x, y, shift);
}
function dragTo(lane, x0, y0, x1, y1) {
  press(lane, x0, y0, false);
  callArgs(lane, "ondrag", [(x0 + x1) / 2, (y0 + y1) / 2, 1, 0, 0]);
  callArgs(lane, "ondrag", [x1, y1, 1, 0, 0]);
  release(lane, x1, y1, false);
}

// Where the lane drew each onset, so a test can aim at a note the way a player
// does — by pointing at it — instead of recomputing the script's geometry and
// then testing that arithmetic against itself. notes() paints in step order,
// so the bodies come back in the order the onsets do.
function laneView(sb, make) {
  var d = drawPhrase(sb, make);
  d.steps = onsetSteps(lastPhrase(sb));
  d.at = noteBodies(d.ops).map(function (o) {
    return { x: (o.x + o.x1) / 2, y: (o.y + o.y1) / 2, top: o.y, bottom: o.y1 };
  });
  return d;
}
function onsetSteps(p) {
  var out = [];
  for (var s = 0; s < p.steps; s++) if (p.lane.flags[s] & 1) out.push(s);
  return out;
}
// the one message a gesture is allowed to send, checked as one
function onlyEdit(lane) {
  var out = mt.sent(lane, 0);
  assert(out.length === 1, "a gesture sent " + out.length + " messages, not one");
  assert(out[0][0] === "stepedit", "a gesture sent \"" + out[0][0] + "\"");
  return out[0];
}
// the lane is a control as well as a display: what it sends goes straight back
// into the core, which is the only thing that may change a phrase
function apply(sb, msg) { callArgs(sb, "stepedit", msg.slice(1)); }

test("a click on a note toggles its accent and rewrites its velocity", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var before = lastPhrase(sb), v = laneView(sb);
  var i = 0;
  while (i < v.steps.length && (before.lane.flags[v.steps[i]] & 2)) i++;
  assert(i < v.steps.length, "this phrase has no plain note to accent");
  var s = v.steps[i];

  clickAt(v.sb, v.at[i].x, v.at[i].y, false);
  var msg = onlyEdit(v.sb);
  assert(msg[1] === "accent" && msg[2] === s,
    "a plain click should be an accent on step " + s + ", got " + msg.join(" "));

  apply(sb, msg);
  var after = lastPhrase(sb);
  assert(after.lane.flags[s] & 2, "the accent did not go on");
  // genStepMeta()'s accent band, so an edited note sits where a generated one would
  assert(after.lane.vel[s] >= 112 && after.lane.vel[s] <= 124,
    "an accented step's velocity left the accent band: " + after.lane.vel[s]);

  // and back off again, onto the plain band rather than the ghost one
  var v2 = laneView(sb), j = v2.steps.indexOf(s);
  clickAt(v2.sb, v2.at[j].x, v2.at[j].y, false);
  apply(sb, onlyEdit(v2.sb));
  var back = lastPhrase(sb);
  assert(!(back.lane.flags[s] & 2), "the accent did not come off");
  assert(back.lane.vel[s] >= 82 && back.lane.vel[s] <= 100,
    "an un-accented step should land on the plain band, not the ghost one: " + back.lane.vel[s]);
});

test("shift-click toggles the slide into a note, and the first onset refuses", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var v = laneView(sb);
  assert(v.steps.length >= 2, "this phrase has only one onset");
  var s = v.steps[1], on = !!(lastPhrase(sb).lane.flags[s] & 4);

  clickAt(v.sb, v.at[1].x, v.at[1].y, true);
  var msg = onlyEdit(v.sb);
  assert(msg[1] === "slide" && msg[2] === s,
    "a shift-click should be a slide on step " + s + ", got " + msg.join(" "));

  apply(sb, msg);
  var after = lastPhrase(sb);
  assert(!!(after.lane.flags[s] & 4) === !on, "the slide did not toggle");
  if (!on) {
    assert(r3(after.lane.gate[s]) === 1.02,
      "a slid step should hold past its own length, gate was " + after.lane.gate[s]);
  }

  // the phrase's first note is slid into from nothing, so the core refuses it
  // and never re-emits — the lane's optimism simply never comes back
  var v2 = laneView(sb), emitted = collect(sb, 3, "phrase").length;
  clickAt(v2.sb, v2.at[0].x, v2.at[0].y, true);
  var first = onlyEdit(v2.sb);
  assert(first[2] === v.steps[0], "the shift-click missed the first onset");
  apply(sb, first);
  assert(collect(sb, 3, "phrase").length === emitted,
    "a slide on the first onset was accepted");
});

test("dragging a note moves it in time and pitch, carrying its own lanes", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var before = lastPhrase(sb), v = laneView(sb);

  // how far a semitone is, measured off the drawing rather than recomputed from
  // the script's own constants: two onsets at different pitches give the scale,
  // and a body's centre is yOf(pitch) whether or not the note is accented
  var semi = 0, lo = v.steps[0];
  for (var a = 0; a < v.steps.length; a++) {
    if (before.lane.pitch[v.steps[a]] < before.lane.pitch[lo]) lo = v.steps[a];
    for (var b = a + 1; b < v.steps.length; b++) {
      var dp = before.lane.pitch[v.steps[b]] - before.lane.pitch[v.steps[a]];
      if (dp) semi = Math.abs(v.at[b].y - v.at[a].y) / Math.abs(dp);
    }
  }
  assert(semi > 0, "this phrase is a pedal tone, so the lane has no pitch scale");

  // the lowest note with a free column two steps to its right: low, so there is
  // room above it inside both the drawn span and the core's range
  var i = -1;
  for (var k = 0; k < v.steps.length; k++) {
    var to = v.steps[k] + 2;
    if (to >= before.steps || (before.lane.flags[to] & 1)) continue;
    if (i < 0 || before.lane.pitch[v.steps[k]] < before.lane.pitch[v.steps[i]]) i = k;
  }
  assert(i >= 0, "this phrase has no note with a free column after it");
  var s = v.steps[i], dest = s + 2, up = before.lane.pitch[s] + 2;

  var cw = (LANE_W - 20 * 2) / before.steps;          // PAD_X from pg-lane.js
  dragTo(v.sb, v.at[i].x, v.at[i].y, v.at[i].x + cw * 2, v.at[i].y - semi * 2);
  var msg = onlyEdit(v.sb);
  assert(msg[1] === "move" && msg[2] === s && msg[3] === dest,
    "the drag should move step " + s + " to " + dest + ", got " + msg.join(" "));
  assert(msg[4] === up,
    "two semitones of travel should read as pitch " + up + ", got " + msg[4]);

  apply(sb, msg);
  var after = lastPhrase(sb);
  assert(!(after.lane.flags[s] & 1), "the note did not leave its old column");
  assert(after.lane.flags[dest] & 1, "the note did not arrive in the new one");
  assert(after.lane.pitch[dest] === msg[4],
    "the note landed on pitch " + after.lane.pitch[dest] + ", not the " + msg[4] + " asked for");
  // everything a step carries travels with it: a move is not a re-roll
  ["vel", "gate", "prob", "timbre", "wet", "micro"].forEach(function (k) {
    assert(r3(after.lane[k][dest]) === r3(before.lane[k][s]),
      "a move dropped the step's " + k + ": " + before.lane[k][s] + " -> " + after.lane[k][dest]);
  });
  assert((after.lane.flags[dest] & 2) === (before.lane.flags[s] & 2), "a move dropped the accent");
});

test("a move onto an occupied column is refused, and one off the end is too", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb), ons = onsetSteps(p);
  assert(ons.length >= 2, "this phrase has only one onset");
  var emitted = collect(sb, 3, "phrase").length;

  callArgs(sb, "stepedit", ["move", ons[0], ons[1], p.lane.pitch[ons[0]]]);
  callArgs(sb, "stepedit", ["move", ons[0], p.steps, p.lane.pitch[ons[0]]]);
  callArgs(sb, "stepedit", ["move", ons[0], -1, p.lane.pitch[ons[0]]]);
  callArgs(sb, "stepedit", ["move", ons[0], ons[0] + 1]);   // no pitch at all
  callArgs(sb, "stepedit", ["accent", -1]);
  callArgs(sb, "stepedit", ["slide", p.steps + 3]);
  callArgs(sb, "stepedit", ["nonsense", ons[0]]);
  assert(collect(sb, 3, "phrase").length === emitted,
    "a refused edit still re-emitted the phrase");
  assert(JSON.stringify(lastPhrase(sb).flat) === JSON.stringify(p.flat),
    "a refused edit changed the phrase anyway");
});

test("a moved note keeps the slide invariant at the front of the phrase", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var p = lastPhrase(sb), ons = onsetSteps(p);
  assert(ons.length >= 2, "this phrase has only one onset");

  // make the second note slide, then move the first one behind it: the slid
  // note is now the phrase's first, with nothing to glide from
  if (!(p.lane.flags[ons[1]] & 4)) callArgs(sb, "stepedit", ["slide", ons[1]]);
  p = lastPhrase(sb);
  assert(p.lane.flags[ons[1]] & 4, "could not get a slide onto the second note");

  var free = -1;
  for (var t = ons[1] + 1; t < p.steps; t++) if (!(p.lane.flags[t] & 1)) { free = t; break; }
  assert(free > 0, "this phrase has no free column after its second note");
  callArgs(sb, "stepedit", ["move", ons[0], free, p.lane.pitch[ons[0]]]);

  var after = lastPhrase(sb);
  assert(onsetSteps(after)[0] === ons[1], "the move did not promote the slid note");
  assert(!(after.lane.flags[ons[1]] & 4),
    "the phrase's first note is slid into from nothing");
  assert(r3(after.lane.gate[ons[1]]) !== 1.02,
    "the freed note kept a slide's gate: " + after.lane.gate[ons[1]]);
});

test("a drag sends one message however far it travels, and only on release", function () {
  var sb = makeSandbox();
  call(sb, "pushall");
  var v = laneView(sb);
  press(v.sb, v.at[0].x, v.at[0].y, false);
  for (var i = 1; i <= 12; i++) {
    callArgs(v.sb, "ondrag", [v.at[0].x + i * 5, v.at[0].y + i, 1, 0, 0]);
  }
  assert(mt.sent(v.sb, 0).length === 0, "the lane sent an edit mid-drag");
  release(v.sb, v.at[0].x + 60, v.at[0].y + 12, false);
  assert(mt.sent(v.sb, 0).length === 1, "a drag sent more than one message");

  // and a press that goes nowhere near a note is not a gesture at all
  var v2 = laneView(sb);
  clickAt(v2.sb, 2, 2, false);
  assert(mt.sent(v2.sb, 0).length === 0, "clicking empty space sent an edit");
});

test("both lanes send their edits back to the core", function () {
  assert(mt.jsHandlers(CORE).indexOf("stepedit") >= 0,
    "pg-core.js has no stepedit handler for the lane to talk to");

  var patch = mt.readPatch(PATCH);
  var core = patch.boxes.filter(function (b) {
    return String(b.box.text || "").indexOf("js pg-core.js") === 0;
  })[0];
  assert(core, "no core box in the built device");

  // the rack lane goes straight back in
  var rack = mt.jsuiBoxes(patch).filter(function (j) { return j.args[0] === "rack"; })[0];
  var direct = mt.feeders(patch, core.box.id).filter(function (f) { return f.id === rack.id; });
  assert(direct.length === 1 && direct[0].inlet === 0,
    "the rack lane's edits do not reach the core's inlet");

  // the window's copy is a subpatcher deeper, so it leaves through the same
  // ctrl_out every other control in that window uses
  var sub = patch.boxes.filter(function (b) { return b.box.varname === "wave_window"; })[0];
  var win = mt.jsuiBoxes(sub.box.patcher).filter(function (j) { return j.args[0] === "window"; })[0];
  var outs = sub.box.patcher.boxes.filter(function (b) { return b.box.maxclass === "outlet"; });
  var reaches = outs.filter(function (o) {
    return mt.feeders(sub.box.patcher, o.box.id).some(function (f) { return f.id === win.id; });
  });
  assert(reaches.length === 1, "the window lane's edits reach no subpatcher outlet");
  var up = mt.feeders(patch, core.box.id).filter(function (f) { return f.id === sub.box.id; });
  assert(up.length === 1 && up[0].inlet === 0,
    "the window subpatcher's control outlet does not reach the core");
});

// ---------------------------------------------------------------- the test sandbox

// §5.1 step probability draws Math.random at play time, so two runs of the same
// core only emit the same notes because maxtest gives each sandbox its own seeded
// Math. Without it, comparing note streams before and after a change always fails.
test("sandboxes with the same seed play identical note streams", function () {
  var hostRandom = Math.random;
  function notes(sb) { return JSON.stringify([sb.__state.out[1], sb.__state.outT[1]]); }

  // all four exist before any of them plays, so a stream shared between them shows
  var seed2 = mt.loadCore(CORE, { outlets: 4, seed: 2 });
  var a = makeSandbox(), b = makeSandbox(), c = seed2(), d = seed2();
  [a, b, c, d].forEach(function (sb) { tickSteps(sb, 200); });

  assert(mt.evalIn(a, "Math") !== Math, "the sandbox is handed the host's Math");
  assert(notes(a) === notes(b), "two sandboxes on the default seed played different notes");
  assert(notes(c) === notes(d), "two sandboxes on seed 2 played different notes");
  // seeds are free to differ, and these two do: equal streams would mean the seed
  // never reaches Math.random, or the core stopped drawing it at play time
  assert(notes(a) !== notes(c), "seed 2 played the default seed's notes");
  assert(Math.random === hostRandom, "a sandbox replaced the host's Math.random");
});

// ---------------------------------------------------------------- core <-> patch contract

// A core driven until it has said everything it knows how to say: startup,
// every macro, every menu, every button, and enough clock to get a phrase and
// a reroll out of it. Two tests read the same run, so what counts as "emits"
// is one list to extend rather than two to keep in step.
function exerciseEverything() {
  var sb = makeSandbox();
  call(sb, "pushall");
  ["novelty", "density", "interlock", "chunk", "squelch", "drive", "cutoff",
   "decay", "sub", "subsat", "wet", "width", "wave", "pw", "fold", "wobrate", "wobdepth",
   "design"].forEach(function (m) { call(sb, m, 0.7); });
  ["fmode", "suboct", "groove", "root", "plen", "lock", "frzr", "frzp", "frzt"]
    .forEach(function (m) { call(sb, m, 1); });
  call(sb, "lock", 0);
  ["frzr", "frzp", "frzt"].forEach(function (m) { call(sb, m, 0); });
  tickSteps(sb, 128);
  ["Mutate", "Return", "Reseed", "Rhythm", "Pitch", "Accent", "Slide", "Sound"]
    .forEach(function (b) { call(sb, b); });
  tickSteps(sb, 64);
  call(sb, "dump");
  return sb;
}

// The core and the patch are built separately, so nothing but this test stops a
// new outlet(0, "…") in pg-core.js from landing on an unrouted [route] outlet
// and silently doing nothing inside Live.
test("every selector the core emits is routed in the built device", function () {
  var patch = mt.readPatch(PATCH);
  var routed = mt.routedSelectors(patch);
  assert(routed.routes >= 3, "expected the synth/note/display routes, found " + routed.routes);

  // The phrase outlet skips [route] — it goes straight to the lane's jsui,
  // because route strips the selector it matches and the lane needs those
  // names. So the jsui's handlers consume selectors just as a route does.
  var consumed = routed.selectors.concat(mt.jsuiHandlers(patch, DEVICE));

  var sb = exerciseEverything();
  var emitted = mt.emittedSelectors(sb);
  emitted.forEach(function (sel) {
    assert(consumed.indexOf(sel) >= 0,
      "the core emits \"" + sel + "\" but nothing in the patch routes or draws it");
  });
  // and nothing in the patch is waiting on a selector the core never sends.
  // Only the routes: a jsui's handlers include its own names (paint, and the
  // mouse handlers to come), which the core has no business emitting.
  routed.selectors.forEach(function (sel) {
    assert(emitted.indexOf(sel) >= 0, "the patch routes \"" + sel + "\" but the core never emits it");
  });
});

// Max numbers a subpatcher's inlets left to right, by where the [inlet] boxes
// sit in the patching view — not by the order the builder created them. A test
// that wants to know which cord in the parent feeds a given inlet has to sort
// them the same way Max does.
function inletOrder(pat, id) {
  var ins = pat.boxes.filter(function (b) { return b.box.maxclass === "inlet"; })
    .map(function (b) { return b.box; })
    .sort(function (a, b) { return a.patching_rect[0] - b.patching_rect[0]; });
  for (var i = 0; i < ins.length; i++) if (ins[i].id === id) return i;
  return -1;
}

// the box holding this patcher, and the patcher holding that box
function hostOf(root, pat) {
  var found = null;
  (function walk(p) {
    p.boxes.forEach(function (b) {
      if (b.box.patcher === pat) found = { id: b.box.id, pat: p };
      else if (b.box.patcher) walk(b.box.patcher);
    });
  })(root);
  return found;
}

// Which of the core's outlets a display really hears, followed cord by cord. A
// jsui inside a window is fed by a local [inlet], so the walk carries on one
// patcher up: the inlet's place among its siblings is the inlet number on the
// subpatcher box, and that is the cord to pick up next.
function coreOutletsFeeding(root, pat, boxId, inletIdx) {
  var out = {};
  mt.feeders(pat, boxId).forEach(function (f) {
    if (inletIdx !== undefined && f.inlet !== inletIdx) return;
    if (f.text === "js pg-core.js") { out[f.outlet] = 1; return; }
    if (f.maxclass !== "inlet") return;
    var host = hostOf(root, pat);
    if (!host) return;
    coreOutletsFeeding(root, host.pat, host.id, inletOrder(pat, f.id))
      .forEach(function (n) { out[n] = 1; });
  });
  return Object.keys(out).map(Number);
}

// anything() is not the whole of Max's dispatch. A selector is resolved against
// the script's globals first, and a js script's globals are not only its own —
// Max's are already there (m4lkit/maxtest.js, MAX_JS_GLOBALS). A selector that
// matches one of those never reaches anything(): it runs Max's function. The
// core's "post" is exactly that collision — the post-filter drive on the synth
// outlet, and also Max's printer — and nothing shows it going wrong except
// numbers appearing in the Max window, which no test can see. So the rule is
// checked at the source: every script fed one of the core's outlets whole has
// to claim, by name, each selector on it that Max already owns.
//
// Not every display is fed that way. pg-knob.js is hung off the dials it
// draws, one [prepend] each, so the builder chose the selector — and then the
// question is simply whether the script answers to the name on the box.
test("no selector reaches a display by way of a Max built-in", function () {
  var scripts = 0;
  [PATCH, MIDI_PATCH].forEach(function (file) {
    var patch = mt.readPatch(file);
    var sb = exerciseEverything();
    mt.jsuiBoxes(patch).forEach(function (j) {
      var fed = mt.feeders(j.patcher, j.id);
      assert(fed.length > 0,
        j.filename + " in " + path.basename(file) + " is fed by nothing at all");
      var claimed = mt.jsHandlers(path.join(DEVICE, j.filename));

      // A [prepend] names the selector outright, so there is nothing to infer
      // and no anything() to fall through to: a name the script does not
      // answer to is a display that silently never updates.
      fed.forEach(function (f) {
        var m = /^prepend\s+(\S+)/.exec(String(f.text || ""));
        if (!m) return;
        assert(claimed.indexOf(m[1]) >= 0,
          j.filename + " is fed \"" + m[1] + "\" by a [" + f.text +
          "] and has no handler of that name");
      });

      var outs = coreOutletsFeeding(patch, j.patcher, j.id);
      if (!outs.length) return;    // control-fed, and already checked above
      scripts++;
      outs.forEach(function (n) {
        mt.emittedSelectors(sb, n).forEach(function (sel) {
          if (mt.MAX_JS_GLOBALS.indexOf(sel) < 0) return;
          assert(claimed.indexOf(sel) >= 0,
            j.filename + " is fed \"" + sel + "\" on the core's outlet " + n +
            ", and " + sel + " is one of Max's own globals: anything() never sees it, " +
            "Max's " + sel + "() runs instead. Give the script a handler of that name.");
        });
      });
    });
  });
  assert(scripts > 0, "no jsui was reached by the walk up from the core's outlets");
});

// the other half of the same contract: every control in the patch has to reach
// a handler that exists, or the dial turns and nothing happens
test("every UI control in the built device reaches a core handler", function () {
  // The page buttons drop out on their own wiring — patchControls follows each
  // message box's cords and skips the ones that only reach [pcontrol] or
  // [thispatcher], so opening a window is never mistaken for a musical control.
  var controls = mt.patchControls(mt.readPatch(PATCH), ["set", "Restore", "pos"]);
  assert(controls.length >= 20, "found only " + controls.length + " controls to check");
  var sb = makeSandbox();
  controls.forEach(function (c) {
    assert(mt.hasHandler(sb, c.name),
      "the patch sends \"" + c.name + "\" but pg-core.js has no such handler");
    if (c.value === undefined) call(sb, c.name);
    else call(sb, c.name, c.value);
  });
});

// §5.4 where the lane ended up. The rack is the view a player has open all
// the time, so the lane has to be there and not only in the window they may
// never open; and both views are fed by the same outlet, unrouted, because
// [route] would eat the selectors they read.
test("the built device shows the lane in the rack, not a waveform", function () {
  var patch = mt.readPatch(PATCH);
  var lanes = mt.jsuiBoxes(patch).filter(function (j) {
    return j.filename === "pg-lane.js";   // the mod-ring overlays are their own test
  });
  assert(lanes.length === 2, "expected a rack lane and a window lane, found " + lanes.length);

  lanes.forEach(function (j) {
    assert(j.args.length === 1, j.varname + " has no view argument");
  });
  var views = lanes.map(function (j) { return j.args[0] + "@" + (j.where || "rack"); });
  views.sort();
  assert(views.join(" ") === "rack@rack window@wave_window",
    "the lanes are not where they should be: " + views.join(" "));

  // it took the waveform strip's place: the rack has no scope~ left, and the
  // lane fills the height that strip used to
  var rack = lanes.filter(function (j) { return j.args[0] === "rack"; })[0];
  patch.boxes.forEach(function (b) {
    assert(b.box.maxclass !== "newobj" || String(b.box.text).indexOf("scope~") !== 0,
      "the rack still has a scope~ competing with the lane");
  });
  assert(rack.rect[3] >= 120, "the rack lane is only " + rack.rect[3] + " px tall");
  assert(rack.rect[1] + rack.rect[3] <= 169,
    "the rack lane runs past Live's 169 px device height");

  // outlet 3 straight in, no [route] in between — here, and through the
  // subpatcher's third inlet for the window lane
  var feeds = mt.feeders(patch, rack.id);
  assert(feeds.length === 1 && feeds[0].text === "js pg-core.js" && feeds[0].outlet === 3,
    "the rack lane is not fed by the core's phrase outlet: " + JSON.stringify(feeds));

  var win = lanes.filter(function (j) { return j.args[0] === "window"; })[0];
  var winFeeds = mt.feeders(win.patcher, win.id);
  assert(winFeeds.length === 1 && winFeeds[0].maxclass === "inlet",
    "the window lane is not fed by its subpatcher inlet: " + JSON.stringify(winFeeds));
  var sub = patch.boxes.filter(function (b) { return b.box.varname === "wave_window"; })[0];
  var subFeeds = mt.feeders(patch, sub.box.id).filter(function (f) { return f.outlet === 3; });
  assert(subFeeds.length === 1 && subFeeds[0].text === "js pg-core.js",
    "the sound-design window is not fed the phrase outlet");
});

// The MIDI-effect build has no audio at all, so the lane is the only display
// it could have — and it is the build where seeing the notes matters most.
test("the MIDI build gets the same rack lane", function () {
  var patch = mt.readPatch(MIDI_PATCH);
  var lanes = mt.jsuiBoxes(patch);
  assert(lanes.length === 1, "expected one lane in the MIDI build, found " + lanes.length);
  assert(lanes[0].args[0] === "rack", "the MIDI build's lane is not the rack view");

  var feeds = mt.feeders(patch, lanes[0].id);
  assert(feeds.length === 1 && feeds[0].text === "js pg-core.js" && feeds[0].outlet === 3,
    "the MIDI build's lane is not fed by the phrase outlet: " + JSON.stringify(feeds));

  // and edits go back, the same as in the instrument: this build has no window,
  // so the rack strip is the only place its notes can be corrected at all
  var core = patch.boxes.filter(function (b) {
    return String(b.box.text || "").indexOf("js pg-core.js") === 0;
  })[0];
  var back = mt.feeders(patch, core.box.id).filter(function (f) { return f.id === lanes[0].id; });
  assert(back.length === 1 && back[0].inlet === 0,
    "the MIDI build's lane cannot send a stepedit back to the core");

  var sb = makeSandbox();
  call(sb, "pushall");
  tickSteps(sb, 32);
  var emitted = mt.emittedSelectors(sb, 3);
  mt.jsuiHandlers(patch, DEVICE).forEach(function (h) {
    assert(emitted.indexOf(h) >= 0,
      "the MIDI build's lane waits on \"" + h + "\" but the core never sends it");
  });
});

// ---------------------------------------------------------------- the window

// Readers for the two-page sound-design window. The builder's own box keys are
// not written into the patch, so these find things the way Max and Live find
// them: subpatchers by varname, controls by maxclass and parameter_longname,
// and a section by the caption printed inside a panel's top-left corner.
function subpatch(pat, varname) {
  var box = pat.boxes.filter(function (b) { return b.box.varname === varname; })[0];
  if (!box) throw new Error("no subpatcher named " + varname + " in this patcher");
  return box.box.patcher;
}

// every live.* control in one patcher, in build order. A live.menu is as much a
// stage's control as a live.dial is, so both count.
function liveControls(pat) {
  return pat.boxes.map(function (b) { return b.box; })
    .filter(function (b) { return String(b.maxclass).indexOf("live.") === 0; })
    .map(function (b) {
      return { name: b.saved_attribute_attributes.valueof.parameter_longname,
               maxclass: b.maxclass, rect: b.presentation_rect };
    });
}

function controlNames(pat) {
  return liveControls(pat).map(function (c) { return c.name; });
}

// panel + the caption ui.section() prints at its inset corner, sorted the way
// the page reads: rows down, then left to right. Read off the geometry, since
// what a player sees as a group is the tint behind the controls, not a key.
function sections(pat) {
  var boxes = pat.boxes.map(function (b) { return b.box; });
  var labels = boxes.filter(function (b) {
    return b.maxclass === "comment" && b.presentation_rect;
  });
  return boxes.filter(function (b) { return b.maxclass === "panel" && b.presentation_rect; })
    .map(function (b) {
      var r = b.presentation_rect;
      var cap = labels.filter(function (c) {
        return c.presentation_rect[0] === r[0] + 8 && c.presentation_rect[1] === r[1] + 2;
      })[0];
      return cap ? { label: cap.text, rect: r } : null;
    })
    .filter(Boolean)
    .sort(function (a, b) { return (a.rect[1] - b.rect[1]) || (a.rect[0] - b.rect[0]); });
}

function inside(rect, outer) {
  return rect[0] >= outer[0] && rect[1] >= outer[1] &&
         rect[0] + rect[2] <= outer[0] + outer[2] &&
         rect[1] + rect[3] <= outer[1] + outer[3];
}

// the box texts a box's output runs through, forward. Page navigation is
// wiring, not captions — the captions are the part most likely to be reworded.
function chainFrom(pat, text) {
  var byId = {}, start = null;
  pat.boxes.forEach(function (b) {
    byId[b.box.id] = b.box;
    if (b.box.text === text) start = b.box.id;
  });
  if (start === null) throw new Error("no box reading \"" + text + "\" in this patcher");
  var out = [], seen = {}, queue = [start];
  while (queue.length) {
    var from = queue.shift();
    if (seen[from]) continue;
    seen[from] = 1;
    (pat.lines || []).forEach(function (l) {
      if (l.patchline.source[0] !== from) return;
      var dst = byId[l.patchline.destination[0]];
      if (!dst) return;
      out.push(dst.text || dst.maxclass);
      queue.push(dst.id);
    });
  }
  return out;
}

// §2 the signal path, drawn as the signal path. A player reaching for the
// filter should find it where the filter is — after the oscillator and the sub,
// before the shaping and the space — so the window's order is the audio order,
// left to right and top to bottom.
test("the sound page is grouped by signal flow", function () {
  var wp = subpatch(mt.readPatch(PATCH), "wave_window");
  var secs = sections(wp);
  var order = secs.map(function (s) { return s.label; });
  var stages = order.filter(function (l) { return l !== "PAGE"; });
  assert(stages.join(" ") === "OSC SUB FILTER SHAPE SPACE CHARACTER",
    "the sound page does not read in signal order: " + stages.join(" "));
  assert(order[order.length - 1] === "PAGE",
    "the page tab is not last on the page: " + order.join(" "));

  // and each stage holds exactly its own controls — a dial sitting under the
  // wrong caption is the one failure this whole regrouping exists to prevent
  var BELONGS = {
    OSC: "Wave PWM Fold", SUB: "Sub SubSat SubOct",
    FILTER: "Squelch Cutoff Decay Drive Mode", SHAPE: "Chunk WobRate WobDepth",
    SPACE: "Wet Width", CHARACTER: "Design"
  };
  var controls = liveControls(wp), placed = 0;
  secs.forEach(function (s) {
    if (!BELONGS[s.label]) return;
    var held = controls.filter(function (c) { return inside(c.rect, s.rect); })
      .map(function (c) { return c.name; });
    placed += held.length;
    assert(held.join(" ") === BELONGS[s.label],
      s.label + " holds \"" + held.join(" ") + "\", not \"" + BELONGS[s.label] + "\"");
  });
  assert(placed === controls.length,
    (controls.length - placed) + " control(s) on the sound page sit outside every stage");
});

// §6 the meta controls, where they belong. Squelch, Chunk, Wet and Design each
// scale what the rest of their stage does, so they lead it: drawn bigger than
// the dials they move, and bottom-aligned with them so the names stay on one
// baseline whatever the knob size.
test("the four sound macros lead their stage, drawn larger", function () {
  var wp = subpatch(mt.readPatch(PATCH), "wave_window");
  var secs = sections(wp);
  var dials = liveControls(wp).filter(function (c) { return c.maxclass === "live.dial"; });
  var MACROS = "Squelch Chunk Wet Design".split(" ");
  var big = dials.filter(function (d) { return MACROS.indexOf(d.name) >= 0; });
  assert(big.length === MACROS.length,
    "expected " + MACROS.length + " promoted macros on the sound page, found " + big.length);

  // the per-stage dials are all one size, so "bigger" reads as a rank and not
  // as an accident of layout
  var plain = dials.filter(function (d) { return MACROS.indexOf(d.name) < 0; });
  var w = plain[0].rect[2];
  plain.forEach(function (d) {
    assert(d.rect[2] === w, d.name + " is " + d.rect[2] + " px wide, not " + w);
  });

  big.forEach(function (d) {
    assert(d.rect[2] > w, d.name + " is no bigger than the dials it scales");
    var stage = secs.filter(function (s) { return inside(d.rect, s.rect); })[0];
    assert(stage, d.name + " is not inside any stage");
    dials.filter(function (o) { return inside(o.rect, stage.rect); }).forEach(function (o) {
      assert(o.rect[0] >= d.rect[0],
        stage.label + ": " + o.name + " sits ahead of the macro that leads it");
      assert(o.rect[1] + o.rect[3] === d.rect[1] + d.rect[3],
        stage.label + ": " + o.name + " does not share a bottom edge with " + d.name);
    });
  });
});

// §1/§5 what the generator plays, versus how it sounds. The groove family, the
// root, the length and the freezes are set once per project and then left
// alone, so they are off the page used for sculpting — which is also what stops
// Interlock reading as a tone control sitting among the filter dials.
test("the generative controls moved to a second page", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var cp = subpatch(wp, "comp_window");
  var sound = controlNames(wp), compose = controlNames(cp);
  "Groove Root Length Novelty Density Interlock Lock FrzRhythm FrzPitch FrzTimbre"
    .split(" ").forEach(function (n) {
      assert(compose.indexOf(n) >= 0, n + " is not on the compose page");
      assert(sound.indexOf(n) < 0, n + " is still on the sound page");
    });

  // the buttons that reroll a phrase, or one layer of it, went with them
  var buttons = cp.boxes.map(function (b) { return b.box; })
    .filter(function (b) { return b.maxclass === "message" && b.presentation === 1; })
    .map(function (b) { return b.text; });
  "Mutate Return Reseed Rhythm Pitch Accent Slide Sound Capture".split(" ")
    .forEach(function (n) {
      assert(buttons.indexOf(n) >= 0, n + " is not on the compose page");
    });

  // and it is a page, not a dead end: a subpatcher's controls cannot patchcord
  // to the core two patchers up, so they leave through its outlet, into the
  // sound page's outlet, into js — one break anywhere and the page goes silent
  var pageOut = cp.boxes.map(function (b) { return b.box; })
    .filter(function (b) { return b.maxclass === "outlet"; });
  assert(pageOut.length === 1,
    "the compose page has " + pageOut.length + " outlets, expected one");
  var feeds = mt.feeders(cp, pageOut[0].id);
  var shims = feeds.filter(function (f) { return String(f.text).indexOf("prepend ") === 0; });
  assert(shims.length === compose.length,
    "the compose page has " + compose.length + " controls but only " +
    shims.length + " of them reach its outlet");
  // the reroll buttons wire straight in, with no prepend to name them — and
  // Sculpt is not among them, because a page tab is not a musical control
  var rerolls = feeds.filter(function (f) { return f.maxclass === "message"; })
    .map(function (f) { return f.text; }).sort();
  assert(rerolls.join(" ") === "Accent Capture Mutate Pitch Reseed Return Rhythm Slide Sound",
    "the compose page's buttons do not all reach its outlet: " + rerolls.join(" "));

  var winOut = wp.boxes.map(function (b) { return b.box; })
    .filter(function (b) { return b.maxclass === "outlet" && b.comment === "control messages out"; })[0];
  assert(mt.feeders(wp, winOut.id).filter(function (f) { return f.text === "p comp_window"; }).length === 1,
    "the compose page's controls never leave its window");
  var js = patch.boxes.filter(function (b) {
    return String(b.box.text).indexOf("js pg-core") === 0;
  })[0];
  assert(mt.feeders(patch, js.box.id).filter(function (f) { return f.text === "p wave_window"; }).length === 1,
    "the window's controls never reach the core");

  // Compose opens the page, Sculpt closes it and uncovers the one underneath
  assert(chainFrom(wp, "Compose").slice(0, 3).join(" > ") === "open > pcontrol > p comp_window",
    "the Compose button does not open the compose page");
  assert(chainFrom(cp, "Sculpt").join(" > ") === "wclose > thispatcher",
    "the Sculpt button does not close the compose page");
});

// The open item the regrouping had to settle first. Live builds automation,
// MIDI mapping and Push's bank layout from the device's top-level parameter
// map, and moving every control into a subpatcher window emptied it — 27
// entries became 0. A nested parameter is addressed "<subpatcher>::<its own
// id>", one hop per level, so the map has to be lifted, not left behind.
test("the nested window keeps Live's parameter map and Push banks", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var cp = subpatch(wp, "comp_window");
  var params = patch.parameters || {};
  var addrs = Object.keys(params).filter(function (k) { return k.indexOf("obj-") === 0; });
  var named = addrs.map(function (k) { return params[k][0]; });

  var expected = controlNames(wp).concat(controlNames(cp));
  assert(expected.length > 0, "no live controls in the window at all");
  expected.forEach(function (n) {
    assert(named.indexOf(n) >= 0,
      "Live cannot see " + n + ": it is not in the device's parameter map");
  });
  assert(named.length === expected.length,
    "the parameter map holds " + named.length + " entries for " + expected.length + " controls");

  // one "::" per subpatcher between a control and the device
  controlNames(cp).forEach(function (n) {
    var k = addrs.filter(function (a) { return params[a][0] === n; })[0];
    assert(k.split("::").length === 3,
      n + " is addressed \"" + k + "\", not two levels down");
  });

  // and Push pages through the same order the window reads in
  var banks = params.parameterbanks || {};
  assert(banks["0"] && banks["0"].parameters.join(" ") ===
    "Wave PWM Fold Sub SubSat SubOct Squelch Cutoff",
    "Push's first bank is not the head of the signal path: " +
    (banks["0"] ? banks["0"].parameters.join(" ") : "no banks at all"));
  var banked = [];
  Object.keys(banks).forEach(function (i) {
    banks[i].parameters.forEach(function (n) { if (n !== "-") banked.push(n); });
  });
  assert(banked.join(" ") === named.join(" "),
    "the Push banks and the parameter map disagree:\n      " +
    banked.join(" ") + "\n      " + named.join(" "));
});

// ---------------------------------------------------------------- the mod rings

// §2.8 Design lets each phrase's own sound push six of the dials on the sound
// page. §5.5 draws that push as a second ring inside the dial it moved, so the
// movement reads as the instrument working rather than as a dial with a fault.
//
// Each ring is named for the selector on the core's synth outlet that carries
// its pushed value — that is how device/pg-mod.js addresses it — and the ring
// belongs to the dial holding the sound key that selector was scaled from.
var MOD_RINGS = {   // ring name (= core selector) -> { sound key, dial }
  wave:    { key: "wave",     dial: "Wave" },
  pw:      { key: "pw",       dial: "PWM" },
  fold:    { key: "fold",     dial: "Fold" },
  subdrv:  { key: "subsat",   dial: "SubSat" },
  wobrate: { key: "wobrate",  dial: "WobRate" },
  wobcut:  { key: "wobdepth", dial: "WobDepth" }
};
var C_RING = [0.980, 0.780, 0.459];   // pg-mod.js RING — the lane's amber again

// live.dial's sweep, stated here rather than imported: 270 degrees with the gap
// at the bottom, running lower-left round to lower-right, clockwise because y
// is down. A ring drawn on any other arc would not line up with the dial.
var DIAL_A0 = Math.PI * 0.75, DIAL_SPAN = Math.PI * 1.5;

function modOverlays(pat) {
  return mt.jsuiBoxes(pat).filter(function (j) { return j.filename === "pg-mod.js"; });
}

// the rings one overlay declares, as {name, cx, cy, r} in that box's own
// coordinates — four creation arguments each, exactly as pg-mod.js reads them
function ringsOf(j) {
  var out = [];
  for (var i = 0; i + 3 < j.args.length; i += 4) {
    out.push({ name: String(j.args[i]), cx: +j.args[i + 1],
               cy: +j.args[i + 2], r: +j.args[i + 3] });
  }
  return out;
}

function dialRect(pat, longname) {
  var d = liveControls(pat).filter(function (c) { return c.name === longname; })[0];
  if (!d) throw new Error("no control named " + longname + " on the sound page");
  return d.rect;
}

function overlaps(a, b) {
  return a[0] < b[0] + b[2] && b[0] < a[0] + a[2] &&
         a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
}

// Max's own dispatch, replayed: every message the core put on its synth outlet
// goes to the handler of that name, or to anything() when there is none. The
// overlay takes that outlet whole, so this is the traffic it really sees — and
// a missing anything() shows up here as a throw, the way Max shows it as an
// error in its window.
function feedSynth(sb, mod) {
  sb.__state.out[0].forEach(function (m) {
    var sel = String(m[0]);
    callArgs(mod, mt.hasHandler(mod, sel) ? sel : "anything", m.slice(1));
  });
}

function makeMod(j) {
  return mt.loadJsui(path.join(DEVICE, "pg-mod.js"),
                     { width: j.rect[2], height: j.rect[3], args: j.args })();
}

test("every dial a phrase moves wears a ring, and no other dial does", function () {
  var patch = mt.readPatch(PATCH);
  var mods = modOverlays(patch);
  assert(mods.length === 2, "expected one ring overlay per dial row, found " + mods.length);
  mods.forEach(function (j) {
    assert(j.where === "wave_window", "a ring overlay sits in " + (j.where || "the rack"));
  });

  var named = [];
  mods.forEach(function (j) {
    ringsOf(j).forEach(function (r) { named.push(r.name); });
  });
  named.sort();
  var want = Object.keys(MOD_RINGS).sort();
  assert(named.join(" ") === want.join(" "),
    "the rings are " + named.join(" ") + ", not " + want.join(" "));

  // the same six the core calls a phrase's sound — a key added to §2.8 without
  // a ring would be a dial moving with no explanation all over again
  var keys = named.map(function (n) { return MOD_RINGS[n].key; }).sort();
  assert(keys.join(" ") === SOUND_KEYS.slice().sort().join(" "),
    "the rings cover " + keys.join(" ") + ", but a phrase's sound is " + SOUND_KEYS.join(" "));

  // and every ring name is a selector the core really sends, so a rename in
  // pushSynth() cannot leave a ring waiting on a message that never comes
  var sb = makeSandbox();
  call(sb, "pushall");
  var emitted = mt.emittedSelectors(sb);
  named.forEach(function (n) {
    assert(emitted.indexOf(n) >= 0,
      "a ring listens for \"" + n + "\", but the core never emits it");
  });
});

test("a ring is drawn on its own dial's knob, inside the overlay", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");

  modOverlays(patch).forEach(function (j) {
    var box = j.rect;
    ringsOf(j).forEach(function (r) {
      var d = dialRect(wp, MOD_RINGS[r.name].dial);
      var cx = box[0] + r.cx, cy = box[1] + r.cy;     // window coordinates

      assert(Math.abs(cx - (d[0] + d[2] / 2)) < 0.5,
        r.name + "'s ring is off the dial's centre line by " +
        (cx - (d[0] + d[2] / 2)).toFixed(2) + " px");
      // the knob hangs under the name label, well above the value readout
      var up = (cy - d[1]) / d[3];
      assert(up > 0.3 && up < 0.6,
        r.name + "'s ring centre sits " + Math.round(up * 100) + "% down its dial");

      // big enough to read as a ring, never wider than the knob can be
      assert(r.r <= d[2] / 4 && r.r >= d[2] / 8,
        r.name + "'s ring radius is " + r.r + " on a " + d[2] + " px dial");
      assert(cx - r.r >= d[0] && cx + r.r <= d[0] + d[2] &&
             cy - r.r >= d[1] && cy + r.r <= d[1] + d[3],
        r.name + "'s ring spills outside its dial");

      // and inside the jsui, or Max clips it
      assert(r.cx - r.r >= 0 && r.cy - r.r >= 0 &&
             r.cx + r.r <= box[2] && r.cy + r.r <= box[3],
        r.name + "'s ring is clipped by the overlay's own edge");
    });
  });
});

test("a ring overlay lets the dial under it take the mouse", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var boxes = wp.boxes.map(function (b) { return b.box; });
  var order = {};
  boxes.forEach(function (b, i) { order[b.id] = i; });

  modOverlays(patch).forEach(function (j) {
    var box = boxes.filter(function (b) { return b.id === j.id; })[0];
    assert(box.ignoreclick === 1, "a ring overlay is not click-through");
    assert(box.border === 0, "a ring overlay draws a border over the dials");
    assert(box.parameter_enable === 0, "a ring overlay claims a Live parameter");

    // in front of the dials, or the rings paint under them and never show.
    // Box order is front-to-back (m4lkit/patch.py, _ordered_boxes), so the
    // overlay has to come first even though it is built last.
    boxes.forEach(function (b) {
      if (!b.presentation_rect || b.maxclass !== "live.dial") return;
      if (!overlaps(j.rect, b.presentation_rect)) return;
      assert(order[j.id] < order[b.id],
        "a ring overlay sits behind the dial it rings");
    });

    // it spans only the dials between its first and last ring: anything else
    // that takes a click stays clear of it, so ignoreclick is the second line
    // of defence rather than the only one
    boxes.forEach(function (b) {
      if (!b.presentation_rect) return;
      // a jsui that has not given the mouse away is a control like any other:
      // the step lane answers clicks, so an overlay must not land on top of it
      var clickable = String(b.maxclass).indexOf("live.") === 0 ||
                      b.maxclass === "message" ||
                      (b.maxclass === "jsui" && b.ignoreclick !== 1);
      if (!clickable || b.maxclass === "live.dial") return;
      assert(!overlaps(j.rect, b.presentation_rect),
        "a ring overlay covers a " + b.maxclass + " at " + b.presentation_rect.join(","));
    });
  });

  // fed the synth stream whole, through the window's own inlet — the same
  // unrouted idiom the lane uses, because [route] would strip these names
  modOverlays(patch).forEach(function (j) {
    var feeds = mt.feeders(j.patcher, j.id);
    assert(feeds.length === 1 && feeds[0].maxclass === "inlet",
      "a ring overlay is not fed by a subpatcher inlet: " + JSON.stringify(feeds));
  });
  var sub = patch.boxes.filter(function (b) { return b.box.varname === "wave_window"; })[0];
  var synth = mt.feeders(patch, sub.box.id).filter(function (f) { return f.inlet === 3; });
  assert(synth.length === 1 && synth[0].text === "js pg-core.js" && synth[0].outlet === 0,
    "the window's ring inlet is not fed the core's synth outlet: " + JSON.stringify(synth));
});

// The whole point of reading the synth outlet instead of recomputing §2.8 is
// that the ring cannot disagree with what is audible. That only holds while
// each handler undoes exactly the scaling pushSynth() applied, so check the
// round trip against the core's own soundNow(), which dump publishes.
test("a ring reads back the value the core is really playing", function () {
  var patch = mt.readPatch(PATCH);
  var mods = modOverlays(patch);

  var sb = makeSandbox();
  call(sb, "design", 1);          // full push, so every ring is off its dial
  call(sb, "Sound");
  call(sb, "dump");
  var sound = lastDump(sb).sound;

  var checked = 0;
  mods.forEach(function (j) {
    var mod = makeMod(j);
    feedSynth(sb, mod);
    mt.evalIn(mod, "rings").forEach(function (r) {
      var want = sound[MOD_RINGS[r.name].key];
      assert(r.v !== null, r.name + "'s ring heard nothing on the synth outlet");
      assert(Math.abs(r.v - want) < 1e-6,
        r.name + "'s ring shows " + r.v + " where the core is playing " + want);
      checked++;
    });
  });
  assert(checked === 6, "only " + checked + " of the six rings were checked");

  // and with Design at zero a phrase pushes nothing, so every ring lands back
  // on its dial's own value — the reading that makes the gap mean something
  var flat = makeSandbox();
  call(flat, "design", 0);
  ["wave", "pw", "fold", "wobrate", "wobdepth", "subsat"]
    .forEach(function (m) { call(flat, m, 0.62); });
  call(flat, "Sound");
  var mod = makeMod(mods[0]);
  feedSynth(flat, mod);
  mt.evalIn(mod, "rings").forEach(function (r) {
    assert(Math.abs(r.v - 0.62) < 1e-6,
      "at Design 0 " + r.name + "'s ring reads " + r.v + ", not the dial's 0.62");
  });
});

test("the ring follows live.dial's own sweep", function () {
  var patch = mt.readPatch(PATCH);
  var j = modOverlays(patch)[0];
  var mod = makeMod(j);

  assert(mt.paint(mod).length === 0,
    "the overlay drew something before the core had said anything");

  var sb = makeSandbox();
  call(sb, "design", 1);
  call(sb, "Sound");
  feedSynth(sb, mod);
  var rings = mt.evalIn(mod, "rings");
  var ops = mt.paint(mod);

  var amber = mt.opsColored(ops, C_RING);
  assert(amber.length === rings.length * 2,
    "expected an arc and a tip per ring, found " + amber.length + " amber marks");

  rings.forEach(function (r) {
    // the ring is the amber stroke that starts where the dial's travel starts
    var arc = amber.filter(function (o) {
      if (o.op !== "stroke") return false;
      var p = o.points[0];
      return Math.abs(p[0] - (r.cx + r.r * Math.cos(DIAL_A0))) < 0.01 &&
             Math.abs(p[1] - (r.cy + r.r * Math.sin(DIAL_A0))) < 0.01;
    });
    assert(arc.length === 1, r.name + " has " + arc.length + " arcs from the dial's zero");

    var end = arc[0].points[arc[0].points.length - 1];
    var got = Math.atan2(end[1] - r.cy, end[0] - r.cx);
    var want = DIAL_A0 + DIAL_SPAN * r.v;
    while (got < DIAL_A0 - 1e-9) got += Math.PI * 2;
    assert(Math.abs(got - want) < 1e-6,
      r.name + "'s ring ends at " + got.toFixed(4) + " rad, not " + want.toFixed(4));
    assert(Math.abs(Math.sqrt(Math.pow(end[0] - r.cx, 2) +
                              Math.pow(end[1] - r.cy, 2)) - r.r) < 1e-6,
      r.name + "'s ring is not a circle of its own radius");
  });

  // the faint travel behind each ring, so a short arc still reads as a value
  var track = ops.filter(function (o) {
    return o.op === "stroke" && o.color[0] === 1 && o.color[3] < 0.2;
  });
  assert(track.length === rings.length,
    "expected one track per ring, found " + track.length);

  ops.forEach(function (o) {
    assert(o.x >= -1 && o.y >= -1 && o.x1 <= j.rect[2] + 1 && o.y1 <= j.rect[3] + 1,
      "a ring overlay drew outside its box: " + JSON.stringify([o.x, o.y, o.x1, o.y1]));
  });
});

// ----------------------------------------------------------------
// The knobs themselves.
//
// Two things happened here at once, and they are separable on purpose. Every
// live.dial in the device now carries its stage's colours instead of Max's
// factory grey (m4lkit/ui.py, dial_look), and one stage — OSC — has its dials
// turned transparent and drawn over by device/pg-knob.js instead (Row.knobs).
// The second only works because of what it does *not* do: the live.dial stays
// where it was, keeps its parameter, and keeps the mouse, so automation, MIDI
// mapping and Push never learn that anything changed. These tests hold that
// line — a promoted dial that stopped being a real control, or a drawn knob
// that drifted off the dial under it, would both look fine in a screenshot.

var C_NEUTRAL = [0.827, 0.820, 0.780];   // ui.py NEUTRAL: RAMP gray's label200

function contains(outer, inner) {
  return inner[0] >= outer[0] && inner[1] >= outer[1] &&
         inner[0] + inner[2] <= outer[0] + outer[2] &&
         inner[1] + inner[3] <= outer[1] + outer[3];
}

function sameRGB(a, b, tol) {
  tol = tol === undefined ? 0.002 : tol;
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol &&
         Math.abs(a[2] - b[2]) <= tol;
}

// A stage paints its caption in its own ink (m4lkit/ui.py, section), so the
// caption is where a test reads what colour a stage is — no second copy of the
// RAMP table here to fall out of step with the one in ui.py.
function stageOf(pat, rect) {
  var boxes = pat.boxes.map(function (b) { return b.box; });
  var panel = boxes.filter(function (b) {
    return b.maxclass === "panel" && b.presentation_rect &&
           contains(b.presentation_rect, rect);
  })[0];
  if (!panel) return null;
  var p = panel.presentation_rect;
  var lbl = boxes.filter(function (b) {
    return b.maxclass === "comment" && b.presentation_rect &&
           Math.abs(b.presentation_rect[0] - (p[0] + 8.0)) < 0.01 &&
           Math.abs(b.presentation_rect[1] - (p[1] + 2.0)) < 0.01;
  })[0];
  return lbl ? { label: String(lbl.text), ink: lbl.textcolor } : null;
}

function eachPatcher(pat, fn, where) {
  fn(pat, where || "the rack");
  pat.boxes.forEach(function (b) {
    if (b.box.patcher) eachPatcher(b.box.patcher, fn, b.box.varname || where);
  });
}

function dialBoxes(pat) {
  return pat.boxes.map(function (b) { return b.box; })
    .filter(function (b) { return b.maxclass === "live.dial"; });
}

function knobOverlays(pat) {
  return mt.jsuiBoxes(pat).filter(function (j) { return j.filename === "pg-knob.js"; });
}

// what one overlay declares: the stage's ink once, then six atoms per knob,
// exactly as device/pg-knob.js reads them
function knobInk(j) { return [+j.args[0], +j.args[1], +j.args[2]]; }
// where a painted point lands relative to a knob: how far out, and how far
// round from live.dial's own start angle (0 at rest, DIAL_SPAN at full)
function radius(k, p) {
  return Math.sqrt(Math.pow(p[0] - k.cx, 2) + Math.pow(p[1] - k.cy, 2));
}
function sweep(k, p) {
  var a = Math.atan2(p[1] - k.cy, p[0] - k.cx) - DIAL_A0;
  while (a < -1e-9) a += Math.PI * 2;
  return a;
}

function knobsOf(j) {
  var out = [];
  for (var i = 3; i + 5 < j.args.length; i += 6) {
    out.push({ name: String(j.args[i]), label: String(j.args[i + 1]),
               cx: +j.args[i + 2], cy: +j.args[i + 3],
               r: +j.args[i + 4], v: +j.args[i + 5] });
  }
  return out;
}

test("every dial wears its stage's ink, and the filled arc is the one that carries it", function () {
  var seen = 0, total = 0, promoted = 0;
  eachPatcher(mt.readPatch(PATCH), function (pat) {
    dialBoxes(pat).forEach(function (d) {
      total++;
      var stage = stageOf(pat, d.presentation_rect);
      // Every dial belongs to a stage, and a stage is what tells it what
      // colour to be — one that landed outside every panel has nothing to take
      // its colour from, and would slip past the rest of this test unchecked.
      assert(stage, d.saved_attribute_attributes.valueof.parameter_longname +
        " sits inside no stage panel");
      seen++;
      var name = d.saved_attribute_attributes.valueof.parameter_longname;

      // Every one of them is set. A dial left half-styled falls back to Max's
      // factory grey for the rest, which is the look this was meant to end.
      ["dialcolor", "activedialcolor", "fgdialcolor", "activefgdialcolor",
       "needlecolor", "activeneedlecolor", "textcolor"].forEach(function (a) {
        assert(d[a] && d[a].length === 4, name + " leaves " + a + " at Max's default");
      });

      if (d.activedialcolor[3] === 0) { promoted++; return; }   // drawn instead

      // live.dial's colour roles do not read the way they are named:
      // dialcolor is the *filled* travel and fgdialcolor the track behind it,
      // which is how all 570 live.dials in Max's own BEAP and Vizzie packages
      // are set. Get it backwards and every dial shows its stage's colour as a
      // full ring that never moves, with the value drawn in grey on top.
      assert(sameRGB(d.activedialcolor, stage.ink),
        name + " fills its arc in " + d.activedialcolor.slice(0, 3).join(",") +
        ", but " + stage.label + " is " + stage.ink.slice(0, 3).join(","));
      assert(sameRGB(d.dialcolor, stage.ink) && d.dialcolor[3] < d.activedialcolor[3],
        name + " does not dim to the same ink when it is inactive");

      // the track is neutral and much fainter, so the value is what reads
      [d.fgdialcolor, d.activefgdialcolor].forEach(function (c) {
        assert(c[0] === c[1] && c[1] === c[2], name + "'s track is tinted, not neutral");
        assert(c[3] < d.activedialcolor[3] / 2,
          name + "'s track is as loud as the value on it");
      });
      assert(d.activefgdialcolor[3] > d.fgdialcolor[3],
        name + "'s track does not dim when the dial is inactive");

      // its own name and readout stay out of the stage's voice, so a line of
      // dials does not compete with the caption sitting above them
      assert(sameRGB(d.textcolor, C_NEUTRAL), name + "'s text is not neutral ink");
      assert(d.activeneedlecolor[3] > d.needlecolor[3],
        name + "'s needle does not dim when the dial is inactive");

      // live.dial's triangle is click-to-restore, a real affordance — kept,
      // and painted in the stage's ink like everything else it owns
      assert(d.triangle !== 0, name + " gives up live.dial's click-to-restore");
      assert(d.tricolor && sameRGB(d.tricolor, stage.ink),
        name + "'s triangle is not in its stage's ink");
      assert(d.tribordercolor === undefined,
        name + " sets tribordercolor, which Max marks obsolete");
    });
  });
  assert(seen === total && total === 18,
    "checked " + seen + " of " + total + " dials");
  assert(promoted > 0, "no stage hands its knobs to a [jsui]");
});

test("a drawn stage keeps every dial, and leaves it nothing to paint", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var overlays = knobOverlays(patch);
  assert(overlays.length === 1,
    "expected one hand-drawn stage, found " + overlays.length);
  var j = overlays[0];
  assert(j.where === "wave_window", "the drawn stage sits in " + (j.where || "the rack"));

  var stage = stageOf(wp, j.rect);
  assert(stage, "the drawn stage is not inside a panel");
  assert(sameRGB(knobInk(j), stage.ink),
    "pg-knob.js is handed " + knobInk(j).join(",") + ", but " +
    stage.label + " is " + stage.ink.slice(0, 3).join(","));

  var covered = dialBoxes(wp).filter(function (d) {
    return overlaps(j.rect, d.presentation_rect);
  });
  var declared = knobsOf(j);
  assert(covered.length === declared.length && covered.length === 3,
    "the overlay covers " + covered.length + " dials and draws " + declared.length);

  covered.forEach(function (d) {
    var v = d.saved_attribute_attributes.valueof;
    var name = v.parameter_longname;

    // Invisible, but by alpha — never `invisible 1`, which can take the mouse
    // with it. Only colours change here, and a colour cannot alter hit-testing.
    assert(d.invisible === undefined, name + " is hidden with `invisible`, not alpha");
    ["dialcolor", "activedialcolor", "fgdialcolor", "activefgdialcolor",
     "needlecolor", "activeneedlecolor", "textcolor", "tricolor",
     "focusbordercolor"].forEach(function (a) {
      assert(d[a] && d[a][3] === 0, name + " still paints " + a + " under the drawing");
    });
    // the text and the triangle are drawn by the script, or not at all — an
    // invisible triangle would be a hotspot with nothing on top of it
    assert(d.showname === 0 && d.shownumber === 0 && d.triangle === 0,
      name + " still draws its own name, readout or triangle");

    // and it is still, in every way Live can see, the control it always was
    assert(d.parameter_enable === 1, name + " stopped being a Live parameter");
    assert(v.parameter_initial_enable === 1 && v.parameter_type === 0,
      name + " lost its parameter setup");
    var drawn = declared.filter(function (k) { return k.label === name; })[0];
    assert(drawn, name + " is covered by the overlay but not drawn by it");
    assert(Math.abs(drawn.v - v.parameter_initial[0]) < 1e-6,
      name + " opens at " + v.parameter_initial[0] + " but is drawn at " + drawn.v);
  });
});

test("a drawn knob lands on the dial under it, and the ring lands inside it", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var j = knobOverlays(patch)[0];

  // every ring pg-mod.js draws, in window coordinates, to check the two
  // overlays agree about where a knob is — they are drawn by different scripts
  // from different boxes and have to share a centre, or the modulation ring
  // floats off the knob it belongs to
  var rings = {};
  modOverlays(patch).forEach(function (m) {
    ringsOf(m).forEach(function (r) {
      rings[MOD_RINGS[r.name].dial] =
        { cx: m.rect[0] + r.cx, cy: m.rect[1] + r.cy, r: r.r };
    });
  });

  knobsOf(j).forEach(function (k) {
    var d = dialRect(wp, k.label);
    var cx = j.rect[0] + k.cx, cy = j.rect[1] + k.cy;

    assert(Math.abs(cx - (d[0] + d[2] / 2)) < 0.5,
      k.label + "'s knob is off the dial's centre line by " +
      (cx - (d[0] + d[2] / 2)).toFixed(2) + " px");
    var up = (cy - d[1]) / d[3];
    assert(up > 0.3 && up < 0.6,
      k.label + "'s knob centre sits " + Math.round(up * 100) + "% down its dial");

    // the whole knob inside the dial's box, and inside the jsui, or Max clips
    assert(cx - k.r >= d[0] && cx + k.r <= d[0] + d[2] &&
           cy - k.r >= d[1] && cy + k.r <= d[1] + d[3],
      k.label + "'s knob spills outside its dial");
    assert(k.cx - k.r >= 0 && k.cy - k.r >= 0 &&
           k.cx + k.r <= j.rect[2] && k.cy + k.r <= j.rect[3],
      k.label + "'s knob is clipped by the overlay's own edge");

    var ring = rings[k.label];
    assert(ring, k.label + " is drawn as a knob but wears no modulation ring");
    assert(Math.abs(ring.cx - cx) < 0.5 && Math.abs(ring.cy - cy) < 0.5,
      k.label + "'s ring and its knob do not share a centre");
    assert(ring.r < k.r,
      k.label + "'s modulation ring is drawn outside the knob it modulates");
  });
});

test("a drawn knob sits over its dials, under the rings, and out of the mouse's way", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var boxes = wp.boxes.map(function (b) { return b.box; });
  var order = {};
  boxes.forEach(function (b, i) { order[b.id] = i; });

  var j = knobOverlays(patch)[0];
  var box = boxes.filter(function (b) { return b.id === j.id; })[0];
  assert(box.ignoreclick === 1, "the drawn knobs eat the click meant for the dial");
  assert(box.border === 0, "the drawn knobs draw a border round the stage");
  assert(box.parameter_enable === 0, "the drawn knobs claim a Live parameter");

  // Box order is front-to-back (m4lkit/patch.py, _ordered_boxes). The drawing
  // has to be in front of the dials it replaces and behind the modulation
  // rings, so the amber ring still reads on top of the knob body.
  boxes.forEach(function (b) {
    if (b.maxclass !== "live.dial" || !b.presentation_rect) return;
    if (!overlaps(j.rect, b.presentation_rect)) return;
    assert(order[j.id] < order[b.id], "the drawn knobs paint behind their own dials");
  });
  modOverlays(patch).forEach(function (m) {
    if (!overlaps(j.rect, m.rect)) return;
    assert(order[m.id] < order[j.id],
      "a modulation ring is painted under the knob body and never shows");
  });

  // and it covers nothing else that answers to a click
  boxes.forEach(function (b) {
    if (!b.presentation_rect || b.maxclass === "live.dial") return;
    var clickable = String(b.maxclass).indexOf("live.") === 0 ||
                    b.maxclass === "message" ||
                    (b.maxclass === "jsui" && b.ignoreclick !== 1);
    if (!clickable) return;
    assert(!overlaps(j.rect, b.presentation_rect),
      "the drawn knobs cover a " + b.maxclass + " at " + b.presentation_rect.join(","));
  });
});

test("a drawn knob is told what its own dial is doing, and the core still is too", function () {
  var patch = mt.readPatch(PATCH);
  var wp = subpatch(patch, "wave_window");
  var j = knobOverlays(patch)[0];
  var drawn = knobsOf(j);

  var feeds = mt.feeders(wp, j.id);
  assert(feeds.length === drawn.length,
    "the overlay draws " + drawn.length + " knobs and is fed by " + feeds.length + " cords");

  drawn.forEach(function (k) {
    var pre = feeds.filter(function (f) { return f.text === "prepend set " + k.name; })[0];
    assert(pre, k.name + " reaches the drawing through no [prepend set " + k.name + "]");

    // fed by its own dial's value outlet, not by the core's idea of it: the
    // drawing and the sound are then the same number by construction
    var src = mt.feeders(wp, pre.id);
    assert(src.length === 1 && src[0].maxclass === "live.dial" && src[0].outlet === 0,
      k.name + "'s [prepend] is fed by " + JSON.stringify(src) + ", not its dial");
    var d = wp.boxes.filter(function (b) { return b.box.id === src[0].id; })[0].box;
    assert(d.saved_attribute_attributes.valueof.parameter_longname === k.label,
      k.name + "'s drawing is fed by the " +
      d.saved_attribute_attributes.valueof.parameter_longname + " dial");

    // and the same dial still reaches the core, so drawing a control did not
    // quietly become the only thing it does
    var toCore = wp.boxes.map(function (b) { return b.box; }).filter(function (b) {
      return b.text === "prepend " + k.name;
    });
    assert(toCore.length === 1, k.name + " no longer reaches the core");
    assert(mt.feeders(wp, toCore[0].id).some(function (f) { return f.id === d.id; }),
      k.name + "'s dial no longer feeds the core");
  });
});

test("a drawn knob paints its value on live.dial's own sweep", function () {
  var patch = mt.readPatch(PATCH);
  var j = knobOverlays(patch)[0];
  var sb = mt.loadJsui(path.join(DEVICE, "pg-knob.js"),
                       { width: j.rect[2], height: j.rect[3], args: j.args })();

  // A knob with nothing to report is a hole, not an absence, so unlike a
  // modulation ring it draws from the first frame — at the value the dial
  // itself opens at.
  var moved = { wave: 0.8, pw: 0.0, fold: 1.0 };
  [null, moved].forEach(function (set) {
    if (set) Object.keys(set).forEach(function (n) { sb.set(n, set[n]); });
    var ops = mt.paint(sb);

    knobsOf(j).forEach(function (k) {
      var v = set ? set[k.name] : k.v;

      // The value arc, picked out by what makes it the value arc: this knob's
      // own centre, the stage's ink at full strength (the glow behind it is the
      // same hue, much fainter), and a start at live.dial's own 7-o'clock.
      var arc = mt.opsColored(ops, knobInk(j)).filter(function (o) {
        if (o.op !== "stroke" || o.color[3] !== 1) return false;
        var p0 = o.points[0];
        return Math.abs(radius(k, p0) - k.r * 0.95) < 0.01 &&
               Math.abs(sweep(k, p0)) < 1e-6;
      });
      assert(arc.length === 1,
        k.name + " drew " + arc.length + " value arcs at " + v);

      var pts = arc[0].points;
      assert(Math.abs(sweep(k, pts[pts.length - 1]) - DIAL_SPAN * v) < 1e-6,
        k.name + "'s arc ends " +
        (sweep(k, pts[pts.length - 1]) / DIAL_SPAN).toFixed(4) +
        " of the way round, not " + v);
      pts.forEach(function (pt) {
        assert(Math.abs(radius(k, pt) - k.r * 0.95) < 0.01,
          k.name + "'s arc wanders off its own radius");
      });

      // the name above and the reading below, both there and both legible
      var texts = ops.filter(function (o) {
        return o.op === "text" && Math.abs(o.x - k.cx) < k.r * 1.6;
      }).map(function (o) { return o.text; });
      assert(texts.indexOf(k.label) >= 0,
        k.name + " does not draw its own name; it draws " + texts.join(","));
      assert(texts.indexOf(v.toFixed(2)) >= 0,
        k.name + " reads " + texts.join(",") + ", not " + v.toFixed(2));
    });

    ops.forEach(function (o) {
      assert(o.x >= -1 && o.y >= -1 && o.x1 <= j.rect[2] + 1 && o.y1 <= j.rect[3] + 1,
        "the drawn knobs painted outside their box: " +
        JSON.stringify([o.x, o.y, o.x1, o.y1]));
    });
  });

  // and it does not repaint when the dial repeats itself, which live.dial does
  // all the way through a drag
  var before = sb.__draw.redraws;
  sb.set("wave", moved.wave);
  assert(sb.__draw.redraws === before, "a knob redraws on a value it is already at");
});

// ----------------------------------------------------------------

run.finish();
