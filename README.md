# PG Bass Generator

A Max for Live instrument for Ableton Live that generates novel, stylistically coherent house basslines with a wet, chunky, squelchy bass synthesis engine.

**Design principle**: generate variation inside a bounded musical and sonic identity, preserving enough memory for novelty to remain legible.

## Status

**v0.3 built.** The generative core, synth engine, and device patch are implemented and tested (30/30 behavioral tests passing). The `.amxd` container format is byte-verified against Ableton Live 12 factory devices. The full design spec lives in [DESIGN.md](DESIGN.md).

v0.3 is the persistence + character pass:

- **State persistence.** A saved Live Set reopens with the bassline it was saved with. The whole working state — both RNG stream positions, the lineage counters, the chaos walks and every per-step layer — is flattened into one list and parked in a `pattr`, which Live saves with the set. Nothing regenerates on load: a restored phrase *is* the phrase, not a replay of its seed.
- **Filter character (§2.3).** The filter is now an LP/BP blend with a saturating stage after it, so grooves can voice from round and closed to hollow and vocal; a resonance-tracking low shelf (§2.2) puts back the fundamental that high Squelch settings scoop out.
- **Wet motion (§3).** The wet send is envelope-shaped per note (floor + amount) instead of static, and the delay taps are modulated by slow independent LFOs for diffusion.
- **Novelty budget over timbre.** Novelty now allocates drift to timbre and wet as well as to notes, so a mutation can change the sound of a phrase and not only its pitches.
- **Grammar.** Pickups/anticipations that tie into downbeats, repetition freezes that hold a phrase and then release it, a double-press `Return` that jumps straight to the lineage root, and the completed chaos walk (slow/medium/fast tiers).
- **Microtiming can rush.** The clamp used to discard all early timing, so the device could only drag. Steps now schedule from the previous tick when they're ahead of the grid, giving each groove a real push/pull axis.

v0.2 was the low-end voicing pass: the register grammar was tightened toward the root (80/20 anchor rule, phrase-start grounding, leap resets), the filter now closes to a genuinely bassy floor after each squelch sweep, the sub oscillator is folded into a fixed 32.7–61.7 Hz window and lightly saturated so it reads on small speakers, and the wet network is high-passed at 500 Hz and ducked by the dry envelope so effects never cloud the fundamental.

## Loading the device

