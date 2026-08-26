#!/usr/bin/env python3
"""build_device.py — generates the PG Bass Generator Max for Live device.

Emits:
  device/PG Bass Generator.maxpat  (standard Max patcher JSON)
  device/PG Bass Generator.amxd    (M4L instrument wrapper around the same JSON)

The patch is deliberately dumb routing: all musical + coupling logic lives in
device/pg-core.js. See DESIGN.md §8 for the architecture notes.
"""

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEVICE_DIR = ROOT / "device"


class Patch:
    def __init__(self):
        self.boxes = []
        self.lines = []
        self.ids = {}
        self.params = []  # (obj_id, longname, shortname) for the patcher parameter map
        self.counter = 0
        # patching-view auto layout grid
        self.px, self.py = 30, 30

    def _next_rect(self, w=140, h=22):
        rect = [self.px, self.py, w, h]
        self.px += 190
        if self.px > 1500:
            self.px = 30
            self.py += 90
        return rect

    def box(self, key, maxclass, text=None, pres=None, extra=None,
            numinlets=1, numoutlets=1, outlettype=None):
        self.counter += 1
        oid = f"obj-{self.counter}"
        self.ids[key] = oid
        b = {
            "id": oid,
            "maxclass": maxclass,
            "numinlets": numinlets,
            "numoutlets": numoutlets,
            "patching_rect": self._next_rect(),
        }
        if text is not None:
            b["text"] = text
        if numoutlets > 0:
            b["outlettype"] = outlettype if outlettype else [""] * numoutlets
        if pres is not None:
            b["presentation"] = 1
            b["presentation_rect"] = pres
        if extra:
            b.update(extra)
        valueof = b.get("saved_attribute_attributes", {}).get("valueof")
        if valueof:
            self.params.append((oid, valueof["parameter_longname"],
                                valueof["parameter_shortname"]))
        self.boxes.append({"box": b})
        return key

    def sig(self, key, text, numinlets, pres=None, extra=None, numoutlets=1):
        return self.box(key, "newobj", text, pres=pres, extra=extra,
                        numinlets=numinlets, numoutlets=numoutlets,
                        outlettype=["signal"] * numoutlets)

    def obj(self, key, text, numinlets=1, numoutlets=1, outlettype=None, pres=None, extra=None):
        return self.box(key, "newobj", text, pres=pres, extra=extra,
                        numinlets=numinlets, numoutlets=numoutlets, outlettype=outlettype)

    def connect(self, src, outlet, dst, inlet):
        self.lines.append({"patchline": {
            "source": [self.ids[src], outlet],
            "destination": [self.ids[dst], inlet],
        }})

    def to_dict(self):
        # patcher-level parameter map + 8-slot banks (Push / Live macro paging)
        parameters = {}
        for oid, longname, shortname in self.params:
            parameters[oid] = [longname, shortname, 0]
        banks = {}
        names = [p[1] for p in self.params]
        for i in range(0, len(names), 8):
            page = names[i:i + 8]
            page += ["-"] * (8 - len(page))
            banks[str(i // 8)] = {"index": i // 8, "name": "", "parameters": page}
        parameters["parameterbanks"] = banks
        parameters["inherited_shortname"] = 1

        return {
            "patcher": {
                "fileversion": 1,
                "appversion": {"major": 8, "minor": 6, "revision": 0,
                               "architecture": "x64", "modernui": 1},
                "classnamespace": "box",
                "rect": [128.0, 144.0, 1600.0, 900.0],
                "openrect": [0.0, 0.0, 0.0, 169.0],
                "bglocked": 0,
                "openinpresentation": 1,
                "default_fontsize": 10.0,
                "default_fontface": 0,
                "default_fontname": "Arial Bold",
                "gridonopen": 1,
                "gridsize": [8.0, 8.0],
                "gridsnaponopen": 1,
                "objectsnaponopen": 1,
                "statusbarvisible": 2,
                "toolbarvisible": 1,
                "lefttoolbarpinned": 0,
                "toptoolbarpinned": 0,
                "righttoolbarpinned": 0,
                "bottomtoolbarpinned": 0,
                "toolbars_unpinned_last_save": 0,
                "tallnewobj": 0,
                "boxanimatetime": 500,
                "enablehscroll": 1,
                "enablevscroll": 1,
                "devicewidth": 0.0,
                "description": "",
                "digest": "",
                "tags": "",
                "style": "",
                "subpatcher_template": "",
                "assistshowspatchername": 0,
                "parameters": parameters,
                "dependency_cache": [],
                "latency": 0,
                "is_mpe": 0,
                "minimum_live_version": "",
                "minimum_max_version": "",
                "platform_compatibility": 0,
                "project": {
                    "version": 1,
                    "creationdate": 3590052838,
                    "modificationdate": 3590052838,
                    "viewrect": [0.0, 0.0, 300.0, 500.0],
                    "autoorganize": 0,
                    "hideprojectwindow": 1,
                    "showdependencies": 1,
                    "autolocalize": 0,
                    "contents": {"patchers": {}},
                    "layout": {},
                    "searchpath": {},
                    "detailsvisible": 0,
                    "amxdtype": 1768515945,
                    "readonly": 0,
                    "devpathtype": 0,
                    "devpath": ".",
                    "sortmode": 0,
                    "viewmode": 0,
                    "includepackages": 0,
                },
                "autosave": 0,
                "boxes": self.boxes,
                "lines": self.lines,
            }
        }


def dial_attrs(longname, initial, shortname=None):
    return {
        "varname": longname.lower(),
        "parameter_enable": 1,
        "saved_attribute_attributes": {"valueof": {
            "parameter_initial": [initial],
            "parameter_initial_enable": 1,
            "parameter_longname": longname,
            "parameter_mmax": 1.0,
            "parameter_mmin": 0.0,
            "parameter_shortname": shortname or longname,
            "parameter_type": 0,
            "parameter_unitstyle": 1,
        }},
    }


def menu_attrs(longname, items, initial_idx):
    return {
        "varname": longname.lower(),
        "parameter_enable": 1,
        "saved_attribute_attributes": {"valueof": {
            "parameter_enum": items,
            "parameter_initial": [initial_idx],
            "parameter_initial_enable": 1,
            "parameter_longname": longname,
            "parameter_mmax": len(items) - 1,
            "parameter_shortname": longname,
            "parameter_type": 2,
        }},
    }


def build():
    p = Patch()

    # ---------------------------------------------------------------- UI (presentation)
    p.box("title", "comment", "PG BASS GENERATOR — Primordial Groove",
          pres=[4.0, 3.0, 260.0, 18.0],
          extra={"fontface": 1, "fontsize": 11.0}, numoutlets=0)
    p.box("display", "message", "…",
          pres=[268.0, 4.0, 188.0, 16.0],
          extra={"fontsize": 9.0}, numinlets=2, numoutlets=1)

    dials = [
        ("Novelty", 0.35), ("Density", 0.5), ("Chunk", 0.55),
        ("Squelch", 0.5), ("Drive", 0.35), ("Cutoff", 0.45),
        ("Decay", 0.5), ("Sub", 0.6), ("Wet", 0.3),
    ]
    for i, (name, init) in enumerate(dials):
        p.box("ui_" + name.lower(), "live.dial",
              pres=[4.0 + i * 50.0, 24.0, 48.0, 64.0],
              extra=dial_attrs(name, init), numinlets=1, numoutlets=2,
              outlettype=["", "float"])

    p.box("ui_groove", "live.menu",
          pres=[4.0, 96.0, 112.0, 15.0],
          extra=menu_attrs("Groove", ["restrained", "rolling", "syncopated",
                                      "driving", "acidic", "broken", "hypnotic"], 1),
          numinlets=1, numoutlets=3, outlettype=["", "", "float"])
    p.box("ui_root", "live.menu",
          pres=[120.0, 96.0, 66.0, 15.0],
          extra=menu_attrs("Root", ["C", "Db", "D", "Eb", "E", "F",
                                    "Gb", "G", "Ab", "A", "Bb", "B"], 0),
          numinlets=1, numoutlets=3, outlettype=["", "", "float"])
    p.box("ui_plen", "live.menu",
          pres=[190.0, 96.0, 76.0, 15.0],
          extra=menu_attrs("Length", ["1 bar", "2 bars", "4 bars"], 1),
          numinlets=1, numoutlets=3, outlettype=["", "", "float"])
    p.box("ui_lock", "live.toggle",
          pres=[276.0, 96.0, 15.0, 15.0],
          extra=menu_attrs("Lock", ["off", "on"], 0),
          numinlets=1, numoutlets=2, outlettype=["", "float"])
    p.box("lock_label", "comment", "lock",
          pres=[293.0, 96.0, 36.0, 16.0], extra={"fontsize": 9.0}, numoutlets=0)

    buttons = ["Mutate", "Return", "Reseed", "Rhythm", "Pitch"]
    for i, name in enumerate(buttons):
        p.box("btn_" + name.lower(), "message", name,
              pres=[4.0 + i * 58.0, 120.0, 54.0, 18.0],
              extra={"fontsize": 9.0}, numinlets=2, numoutlets=1)

    # ---------------------------------------------------------------- core + clock
    p.obj("js", "js pg-core.js", numinlets=1, numoutlets=3)
    p.obj("thisdevice", "live.thisdevice", numinlets=1, numoutlets=3,
          outlettype=["bang", "int", "int"])
    p.box("msg_pushall", "message", "pushall", numinlets=2, numoutlets=1)
    p.obj("metro", "metro 16n @active 1 @quantize 16n", numinlets=2, numoutlets=1,
          outlettype=["bang"])
    p.obj("trig_bb", "t b b", numinlets=1, numoutlets=2, outlettype=["bang", "bang"])
    p.obj("transport", "transport", numinlets=1, numoutlets=8)
    p.obj("pack_pos", "pack 1 1 0", numinlets=3, numoutlets=1)
    p.obj("prepend_pos", "prepend pos", numinlets=1, numoutlets=1)

    # UI -> js prepends
    for name, _ in dials:
        key = name.lower()
        p.obj("pre_" + key, f"prepend {key}", numinlets=1, numoutlets=1)
        p.connect("ui_" + key, 0, "pre_" + key, 0)
        p.connect("pre_" + key, 0, "js", 0)
    for key in ("groove", "root", "plen", "lock"):
        p.obj("pre_" + key, f"prepend {key}", numinlets=1, numoutlets=1)
        p.connect("ui_" + key, 0, "pre_" + key, 0)
        p.connect("pre_" + key, 0, "js", 0)
    for name in buttons:
        p.connect("btn_" + name.lower(), 0, "js", 0)

    # clock wiring: metro -> [t b b]; right bang queries transport first,
    # then the left bang ticks the core with a fresh position available
    p.connect("metro", 0, "trig_bb", 0)
    p.connect("trig_bb", 1, "transport", 0)
    p.connect("transport", 0, "pack_pos", 0)
    p.connect("transport", 1, "pack_pos", 1)
    p.connect("transport", 2, "pack_pos", 2)
    p.connect("pack_pos", 0, "prepend_pos", 0)
    p.connect("prepend_pos", 0, "js", 0)
    p.connect("trig_bb", 0, "js", 0)
    p.connect("thisdevice", 0, "msg_pushall", 0)
    p.connect("msg_pushall", 0, "js", 0)

    # ---------------------------------------------------------------- js outlet routing
    synth_params = ["cutoff", "reso", "envd", "drv", "post", "gain", "adec",
                    "asus", "sub", "wet", "duck", "fb", "dly", "dly2"]
    p.obj("route_synth", "route " + " ".join(synth_params),
          numinlets=1, numoutlets=len(synth_params) + 1)
    note_params = ["pitch", "trig", "fmul", "dmul", "fdec"]
    p.obj("route_note", "route " + " ".join(note_params),
          numinlets=1, numoutlets=len(note_params) + 1)
    p.obj("route_disp", "route disp dump", numinlets=1, numoutlets=3)
    p.obj("prepend_set", "prepend set", numinlets=1, numoutlets=1)

    p.connect("js", 0, "route_synth", 0)
    p.connect("js", 1, "route_note", 0)
    p.connect("js", 2, "route_disp", 0)
    p.connect("route_disp", 0, "prepend_set", 0)
    p.connect("prepend_set", 0, "display", 0)

    # ---------------------------------------------------------------- smoothing lines
    p.sig("l_cutoff", "line~", 2, numoutlets=2)   # cutoff base Hz
    p.sig("l_envd", "line~", 2, numoutlets=2)     # filter env depth Hz
    p.sig("l_drv", "line~", 2, numoutlets=2)      # pre-filter drive amount
    p.sig("l_wet", "line~", 2, numoutlets=2)      # wet send level
    p.sig("l_pitch", "line~", 2, numoutlets=2)    # note pitch (MIDI, glides)

    p.connect("route_synth", synth_params.index("cutoff"), "l_cutoff", 0)
    p.connect("route_synth", synth_params.index("envd"), "l_envd", 0)
    p.connect("route_synth", synth_params.index("drv"), "l_drv", 0)
    p.connect("route_synth", synth_params.index("wet"), "l_wet", 0)
    p.connect("route_note", note_params.index("pitch"), "l_pitch", 0)

    # ---------------------------------------------------------------- envelopes
    # amp: fast attack, chunk-scaled decay/sustain; filter: snappy, sustain 0
    p.sig("adsr_amp", "adsr~ 2 260 0.35 60", 5)
    p.sig("adsr_filt", "adsr~ 1 300 0. 80", 5)
    p.connect("route_note", note_params.index("trig"), "adsr_amp", 0)
    p.connect("route_note", note_params.index("trig"), "adsr_filt", 0)
    p.connect("route_synth", synth_params.index("adec"), "adsr_amp", 2)
    p.connect("route_synth", synth_params.index("asus"), "adsr_amp", 3)
    p.connect("route_note", note_params.index("fdec"), "adsr_filt", 2)

    # ---------------------------------------------------------------- oscillators
    p.sig("mtof_main", "mtof~", 1)
    p.sig("osc_saw", "saw~", 2)
    p.sig("osc_rect", "rect~", 2)
    p.sig("saw_gain", "*~ 0.8", 2)
    p.sig("rect_gain", "*~ 0.3", 2)
    p.sig("osc_mix", "+~", 2)
    p.connect("l_pitch", 0, "mtof_main", 0)
    p.connect("mtof_main", 0, "osc_saw", 0)
    p.connect("mtof_main", 0, "osc_rect", 0)
    p.connect("osc_saw", 0, "saw_gain", 0)
    p.connect("osc_rect", 0, "rect_gain", 0)
    p.connect("saw_gain", 0, "osc_mix", 0)
    p.connect("rect_gain", 0, "osc_mix", 1)

    # ---------------------------------------------------------------- drive -> filter
    p.sig("pre_drive", "*~ 1.", 2)     # drive amount (smoothed)
    p.sig("dmul_mul", "*~ 1.", 2)      # per-note accent drive
    p.sig("sat1", "tanh~", 1)
    p.sig("filter", "svf~ 800 0.5", 3, numoutlets=4)
    p.connect("osc_mix", 0, "pre_drive", 0)
    p.connect("l_drv", 0, "pre_drive", 1)
    p.connect("pre_drive", 0, "dmul_mul", 0)
    p.connect("route_note", note_params.index("dmul"), "dmul_mul", 1)
    p.connect("dmul_mul", 0, "sat1", 0)
    p.connect("sat1", 0, "filter", 0)
    p.connect("route_synth", synth_params.index("reso"), "filter", 2)

    # cutoff = base + env*depth*accent, clipped to sane Hz
    p.sig("envd_mul", "*~ 1.", 2)
    p.sig("fmul_mul", "*~ 1.", 2)
    p.sig("cut_sum", "+~", 2)
    p.sig("cut_clip", "clip~ 40. 12000.", 3)
    p.connect("adsr_filt", 0, "envd_mul", 0)
    p.connect("l_envd", 0, "envd_mul", 1)
    p.connect("envd_mul", 0, "fmul_mul", 0)
    p.connect("route_note", note_params.index("fmul"), "fmul_mul", 1)
    p.connect("fmul_mul", 0, "cut_sum", 0)
    p.connect("l_cutoff", 0, "cut_sum", 1)
    p.connect("cut_sum", 0, "cut_clip", 0)
    p.connect("cut_clip", 0, "filter", 1)

    # ---------------------------------------------------------------- post filter / VCA
    p.sig("amp_mul", "*~ 0.", 2)
    p.sig("post_mul", "*~ 1.", 2)
    p.sig("sat2", "tanh~", 1)
    p.sig("gain_mul", "*~ 0.5", 2)
    p.connect("filter", 0, "amp_mul", 0)          # svf~ lowpass outlet
    p.connect("adsr_amp", 0, "amp_mul", 1)
    p.connect("amp_mul", 0, "post_mul", 0)
    p.connect("route_synth", synth_params.index("post"), "post_mul", 1)
    p.connect("post_mul", 0, "sat2", 0)
    p.connect("sat2", 0, "gain_mul", 0)
    p.connect("route_synth", synth_params.index("gain"), "gain_mul", 1)

    # ---------------------------------------------------------------- sub oscillator (§2.5)
    p.sig("sub_offset", "-~ 12.", 2)
    p.sig("mtof_sub", "mtof~", 1)
    p.sig("osc_sub", "cycle~", 2)
    p.sig("sub_env", "*~ 0.", 2)
    p.sig("sub_mul", "*~ 0.6", 2)
    p.connect("l_pitch", 0, "sub_offset", 0)
    p.connect("sub_offset", 0, "mtof_sub", 0)
    p.connect("mtof_sub", 0, "osc_sub", 0)
    p.connect("osc_sub", 0, "sub_env", 0)
    p.connect("adsr_amp", 0, "sub_env", 1)
    p.connect("sub_env", 0, "sub_mul", 0)
    p.connect("route_synth", synth_params.index("sub"), "sub_mul", 1)

    # ---------------------------------------------------------------- wet core (§3)
    # send = highpassed dry, level enveloped, ducked against the amp env
    p.sig("wet_hp", "svf~ 420. 0.2", 3, numoutlets=4)
    p.sig("wet_mul", "*~ 0.", 2)
    p.sig("duckamt_mul", "*~ 0.6", 2)
    p.sig("duck_inv", "!-~ 1.", 2)
    p.sig("duck_mul", "*~ 1.", 2)
    p.sig("fb_sum", "+~", 2)
    p.sig("tapin", "tapin~ 2000", 1)
    p.sig("tapout", "tapout~ 380. 500.", 2, numoutlets=2)
    p.sig("fb_damp", "onepole~ 2400.", 2)
    p.sig("fb_mul", "*~ 0.3", 2)
    p.connect("gain_mul", 0, "wet_hp", 0)
    p.connect("wet_hp", 1, "wet_mul", 0)          # svf~ highpass outlet
    p.connect("l_wet", 0, "wet_mul", 1)
    p.connect("adsr_amp", 0, "duckamt_mul", 0)
    p.connect("route_synth", synth_params.index("duck"), "duckamt_mul", 1)
    p.connect("duckamt_mul", 0, "duck_inv", 0)
    p.connect("wet_mul", 0, "duck_mul", 0)
    p.connect("duck_inv", 0, "duck_mul", 1)
    p.connect("duck_mul", 0, "fb_sum", 0)
    p.connect("fb_sum", 0, "tapin", 0)
    p.connect("tapin", 0, "tapout", 0)
    p.connect("tapout", 0, "fb_damp", 0)
    p.connect("fb_damp", 0, "fb_mul", 0)
    p.connect("route_synth", synth_params.index("fb"), "fb_mul", 1)
    p.connect("fb_mul", 0, "fb_sum", 1)
    p.connect("route_synth", synth_params.index("dly"), "tapout", 0)
    p.connect("route_synth", synth_params.index("dly2"), "tapout", 1)

    # ---------------------------------------------------------------- output stage
    # §3.4 low-end stereo safety: dry + sub stay centered, only the wet taps differ L/R
    p.sig("dry_sub", "+~", 2)
    p.sig("sum_l", "+~", 2)
    p.sig("sum_r", "+~", 2)
    p.sig("trim_l", "*~ 0.8", 2)
    p.sig("trim_r", "*~ 0.8", 2)
    p.sig("plugout", "plugout~", 2, numoutlets=2)
    p.obj("midiin", "midiin", numinlets=1, numoutlets=1, outlettype=["int"])
    p.connect("gain_mul", 0, "dry_sub", 0)
    p.connect("sub_mul", 0, "dry_sub", 1)
    p.connect("dry_sub", 0, "sum_l", 0)
    p.connect("tapout", 0, "sum_l", 1)
    p.connect("dry_sub", 0, "sum_r", 0)
    p.connect("tapout", 1, "sum_r", 1)
    p.connect("sum_l", 0, "trim_l", 0)
    p.connect("sum_r", 0, "trim_r", 0)
    p.connect("trim_l", 0, "plugout", 0)
    p.connect("trim_r", 0, "plugout", 1)

    return p


def validate(p):
    ids = {b["box"]["id"] for b in p.boxes}
    inlets = {b["box"]["id"]: b["box"]["numinlets"] for b in p.boxes}
    outlets = {b["box"]["id"]: b["box"]["numoutlets"] for b in p.boxes}
    for line in p.lines:
        src, so = line["patchline"]["source"]
        dst, di = line["patchline"]["destination"]
        assert src in ids, f"line source missing: {src}"
        assert dst in ids, f"line destination missing: {dst}"
        assert so < outlets[src], f"{src} outlet {so} >= {outlets[src]}"
        assert di < inlets[dst], f"{dst} inlet {di} >= {inlets[dst]}"
    names = [b["box"].get("saved_attribute_attributes", {}).get("valueof", {})
             .get("parameter_longname") for b in p.boxes]
    names = [n for n in names if n]
    assert len(names) == len(set(names)), "duplicate parameter longnames"


def main():
    p = build()
    validate(p)
    doc = p.to_dict()
    json_bytes = json.dumps(doc, indent=1).encode("utf-8") + b"\n"

    DEVICE_DIR.mkdir(exist_ok=True)
    maxpat = DEVICE_DIR / "PG Bass Generator.maxpat"
    maxpat.write_bytes(json_bytes)

    # .amxd container (IFF-style chunks, verified against Live 12 factory devices):
    #   "ampf" <u32 size=4> "iiii"   device type: instrument
    #   "meta" <u32 size=4> <u32 0>  plain uncompressed patcher payload
    #   "ptch" <u32 size>   <patcher JSON, null-terminated>
    payload = json_bytes + b"\x00"
    amxd_bytes = (b"ampf" + struct.pack("<I", 4) + b"iiii"
                  + b"meta" + struct.pack("<I", 4) + struct.pack("<I", 0)
                  + b"ptch" + struct.pack("<I", len(payload)) + payload)
    amxd = DEVICE_DIR / "PG Bass Generator.amxd"
    amxd.write_bytes(amxd_bytes)

    json.loads(maxpat.read_text())  # round-trip sanity
    print(f"boxes: {len(p.boxes)}  lines: {len(p.lines)}  params: {len(p.params)}")
    print(f"wrote {maxpat.name} ({maxpat.stat().st_size} bytes)")
    print(f"wrote {amxd.name} ({amxd.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
