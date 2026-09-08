"""Plumbing between a [js] core and the rest of the device.

The core is expected to speak this protocol. On its inlet:
  <msg> <value>            a control moved (wire_controls)
  <Caption>                a message-box button, sent verbatim (wire_controls)
  bang                     one clock step (clock)
  pos <bar> <beat> <unit>  transport position, sent just before each bang (clock)
  pushall                  re-emit every parameter; fired on device load (persist_state)
  Restore <list>           the state list it last emitted, handed back on load (persist_state)
On its outlets:
  <selector> <args...>     parameters, demultiplexed by a Route
  state <list>             a flat numeric snapshot of everything worth saving (persist_state)
  disp <text>              a status line (status_display)
"""


def wire_controls(p, sources, buttons=(), js="js"):
    """Each (box key, msg) control reaches the core as "<msg> <value>"."""
    for key, msg in sources:
        p.obj("pre_" + msg, f"prepend {msg}", numinlets=1, numoutlets=1)
        p.connect(key, 0, "pre_" + msg, 0)
        p.connect("pre_" + msg, 0, js, 0)
    for key in buttons:
        p.connect(key, 0, js, 0)


def clock(p, js="js", interval="16n"):
    """A transport-quantized metro that bangs the core once per step, with a
    fresh "pos bar beat unit" delivered just ahead of each bang."""
    p.obj("metro", f"metro {interval} @active 1 @quantize {interval}",
          numinlets=2, numoutlets=1, outlettype=["bang"])
    p.obj("trig_bb", "t b b", numinlets=1, numoutlets=2, outlettype=["bang", "bang"])
    p.obj("transport", "transport", numinlets=1, numoutlets=8)
    p.obj("pack_pos", "pack 1 1 0", numinlets=3, numoutlets=1)
    p.obj("prepend_pos", "prepend pos", numinlets=1, numoutlets=1)
    # [t b b] fires right to left: query the transport first, then tick the core
    p.connect("metro", 0, "trig_bb", 0)
    p.connect("trig_bb", 1, "transport", 0)
    p.connect("transport", 0, "pack_pos", 0)
    p.connect("transport", 1, "pack_pos", 1)
    p.connect("transport", 2, "pack_pos", 2)
    p.connect("pack_pos", 0, "prepend_pos", 0)
    p.connect("prepend_pos", 0, js, 0)
    p.connect("trig_bb", 0, js, 0)


class Route:
    """[route a b c ...]: outlet i carries selector names[i]; the extra last
    outlet is whatever did not match."""

    def __init__(self, p, key, names):
        self.p, self.key, self.names = p, key, list(names)
        p.obj(key, "route " + " ".join(self.names),
              numinlets=1, numoutlets=len(self.names) + 1)

    def outlet(self, name):
        return self.names.index(name)

    def wire(self, name, dst, inlet=0):
        self.p.connect(self.key, self.outlet(name), dst, inlet)


def smoothers(p, route, names, prefix="l_"):
    """One [line~] per selector, so "<sel> <target> <ms>" arrives as a glided
    signal. Boxes are keyed prefix + name."""
    for name in names:
        p.sig(prefix + name, "line~", 2, numoutlets=2)
    for name in names:
        route.wire(name, prefix + name)


def status_display(p, route, pres, sel="disp"):
    p.box("display", "message", "…", pres=pres,
          extra={"fontsize": 9.0}, numinlets=2, numoutlets=1)
    p.obj("prepend_set", "prepend set", numinlets=1, numoutlets=1)
    route.wire(sel, "prepend_set")
    p.connect("prepend_set", 0, "display", 0)


def persist_state(p, route, pattr, sel="state", js="js"):
    """Round-trips the core's state list through a [pattr] so it lives in the
    Live Set.

    Load order: [t b b] fires right-to-left, so the stored list goes back to
    the core as "Restore ..." BEFORE pushall runs. Restore lets the core drop
    whatever regeneration Live's parameter restore just queued, and pushall
    then re-emits the parameters (and the state, so a set saved before the
    device ever ran still comes back with content).
    """
    p.obj("thisdevice", "live.thisdevice", numinlets=1, numoutlets=3,
          outlettype=["bang", "int", "int"])
    p.obj("load_bb", "t b b", numinlets=1, numoutlets=2, outlettype=["bang", "bang"])
    p.obj("pattr_state", f"pattr {pattr}", numinlets=2, numoutlets=3)
    p.obj("prepend_restore", "prepend Restore", numinlets=1, numoutlets=1)
    p.box("msg_pushall", "message", "pushall", numinlets=2, numoutlets=1)
    p.connect("thisdevice", 0, "load_bb", 0)
    p.connect("load_bb", 1, "pattr_state", 0)   # bang: pattr outputs what it stored
    p.connect("pattr_state", 0, "prepend_restore", 0)
    p.connect("prepend_restore", 0, js, 0)
    p.connect("load_bb", 0, "msg_pushall", 0)
    p.connect("msg_pushall", 0, js, 0)

    # stored as "set ..." so pattr does not echo it back out, which would loop
    # straight into Restore
    p.obj("prepend_set_state", "prepend set", numinlets=1, numoutlets=1)
    route.wire(sel, "prepend_set_state")
    p.connect("prepend_set_state", 0, "pattr_state", 0)


def midi_out(p, note, note_sel="note", stop_sel="trig"):
    """MIDI-effect build: "note <pitch> <vel> <ms>" events leave the device as
    real MIDI, and "<stop_sel> 0" flushes pending note-offs.

    This has to be a separate device rather than a switch on an instrument.
    An instrument sits at the *end* of Live's MIDI chain, so nothing downstream
    can receive notes from it — which is why none of the factory Max
    instruments contain a [midiout], and why Cycling '74 ship their own
    "Max MIDI Sender" example as a MIDI effect.
    """
    p.obj("midiin", "midiin", numinlets=1, numoutlets=1, outlettype=["int"])
    p.obj("makenote", "makenote 100 200", numinlets=3, numoutlets=2,
          outlettype=["int", "int"])
    p.obj("pack_note", "pack 0 0", numinlets=2, numoutlets=1, outlettype=[""])
    p.obj("midiformat", "midiformat", numinlets=8, numoutlets=2,
          outlettype=["int", ""])
    p.obj("midiout", "midiout", numinlets=1, numoutlets=0)

    # "note <pitch> <vel> <ms>" distributes across makenote's three inlets —
    # Max fills the right inlets first, so velocity and duration are already
    # set by the time the pitch triggers the note.
    note.wire(note_sel, "makenote", 0)
    # makenote fires velocity (outlet 1) before pitch (outlet 0), so pack's cold
    # inlet is always current when the hot inlet triggers.
    p.connect("makenote", 1, "pack_note", 1)
    p.connect("makenote", 0, "pack_note", 0)
    p.connect("pack_note", 0, "midiformat", 0)
    p.connect("midiformat", 0, "midiout", 0)

    # On stop the core closes its own voice with "<stop_sel> 0". Here that has
    # to flush makenote's pending note-offs instead, or every note it has
    # already started hangs on the downstream instrument.
    p.obj("stop_if", "if $f1 <= 0. then stop", numinlets=1, numoutlets=1)
    note.wire(stop_sel, "stop_if", 0)
    p.connect("stop_if", 0, "makenote", 0)

    # pass incoming MIDI through so the track still plays from the keyboard
    p.connect("midiin", 0, "midiout", 0)
