# m4lkit

The device-independent half of `scripts/build_device.py`: everything needed to
generate a Max for Live device from Python that is not about *this* device.
A new device is a build script that lays out its own controls, names its own
parameters, and wires its own signal graph on top of these, plus a test file
that drives its core through `maxtest.js`.

| module     | what it owns |
|------------|--------------|
| `patch.py` | `Patch` — the patcher JSON builder (string-keyed boxes, patchlines, Live parameter map + banks); `validate`; `write_device` — writes the `.maxpat` and the `.amxd` (`ampf`/`meta`/`ptch` container, instrument / MIDI / audio types) |
| `ui.py`    | `Row` — captioned, colour-coded groups of `live.dial` / `live.menu` / `live.toggle` / message-box buttons laid out left-to-right on one presentation row; the parameter attribute dicts Live needs |
| `core.py`  | plumbing between a `[js]` core and the patch: control fan-in, transport clock, `Route` demux of the core's outlets, `line~` smoothers, status line, `[pattr]` state persistence, MIDI-effect output. The message protocol the core has to speak is in the module docstring |
| `maxtest.js` | Node-side test shim for a legacy `[js]` core: `loadCore` builds a sandbox with fake `outlet`/`post`/`Task`/`Date.now` and a fake clock; `call`/`tick`/`collect`/`last` drive and read it; `readPatch`/`routedSelectors`/`patchControls` check the built `.maxpat` against the core in both directions; `runner` is a minimal test/assert/finish |
| `dsp.py`   | reusable signal blocks: shared LFO, crossfade, wavefolder, envelope duck, mid/side width, asymmetric saturation. Each boxes under `<key>_...` and returns its output key so blocks chain |

Conventions that matter:

- A box key is a name you choose; `Patch` allocates the `obj-N` ids. Keys are
  unique per patch (`Patch.box` asserts it) — two controls that share a key
  silently overwrite each other's id and orphan the first.
- Box creation order is z-order in the patcher, so section panels are boxed
  before the controls they sit behind.
- Every control's `(box key, js message)` pair lands in `Row.sources`; hand
  those to `core.wire_controls` and each control reaches the core as
  `<msg> <value>`.
- `core.Route(...).wire(name, dst, inlet)` connects a core selector to a box
  without anyone having to count outlets.