1. Keep the `device/` folder together — `pg-core.js` must sit next to both `.amxd` files so Max can resolve the script.
2. Drag `device/PG Bass Generator.amxd` onto a **MIDI track** in Ableton Live. (`PG Bass Generator MIDI.amxd` is the MIDI-effect build of the same generator — see [Getting the bassline out as MIDI](#getting-the-bassline-out-as-midi).)
3. Press play. The generator is transport-synced (16th-note clock) and starts producing phrases immediately; audio comes out of the device directly (it is an instrument, not a MIDI effect).

If Live rejects the file for any reason, open `device/PG Bass Generator.maxpat` in Max and use **File → Save As…** to re-export it as a Max Instrument `.amxd` — the patch itself is the source of truth.

## Controls

| Control | What it does |
|---|---|
| **Novelty** | Stability ↔ novelty macro. Low = locked-in loop; high = frequent, deeper mutation and more chaos modulation. |
| **Density** | Note density of generated rhythms. |
| **Chunk** | Shorter/punchier amp envelope and gates vs. longer, rounder notes. |
| **Squelch** | Filter resonance + filter-envelope depth (the 303 acid character). |
| **Drive** | Pre/post saturation amount. |
| **Cutoff** | Base filter cutoff (~45 Hz – ~3.3 kHz exponential — voiced so the filter always settles back into bass territory). |
| **Decay** | Filter envelope decay time (squelch resolves inside a 16th at typical settings). |
| **Sub** | Sub-oscillator level (saturated sine, octave-folded into a fixed 32.7–61.7 Hz window under every note; 0.45 floor). |
| **Wet** | Frequency-split wet send (delay/feedback network high-passed at 500 Hz, return ducked by the dry amp envelope; low end stays dry/mono). |
| **Groove** | 7 groove states (weights for density/offbeats/gates/accents/slides/swing/contours). |
| **Root** | Root note (C–B, register C1–C3 by default). |
| **Length** | Phrase length: 1 / 2 / 4 bars. |
| **Lock** | Freeze the current phrase — no mutation at boundaries. |
| **Mutate** | Force a mutation now (depth scales with Novelty). |
| **Return** | Return to the parent phrase in the lineage. Press twice within 700 ms to jump straight back to the lineage root. |
| **Reseed** | New seed → brand-new phrase identity. |
| **Rhythm / Pitch** | Regenerate just that layer, keeping the rest of the phrase identity. |
| **Capture** | Write the current phrase into the first empty clip slot on this track as MIDI. |

## Development

- `device/pg-core.js` — the entire generative core (phrase identity, memory/lineage, tonal gravity, contour grammar, accent hierarchy, slide logic, groove states, novelty budget, synth parameter mapping). Legacy `js` object, strict ES5.
- `scripts/build_device.py` — generates both devices programmatically (factory-accurate patcher JSON + verified `ampf`/`meta`/`ptch` chunk container). One `build(kind)` shares the UI, core, clock and persistence; `kind="instrument"` appends the synth and `plugout~` (`iiii`), `kind="midi"` appends `midiout` instead (`mmmm`).
- `tests/harness.js` — Node test harness that sandboxes `pg-core.js` with a fake Max environment (Task scheduler, fake clock, outlet recorder).

Run the tests:

```bash
node tests/harness.js
```

Rebuild the device after editing the builder:

```bash
python3 scripts/build_device.py
```

## Getting the bassline out as MIDI

An instrument sits at the **end** of Live's MIDI chain, so nothing downstream can receive notes from it — arm-record and Capture MIDI will never see this device's output, and no amount of routing changes that. (None of the nine factory Max instruments contain a `midiout`; Cycling '74 ship their own "Max MIDI Sender" example as a MIDI effect for the same reason.) There are two ways out, and the repo builds both:

**Capture button — write the phrase straight into a clip.** Press **Capture** on the instrument and it writes the current phrase into the first empty clip slot on its own track via the Live API, named `PG A3` after the phrase. This is the exact phrase as generated — microtiming and slide overlaps included — rather than one probabilistic pass of it, and it doesn't need recording, routing, or a second track.

**`PG Bass Generator MIDI.amxd` — the MIDI-effect build.** Same generative core, same controls, same persisted state, with the synth replaced by a `midiout`. Drop it on a MIDI track ahead of any instrument and it drives that instrument instead of its own. Incoming MIDI passes through, and transport stop flushes pending note-offs so nothing hangs.

To *record* the MIDI-effect build, Live needs a second track, because a track records its own input rather than its device chain's output:

1. Track 1: `PG Bass Generator MIDI` + whatever instrument you want it to play.
2. Track 2: **MIDI From** → Track 1, and set the sub-menu below it to **Post FX**.
3. Arm Track 2, set Monitor to **In**, and record.

Slides are written as overlapping notes rather than held ones — that's what makes a mono synth downstream glide instead of retrigger, which is the same thing the tie does to our own voice.

## Persistence

The device serializes its generator state to outlet 0 as a `state` list, which the patch stores into `[pattr pg_state]` with a `set` message (storing without echoing, so there's no feedback loop). On load, `live.thisdevice` fires a `[t b b]`: the right outlet bangs the `pattr` first, so `Restore` hands the saved phrase back to the core *before* `pushall` runs — and `Restore` discards whatever regeneration Live's parameter restore had just queued.

One deliberate limitation: `Restore` rebuilds `history` as `[phrase]`, because the lineage isn't serialized. After a reload the phrase and its identity (`A3`, generation, parent id) come back intact, but `Return` has no parent to go back to until you mutate again. It degrades to a no-op rather than to a wrong phrase.

## Architecture

- Max for Live instrument device (MIDI in → audio out)
- Legacy `js` (ES5) for the generative core — `js pg-core.js`, three outlets: synth params / note events / display
- Plain MSP objects for the synth: saw+rect (0.6/0.45 mix) → drive → `tanh~` → `svf~` tapped for **both** lowpass and bandpass and blended per groove → `tanh~` nonlinearity (drive in / trim out) → resonance-compensating `onepole~ 120` low shelf → amp; independent octave-folded sub sine through its own `tanh~` saturator; wet delay network high-passed at 500 Hz, taps modulated by `cycle~ 0.19 / 0.27` for diffusion, send shaped by its own `adsr~` and the return ducked by the dry envelope
- `live.*` parameters (13 total, 2 banks) for automation and Push mapping; generator state persists separately via `[pattr pg_state]`
- Transport-synced clock: `metro 16n @quantize 16n` + `transport` position → JS phase correction, with an auxiliary `Task` that fires rushed steps ahead of their own grid tick

A [Primordial Groove](https://primordialgroove.com) project.
