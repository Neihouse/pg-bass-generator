#!/usr/bin/env python3
"""build_device.py — generates the PG Bass Generator Max for Live device.

Emits:
  device/PG Bass Generator.maxpat / .amxd        (instrument)
  device/PG Bass Generator MIDI.maxpat / .amxd   (MIDI effect)

The patch is deliberately dumb routing: all musical + coupling logic lives in
device/pg-core.js. See DESIGN.md §8 for the architecture notes. Everything
that is not specific to this device — patcher construction, .amxd packaging,
control rows, the js-core plumbing and the reusable DSP blocks — is in m4lkit/.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from m4lkit import core, dsp, ui
from m4lkit.patch import Patch, write_device

DEVICE_DIR = ROOT / "device"

# Every control on the device, grouped for both the floating window's
# sectioned panels and Live's automation/Push mapping (the longname). The
# message name is the handler in pg-core.js.
#
# The window has two pages. The sound page (build_wave_window) is the device's
# sculpting surface, laid out in signal order — oscillator, sub, filter, shape,
# space — so a panel sits where its stage sits in the audio path. The compose
# page (build_compose_page) holds what decides *what* gets played rather than
# how it sounds; it is set once per project, and keeping it off the sound page
# is what lets the sound page breathe.

MACRO_W = 108.0   # a §6 meta control's diameter; the per-stage dials are 72

STAGES = [  # (label, ramp, dials, menus) — one panel per stage of the path
    # A dial's optional fourth element is its diameter. The four §6 meta
    # controls that live on this page — Squelch, Chunk, Wet and Design — lead
    # their stage at MACRO_W, with the per-stage dials that feed them beside
    # them at the ordinary size. Novelty and Density are §6 too, but they
    # decide the notes, so they sit on the compose page instead.
    ("osc", "coral", [
        # §2.6 waveform shaping: saw<->pulse blend, pulse width, wavefolder
        ("Wave", 0.3, "wave"), ("PWM", 0.5, "pw"), ("Fold", 0.0, "fold"),
    ], []),
    ("sub", "teal", [
        ("Sub", 0.6, "sub"), ("SubSat", 0.35, "subsat"),   # §2.5 sub saturation
    ], [
        # §2.5 how far down the sub sits under the note
        ("SubOct", ["sub -1", "sub -2"], 0, "suboct", 66.0),
    ]),
    ("filter", "amber", [
        ("Squelch", 0.5, "squelch", MACRO_W),
        ("Cutoff", 0.45, "cutoff"), ("Decay", 0.5, "decay"), ("Drive", 0.35, "drive"),
    ], [
        # §2.1 "auto" lets the groove's own affinity weights pick the mode
        ("Mode", ["auto", "round", "wet", "squelch", "bite",
                  "hollow", "rubber", "acid"], 0, "fmode", 92.0),
    ]),
    ("shape", "purple", [
        ("Chunk", 0.55, "chunk", MACRO_W),
        # §2.7 one LFO, shared: rate (Hz) and a depth that swings both the
        # filter cutoff and pitch together so the movement reads as one thing
        ("WobRate", 0.35, "wobrate"), ("WobDepth", 0.0, "wobdepth"),
    ], []),
    ("space", "pink", [
        ("Wet", 0.3, "wet", MACRO_W), ("Width", 0.6, "width"),   # §3.4 stereo width
    ], []),
    ("character", "gray", [
        # §2.8 how far each phrase's own sound (wave, PWM, fold, wobble, sub
        # saturation) moves the dials on this page: 0 plays them as set. It
        # belongs here, next to what it moves, not on the compose page.
        ("Design", 0.5, "design", MACRO_W),
    ], []),
]

# §2.8 the dials a phrase's own sound pushes, and the selector on the core's
# synth outlet that carries each one's pushed value. Every one of these is a
# SOUND_KEY in pg-core.js; the rest of the dials above play as set, so they get
# no ring. subsat and wobdepth each drive two selectors — one of a pair is
# enough to recover the value, and device/pg-mod.js says how it undoes the
# scaling on the way back.
MOD_RINGS = [   # (dial's js message, the synth selector carrying its pushed value)
    ("wave", "wave"), ("pw", "pw"), ("fold", "fold"),
    ("subsat", "subdrv"), ("wobrate", "wobrate"), ("wobdepth", "wobcut"),
]

# ---- compose page: how the generator behaves, not how it sounds ----
COMPOSE_DIALS = [  # (parameter longname, initial, js message)
    ("Novelty", 0.45, "novelty"), ("Density", 0.5, "density"),
    ("Interlock", 0.5, "interlock"),   # §1.4 bipolar downbeat rest bias
]
COMPOSE_MENUS = [  # (parameter longname, items, initial index, js message, width)
    ("Groove", ["restrained", "rolling", "syncopated",
                "driving", "acidic", "broken", "hypnotic"], 1, "groove", 112.0),
    ("Root", ["C", "Db", "D", "Eb", "E", "F",
              "Gb", "G", "Ab", "A", "Bb", "B"], 0, "root", 58.0),
    ("Length", ["1 bar", "2 bars", "4 bars"], 1, "plen", 70.0),
]
# §5.3 the global lock plus the three per-layer freezes: rhythm, pitch and
# timbre hold independently, so one layer can drift while the others don't.
TOGGLES = [  # (parameter longname, js message, caption, caption width)
    ("Lock", "lock", "lock", 30.0),
    ("FrzRhythm", "frzr", "rhy", 26.0),
    ("FrzPitch", "frzp", "pit", 26.0),
    ("FrzTimbre", "frzt", "tim", 26.0),
]
BUTTON_GROUPS = [
    ("generate", "teal", ["Mutate", "Return", "Reseed"]),
    # §2.8 Sound redraws the phrase's sound and filter mode, notes untouched
    ("regenerate layer", "coral", ["Rhythm", "Pitch", "Accent", "Slide", "Sound"]),
    ("utility", "gray", ["Capture"]),
]

WAVE_RECT = [160.0, 100.0, 980.0, 628.0]   # sound page window: x, y, w, h
COMP_RECT = [160.0, 100.0, 980.0, 300.0]   # compose page window, over the top


def build_compose_page():
    """The window's second page: how the generator behaves, rather than how it
    sounds. Groove family, root, length and the phrase macros; the freeze
    switches; and the buttons that reroll the phrase or a single layer of it.
    Set once per project and then left alone, which is exactly why it is off
    the sound page — and it is where Interlock stops reading as a tone control.


    Same subpatcher discipline as the sound page: its controls can't patchcord
    to the js core two patchers up, so they feed a local `outlet`, which the
    sound page wires into its own outlet and on to js. "Sculpt" hands the page
    back by closing this window with [thispatcher], uncovering the sound page
    underneath — no scripting, nothing to keep in sync.
    """
    cp = Patch("instrument")
    _, _, cw, ch = COMP_RECT
    cp.panel("bg", pres=[0.0, 0.0, cw, ch],
             bgcolor=[0.086, 0.086, 0.094, 1.0], bordercolor=[0.086, 0.086, 0.094, 1.0],
             rounded=0)
    cp.box("in1", "inlet", numinlets=0, numoutlets=1, outlettype=[""],
           extra={"patching_rect": [20.0, 20.0, 30.0, 30.0], "comment": "pcontrol target"})
    cp.box("ctrl_out", "outlet", numinlets=1, numoutlets=0,
           extra={"patching_rect": [60.0, 20.0, 30.0, 30.0], "comment": "control messages out"})

    cp.box("title", "comment", "COMPOSE", pres=[8.0, 8.0, 400.0, 20.0],
           extra={"fontface": 1, "fontsize": 15.0, "textcolor": [0.92, 0.92, 0.92, 1.0]},
           numoutlets=0)
    cp.box("subtitle", "comment", "what gets played — set once, then left alone",
           pres=[8.0, 27.0, 480.0, 14.0],
           extra={"fontsize": 10.0, "textcolor": [0.55, 0.55, 0.55, 1.0]}, numoutlets=0)

    row1 = ui.Row(cp, y=66.0, h=58.0, panel_top=46.0, panel_h=124.0, gap=30.0)
    row1.stage("phrase", "gray", COMPOSE_DIALS, COMPOSE_MENUS, pitch=72.0, w=60.0)
    row2 = ui.Row(cp, y=196.0, h=20.0, panel_top=178.0, panel_h=40.0, gap=24.0)
    row2.toggles("freeze", "pink", TOGGLES)
    for label, ramp, names in BUTTON_GROUPS:
        row2.buttons(label, ramp, names)

    core.wire_controls(cp, row1.sources + row2.sources, row2.button_keys, dst="ctrl_out")

    # Back to the sound page: close this window and the one it covers is there.
    ui.section(cp, "page_back", "PAGE", "teal", [830.0, 46.0, 122.0, 124.0])
    # "Sculpt", not "Sound" — the reroll button two panels to the left is
    # already called Sound, and these two do very different things.
    cp.box("btn_sculpt", "message", "Sculpt", pres=[842.0, 78.0, 98.0, 24.0],
           extra={"fontsize": 11.0}, numinlets=2, numoutlets=1)
    cp.box("page_back_hint", "comment", "back to the voice",
           pres=[842.0, 108.0, 104.0, 26.0],
           extra={"fontsize": 9.0, "textcolor": [0.55, 0.55, 0.55, 1.0]}, numoutlets=0)
    cp.box("msg_wclose", "message", "wclose", numinlets=2, numoutlets=1)
    cp.obj("this_p", "thispatcher", numinlets=1, numoutlets=1, outlettype=[""])
    cp.connect("btn_sculpt", 0, "msg_wclose", 0)
    cp.connect("msg_wclose", 0, "this_p", 0)
    return cp


def build_wave_window():
    """The sound page: the step lane up top with the waveform under it, and the
    voice below laid out in signal order — OSC, SUB, FILTER, SHAPE, SPACE, then
    CHARACTER, each stage a panel where it sits in the audio path. The §6 meta
    control of a stage leads it at MACRO_W, so the four dials that carry the
    sound read first and the per-stage dials sit under the stage they belong to.

    It opens as an independent floating OS window, not confined to Live's 169 px
    rack cap — that cap only applies to the top-level device patcher (see
    Patch.subpatcher() in m4lkit/patch.py).

    Controls here can't patchcord straight to the js core in the parent
    patcher — a subpatcher is its own box graph. Each control instead feeds
    a local `outlet` box (ctrl_out), which becomes a real outlet on the
    subpatcher box in the parent, wired there to js like any other source.
    The same rule runs the other way for the step lane: it reads the core's
    phrase outlet through a local `inlet` box (in3), fed in the parent. The
    compose page nests one level deeper and sends its controls out through
    this same outlet.
    """
    wp = Patch("instrument")
    _, _, ww, wh = WAVE_RECT
    wp.panel("bg", pres=[0.0, 0.0, ww, wh],
             bgcolor=[0.086, 0.086, 0.094, 1.0], bordercolor=[0.086, 0.086, 0.094, 1.0],
             rounded=0)

    wp.box("in1", "inlet", numinlets=0, numoutlets=1, outlettype=["signal"],
           extra={"patching_rect": [20.0, 20.0, 30.0, 30.0], "comment": "(signal) audio in"})
    wp.box("in2", "inlet", numinlets=0, numoutlets=1, outlettype=[""],
           extra={"patching_rect": [60.0, 20.0, 30.0, 30.0], "comment": "pcontrol target"})
    wp.box("in3", "inlet", numinlets=0, numoutlets=1, outlettype=[""],
           extra={"patching_rect": [100.0, 20.0, 30.0, 30.0], "comment": "phrase + steps"})
    wp.box("in4", "inlet", numinlets=0, numoutlets=1, outlettype=[""],
           extra={"patching_rect": [140.0, 20.0, 30.0, 30.0],
                  "comment": "synth values, as modulated"})
    wp.box("ctrl_out", "outlet", numinlets=1, numoutlets=0,
           extra={"patching_rect": [180.0, 20.0, 30.0, 30.0], "comment": "control messages out"})

    wp.box("title", "comment", "PG BASS GENERATOR",
           pres=[8.0, 8.0, 600.0, 20.0],
           extra={"fontface": 1, "fontsize": 15.0, "textcolor": [0.92, 0.92, 0.92, 1.0]},
           numoutlets=0)
    wp.box("subtitle", "comment", "step lane · waveform · the voice in signal order",
           pres=[8.0, 27.0, 600.0, 14.0],
           extra={"fontsize": 10.0, "textcolor": [0.55, 0.55, 0.55, 1.0]}, numoutlets=0)

    # The hero: what the generator just wrote, drawn (DESIGN.md §5). The
    # waveform keeps its place underneath — it reports the sound, the lane
    # reports the notes, and Mutate is only legible with both.
    wp.box("lane", "jsui", pres=[8.0, 46.0, 944.0, 140.0],
           extra={"filename": "pg-lane.js", "jsarguments": ["window"],
                  "border": 0, "parameter_enable": 0},
           numinlets=1, numoutlets=1)
    wp.connect("in3", 0, "lane", 0)

    wp.box("bigscope", "scope~", pres=[8.0, 194.0, 944.0, 56.0],
           extra={"bgcolor": [0.02, 0.02, 0.02, 1.0], "bufsize": 4096},
           numinlets=1, numoutlets=0)
    wp.connect("in1", 0, "bigscope", 0)

    # Signal order, left to right and top to bottom. `y`/`h` size an ordinary
    # dial; a MACRO_W one grows upward from the shared bottom edge, which is
    # why each panel starts well above its row.
    row1 = ui.Row(wp, y=316.0, h=70.0, panel_top=262.0, panel_h=154.0, gap=30.0)
    for label, ramp, dials, menus in STAGES[:3]:        # osc, sub, filter
        row1.stage(label, ramp, dials, menus, pitch=88.0, w=72.0)

    row2 = ui.Row(wp, y=482.0, h=70.0, panel_top=428.0, panel_h=132.0, gap=30.0)
    for label, ramp, dials, menus in STAGES[3:]:        # shape, space, character
        row2.stage(label, ramp, dials, menus, pitch=88.0, w=72.0)

    # §2.8 made visible: one click-through [jsui] per row, drawing each phrase's
    # pushed value as a second ring inside the dial it moved (DESIGN.md §5.5).
    # Per row rather than one box over both, so neither overlay ever reaches a
    # menu or a button — it spans only the dials between its first and last
    # ring. Both take the core's synth outlet whole; pg-mod.js picks out the
    # six selectors it rings and ignores the rest.
    for n, row in ((1, row1), (2, row2)):
        rings = [(sel, msg) for msg, sel in MOD_RINGS if msg in row.dial_rects]
        if rings:
            wp.connect("in4", 0, row.overlay("mod%d" % n, "pg-mod.js", rings), 0)

    core.wire_controls(wp, row1.sources + row2.sources, dst="ctrl_out")

    # ---- the compose page, nested one level deeper ----
    # Same idiom the parent uses to open this window: a hidden [open] behind a
    # visible button, into a [pcontrol] whose outlet names the patcher box it
    # opens — here the compose page's only inlet, which nothing else feeds.
    comp_p = build_compose_page()
    wp.subpatcher("comp_window", "p comp_window", comp_p,
                  rect=COMP_RECT, varname="comp_window",
                  title="PG Bass Generator — Compose",
                  numinlets=1, numoutlets=1, openinpresentation=1)
    wp.connect("comp_window", 0, "ctrl_out", 0)
    wp.obj("pctrl_comp", "pcontrol", numinlets=1, numoutlets=1, outlettype=[""])
    wp.connect("pctrl_comp", 0, "comp_window", 0)

    ui.section(wp, "page_fwd", "PAGE", "teal", [692.0, 428.0, 260.0, 132.0])
    wp.box("btn_compose", "message", "Compose", pres=[704.0, 462.0, 110.0, 24.0],
           extra={"fontsize": 11.0}, numinlets=2, numoutlets=1)
    wp.box("page_fwd_hint", "comment",
           "groove · root · length · interlock · freeze · reroll",
           pres=[704.0, 494.0, 236.0, 26.0],
           extra={"fontsize": 9.0, "textcolor": [0.55, 0.55, 0.55, 1.0]}, numoutlets=0)
    wp.box("msg_comp_open", "message", "open", numinlets=2, numoutlets=1)
    wp.connect("btn_compose", 0, "msg_comp_open", 0)
    wp.connect("msg_comp_open", 0, "pctrl_comp", 0)
    return wp


def build(kind="instrument"):
    p = Patch(kind)

    # ---------------------------------------------------------------- UI (rack, 169 px)
    # The full control set above lives in the floating sound-design window
    # now (build_wave_window) — Live's 169 px device-height cap applies only
    # to this top-level patcher, not to a subpatcher's own floating window.
    # The rack keeps just the essentials: title, live status text, the step
    # lane that fills the rest of it, and the button that opens the big
    # window (wired further down, once `js` exists).
    p.box("title", "comment", "PG BASS GENERATOR — Primordial Groove",
          pres=[4.0, 3.0, 260.0, 16.0],
          extra={"fontface": 1, "fontsize": 11.0}, numoutlets=0)

    # ---------------------------------------------------------------- core + clock
    p.obj("js", "js pg-core.js", numinlets=1, numoutlets=4)
    core.clock(p)

    # ---------------------------------------------------------------- js outlet routing
    synth = core.Route(p, "route_synth", [
        "cutoff", "reso", "envd", "drv", "post", "gain", "adec",
        "asus", "sub", "wet", "duck", "fb", "dly", "dly2",
        # §2.3 filter character: lp/bp blend, nonlinearity, resonance shelf
        "lpamt", "bpamt", "nlin", "nlout", "shelf",
        # §3 wet envelope + diffusion
        "wamt", "wflr", "wdec", "dmod",
        # §2.5 sub voice: its own saturation, makeup and resonant-peak duck
        "subdrv", "subgain", "subduck",
        # §2.4 saturation asymmetry (idle value; each note re-sends its own)
        "asym",
        # §3.4 stereo: return width and the frequency below which it stays mono
        "width", "monof",
        # §2.6 waveform shaping: saw<->pulse blend, pulse width, wavefolder depth
        "wave", "pw", "fold",
        # §2.7 shared wobble LFO: rate (Hz), and depth split into its
        # cutoff swing (Hz) and pitch swing (semitones, pre-mtof~)
        "wobrate", "wobcut", "wobpitch",
        # §5.4 serialized generator state, headed for [pattr]
        "state"])
    # "note" is the MIDI-effect build's note event; the instrument leaves it unrouted
    note = core.Route(p, "route_note",
                      ["pitch", "spitch", "trig", "fmul", "dmul", "fdec", "asym", "note"])
    disp = core.Route(p, "route_disp", ["disp", "dump"])
    p.connect("js", 0, synth.key, 0)
    p.connect("js", 1, note.key, 0)
    p.connect("js", 2, disp.key, 0)
    # Outlet 3 (phrase + steps) goes straight to the lanes, unrouted: [route]
    # strips the selector it matched, and the lane needs those names to tell a
    # header from a grid. One outlet, two readers — the rack strip here and,
    # on the instrument build, the hero lane in the floating window.
    core.status_display(p, disp, pres=[352.0, 3.0, 252.0, 16.0])
    core.persist_state(p, synth, pattr="pg_state")   # saved with the Live set

    # The rack's one display, and the reason the device needs no scope here:
    # what the generator just wrote, drawn. It replaces the waveform strip
    # that used to fill this space — the waveform reports the sound, which the
    # sound-design window still shows in full, while the notes are what Mutate
    # and the four layer rerolls actually change (DESIGN.md §5.4). Both builds
    # get it: on the MIDI build, where there is no audio to scope at all, it is
    # the only readout there could be.
    p.box("lane", "jsui", pres=[8.0, 24.0, 952.0, 138.0],
          extra={"filename": "pg-lane.js", "jsarguments": ["rack"],
                 "border": 0, "parameter_enable": 0},
          numinlets=1, numoutlets=1)
    p.connect("js", 3, "lane", 0)

    # The MIDI-effect build shares everything above — same core, same UI, same
    # persisted state — and swaps the entire synth below for a [midiout].
    if kind == "midi":
        core.midi_out(p, note)
        return p

    # ---------------------------------------------------------------- smoothing lines
    core.smoothers(p, synth, [
        "cutoff",    # cutoff base Hz
        "envd",      # filter env depth Hz
        "drv",       # pre-filter drive amount
        "wet",       # wet send level
        "monof",     # §3.4 mono-below / wet crossover Hz
        "wave",      # §2.6 saw<->pulse blend
        "pw",        # §2.6 pulse width
        "fold",      # §2.6 wavefolder depth
        "wobrate",   # §2.7 wobble LFO rate (Hz)
        "wobcut",    # §2.7 wobble cutoff swing (Hz)
        "wobpitch",  # §2.7 wobble pitch swing (semitones)
    ])
    core.smoothers(p, note, [
        "pitch",     # note pitch (MIDI, glides)
        "spitch",    # sub pitch (MIDI, folded 24-35)
    ])

    # §2.7 one wobble LFO, shared by the filter cutoff and both oscillators'
    # pitch, so the two move together as one audible wobble
    wob = dsp.lfo(p, "wobble", "l_wobrate", [("cut", "l_wobcut"), ("pitch", "l_wobpitch")])

    # ---------------------------------------------------------------- envelopes
    # amp: fast attack, chunk-scaled decay/sustain; filter: snappy, sustain 0
    p.sig("adsr_amp", "adsr~ 2 260 0.35 60", 5)
    p.sig("adsr_filt", "adsr~ 1 300 0. 80", 5)
    note.wire("trig", "adsr_amp", 0)
    note.wire("trig", "adsr_filt", 0)
    synth.wire("adec", "adsr_amp", 2)
    synth.wire("asus", "adsr_amp", 3)
    note.wire("fdec", "adsr_filt", 2)

    # ---------------------------------------------------------------- oscillators
    # §2.6 Wave crossfades saw <-> pulse (rect~, width set by PWM) rather than
    # just mixing them, so the blend is a single timbral sweep instead of a
    # loudness-changing add. §2.7 the wobble LFO's pitch swing is summed in
    # before mtof~, in MIDI-note space, so it reads as true vibrato.
    p.sig("pitch_wob", "+~", 2)
    p.sig("mtof_main", "mtof~", 1)
    p.sig("osc_saw", "saw~", 2)
    p.sig("osc_rect", "rect~", 2)
    p.sig("wave_inv", "!-~ 1.", 2)
    p.sig("saw_gain", "*~", 2)
    p.sig("rect_gain", "*~", 2)
    p.sig("wave_saw_amt", "*~ 0.85", 2)
    p.sig("wave_rect_amt", "*~ 0.75", 2)
    p.sig("osc_mix", "+~", 2)
    p.connect("l_pitch", 0, "pitch_wob", 0)
    p.connect(wob["pitch"], 0, "pitch_wob", 1)
    p.connect("pitch_wob", 0, "mtof_main", 0)
    p.connect("mtof_main", 0, "osc_saw", 0)
    p.connect("mtof_main", 0, "osc_rect", 0)
    p.connect("l_pw", 0, "osc_rect", 1)
    p.connect("l_wave", 0, "wave_inv", 0)
    p.connect("wave_inv", 0, "wave_saw_amt", 0)
    p.connect("wave_saw_amt", 0, "saw_gain", 1)
    p.connect("l_wave", 0, "wave_rect_amt", 0)
    p.connect("wave_rect_amt", 0, "rect_gain", 1)
    p.connect("osc_saw", 0, "saw_gain", 0)
    p.connect("osc_rect", 0, "rect_gain", 0)
    p.connect("saw_gain", 0, "osc_mix", 0)
    p.connect("rect_gain", 0, "osc_mix", 1)

    # §2.6 wavefolder on the oscillator mix, crossfaded in by Fold
    folded = dsp.wavefolder(p, "fold", "osc_mix", "l_fold")

    # The waveform tap, post-Wave/PWM/Fold, so the three timbre controls'
    # combined shape is visible. It goes to the sound-design window rather
    # than the rack now: the rack's 169 px hold the step lane, and a player
    # who wants to see the shape they are sculpting is already in the window
    # with the controls that sculpt it.

    # the full Serum-style sound-design window: hero waveform + every
    # control, sectioned. Not confined to Live's 169 px rack — that cap only
    # applies to this top-level device patcher (see Patch.subpatcher()).
    # Opened on demand from a title-bar button via [pcontrol]. Its controls
    # can't patchcord straight to `js` (a subpatcher is its own box graph),
    # so ctrl_out — the subpatcher's outlet 0 — carries them back out here.
    wave_p = build_wave_window()
    p.subpatcher("wave_window", "p wave_window", wave_p,
                 rect=WAVE_RECT, varname="wave_window",
                 title="PG Bass Generator — Sound Design",
                 numinlets=4, numoutlets=1, openinpresentation=1)
    p.connect(folded, 0, "wave_window", 0)
    p.connect("wave_window", 0, "js", 0)
    p.connect("js", 3, "wave_window", 2)
    p.connect("js", 0, "wave_window", 3)   # the synth stream, for the mod rings
    # pcontrol takes no creation arguments and has no @target attribute — it
    # opens/closes whatever patcher/subpatcher box is patched into its
    # outlet, so the open/close command reaches wave_window via a real
    # patchcord (into its second, otherwise-unwired inlet) rather than by name.
    p.obj("pctrl_wave", "pcontrol", numinlets=1, numoutlets=1, outlettype=[""])
    p.connect("pctrl_wave", 0, "wave_window", 1)
    # clicking it feeds a hidden [message open] (its own content, ignoring
    # what arrives) so pcontrol gets the exact protocol word it expects
    # while the visible button stays self-explanatory.
    p.box("btn_waveform", "message", "Open GUI", pres=[860.0, 3.0, 92.0, 16.0],
          extra={"fontsize": 9.0}, numinlets=2, numoutlets=1)
    p.box("msg_wave_open", "message", "open", numinlets=2, numoutlets=1)
    p.connect("btn_waveform", 0, "msg_wave_open", 0)
    p.connect("msg_wave_open", 0, "pctrl_wave", 0)

    # ---------------------------------------------------------------- drive -> filter
    p.sig("drive_mul", "*~ 1.", 2)     # drive amount (smoothed)
    p.sig("dmul_mul", "*~ 1.", 2)      # per-note accent drive
    p.sig("sat1", "tanh~", 1)
    p.sig("filter", "svf~ 800 0.5", 3, numoutlets=4)
    p.connect(folded, 0, "drive_mul", 0)
    p.connect("l_drv", 0, "drive_mul", 1)
    p.connect("drive_mul", 0, "dmul_mul", 0)
    note.wire("dmul", "dmul_mul", 1)
    p.connect("dmul_mul", 0, "sat1", 0)
    p.connect("sat1", 0, "filter", 0)
    synth.wire("reso", "filter", 2)

    # cutoff = base + env*depth*accent, clipped to sane Hz
    p.sig("envd_mul", "*~ 1.", 2)
    p.sig("fmul_mul", "*~ 1.", 2)
    p.sig("cut_sum", "+~", 2)
    p.sig("cut_wob", "+~", 2)   # §2.7 wobble LFO's cutoff swing added in last
    p.sig("cut_clip", "clip~ 40. 12000.", 3)
    p.connect("adsr_filt", 0, "envd_mul", 0)
    p.connect("l_envd", 0, "envd_mul", 1)
    p.connect("envd_mul", 0, "fmul_mul", 0)
    note.wire("fmul", "fmul_mul", 1)
    p.connect("fmul_mul", 0, "cut_sum", 0)
    p.connect("l_cutoff", 0, "cut_sum", 1)
    p.connect("cut_sum", 0, "cut_wob", 0)
    p.connect(wob["cut"], 0, "cut_wob", 1)
    p.connect("cut_wob", 0, "cut_clip", 0)
    p.connect("cut_clip", 0, "filter", 1)

    # ---------------------------------------------------------------- post filter / VCA
    # §2.3 filter mode: grooves blend the svf~ lowpass and bandpass outlets, so
    # acidic/broken read hollow and forward while restrained stays pure lowpass.
    p.sig("filt_lp", "*~ 1.", 2)
    p.sig("filt_bp", "*~ 0.", 2)
    p.sig("filt_mix", "+~", 2)
    p.connect("filter", 0, "filt_lp", 0)          # svf~ lowpass outlet
    synth.wire("lpamt", "filt_lp", 1)
    p.connect("filter", 2, "filt_bp", 0)          # svf~ bandpass outlet
    synth.wire("bpamt", "filt_bp", 1)
    p.connect("filt_lp", 0, "filt_mix", 0)
    p.connect("filt_bp", 0, "filt_mix", 1)

    # §2.3 nonlinear filter: drive into a tanh~ and back out, so resonance
    # compresses and growls at the peak instead of ringing linearly
    p.sig("nl_pre", "*~ 1.", 2)
    p.sig("nl_sat", "tanh~", 1)
    p.sig("nl_post", "*~ 1.", 2)
    p.connect("filt_mix", 0, "nl_pre", 0)
    synth.wire("nlin", "nl_pre", 1)
    p.connect("nl_pre", 0, "nl_sat", 0)
    p.connect("nl_sat", 0, "nl_post", 0)
    synth.wire("nlout", "nl_post", 1)

    # §2.2 resonance compensation: a resonant lowpass robs the fundamental, so
    # give back a low shelf that tracks resonance and the bandpass blend
    p.sig("shelf_lp", "onepole~ 120.", 2)
    p.sig("shelf_amt", "*~ 0.", 2)
    p.sig("shelf_sum", "+~", 2)
    p.connect("nl_post", 0, "shelf_lp", 0)
    p.connect("shelf_lp", 0, "shelf_amt", 0)
    synth.wire("shelf", "shelf_amt", 1)
    p.connect("nl_post", 0, "shelf_sum", 0)
    p.connect("shelf_amt", 0, "shelf_sum", 1)

    p.sig("amp_mul", "*~ 0.", 2)
    p.sig("post_mul", "*~ 1.", 2)
    p.connect("shelf_sum", 0, "amp_mul", 0)
    p.connect("adsr_amp", 0, "amp_mul", 1)
    p.connect("amp_mul", 0, "post_mul", 0)
    synth.wire("post", "post_mul", 1)
    # §2.4 dynamic, asymmetric saturation: the offset is sent per note and
    # scales with velocity and accent, so the character opens up as the phrase
    # digs in rather than sitting still
    saturated = dsp.asym_sat(p, "asym", "post_mul")
    synth.wire("asym", "asym_add", 1)
    note.wire("asym", "asym_add", 1)
    p.sig("gain_mul", "*~ 0.5", 2)
    p.connect(saturated, 0, "gain_mul", 0)
    synth.wire("gain", "gain_mul", 1)

    # ---------------------------------------------------------------- sub oscillator (§2.5)
    # pitch arrives pre-folded from js — MIDI 24-35 (32.7-61.7 Hz) at sub -1, or
    # 12-23 (16.4-30.9 Hz) at sub -2. The sub is its own voice, not a copy of the
    # main one: SubSat drives its saturator (adding 65-130 Hz harmonics so it
    # reads on speakers that cannot move the fundamental), and the makeup gain
    # takes back the level that drive adds so the control is a timbre, not a
    # loudness. The duck then pulls the sub down under a resonant filter peak,
    # which is where a fat sub and a screaming resonance would otherwise fight.
    p.sig("spitch_wob", "+~", 2)  # §2.7 shares the main osc's wobble pitch swing
    p.sig("mtof_sub", "mtof~", 1)
    p.sig("osc_sub", "cycle~", 2)
    p.sig("sub_sat_pre", "*~ 1.5", 2)
    p.sig("sub_sat", "tanh~", 1)
    p.sig("sub_makeup", "*~ 1.", 2)
    p.sig("sub_env", "*~ 0.", 2)
    p.connect("l_spitch", 0, "spitch_wob", 0)
    p.connect(wob["pitch"], 0, "spitch_wob", 1)
    p.connect("spitch_wob", 0, "mtof_sub", 0)
    p.connect("mtof_sub", 0, "osc_sub", 0)
    p.connect("osc_sub", 0, "sub_sat_pre", 0)
    synth.wire("subdrv", "sub_sat_pre", 1)
    p.connect("sub_sat_pre", 0, "sub_sat", 0)
    p.connect("sub_sat", 0, "sub_makeup", 0)
    synth.wire("subgain", "sub_makeup", 1)
    p.connect("sub_makeup", 0, "sub_env", 0)
    p.connect("adsr_amp", 0, "sub_env", 1)
    # the filter envelope is the resonant peak: duck against it, scaled by how
    # much peak there actually is (subduck is 0 until resonance is high)
    sub_duck = dsp.duck(p, "sub_duck", "adsr_filt")
    synth.wire("subduck", "sub_duck_amt", 1)
    p.sig("sub_duck_mul", "*~ 1.", 2)
    p.sig("sub_mul", "*~ 0.6", 2)
    p.connect("sub_env", 0, "sub_duck_mul", 0)
    p.connect(sub_duck, 0, "sub_duck_mul", 1)
    p.connect("sub_duck_mul", 0, "sub_mul", 0)
    synth.wire("sub", "sub_mul", 1)

    # ---------------------------------------------------------------- wet core (§3)
    # send = highpassed dry, level enveloped, ducked against the amp env
    # §3.1/§3.4 crossover: the wet network is the only stereo content in the
    # device, so the frequency it starts at *is* the mono-below frequency. Width
    # drives it: a narrow image can afford to reverberate lower down, a wide one
    # has to keep more of the low end centred.
    p.sig("wet_hp", "svf~ 500. 0.2", 3, numoutlets=4)
    p.sig("wet_mul", "*~ 0.", 2)
    p.connect("gain_mul", 0, "wet_hp", 0)
    p.connect("l_monof", 0, "wet_hp", 1)          # §3.4 mono-below frequency
    p.connect("wet_hp", 1, "wet_mul", 0)          # svf~ highpass outlet
    p.connect("l_wet", 0, "wet_mul", 1)
    duck = dsp.duck(p, "duck", "adsr_amp", init=0.6)
    synth.wire("duck", "duck_amt", 1)
    # §3.2 envelope-shaped send: the wet level follows its own decay envelope on
    # top of the static send, so effects bloom after the transient rather than
    # sitting at a fixed depth. wflr is the floor the envelope rides above.
    p.sig("adsr_wet", "adsr~ 5 400 0.25 200", 5)
    p.sig("wenv_amt", "*~ 0.65", 2)
    p.sig("wenv_floor", "+~ 0.35", 2)
    p.sig("wenv_mul", "*~ 1.", 2)
    note.wire("trig", "adsr_wet", 0)
    synth.wire("wdec", "adsr_wet", 2)
    p.connect("adsr_wet", 0, "wenv_amt", 0)
    synth.wire("wamt", "wenv_amt", 1)
    p.connect("wenv_amt", 0, "wenv_floor", 0)
    synth.wire("wflr", "wenv_floor", 1)
    p.connect("wet_mul", 0, "wenv_mul", 0)
    p.connect("wenv_floor", 0, "wenv_mul", 1)

    p.sig("duck_mul", "*~ 1.", 2)
    p.sig("fb_sum", "+~", 2)
    p.sig("tapin", "tapin~ 2000", 1)
    p.sig("tapout", "tapout~ 380. 500.", 2, numoutlets=2)
    p.sig("fb_damp", "onepole~ 2400.", 2)
    p.sig("fb_mul", "*~ 0.3", 2)
    p.connect("wenv_mul", 0, "duck_mul", 0)
    p.connect(duck, 0, "duck_mul", 1)
    p.connect("duck_mul", 0, "fb_sum", 0)
    p.connect("fb_sum", 0, "tapin", 0)
    p.connect("tapin", 0, "tapout", 0)
    p.connect("tapout", 0, "fb_damp", 0)
    p.connect("fb_damp", 0, "fb_mul", 0)
    synth.wire("fb", "fb_mul", 1)
    p.connect("fb_mul", 0, "fb_sum", 1)
    # §3.2 diffusion: the two taps are driven at signal rate through slow,
    # mutually-detuned LFOs. A few ms of wander smears repeats into something
    # that reads as space instead of a metronomic echo; dmod scales the depth
    # with the Wet macro. tapout~ interpolates, so the taps stay glitch-free.
    p.sig("dly_sig", "sig~ 380.", 1)
    p.sig("dly2_sig", "sig~ 500.", 1)
    p.sig("lfo1", "cycle~ 0.19", 2)
    p.sig("lfo2", "cycle~ 0.27", 2)
    p.sig("mod1", "*~ 0.", 2)
    p.sig("mod2", "*~ 0.", 2)
    p.sig("dly_mod", "+~", 2)
    p.sig("dly2_mod", "+~", 2)
    synth.wire("dly", "dly_sig", 0)
    synth.wire("dly2", "dly2_sig", 0)
    p.connect("lfo1", 0, "mod1", 0)
    p.connect("lfo2", 0, "mod2", 0)
    synth.wire("dmod", "mod1", 1)
    synth.wire("dmod", "mod2", 1)
    p.connect("dly_sig", 0, "dly_mod", 0)
    p.connect("mod1", 0, "dly_mod", 1)
    p.connect("dly2_sig", 0, "dly2_mod", 0)
    p.connect("mod2", 0, "dly2_mod", 1)
    p.connect("dly_mod", 0, "tapout", 0)
    p.connect("dly2_mod", 0, "tapout", 1)

    # ---------------------------------------------------------------- output stage
    # §3.4 low-end stereo safety: dry + sub stay centered, only the wet taps differ L/R
    # §3.3 return ducking: delay tails breathe around each new note (same duck as the send)
    p.sig("ret_duck_l", "*~ 1.", 2)
    p.sig("ret_duck_r", "*~ 1.", 2)
    p.connect("tapout", 0, "ret_duck_l", 0)
    p.connect(duck, 0, "ret_duck_l", 1)
    p.connect("tapout", 1, "ret_duck_r", 0)
    p.connect(duck, 0, "ret_duck_r", 1)
    # §3.4 Width scales the return's side channel; a plain L/R spread would
    # cancel to silence in mono, this collapses to a true mono return instead
    ms_l, ms_r = dsp.stereo_width(p, "ms", "ret_duck_l", "ret_duck_r")
    synth.wire("width", "ms_sidew", 1)

    p.sig("dry_sub", "+~", 2)
    p.sig("sum_l", "+~", 2)
    p.sig("sum_r", "+~", 2)
    p.sig("trim_l", "*~ 0.75", 2)
    p.sig("trim_r", "*~ 0.75", 2)
    p.sig("plugout", "plugout~", 2, numoutlets=2)
    p.obj("midiin", "midiin", numinlets=1, numoutlets=1, outlettype=["int"])
    p.connect("gain_mul", 0, "dry_sub", 0)
    p.connect("sub_mul", 0, "dry_sub", 1)
    p.connect("dry_sub", 0, "sum_l", 0)
    p.connect(ms_l, 0, "sum_l", 1)
    p.connect("dry_sub", 0, "sum_r", 0)
    p.connect(ms_r, 0, "sum_r", 1)
    p.connect("sum_l", 0, "trim_l", 0)
    p.connect("sum_r", 0, "trim_r", 0)
    p.connect("trim_l", 0, "plugout", 0)
    p.connect("trim_r", 0, "plugout", 1)

    return p


def main():
    write_device(build("instrument"), DEVICE_DIR, "PG Bass Generator")
    write_device(build("midi"), DEVICE_DIR, "PG Bass Generator MIDI")


if __name__ == "__main__":
    main()
