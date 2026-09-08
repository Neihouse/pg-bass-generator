"""Presentation-view controls: Live parameter attributes and row layout."""

# (bg800, border600, label200), each an (r, g, b) 0-1 triple
RAMP = {
    "gray":  ((0.267, 0.267, 0.255), (0.373, 0.369, 0.353), (0.827, 0.820, 0.780)),
    "coral": ((0.443, 0.169, 0.075), (0.600, 0.235, 0.114), (0.961, 0.769, 0.702)),
    "teal":  ((0.031, 0.314, 0.255), (0.059, 0.431, 0.337), (0.624, 0.882, 0.796)),
    "amber": ((0.388, 0.220, 0.024), (0.522, 0.310, 0.043), (0.980, 0.780, 0.459)),
    "pink":  ((0.447, 0.141, 0.243), (0.600, 0.208, 0.337), (0.957, 0.753, 0.820)),
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


def section(p, key, label, ramp, rect):
    """A tinted, captioned panel behind a group of controls. Purely cosmetic:
    nothing depends on it, only on each control's own presentation rect."""
    bg, bd, lb = RAMP[ramp]
    p.panel(key + "_panel", rect, bgcolor=list(bg) + [0.22], bordercolor=list(bd) + [0.5])
    lx, ly, lw, _lh = rect
    p.box(key + "_lbl", "comment", label,
          pres=[lx + 8.0, ly + 3.0, lw - 12.0, 12.0],
          extra={"fontsize": 8.5, "textcolor": list(lb) + [1.0]}, numoutlets=0)


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

    def _section(self, label, ramp, span):
        section(self.p, label.replace(" ", "_"), label.upper(), ramp,
                [self.x - 6.0, self.panel_top, span + 12.0, self.panel_h])

    def dials(self, label, ramp, dials, pitch=50.0, w=48.0):
        """dials: (parameter longname, initial 0-1, js message)"""
        span = (len(dials) - 1) * pitch + w
        self._section(label, ramp, span)
        for i, (name, init, msg) in enumerate(dials):
            key = "ui_" + msg
            self.p.box(key, "live.dial", pres=[self.x + i * pitch, self.y, w, self.h],
                       extra=dial_attrs(name, init), numinlets=1, numoutlets=2,
                       outlettype=["", "float"])
            self.sources.append((key, msg))
        self.x += span + self.gap

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
