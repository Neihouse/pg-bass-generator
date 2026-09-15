# PG Bass Generator — Design Spec v0.1

**Device**: Ableton Live Max for Live instrument (MIDI in → audio out, mono voice)
**Purpose**: Generate novel, stylistically coherent house basslines with a wet, chunky, squelchy bass synthesis engine.

## Design principle

> **Generate variation inside a bounded musical and sonic identity, preserving enough memory for novelty to remain legible.**

Every subsystem below serves this principle. Randomness is never raw: it is scoped to a layer, clamped to a range, budgeted per phrase, and anchored by memory.

## Architecture overview

```
            ┌──────────────────────────────────────────────┐
            │                META CONTROLS                  │
            │  stability↔novelty · density · squelch ·      │
            │  chunk · wet · groove state · seed/mutate/    │
            │  return                                       │
            └──────────┬───────────────────────────────────┘
                       │  (each macro maps to many params)
      ┌────────────────┼────────────────────┐
      ▼                ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GENERATIVE   │  │ SYNTH CORE   │  │ WET CORE     │
│ CORE         │─►│              │─►│              │─► audio out
│ phrases +    │  │ osc/sub/     │  │ freq split,  │
│ step metadata│  │ filter/env/  │  │ delay, duck, │
│              │  │ saturation   │  │ stereo mgmt  │
└──────────────┘  └──────────────┘  └──────────────┘
```

The contract between sequencer and synth is **step metadata** (§ Interaction), not bare MIDI notes. The pattern itself shapes the sound.

---

# 1. Generative core

## 1.1 Phrase identity and mutation

A phrase has a stable identity decomposed into independent layers:

```
phrase identity = rhythmic skeleton
               + pitch contour
               + accent contour
               + slide contour
```

Mutation targets layers independently — this is what separates mutation from randomness.

| Mutation depth | Behavior |
|---|---|
| **low** | Preserve rhythm. Alter 1–2 pitches. Maybe move one accent. |
| **medium** | Preserve contour shape. Alter rhythm density. Alter slide placement. |
| **high** | Regenerate most layers. Retain root, scale, phrase length. |

Root, scale, and phrase length are **never** mutated — they are the identity floor.

### Phrase data model

```
Phrase {
  id, parentId, generation        // lineage
  seed                            // reproducible regeneration
  lengthBars                      // 1 | 2 | 4
  rhythm:  onset mask + gate values per step
  pitch:   contour type + scale degrees
  accents: accent mask
  slides:  slide mask
  sound:   wave, pw, fold, wobrate, wobdepth, subsat   // § 2.8
}
```

## 1.2 Memory depth

Explicit recurrence memory, so evolution stays recognizable instead of drifting:

- Previous-phrase memory; 2-bar / 4-bar phrase memory
- Mutation always derives from a **parent phrase** (lineage tree)
- Probability of **return** to an older phrase at phrase boundaries
- Motif retention: a marked motif survives mutation

```
phrase A → mutate → A1 → mutate → A2 → (return) → A
```

Defaults: keep the last **8** phrases with lineage. Base P(return to parent at phrase boundary) = **0.25**, scaled up by stability (§ 4.4).

## 1.3 Hierarchical timing

Steps are never generated independently. Timing decisions cascade through scales:

```
bar → beat → subdivision → microtiming
```

Controls:

| Control | Scope |
|---|---|
| phrase length | phrase |
| bar-level density | bar |
| beat emphasis | beat |
| offbeat preference | subdivision |
| swing | subdivision |
| humanized timing | microtiming (± ticks) |
| pickup notes | bar boundary |
| anticipations | beat boundary |

## 1.4 Rest logic

The generator must know when **not** to play.

| Parameter | Default |
|---|---|
| rest probability (base, scaled by density) | 15–30% |
| max consecutive notes | 6 |
| min rest duration | 1 subdivision |
| phrase-end silence bias | on |
| downbeat rest bias/avoidance | bipolar control (house default: avoid resting on the one) |
| syncopated gap preference | on |

