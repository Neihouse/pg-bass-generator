# m4lkit

The device-independent half of `scripts/build_device.py`: everything needed to
generate a Max for Live device from Python that is not about *this* device.
A new device is a build script that lays out its own controls, names its own
parameters, and wires its own signal graph on top of these, plus a test file
that drives its core through `maxtest.js`.

| module     | what it owns |
|------------|--------------|
| `patch.py` | `Patch` — the patcher JSON builder (string-keyed boxes, patchlines, Live parameter map + banks); `validate`; `write_device` — writes the `.maxpat` and the `.amxd` (`ampf`/`meta`/`ptch` container, instrument / MIDI / audio types) |
| `ui.py`    | `Row` — captioned, colour-coded groups of `live.dial` / `live.menu` / `live.toggle` / message-box buttons laid out left-to-right on one presentation row; the parameter attribute dicts Live needs. `Row.stage` is the variant for a signal path: one caption over a line of dials with that stage's menus beneath them, and an optional per-dial diameter so a group's meta control can lead it drawn larger — the dials share a bottom edge, so their name labels stay on one baseline whatever the knob size. `dial_look` is the stage's colours as `live.dial` attributes — the filled arc in that stage's ink, a neutral track behind it — or, `hidden`, the same dial with every colour at zero alpha. `Row.overlay` lays a click-through `[jsui]` over dials the row already drew, for a script that has to put a second reading on a `live.dial` — which cannot draw one itself; `Row.knobs` is the other half of that idea, a `[jsui]` that draws the controls instead of annotating them, over hidden dials that keep the parameter and the mouse; `dial_knob` is where `live.dial` actually puts its knob inside its box, so an overlay and the control under it agree on the geometry in one place |
| `core.py`  | plumbing between a `[js]` core and the patch: control fan-in, transport clock, `Route` demux of the core's outlets, `line~` smoothers, status line, `[pattr]` state persistence, MIDI-effect output. The message protocol the core has to speak is in the module docstring |
| `maxtest.js` | Node-side test shim for a legacy `[js]` core: `loadCore` builds a sandbox with fake `outlet`/`post`/`Task`/`Date.now`, a fake clock and its own `Math.random`, seeded by the `seed` option (default 1) so the same inputs emit the same messages every run; `call`/`tick`/`collect`/`last` drive and read it; `readPatch`/`routedSelectors`/`patchControls`/`jsuiHandlers` check the built `.maxpat` against the core in both directions, `emittedSelectors(sb, outlet)` narrows that to one stream, `jsHandlers` reads the messages a single script answers to and `MAX_JS_GLOBALS` lists the names Max already owns in one (see the convention below), and `jsuiBoxes`/`feeders` ask where a display ended up, how it was configured and what feeds it (by box id — a builder's own key for a box is not written into the patch); `sent(sb, outlet)` reads the other direction — what a `[jsui]` pushed out of its own outlet, in order, which is the half a mouse handler writes; `loadJsui` does the same job for a `[jsui]` display script, shimming `mgraphics` so `paint` runs headless and `paint(sb)` hands back every primitive it drew, colour and geometry included, with `args` standing in for the box's creation arguments — `arc` is sampled along the sweep it really traces rather than boxed as the whole circle, so a test can ask where a partial arc ended; `runner` is a minimal test/assert/finish |
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
- The reverse also holds for a `[jsui]`: not every top-level function is a
  message. Max calls `paint`, `onclick`, `ondrag`, `onresize` and the rest of
  `maxtest.JSUI_CALLBACKS` itself — they arrive from the window, never from a
  patchcord — so `jsuiHandlers` drops them. A test asking what selectors a
  display consumes must not count a mouse handler as one waiting on a stream
  that will never carry it.
- A `[js]`/`[jsui]` script does not get to decide which messages it handles.
  Max resolves an incoming selector against the script's globals, and those
  start out holding Max's own — `post`, `error`, `outlet`, `Task`, `File` and
  the rest of `maxtest.MAX_JS_GLOBALS`. A selector that matches one of them
  never reaches `anything()`: Max's function runs instead, silently doing
  something else. So a script fed a whole outlet has to claim every such name
  that outlet can carry, with a no-op of its own — and since nothing in the
  patch shows it going wrong, a test is what notices when the stream grows one.
- A `[jsui]` is not a Live parameter — automation, MIDI mapping and Push all
  speak to `live.*` boxes and nothing else — so a drawn control is never a
  replacement for one. `Row.knobs` leaves the `live.dial` exactly where it was
  and turns it transparent by *alpha*, never `invisible`, because a colour
  cannot change hit-testing and an attribute that hides a box might; the drawing
  goes on top with `ignoreclick`, and every native gesture still lands on a real
  control that Live can see. Its resting value rides in as a creation argument,
  so the knob is drawn correctly on the first frame rather than after the first
  move — an annotation may start blank, a control may not.
- A display is usually fed a whole core outlet, but it need not be: `Row.knobs`
  hangs its script off the dials themselves, one `[prepend set <msg>]` each, so
  the drawing and the sound are the same number by construction. Either way the
  selector has to be one the script answers to, and neither the patch nor Max
  says otherwise when it is not — the display simply never updates.
