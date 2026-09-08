# Fiverr gig draft — custom Max for Live devices

Working draft. Prices are placeholders; check current Fiverr rates for M4L gigs before publishing.

## Title (80 chars max)

I will build a custom Max for Live device for Ableton Live

## Category

Music & Audio → Audio Plugins / Custom software (pick whichever Fiverr currently lists for M4L)

## Search tags

max for live, ableton, m4l device, midi effect, custom plugin

## Description

You have an idea for an Ableton device that doesn't exist yet: a generative MIDI tool, a macro-controlled synth voice, a utility that does one specific thing your workflow needs. I build it as a Max for Live device you drop on a track like any factory device.

What you get:

- A `.amxd` device (instrument, MIDI effect, or audio effect) with a clean Live-style UI, mappable parameters, and state that saves with your set.
- Source: the patcher and any JavaScript, so you own the device outright and can hand it to another developer later.
- A short walkthrough of the controls.

How I work: the device logic is written in code and tested outside Live before it ever touches a patcher, so the behavior is repeatable and bug reports get fixed, not guessed at. The patcher itself is generated from a build script, which means revisions are fast and the UI stays consistent.

Portfolio: PG Bass Generator, a generative bass instrument (26 automatable parameters, seven groove styles, saved phrase state, MIDI-out build) with a public repo and automated tests. Link in the gallery.

Before ordering, message me with a one-paragraph description of the device. I'll tell you which tier it fits and whether anything is out of scope.

## Packages

| | Basic | Standard | Premium |
|---|---|---|---|
| Fits | A utility or MIDI effect with up to 4 controls | An instrument or effect with a UI panel, up to 12 controls, saved state | A generative or algorithmic device with custom logic, up to 30 controls, MIDI-out variant |
| Delivery | 5 days | 10 days | 21 days |
| Revisions | 1 | 2 | 3 |
| Source included | yes | yes | yes |
| Price (placeholder) | $150 | $400 | $900+ |

## Requirements (buyer fills in)

1. What the device should do, in plain words. One paragraph is enough.
2. Device type: instrument, MIDI effect, or audio effect. Not sure? Say what goes in and what comes out.
3. Live version (12 required unless discussed) and Max version if you know it.
4. Any reference devices, plugins, or hardware it should feel like.

## FAQ

**Do I need Max for Live?** Yes, the device runs inside the Max for Live add-on (included with Live Suite).

**Will it work with Push?** Parameters are exposed as standard Live parameters, so they map to Push and to automation like any factory device.

**Can I resell the device?** Standard packages are for your own use. Ask before ordering if you plan to distribute it; that's a different license and price.

**What can't you build?** Anything that needs Max externals not shipped with Live, deep Live API browsing of other tracks' clips beyond what the API exposes, or a copy of an existing commercial device.

## Gallery

- Cover: the PG Bass Generator UI (screenshot of the presentation view in Live, dark theme).
- Video: 45–60 second demo reel (see below).
- PDF: one page, "how a commission works" (brief → build → walkthrough → revision).

## Demo reel shot list (45–60 s, screen capture in Live, no voiceover needed)

1. 0–5 s: empty MIDI track, drag the `.amxd` on, press play. Bass starts immediately.
2. 5–15 s: sweep Squelch then Cutoff while it plays. Show the status line updating.
3. 15–25 s: switch Groove through three states (rolling → acidic → broken). Cut on the bar.
4. 25–35 s: press Mutate twice, then Return. Show the phrase come back.
5. 35–45 s: toggle Lock, save the set, reopen it, play. Same phrase.
6. 45–55 s: swap to the MIDI build, show notes landing in a clip via Capture.
7. End card: "Custom Max for Live devices — built to order. Source included."

Record at 1080p, 60 fps if possible; Fiverr compresses hard so keep the UI zoomed in.
