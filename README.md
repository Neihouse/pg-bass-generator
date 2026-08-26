# PG Bass Generator

A Max for Live instrument for Ableton Live that generates novel, stylistically coherent house basslines with a wet, chunky, squelchy bass synthesis engine.

**Design principle**: generate variation inside a bounded musical and sonic identity, preserving enough memory for novelty to remain legible.

## Status

**v0.1 built.** The generative core, synth engine, and device patch are implemented and tested (19/19 behavioral tests passing). The `.amxd` container format is byte-verified against Ableton Live 12 factory devices. The full design spec lives in [DESIGN.md](DESIGN.md).

## Loading the device

1. Keep the `device/` folder together — `pg-core.js` must sit next to the `.amxd` so Max can resolve the script.
2. Drag `device/PG Bass Generator.amxd` onto a **MIDI track** in Ableton Live.
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
| **Cutoff** | Base filter cutoff (55 Hz – ~6.8 kHz exponential). |
| **Decay** | Filter envelope decay time. |
| **Sub** | Independent sub-oscillator level (sine, −12 st). |
| **Wet** | Frequency-split wet send (HP'd delay/feedback network, ducked by the amp envelope, low end stays dry/mono). |
| **Groove** | 7 groove states (weights for density/offbeats/gates/accents/slides/swing/contours). |
| **Root** | Root note (C–B, register C1–C3 by default). |
| **Length** | Phrase length: 1 / 2 / 4 bars. |
| **Lock** | Freeze the current phrase — no mutation at boundaries. |
| **Mutate** | Force a mutation now (depth scales with Novelty). |
| **Return** | Return to the parent phrase in the lineage. |
| **Reseed** | New seed → brand-new phrase identity. |
| **Rhythm / Pitch** | Regenerate just that layer, keeping the rest of the phrase identity. |

## Development

- `device/pg-core.js` — the entire generative core (phrase identity, memory/lineage, tonal gravity, contour grammar, accent hierarchy, slide logic, groove states, novelty budget, synth parameter mapping). Legacy `js` object, strict ES5.
- `scripts/build_device.py` — generates `PG Bass Generator.maxpat` and packs it into `PG Bass Generator.amxd` programmatically (factory-accurate patcher JSON + verified `ampf`/`meta`/`ptch` chunk container).
- `tests/harness.js` — Node test harness that sandboxes `pg-core.js` with a fake Max environment (Task scheduler, fake clock, outlet recorder).

Run the tests:

```bash
node tests/harness.js
```

Rebuild the device after editing the builder:

```bash
python3 scripts/build_device.py
```

## Architecture

- Max for Live instrument device (MIDI in → audio out)
- Legacy `js` (ES5) for the generative core — `js pg-core.js`, three outlets: synth params / note events / display
- Plain MSP objects for the synth: saw+rect → drive → `tanh~` → `svf~` (resonant LPF with envelope + squelch mapping) → post-saturation, independent sub sine, HP'd wet delay network with envelope ducking
- `live.*` parameters (13 total, 2 banks) for automation and Push mapping
- Transport-synced clock: `metro 16n @quantize 16n` + `transport` position → JS phase correction

A [Primordial Groove](https://primordialgroove.com) project.
