"""Presentation-view controls: Live parameter attributes and row layout."""

# (bg800, border600, label200), each an (r, g, b) 0-1 triple
RAMP = {
    "gray":  ((0.267, 0.267, 0.255), (0.373, 0.369, 0.353), (0.827, 0.820, 0.780)),
    "coral": ((0.443, 0.169, 0.075), (0.600, 0.235, 0.114), (0.961, 0.769, 0.702)),
    "teal":  ((0.031, 0.314, 0.255), (0.059, 0.431, 0.337), (0.624, 0.882, 0.796)),
    "amber": ((0.388, 0.220, 0.024), (0.522, 0.310, 0.043), (0.980, 0.780, 0.459)),
    "pink":  ((0.447, 0.141, 0.243), (0.600, 0.208, 0.337), (0.957, 0.753, 0.820)),
    "purple": ((0.235, 0.204, 0.537), (0.325, 0.290, 0.718), (0.808, 0.796, 0.965)),
}

# RAMP gray's label200 on its own: the ink for anything that must not read as
# belonging to a stage. A dial's own name and readout use it, so a line of
# controls does not compete with the stage caption sitting above them in that
# stage's colour.
NEUTRAL = (0.827, 0.820, 0.780)


def dial_look(ramp, hidden=False):
    """The appearance half of a live.dial, kept apart from dial_attrs so the
    two can differ: a stage whose knobs are drawn by a [jsui] wants the Live
    parameter and none of the paint.

    live.dial's colour roles do not read the way they are named. `dialcolor`
    is the *filled* travel — the value — and `fgdialcolor` is the unfilled
    track behind it. That is settled here once, off the 570 live.dials in
    Max's own BEAP and Vizzie packages: every one of them puts its accent in
    `dialcolor` and leaves a neutral in `fgdialcolor`, and 245 set only the
    former. The bare names paint when `active` is 0, the `active*` pair when
    it is 1, so both are set — a disabled control still reads as this stage's,
    just dimmed, instead of falling back to Max's factory grey.

    Colours only, plus the three text/marker toggles. Nothing here touches
    `appearance` or `needlemode`, so dial_knob()'s measured geometry — and
    every overlay trusting it — stays true. That is also why `hidden` is
    alpha rather than `invisible 1`: a colour cannot change hit-testing, so a
    painted-over dial is still a live.dial under the pointer and keeps drag,
    fine-drag, right-click MIDI mapping, automation write and Push. The one
    thing `hidden` does give up is live.dial's triangle — click-to-restore —
    because an invisible triangle is a hotspot with nothing over it, and where
    live.dial draws that triangle has never been measured the way dial_knob()
    measured the knob.
    """
    lb = list(RAMP[ramp][2])
    if hidden:
        return {"dialcolor": [0.0, 0.0, 0.0, 0.0],
                "activedialcolor": [0.0, 0.0, 0.0, 0.0],
                "fgdialcolor": [0.0, 0.0, 0.0, 0.0],
                "activefgdialcolor": [0.0, 0.0, 0.0, 0.0],
                "needlecolor": [0.0, 0.0, 0.0, 0.0],
                "activeneedlecolor": [0.0, 0.0, 0.0, 0.0],
                "textcolor": [0.0, 0.0, 0.0, 0.0],
                "focusbordercolor": [0.0, 0.0, 0.0, 0.0],
                "tricolor": [0.0, 0.0, 0.0, 0.0],
                "showname": 0, "shownumber": 0, "triangle": 0}
    return {
        "activedialcolor": lb + [1.0],                 # the value, in this stage's ink
        "dialcolor": lb + [0.45],
        "activefgdialcolor": [1.0, 1.0, 1.0, 0.13],    # the travel it moves along,
        "fgdialcolor": [1.0, 1.0, 1.0, 0.07],          # kept near pg-mod.js's TRACK
        "activeneedlecolor": [1.0, 1.0, 1.0, 0.72],    # and where it is right now
        "needlecolor": [1.0, 1.0, 1.0, 0.32],
        "textcolor": list(NEUTRAL) + [0.78],
        "focusbordercolor": lb + [0.5],
        "tricolor": lb + [0.55],
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


# Where live.dial puts its knob inside its box, measured off the device's own
# screenshot (docs/cover-device-ui.png, 48 x 56 dials): the knob is a circle
# centred across the width, hung under a fixed-height name label with the value
# readout below it — centre (24.0, 24.9), radius 12.06. A width-driven radius
# (w/4) and a height-driven one (whatever the two text bands leave) both land on
# that, and one screenshot cannot separate them; taking the smaller keeps a ring
# drawn over the knob inside the knob whichever one Max is really using.
DIAL_NAME_H = 12.9     # the parameter name, above the knob
DIAL_VALUE_H = 19.0    # the value readout, below it


def dial_knob(rect):
    """live.dial's knob within its presentation rect, as (cx, cy, radius) in
    the same coordinates. Anything drawn on top of a dial has to agree with
    this or it rings empty space."""
    x, y, w, h = rect
    r = min(w / 4.0, (h - DIAL_NAME_H - DIAL_VALUE_H) / 2.0)
    return x + w / 2.0, y + DIAL_NAME_H + r, r


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


def section(p, key, label, ramp, rect):
    """A tinted, captioned panel behind a group of controls. Purely cosmetic:
    nothing depends on it, only on each control's own presentation rect."""
    bg, bd, lb = RAMP[ramp]
    p.panel(key + "_panel", rect, bgcolor=list(bg) + [0.22], bordercolor=list(bd) + [0.5])
    lx, ly, lw, _lh = rect
    p.box(key + "_lbl", "comment", label,
          pres=[lx + 8.0, ly + 2.0, lw - 12.0, 10.0],
          extra={"fontsize": 8.0, "textcolor": list(lb) + [1.0]}, numoutlets=0)


class Row:
    """Lays out captioned groups of controls left to right on one presentation row.

    Every control's (box key, js message) pair collects in `sources`, message
    box buttons in `button_keys`; hand both to core.wire_controls. Control box keys
    are "ui_<msg>", buttons "btn_<caption>".
    """

    def __init__(self, p, y, h, panel_top, panel_h, x=8.0, gap=14.0):
        self.p, self.y, self.h = p, y, h
        self.panel_top, self.panel_h = panel_top, panel_h
        self.x, self.gap = x, gap
        self.sources = []
        self.button_keys = []
        self.dial_rects = {}   # js message -> that dial's presentation rect
        self.knob_keys = []    # box key of every stage drawn by a [jsui] instead

    def _section(self, label, ramp, span):
        section(self.p, label.replace(" ", "_"), label.upper(), ramp,
                [self.x - 6.0, self.panel_top, span + 12.0, self.panel_h])

    def dials(self, label, ramp, dials, pitch=50.0, w=48.0):
        """dials: (parameter longname, initial 0-1, js message)"""
        span = (len(dials) - 1) * pitch + w
        self._section(label, ramp, span)
        look = dial_look(ramp)
        for i, (name, init, msg) in enumerate(dials):
            key, rect = "ui_" + msg, [self.x + i * pitch, self.y, w, self.h]
            self.p.box(key, "live.dial", pres=rect,
                       extra=dict(dial_attrs(name, init), **look),
                       numinlets=1, numoutlets=2, outlettype=["", "float"])
            self.sources.append((key, msg))
            self.dial_rects[msg] = rect
        self.x += span + self.gap

    def stage(self, label, ramp, dials, menus=(), pitch=50.0, w=48.0,
              menu_h=18.0, menu_gap=4.0, drawn=None):
        """One stage of a signal path under a single caption: its dials on a
        line, the menus belonging to the same stage on a line beneath.

        A dial entry may carry a fourth element giving that one dial a larger
        diameter — how a group's meta control leads it, drawn bigger than the
        per-stage dials beside it. Dials share a bottom edge, so their name
        labels stay on one baseline whatever the knob size, and the gutter
        (pitch - w) is constant, so a promoted dial pushes the rest of the
        stage along instead of overlapping it. `y`/`h` describe an ordinary
        dial; a promoted one grows upward from the shared bottom, so leave it
        room between `panel_top` and `y`.

        `drawn` names a [jsui] script to hand this stage's knobs to: the dials
        go transparent and that script paints them instead (see knobs). The
        stage is otherwise laid out, wired and parameterised exactly as any
        other, so a device can promote one stage at a time.

        dials: (parameter longname, initial 0-1, js message[, diameter])
        menus: (parameter longname, items, initial index, js message, width)
        """
        gutter = pitch - w
        sizes = [d[3] if len(d) > 3 else w for d in dials]
        span = sum(sizes) + gutter * (len(sizes) - 1)
        if menus:
            span = max(span, sum(m[4] for m in menus) + menu_gap * (len(menus) - 1))
        self._section(label, ramp, span)

        look = dial_look(ramp, hidden=bool(drawn))
        x = self.x
        for (name, init, msg), dw in zip([d[:3] for d in dials], sizes):
            dh = self.h * dw / w
            key, rect = "ui_" + msg, [x, self.y + self.h - dh, dw, dh]
            self.p.box(key, "live.dial", pres=rect,
                       extra=dict(dial_attrs(name, init), **look),
                       numinlets=1, numoutlets=2, outlettype=["", "float"])
            self.sources.append((key, msg))
            self.dial_rects[msg] = rect
            x += dw + gutter

        if drawn:
            self.knobs("knob_" + label.replace(" ", "_"), drawn, ramp,
                       [(msg, name, init) for name, init, msg in
                        [d[:3] for d in dials]])

        x = self.x
        for name, items, init, msg, mw in menus:
            key = "ui_" + msg
            self.p.box(key, "live.menu",
                       pres=[x, self.y + self.h + menu_gap, mw, menu_h],
                       extra=menu_attrs(name, items, init),
                       numinlets=1, numoutlets=3, outlettype=["", "", "float"])
            self.sources.append((key, msg))
            x += mw + menu_gap
        self.x += span + self.gap

    def overlay(self, key, filename, rings, scale=0.72):
        """A [jsui] laid over dials this row already drew, so a script can put a
        second reading on a live.dial — which cannot draw one itself.

        rings: (ring name, js message). The message names a dial on this row;
        the name is what the script calls that ring. Each ring's centre and
        radius reach the script as creation arguments in the overlay's own
        coordinates — `<name> <cx> <cy> <r>`, four per ring — so live.dial's
        geometry is worked out in one place (dial_knob) instead of being agreed
        on twice. `scale` sets the ring inside the knob, as a fraction of it.

        The box spans exactly the dials it rings and is `ignoreclick`, so the
        dials underneath still take the mouse; it goes in front of everything
        (see Patch.box) because it is laid out after the controls it covers.
        """
        rects = [self.dial_rects[msg] for _, msg in rings]
        x0 = min(r[0] for r in rects)
        y0 = min(r[1] for r in rects)
        x1 = max(r[0] + r[2] for r in rects)
        y1 = max(r[1] + r[3] for r in rects)

        args = []
        for (name, msg), rect in zip(rings, rects):
            cx, cy, r = dial_knob(rect)
            args += [name, round(cx - x0, 2), round(cy - y0, 2), round(r * scale, 2)]

        self.p.box(key, "jsui", pres=[x0, y0, x1 - x0, y1 - y0],
                   extra={"filename": filename, "jsarguments": args,
                          "border": 0, "parameter_enable": 0, "ignoreclick": 1},
                   numinlets=1, numoutlets=1, front=True)
        return key

    def knobs(self, key, filename, ramp, dials):
        """The other kind of overlay: a [jsui] that draws the controls
        themselves, rather than a second reading on top of them.

        live.dial's own paint is four colours wide — that is the whole of it,
        and no amount of colouring gets past the flat arc every Live device
        already wears. A script can draw anything, but a [jsui] is not a Live
        parameter: automation, MIDI mapping and Push all speak to live.* boxes
        and nothing else. So the dial stays exactly where it was, keeps its
        parameter, and goes transparent (dial_look(hidden=True) — alpha, not
        `invisible`, so hit-testing cannot change); this box covers it and is
        `ignoreclick`, which passes the mouse through to it. Native drag,
        fine-drag, right-click-to-map and automation write all still land on a
        real live.dial. The script only paints.

        Which means it has to be told what the dial knows. Each control reaches
        it as `set <msg> <value>` through a [prepend] off the dial's own outlet
        — the same outlet the core listens to, so the drawing cannot disagree
        with what is heard — and its resting value rides in as a creation
        argument, so the knob is drawn correctly on the very first frame
        instead of waiting for a move.

            jsui <filename> <r> <g> <b> (<msg> <label> <cx> <cy> <radius> <initial>)...

        The stage's ink leads, once, so one script serves every stage.

        dials: (js message, parameter label, initial 0-1), in the order the row
        drew them. Labels travel as single atoms, so a space in one would arrive
        as two arguments and shift every knob after it — caught here, at build
        time, rather than in Max.
        """
        rects = [self.dial_rects[msg] for msg, _, _ in dials]
        x0 = min(r[0] for r in rects)
        y0 = min(r[1] for r in rects)
        x1 = max(r[0] + r[2] for r in rects)
        y1 = max(r[1] + r[3] for r in rects)

        args = [round(c, 4) for c in RAMP[ramp][2]]
        for (msg, label, init), rect in zip(dials, rects):
            assert " " not in label, f"knob label is one atom: {label!r}"
            cx, cy, r = dial_knob(rect)
            args += [msg, label, round(cx - x0, 2), round(cy - y0, 2),
                     round(r, 2), round(init, 4)]

        self.p.box(key, "jsui", pres=[x0, y0, x1 - x0, y1 - y0],
                   extra={"filename": filename, "jsarguments": args,
                          "border": 0, "parameter_enable": 0, "ignoreclick": 1},
                   numinlets=1, numoutlets=1, front=True)

        for msg, _, _ in dials:
            feed = "knobfeed_" + msg
            self.p.obj(feed, "prepend set " + msg, numinlets=1, numoutlets=1)
            self.p.connect("ui_" + msg, 0, feed, 0)
            self.p.connect(feed, 0, key, 0)

        self.knob_keys.append(key)
        return key

    def menus(self, label, ramp, menus, gap=4.0):
        """menus: (parameter longname, items, initial index, js message, width)"""
        span = sum(m[-1] for m in menus) + gap * (len(menus) - 1)
        self._section(label, ramp, span)
        x = self.x
        for name, items, init, msg, w in menus:
            key = "ui_" + msg
            self.p.box(key, "live.menu", pres=[x, self.y, w, self.h],
                       extra=menu_attrs(name, items, init),
                       numinlets=1, numoutlets=3, outlettype=["", "", "float"])
            self.sources.append((key, msg))
            x += w + gap
        self.x += span + self.gap

    def toggles(self, label, ramp, toggles, gap=3.0):
        """toggles: (parameter longname, js message, caption, caption width)"""
        span = sum(17.0 + lw for *_, lw in toggles) + gap * (len(toggles) - 1)
        self._section(label, ramp, span)
        x = self.x
        for name, msg, caption, lw in toggles:
            key = "ui_" + msg
            self.p.box(key, "live.toggle", pres=[x, self.y, 15.0, self.h],
                       extra=menu_attrs(name, ["off", "on"], 0),
                       numinlets=1, numoutlets=2, outlettype=["", "float"])
            self.p.box(key + "_label", "comment", caption,
                       pres=[x + 17.0, self.y, lw, 16.0],
                       extra={"fontsize": 9.0}, numoutlets=0)
            self.sources.append((key, msg))
            x += 17.0 + lw + gap
        self.x += span + self.gap

    def buttons(self, label, ramp, names, pitch=58.0, w=54.0):
        """names: message-box captions, each sent verbatim to the core when clicked"""
        span = (len(names) - 1) * pitch + w
        self._section(label, ramp, span)
        for i, name in enumerate(names):
            key = "btn_" + name.lower()
            self.p.box(key, "message", name,
                       pres=[self.x + i * pitch, self.y, w, self.h],
                       extra={"fontsize": 9.0}, numinlets=2, numoutlets=1)
            self.button_keys.append(key)
        self.x += span + self.gap
