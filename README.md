# PG Bass Generator

A Max for Live instrument for Ableton Live that generates novel, stylistically coherent basslines with a wet, chunky, squelchy bass synthesis engine. The rhythmic target is the Maccabi House / psychedelic indie-dance vocabulary — Adam Ten, Mita Gami, Rafael, Yamagucci and adjacent records — rather than generic four-on-the-floor house.

**Design principle**: generate variation inside a bounded musical and sonic identity, preserving enough memory for novelty to remain legible.

## Status

**v0.5 built.** The generative core, synth engine, and device patch are implemented and tested (51/51 behavioral tests passing). The `.amxd` container format is byte-verified against Ableton Live 12 factory devices. The full design spec lives in [DESIGN.md](DESIGN.md).

v0.5 is the completion pass — everything DESIGN.md specifies is now actually implemented and reachable from the UI:

- **The seven filter modes (§2.1)** are real, distinct filters rather than one filter with a groove scalar — see [Filter modes](#filter-modes) below. Mode is part of phrase identity, so it is drawn with the phrase, serialized with it, and held by the timbre freeze.
- **Interlock (§1.3) is a control**, not just a family constant. The kick relationship is a dial: measured over 120 phrases per position, `rolling` lands on the quarter 26% of the time at Interlock 0 and 91% at 1; `broken` moves 5% → 64%; `syncopated` 11% → 82%.
- **Rest grammar (§1.4).** Phrase-end silence bias thins the last beat of the phrase, and a 16th push on the "a" biases the following beat toward a gap, so anticipations resolve into space instead of into more notes.
- **Directional slides (§1.9).** Upward / downward / return / octave slides are independently weighted per groove — `acidic` reaches for the octave, `hypnotic` returns to where it came from, `driving` slides up, `broken` slides down.
- **Sub voice (§2.5).** Selectable −1 or −2 octave, its own saturation with makeup gain, and a duck that pulls the sub down as the resonant peak comes up so high Squelch doesn't fight the fundamental.
- **Asymmetric saturation (§2.4).** Drive asymmetry tracks velocity and accent, so loud notes get even-harmonic bark and quiet ones stay clean; a 10 Hz DC blocker removes the offset the asymmetry introduces.
- **Stereo (§3.4).** A Width control on the wet return with a mono-below crossover, encoded mid/side so a mono fold attenuates rather than cancels.
- **Three separate freezes (§5.3)** — rhythm, pitch, timbre — plus **Accent** and **Slide** regenerate-layer buttons alongside Rhythm and Pitch.

v0.4 was the rhythm pass — see [Rhythm](#rhythm-the-motif-engine) below. The old rhythm generator flipped an independent weighted coin per step, which produced technically competent phrases with nothing to remember: measured over 600 phrases per groove, **0.1%** of adjacent bars were identical and adjacent bars differed by 5–7 of 16 steps. It now assembles bars from per-family vocabularies of one-beat cells and restates them: **50–58%** of adjacent bars are identical and the rest differ by about 1 step of 16.

v0.3 was the persistence + character pass:

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
| **Interlock** | Kick relationship, from answering the kick (0) to landing with it (1). Weighted full on beats 1 and 3, half on 2 and 4. At 0.5 the groove's own family value stands. |
| **Chunk** | Shorter/punchier amp envelope and gates vs. longer, rounder notes. |
| **Squelch** | Filter resonance + filter-envelope depth (the 303 acid character). Also sets how hard the sub ducks under the resonant peak. |
| **Drive** | Pre/post saturation amount. |
| **Cutoff** | Base filter cutoff (~45 Hz – ~3.3 kHz exponential — voiced so the filter always settles back into bass territory). |
| **Decay** | Filter envelope decay time (squelch resolves inside a 16th at typical settings). |
| **Sub** | Sub-oscillator level (saturated sine, octave-folded under every note; 0.45 floor). |
| **SubSat** | Sub saturation drive, with automatic makeup gain so turning it up thickens the sub instead of just making it louder. |
| **Wet** | Frequency-split wet send (delay/feedback network high-passed at 500 Hz, return ducked by the dry amp envelope; low end stays dry/mono). |
| **Width** | Stereo width of the wet return (mid/side). 0 is a true mono return, not silence. Also sets the mono-below crossover: narrow settings keep more of the low end centred. |
| **Groove** | 7 groove states. Each selects a rhythmic family and a kick relationship, plus weights for density/offbeats/gates/accents/slides/swing/contours/filter mode/slide direction. |
| **Mode** | Filter mode. `auto` lets the groove's affinity weights draw one with each phrase; any other position forces it — see [Filter modes](#filter-modes). |
| **Root** | Root note (C–B, register C1–C3 by default). |
| **Length** | Phrase length: 1 / 2 / 4 bars. |
| **SubOct** | Sub octave: −1 (32.7–61.7 Hz) or −2 (16.4–30.9 Hz). |
| **Lock** | Freeze the current phrase — no mutation at boundaries. |
| **rhy / pit / tim** | Independent layer freezes (§5.3): hold the rhythm, the pitches, or the timbre while everything else keeps mutating. |
| **Mutate** | Force a mutation now (depth scales with Novelty). |
| **Return** | Return to the parent phrase in the lineage. Press twice within 700 ms to jump straight back to the lineage root. |
| **Reseed** | New seed → brand-new phrase identity. |
| **Rhythm / Pitch / Accent / Slide** | Regenerate just that layer, keeping the rest of the phrase identity. |
| **Capture** | Write the current phrase into the first empty clip slot on this track as MIDI. |

## Development

- `device/pg-core.js` — the entire generative core (phrase identity, memory/lineage, tonal gravity, contour grammar, rhythmic cell families and bar form, rest grammar, accent hierarchy, directional slide logic, groove states, filter modes, novelty budget, synth parameter mapping). Legacy `js` object, strict ES5.
- `scripts/build_device.py` — generates both devices programmatically (factory-accurate patcher JSON + verified `ampf`/`meta`/`ptch` chunk container). One `build(kind)` shares the UI, core, clock and persistence; `kind="instrument"` appends the synth and `plugout~` (`iiii`), `kind="midi"` appends `midiout` instead (`mmmm`).
- `tests/harness.js` — Node test harness that sandboxes `pg-core.js` with a fake Max environment (Task scheduler, fake clock, outlet recorder). Two of the tests read the built `.maxpat` and check the core↔patch contract in both directions: every selector the core emits is routed somewhere in the device, and every routed selector is one the core actually sends. That's the failure mode that doesn't show up as an error — a new `outlet(0, "…")` landing on nothing, silently doing nothing inside Live.

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

## Rhythm: the motif engine

This music is hypnotic because a small recognizable machine states itself and then changes almost imperceptibly, which means randomness destroys the exact thing that makes it work. So the rhythm is built the way the style is, in four layers:

**1. Cell vocabulary.** A bar is assembled from four one-beat cells, each a 4-bit pattern (bit 0 is the beat, bit 1 the "e", bit 2 the "&", bit 3 the "a" — so `13` is `x.xx`, the rolling 16th push). Density selects *denser cells* rather than raising every step's coin, so turning it up reads as a busier figure instead of 16th-note mush.

**2. Rhythmic families.** The vocabulary is not universal — each groove draws from one of four banks, which is what makes "rolling" and "syncopated" genuinely different ideas rather than the same generator with different scalars:

| Family | Character | Grooves |
|---|---|---|
| `psy` | rolling 16th pushes, offbeat 8ths, dotted 3-step movement, sparse syncopated stabs, late-beat anticipations | rolling, syncopated, hypnotic |
| `deep` | simpler offbeats, root-quarter figures, fewer 16ths | restrained, driving |
| `acid` | repetitive 16th cells; mutates through pitch and filter more than through onsets | acidic |
| `broken` | displaced cells, more silence, weak four-on-the-floor dependency | broken |

**3. Kick interlock.** Each family (and optionally each groove) carries a `kick` value on a 0–1 scale — how willingly it lands *with* the kick rather than answering it. It is applied as odds on cells that contain the beat, weighted full on beats 1 and 3 and half on 2 and 4. This is what separates `rolling` and `syncopated`, which share the `psy` vocabulary. The **Interlock** dial moves that value; 0.5 leaves the family's own. Quarter-note landing rate, measured over 120 phrases per cell:

| Groove | Interlock 0 | 0.5 | 1 |
|---|---|---|---|
| restrained | 42% | 88% | 97% |
| rolling | 26% | 71% | 91% |
| syncopated | 11% | 37% | 82% |
| driving | 68% | 91% | 97% |
| acidic | 38% | 84% | 94% |
| broken | 5% | 18% | 64% |
| hypnotic | 17% | 68% | 89% |

The grooves stay ordered relative to one another at every position — `broken` never out-locks `driving` — so the dial shifts the whole family without erasing what distinguishes it.

**4. Bar form.** A 4-bar phrase picks a form biased heavily toward restatement — `AAAA'` 28%, `AAAB'` 28%, `AABA'` 22%, `AA'AA''` 17%, `ABAB'` 6% — where `A'` is one small change, usually on the last beat where the ear already expects a turnaround, and `B` is still derived from `A`. A medium mutation varies the phrase's own opening bar rather than drawing a fresh figure, so it sounds like the same machine drifting. (The **Rhythm** button is an explicit ask for a new figure, so it does regenerate from scratch.)

A restored phrase has its bar A recovered from its own onsets, so motif variation keeps working after a reload.

## Filter modes

The filter is not one filter with a groove scalar on it — there are seven, and which one a phrase uses is part of its identity, drawn with the phrase and serialized with it. Each mode is a set of offsets and multipliers *on top of* the macros, so Cutoff, Squelch, Drive and Decay still do exactly what their labels say; the mode moves the centre they move around.

| Mode | Cutoff | Reso | Drive | Env depth | Decay | LP/BP | Accent | Character |
|---|---|---|---|---|---|---|---|---|
| `round` | −0.55 | −0.16 | 0.80 | 0.55 | 1.00 | 0.00 | 1.25 | closed, pure lowpass, no sweep — the "just a bass" mode |
| `wet` | 0.00 | 0.00 | 0.85 | 0.90 | 1.05 | 0.10 | 1.35 | neutral and open, a touch of bandpass for air |
| `squelch` | −0.10 | +0.18 | 1.15 | 1.55 | 0.85 | 0.12 | 1.85 | fast resonant sweep resolving low — the house squelch |
| `bite` | +0.75 | +0.02 | 1.55 | 1.00 | 0.55 | 0.18 | 1.60 | bright and short, driven hard, snaps shut |
| `hollow` | +0.10 | −0.12 | 0.75 | 0.60 | 1.70 | 0.34 | 1.20 | the most bandpass of the set, long decay — vocal, scooped |
| `rubber` | −0.15 | +0.04 | 1.00 | 1.05 | 1.45 | 0.16 | 1.40 | mid-closed with a slow release, bouncy rather than sharp |
| `acid` | +0.15 | +0.26 | 1.45 | 1.70 | 0.60 | 0.22 | 2.00 | highest resonance, deepest envelope, hardest accent coupling |

The **Mode** menu's `auto` position lets the groove draw one. Each groove carries affinity weights, so a groove keeps its sonic character across reseeds without ever being locked to a single voicing:

| Groove | Draws from |
|---|---|
| restrained | `round` ×4, `rubber` ×2, `wet` ×1 |
| rolling | `wet` ×3, `rubber` ×3, `round` ×2, `squelch` ×1 |
| syncopated | `squelch` ×3, `bite` ×2, `wet` ×2, `hollow` ×1 |
| driving | `bite` ×3, `squelch` ×2, `round` ×2 |
| acidic | `acid` ×5, `squelch` ×3, `bite` ×1 |
| broken | `hollow` ×3, `bite` ×2, `rubber` ×2, `squelch` ×1 |
| hypnotic | `round` ×3, `rubber` ×3, `wet` ×2 |

Any other Mode position overrides the draw outright. The **tim** freeze holds the mode along with the rest of the timbre layer.

## Persistence

The device serializes its generator state to outlet 0 as a `state` list, which the patch stores into `[pattr pg_state]` with a `set` message (storing without echoing, so there's no feedback loop). On load, `live.thisdevice` fires a `[t b b]`: the right outlet bangs the `pattr` first, so `Restore` hands the saved phrase back to the core *before* `pushall` runs — and `Restore` discards whatever regeneration Live's parameter restore had just queued.

The state list ends in a small extras block, so fields added later — the bar form and the filter mode both live there now — serialize without bumping the state version. A list saved by an older build simply has no tail, and those fields fall back to their defaults, which is why existing Live Sets still restore.

One deliberate limitation: `Restore` rebuilds `history` as `[phrase]`, because the lineage isn't serialized. After a reload the phrase and its identity (`A3`, generation, parent id) come back intact, but `Return` has no parent to go back to until you mutate again. It degrades to a no-op rather than to a wrong phrase.

## Architecture

- Max for Live instrument device (MIDI in → audio out)
- Legacy `js` (ES5) for the generative core — `js pg-core.js`, three outlets: synth params / note events / display
- Plain MSP objects for the synth: saw+rect (0.6/0.45 mix) → drive → `tanh~` → `svf~` tapped for **both** lowpass and bandpass and blended per filter mode → `tanh~` nonlinearity (drive in / trim out) → resonance-compensating `onepole~ 120` low shelf → per-note DC offset → `tanh~` → `onepole~ 10` DC blocker (§2.4 asymmetric saturation, so loud notes bark on even harmonics and quiet ones stay clean) → amp
- Sub voice on its own path: octave-folded sine → saturator driven by SubSat with a compensating makeup gain → ducked by the filter envelope in proportion to resonance, so the sub steps out of the way of the squelch peak instead of fighting it
- Wet network high-passed at 500 Hz with a Width-driven crossover frequency, taps modulated by `cycle~ 0.19 / 0.27` for diffusion, send shaped by its own `adsr~`, return ducked by the dry envelope, then mid/side width-encoded (`L = m + w·s`, `R = m − w·s`) so a mono fold attenuates the sides rather than cancelling them
- `live.*` parameters (21 total, 3 banks) for automation and Push mapping; generator state persists separately via `[pattr pg_state]`
- Transport-synced clock: `metro 16n @quantize 16n` + `transport` position → JS phase correction, with an auxiliary `Task` that fires rushed steps ahead of their own grid tick

A [Primordial Groove](https://primordialgroove.com) project.
