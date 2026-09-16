# m4lkit

The device-independent half of `scripts/build_device.py`: everything needed to
generate a Max for Live device from Python that is not about *this* device.
A new device is a build script that lays out its own controls, names its own
parameters, and wires its own signal graph on top of these, plus a test file
that drives its core through `maxtest.js`.

| module     | what it owns |
|------------|--------------|
| `patch.py` | `Patch` — the patcher JSON builder (string-keyed boxes, patchlines, Live parameter map + banks); `validate`; `write_device` — writes the `.maxpat` and the `.amxd` (`ampf`/`meta`/`ptch` container, instrument / MIDI / audio types) |
| `ui.py`    | `Row` — captioned, colour-coded groups of `live.dial` / `live.menu` / `live.toggle` / message-box buttons laid out left-to-right on one presentation row; the parameter attribute dicts Live needs. `Row.stage` is the variant for a signal path: one caption over a line of dials with that stage's menus beneath them, and an optional per-dial diameter so a group's meta control can lead it drawn larger — the dials share a bottom edge, so their name labels stay on one baseline whatever the knob size. `Row.overlay` lays a click-through `[jsui]` over dials the row already drew, for a script that has to put a second reading on a `live.dial` — which cannot draw one itself; `dial_knob` is where `live.dial` actually puts its knob inside its box, so an overlay and the control under it agree on the geometry in one place |
| `core.py`  | plumbing between a `[js]` core and the patch: control fan-in, transport clock, `Route` demux of the core's outlets, `line~` smoothers, status line, `[pattr]` state persistence, MIDI-effect output. The message protocol the core has to speak is in the module docstring |
| `maxtest.js` | Node-side test shim for a legacy `[js]` core: `loadCore` builds a sandbox with fake `outlet`/`post`/`Task`/`Date.now`, a fake clock and its own `Math.random`, seeded by the `seed` option (default 1) so the same inputs emit the same messages every run; `call`/`tick`/`collect`/`last` drive and read it; `readPatch`/`routedSelectors`/`patchControls`/`jsuiHandlers` check the built `.maxpat` against the core in both directions, and `jsuiBoxes`/`feeders` ask where a display ended up, how it was configured and what feeds it (by box id — a builder's own key for a box is not written into the patch); `loadJsui` does the same job for a `[jsui]` display script, shimming `mgraphics` so `paint` runs headless and `paint(sb)` hands back every primitive it drew, colour and geometry included, with `args` standing in for the box's creation arguments — `arc` is sampled along the sweep it really traces rather than boxed as the whole circle, so a test can ask where a partial arc ended; `runner` is a minimal test/assert/finish |
| `dsp.py`   | reusable signal blocks: shared LFO, crossfade, wavefolder, envelope duck, mid/side width, asymmetric saturation. Each boxes under `<key>_...` and returns its output key so blocks chain |

Conventions that matter:

- A box key is a name you choose; `Patch` allocates the `obj-N` ids. Keys are
  unique per patch (`Patch.box` asserts it) — two controls that share a key
  silently overwrite each other's id and orphan the first.
- Box creation order is z-order in the patcher, so section panels are boxed
  before the controls they sit behind. A box that has to sit *in front* of
  what it covers — an overlay laid out after the controls it draws on — takes
  `Patch.box(front=True)` instead of being moved earlier in the script.
- Every control's `(box key, js message)` pair lands in `Row.sources`; hand
  those to `core.wire_controls` and each control reaches the core as
  `<msg> <value>`.
- `core.Route(...).wire(name, dst, inlet)` connects a core selector to a box
  without anyone having to count outlets.
- `Patch.subpatcher` lifts the inner patcher's Live parameters into the parent's
  map under their `oid::oid` nested addresses, recursively. Live builds
  automation, MIDI mapping and the Push bank layout from the *device-level* map,
  so without that lift, moving controls into a window subpatcher empties all
  three — the controls still work and Live can no longer see them.
- `maxtest.patchControls` walks subpatchers too, so a control is checked
  wherever it lives; a message-box button whose output only reaches `[pcontrol]`
  or `[thispatcher]` is page navigation and drops out on its own wiring, without
  a list of captions to keep in sync.