## 1.5 Register discipline

For house bass, pitch range matters as much as scale.

| Parameter | Default |
|---|---|
| allowed pitch range | C1–C3 |
| root octave | C1 |
| max interval jump | 12 semitones |
| preferred interval set | root, 5th, m7, octave |
| register reset behavior | reset toward root octave after a leap or at phrase start |

Distribution target: **80%** anchor tones (root / fifth / minor 7th / octave-related), **20%** neighbor or passing tones.

## 1.6 Tonal gravity

Weighted-random pitch is not enough. Pitches sit in a gravity field:

| Tone | Role | Weight (starting point) |
|---|---|---|
| root | strongest attractor | 1.0 |
| fifth | secondary attractor | 0.6 |
| octave | structural anchor | 0.5 |
| minor 7th | color anchor | 0.35 |
| passing/neighbor tones | temporary motion | 0.1–0.2 |

Phrase endings get an elevated probability (≈2×) of resolving toward anchor tones. This is what gives phrases musical direction.

## 1.7 Contour grammar

The generator selects a **contour type first**, then generates notes inside it — never stepwise random selection.

Contour vocabulary: ascending · descending · arch · repeated-note motif · pedal tone · leap + return · neighbor motion.

Contour selection is weighted by groove state (§ 1.10).

## 1.8 Accent hierarchy

Accents have phrase-level structure, not independent per-step probability:

```
bar accent template  +  syncopated accents  +  occasional surprise accents
```

Max accent density: **35%** of sounding onsets (too many accents kills contrast). Surprise accents: low probability (≈5%), never two in a row.

## 1.9 Slide conditions

Slides are conditional, never arbitrary. Slide probability increases when:

- the next note is legato
- the interval is small (≤ 3 semitones)
- the note is accented
- phrase density is high

Directional biases (each independently weightable): upward slides · downward slides · return slides · octave slides.

## 1.10 Groove state

A higher-level state that moves many parameters together — better than exposing every control separately.

| State | Density | Note length | Offbeat bias | Accents | Slides | Mutation |
|---|---|---|---|---|---|---|
| **restrained** | low | short | low | sparse | rare | low |
| **rolling** | medium | short | high | moderate | few long | low |
| **syncopated** | medium | mixed | high | syncopated | medium | medium |
| **driving** | high | medium | low (on-beat) | strong downbeats | few | low |
| **acidic** | med-high | mixed | medium | frequent | frequent | medium |
| **broken** | medium | mixed | irregular | surprise-heavy | medium | high |
| **hypnotic** | medium | short | fixed | minimal | minimal | very low |

Groove state also weights contour selection (§ 1.7) and filter mode affinity (§ 2.1).

---

# 2. Synth core

Mono voice, last-note priority, 303-style legato: a slide step glides pitch **without retriggering** envelopes.

Voice path: `saw↔pulse crossfade → wavefolder + sub → pre-filter drive → nonlinear resonant LPF → filter/amp envelopes → post saturation → out`.

## 2.1 Filter behavior as a state machine

The filter is not just cutoff/resonance — accent drives coupled behavior:

```
accent ↑ → cutoff envelope ↑
         → resonance nudged (direction depends on mode)
         → drive ↑
         → decay changes
```

**Filter modes** — each maps to coordinated DSP settings (values are tuning targets, not final):

| Mode | Cutoff center | Resonance | Drive | Env depth | Decay | Character note |
|---|---|---|---|---|---|---|
| **round** | low | low | mild | low | medium | warm, no bite |
| **wet** | medium | medium | mild | medium | medium | slippery, chorused feel |
| **squelch** | medium | high | medium | **high** | accent-coupled | classic squelch |
| **bite** | high | medium | high | medium | short | aggressive attack |
| **hollow** | medium | low | low | low | long | scooped, spacious |
| **rubber** | medium | medium | medium | medium | slow-bounce | elastic |
| **acid** | accent-swept | high | high | accent-coupled | short | 303 lineage |

## 2.2 Resonance compensation

High resonance must not destroy club weight:

