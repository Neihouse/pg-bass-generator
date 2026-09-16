"""Max patcher construction and Max for Live (.amxd) packaging.

A Patch is a list of boxes and patchlines addressed by string keys. Boxes are
auto-placed on a grid in the patching view; presentation rects are explicit.
"""

import json
import struct
from pathlib import Path

# .amxd device type 4cc; the project dict wants the same bytes as a big-endian int
DEVICE_TYPES = {"instrument": b"iiii", "midi": b"mmmm", "audio": b"aaaa"}


class Patch:
    def __init__(self, kind="instrument"):
        self.kind = kind
        self.amxdtype = int.from_bytes(DEVICE_TYPES[kind], "big")
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
            numinlets=1, numoutlets=1, outlettype=None, front=False):
        """`front=True` puts the box in front of everything already built
        instead of behind it (see _ordered_boxes) — for an overlay that has to
        be laid out after the controls it draws on top of."""
        assert key not in self.ids, f"duplicate box key: {key}"
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
        if front:
            self.boxes.insert(0, {"box": b})
        else:
            self.boxes.append({"box": b})
        return key

    def sig(self, key, text, numinlets, pres=None, extra=None, numoutlets=1):
        return self.box(key, "newobj", text, pres=pres, extra=extra,
                        numinlets=numinlets, numoutlets=numoutlets,
                        outlettype=["signal"] * numoutlets)

    def obj(self, key, text, numinlets=1, numoutlets=1, outlettype=None, pres=None, extra=None):
        return self.box(key, "newobj", text, pres=pres, extra=extra,
                        numinlets=numinlets, numoutlets=numoutlets, outlettype=outlettype)

    def panel(self, key, pres, bgcolor, bordercolor, rounded=8):
        """A `panel` UI object used only to group controls in the presentation
        view. Call it whenever reads best — to_dict() sinks every panel behind
        the rest of the patch, so it cannot cover the controls it groups."""
        return self.box(key, "panel", pres=pres,
                        extra={"bgcolor": bgcolor, "bordercolor": bordercolor,
                               "rounded": rounded, "border": 1},
                        numinlets=1, numoutlets=0)

    def subpatcher(self, key, text, inner, rect, varname=None, pres=None,
                   numinlets=0, numoutlets=0, outlettype=None,
                   title=None, openinpresentation=0):
        """A subpatcher box: `inner` is a separate Patch built with its own
        box()/sig()/connect() calls (own id-space, own boxes/lines). It opens
        as an independent floating OS window — not constrained by Live's
        169px rack cap, since that cap (`openrect` in to_dict()) only applies
        to the top-level device patcher, not to a nested subpatcher's own
        `rect`. Give it a `varname` (scripting name) so a [pcontrol @target
        <varname>] elsewhere in this patch can open/front/close it.

        Any Live parameters inside `inner` are lifted into this patcher's
        parameter map under their `oid::oid` nested addresses, so the device
        keeps a full parameter list and Push bank layout."""
        assert key not in self.ids, f"duplicate box key: {key}"
        self.counter += 1
        oid = f"obj-{self.counter}"
        self.ids[key] = oid

        validate(inner)
        # Live addresses a nested parameter as "<subpatcher oid>::<its own oid>".
        # Lifting them into this patcher's map is what keeps the device-level
        # parameter list — and the Push banks built from it — non-empty when the
        # controls live in a subpatcher window rather than the rack. Recursive by
        # construction: a doubly-nested control arrives already prefixed once.
        for inner_oid, longname, shortname in inner.params:
            self.params.append((f"{oid}::{inner_oid}", longname, shortname))

        inner_patcher = inner.to_dict()["patcher"]
        inner_patcher.pop("project", None)
        inner_patcher.pop("openrect", None)
        inner_patcher["rect"] = rect
        inner_patcher["openinpresentation"] = openinpresentation
        if title is not None:
            inner_patcher["title"] = title

        b = {
            "id": oid,
            "maxclass": "newobj",
            "text": text,
            "numinlets": numinlets,
            "numoutlets": numoutlets,
            "patching_rect": self._next_rect(),
            "patcher": inner_patcher,
            "saved_object_attributes": {"description": "", "digest": "",
                                         "globalpatchername": "", "tags": ""},
        }
        if varname:
            b["varname"] = varname
        if numoutlets > 0:
            b["outlettype"] = outlettype if outlettype else [""] * numoutlets
        if pres is not None:
            b["presentation"] = 1
            b["presentation_rect"] = pres
        self.boxes.append({"box": b})
        return key

    def connect(self, src, outlet, dst, inlet):
        self.lines.append({"patchline": {
            "source": [self.ids[src], outlet],
            "destination": [self.ids[dst], inlet],
        }})

    def _ordered_boxes(self):
        """Max draws `boxes` front-to-back: index 0 is frontmost, the last entry
        sits at the very back. Panels are backdrops, so they go last — earliest
        created deepest, since a full-window backdrop is built before the
        section panels that sit on it. Everything else keeps build order, so a
        box built later sits *behind* one built earlier; box(front=True) is how
        a box built last still lands on top."""
        panels = [b for b in self.boxes if b["box"]["maxclass"] == "panel"]
        rest = [b for b in self.boxes if b["box"]["maxclass"] != "panel"]
        return rest + panels[::-1]

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
                    "amxdtype": self.amxdtype,
                    "readonly": 0,
                    "devpathtype": 0,
                    "devpath": ".",
                    "sortmode": 0,
                    "viewmode": 0,
                    "includepackages": 0,
                },
                "autosave": 0,
                "boxes": self._ordered_boxes(),
                "lines": self.lines,
            }
        }


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


def write_device(p, out_dir, name):
    """Writes <name>.maxpat and <name>.amxd into out_dir."""
    validate(p)
    json_bytes = json.dumps(p.to_dict(), indent=1).encode("utf-8") + b"\n"

    out_dir = Path(out_dir)
    out_dir.mkdir(exist_ok=True)
    maxpat = out_dir / f"{name}.maxpat"
    maxpat.write_bytes(json_bytes)

    # .amxd container (IFF-style chunks, verified against Live 12 factory devices):
    #   "ampf" <u32 size=4> <4cc>    device type: "iiii" instrument / "mmmm" MIDI effect
    #   "meta" <u32 size=4> <u32 0>  plain uncompressed patcher payload
    #   "ptch" <u32 size>   <patcher JSON, null-terminated>
    payload = json_bytes + b"\x00"
    amxd_bytes = (b"ampf" + struct.pack("<I", 4) + DEVICE_TYPES[p.kind]
                  + b"meta" + struct.pack("<I", 4) + struct.pack("<I", 0)
                  + b"ptch" + struct.pack("<I", len(payload)) + payload)
    amxd = out_dir / f"{name}.amxd"
    amxd.write_bytes(amxd_bytes)

    json.loads(maxpat.read_text())  # round-trip sanity
    print(f"{name}: {p.kind}  boxes: {len(p.boxes)}  lines: {len(p.lines)}  "
          f"params: {len(p.params)}  amxd: {amxd.stat().st_size} bytes")