- resonance gain compensation
- low-end restoration (post-filter low shelf tracking resonance)
- post-filter sub reinforcement
- resonance-dependent drive compensation

Goal: full squelch with no loss of low-end energy.

## 2.3 Nonlinear filter interaction

The character comes from a **coupled system**, not independent knobs:

```
oscillator level → pre-filter drive → filter resonance → filter envelope
```

Raising osc level pushes the filter harder; resonance interacts with drive; envelope depth reads differently at different drive levels. These couplings are designed, not incidental.

## 2.4 Dynamic saturation

Drive responds to the note — movement without adding notes:

- accent-linked drive
- velocity-linked saturation
- envelope-following distortion
- resonance-dependent clipping
- dynamic asymmetric saturation

## 2.5 Sub independence

The sub oscillator has its own rules:

| Rule | Value |
|---|---|
| pitch | follows main osc |
| distortion | partially bypasses main saturation |
| wet FX | mostly bypasses |
| width | mono, always |
| filtering | low-passed |

Controls: sub octave (−1 / −2) · sub mix · sub saturation · sub ducking on resonant peaks.

## 2.6 Waveform shaping

The oscillator is shaped before it reaches the filter:

| Control | Behavior |
|---|---|
| **wave** | crossfades saw ↔ pulse, so the blend is one timbral sweep, not a louder sum |
| **pwm** | pulse width, kept inside 6–94% where a pulse cycle would collapse toward silence |
| **fold** | sine wavefolder, crossfaded in; adds harmonics that move independently of the filter |

All three glide over 40 ms, so a phrase that brings a new sound (§ 2.8) never steps mid-note.

## 2.7 Wobble LFO

One LFO swings the filter cutoff and the pitch of both oscillators together, so the wobble reads as one gesture instead of two modulations drifting apart.

| Control | Maps to |
|---|---|
| **wobble rate** | 0.06 × 2^(7.5 × rate) Hz — about 0.06 to 11 Hz |
| **wobble depth** | cutoff ± 2200 Hz and pitch ± 0.6 st at full depth; the cutoff swing is added after the filter envelope |

## 2.8 Parametric sound design

A phrase carries its own **sound**, not just its notes: six parameters that set where the oscillator shape, wavefolder, wobble and sub saturation sit.

```
Sound { wave, pw, fold, wobrate, wobdepth, subsat }   // each 0–1
```

**Groove tables.** Each groove state (§ 1.10) gives every sound parameter a `[centre, spread]`. A new phrase draws each one triangularly around the centre, so a groove's phrases cluster where it sits and reach the edges of its spread only now and then.

| Groove | Oscillator | Fold | Wobble | Sub saturation | Spread |
|---|---|---|---|---|---|
| **restrained** | dark saw | trace | slow, faint | low | narrow |
| **rolling** | saw | light | gentle | medium | medium |
| **syncopated** | even blend, narrow pulse | medium | medium | medium | medium |
| **driving** | pulse-leaning | medium | quick, faint | **high** | medium |
| **acidic** | saw | light | **fastest** | medium | wide |
| **broken** | pulse, narrowest | **heaviest** | deepest, erratic rate | low | **widest** |
| **hypnotic** | saw-leaning | trace | slowest, always present | low | **tight** — phrases sound alike |

**Design macro.** Like a filter mode (§ 2.1), the phrase's sound is an offset around the dials, not a takeover:

```
played = clamp(dial + design × (phrase value − reference), 0, 1)
```

Each reference is that dial's default, so **design 0** plays the dials exactly, and **design 1 with the dials at default** plays each phrase's own sound. Anywhere between, the dial sets the centre and the phrase moves around it. Default design is 0.5.

**Evolution.** A mutation (§ 1.1) moves the sound only when the timbre allocation of the novelty budget (§ 4.3) spends. Otherwise the lineage keeps its sound, even through a high mutation that regenerates the notes. When the budget spends, the mutation pulls a few randomly picked parameters part of the way toward a fresh draw from the current groove. Pulling toward a draw, rather than stepping by a random amount, is mean-reverting: a lineage wanders around its groove's sound instead of random-walking to the edges, and drifts across after a groove change.

| Mutation depth | Parameters pulled | Pull toward the draw |
|---|---|---|
| **low** | 1 | 30% |
| **medium** | up to 2 | 60% |
| **high** | up to 3 | 85% |

**Holding and redrawing.**

- **freeze timbre** (§ 5.3) holds the sound along with the filter mode.
- **regenerate sound** draws a new sound and filter mode from the current groove and leaves every note, accent and slide alone.
- Mutate, return and reseed re-send the synth at once, so a phrase's sound arrives with its notes instead of at the next bar.

**Persistence.** The sound is saved with the phrase in the Live Set. A set saved before phrases had a sound restores without one and plays its dials exactly as before. Its lineage picks up a sound at the next mutation, unless timbre is frozen, or at a regenerate sound. The sound draws from its own random stream, so a seed still writes the same bassline it did before.

---

# 3. Wet core

## 3.1 Frequency-aware wetness

| Band | Treatment |
|---|---|
| 0–120 Hz | mono, dry-biased |
| 120–500 Hz | mild saturation / modulation |
| 500 Hz+ | delay / diffusion / reverb |

Crossover values are adjustable; these are the defaults.

## 3.2 Envelope-shaped wet send

Wetness moves with the note:

```
note onset → mostly dry
note decay → wet send rises
```

Tails feel wet without blurring the transient — essential for club bass.

## 3.3 Ducking

Reverb, delay, and modulation ducking, all driven by the **dry bass envelope**. The wet layer breathes around the note instead of covering it.

## 3.4 Stereo control

Explicit low-end stereo safety:

| Band | Width |
|---|---|
| sub | mono |
| low mids | narrow |
| upper harmonics | wider |

Controls: mono-below frequency · per-band stereo width · correlation-safe wet spread.

---

# 4. Novelty architecture

## 4.1 Correlated modulation domains

One chaos source for everything is wrong. Use several, at distinct timescales:

| Domain | Timescale | Target |
|---|---|---|
| slow chaos | tens of seconds | filter character |
| medium chaos | seconds | decay / drive |
| phrase-level chaos | per phrase | mutation probability |
| step-level randomness | per step | velocity / timing microvariation |

## 4.2 Bounded chaos

All chaotic modulation is clamped. The system never wanders outside its sonic identity.

| Target | Clamp (default) |
|---|---|
| cutoff | ±8% |
| resonance | ±3% |
| decay | ±12% |
| drive | ±5% |
| wet send | ±5% |

## 4.3 Novelty budget

**One of the most important controls in the device.**

```
novelty budget = how much can change per phrase
```

The budget is distributed across targets. Example at novelty = 20%:

| Target | Allocation |
|---|---|
| pitch | 5% |
| rhythm | 5% |
| accent | 3% |
| slide | 2% |
| timbre | 3% |
| wetness | 2% |

This yields one musically meaningful macro instead of six twitchy knobs.

## 4.4 Stability ↔ novelty axis

**The primary UI control:**

```
stable ←──────────────→ novel
```

Underneath, it simultaneously scales: mutation depth · phrase-memory return probability (inverse) · chaotic modulation range · rhythmic divergence · pitch divergence · timbral drift.

---

# 5. Interaction patterns

## 5.1 Sequencer ↔ synth coupling (step metadata)

The sequencer outputs more than MIDI. Every step carries:

```
Step {
  pitch        // MIDI note
  velocity     // 1–127
  gate         // fraction of step, or tie
  accent       // bool
  slide        // bool → glide, no env retrigger
  probability  // 0–1, evaluated at play time
  timbre       // −1…+1 per-step timbre offset (cutoff/drive bias)
  wet          // 0–1 per-step wet send
  micro        // timing offset in ticks
}
```

The synth responds to metadata directly — the pattern shapes the sound.

## 5.2 Phrase-level timbre evolution

Each new phrase may slightly shift: cutoff center · resonance bias · drive amount · envelope decay · wetness · modulation depth · its sound (§ 2.8).

Shifts are bounded by the chaos clamps (§ 4.2), and the sound by its groove's spread, so timbral evolution is tied to musical structure and never escapes the identity.

## 5.3 Reset and anchor behavior

Deliberate re-grounding — essential for live use:

| Action | Effect |
|---|---|
| **return** | jump back to root phrase (lineage generation 0) |
| **reseed** | new seed, new root phrase |
| **lock phrase** | freeze everything; mutation paused |
| **freeze rhythm** | rhythm layer immutable, others evolve |
| **freeze pitch** | pitch layer immutable |
| **freeze timbre** | timbre drift paused |
| **regenerate layer** | regenerate exactly one layer (rhythm / pitch / accent / slide / sound) |

---

# 6. Meta controls

| Control | Maps to |
|---|---|
| **stability ↔ novelty** | § 4.4 — the primary macro |
| **density** | bar-level density, rest probability, max consecutive notes |
| **squelch** | filter env depth, resonance, accent→filter coupling, resonance compensation |
| **chunk** | gate length (short, decisive), amp env punch, drive, transient weight, tight low end |
| **wet** | wet send ceiling, envelope-shaped send depth, band wetness |
| **groove state** | § 1.10 — sets many sequencer params at once, and where phrases' sounds sit (§ 2.8) |
| **design** | § 2.8 — how far each phrase's own sound moves the sound dials |
| **seed / mutate / return** | § 5.3 transport for the phrase lineage |

---

# 7. v0.1 scope

```
GENERATIVE CORE          SYNTH CORE               WET CORE              META CONTROLS
├── phrase memory        ├── saw / pulse          ├── frequency split   ├── stability ↔ novelty
├── rhythmic grammar     ├── sub                  ├── env-shaped send   ├── density
├── tonal gravity        ├── nonlinear res. LPF   ├── delay             ├── squelch
├── contour grammar      ├── filter envelope      ├── diffusion         ├── chunk
├── accent logic         ├── amp envelope         ├── modulation        ├── wet
├── slide logic          ├── pre/post saturation  ├── ducking           ├── groove state
├── mutation depth       └── glide                └── stereo mgmt       └── seed / mutate / return
└── novelty budget
```

**Non-goals for v0.1**: polyphony · style packs beyond house · generated-phrase MIDI export (future) · external modulation inputs.

---

# 8. Implementation notes (Max for Live)

- **Device type**: Max Instrument (MIDI in → audio out). One device contains sequencer + synth + wet engine.
- **Generative core**: `v8` (JavaScript) object holds the phrase model, lineage, and all generation logic. Driven by a transport-locked clock (`plugsync~` / `metro @active 1` quantized to 16ths). Emits step metadata as dicts/messages, not just note numbers.
- **Synth core**: `gen~` for the nonlinear filter + saturation stages (the couplings in § 2.3 want sample-level control); standard MSP for oscillators and envelopes is fine.
- **Voice model**: mono, last-note priority; slide flag → glide without envelope retrigger.
- **State/presets**: `pattr` + Live parameter system; all meta controls as `live.*` objects so they automate and map to Push.
- **UI**: meta controls (§ 6) front and center; per-layer generative controls in an expandable advanced panel.

# 9. Milestones

1. **Skeleton**: transport-synced step engine in JS emitting a fixed test pattern → basic mono synth (saw + sub, LPF, envelopes). Sound comes out on beat.
2. **Phrase model**: rhythm + pitch generation with hierarchical timing, rest logic, tonal gravity, register discipline, contour grammar.
3. **Articulation**: accent hierarchy + slide conditions + filter state machine (accent → env/drive coupling).
4. **Evolution**: mutation depths, phrase memory/lineage, stability↔novelty axis, novelty budget.
5. **Wet core**: frequency split, envelope-shaped send, ducking, stereo management.
6. **Polish**: groove states, filter modes, resonance compensation tuning, reset/anchor controls, UI.
