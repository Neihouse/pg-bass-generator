"""Signal-graph building blocks.

Each function boxes its objects under "<key>_..." and returns the key of its
output box, so blocks chain: p.connect(dsp.wavefolder(p, "fold", ...), 0, ...).
Inputs named as signals are box keys whose outlet 0 carries the signal.
"""


def _f(x):
    """Max-style float literal: 0. / 1. / 0.6, never 0.0 (and never a bare int)."""
    return f"{float(x)}".rstrip("0")


def lfo(p, key, rate, depths):
    """One [cycle~] at `rate` Hz, scaled into one output per (name, depth
    signal). Returns {name: output key}. Sharing a single LFO across several
    destinations keeps their movement locked together instead of drifting into
    two independent modulations."""
    p.sig(key, "cycle~", 2)
    p.connect(rate, 0, key, 0)
    outs = {}
    for name, depth in depths:
        k = f"{key}_{name}"
        p.sig(k, "*~ 0.", 2)
        p.connect(key, 0, k, 0)
        p.connect(depth, 0, k, 1)
        outs[name] = k
    return outs


def crossfade(p, key, dry, wet, mix):
    """dry * (1 - mix) + wet * mix, with mix a 0-1 signal."""
    p.sig(key + "_inv", "!-~ 1.", 2)
    p.sig(key + "_dry", "*~", 2)
    p.sig(key + "_wet", "*~", 2)
    p.sig(key + "_out", "+~", 2)
    p.connect(mix, 0, key + "_inv", 0)
    p.connect(dry, 0, key + "_dry", 0)
    p.connect(key + "_inv", 0, key + "_dry", 1)
    p.connect(wet, 0, key + "_wet", 0)
    p.connect(mix, 0, key + "_wet", 1)
    p.connect(key + "_dry", 0, key + "_out", 0)
    p.connect(key + "_wet", 0, key + "_out", 1)
    return key + "_out"


def wavefolder(p, key, src, amount, drive=3.2):
    """Sine wavefolder, crossfaded in by `amount` (0-1 signal) so 0 leaves the
    source untouched. A copy of `src` is driven by 1 + amount * drive into a
    phase-wrapped sine, which folds anything past +-0.5 cycle back on itself
    and adds harmonics that move independently of any filter after it."""
    p.sig(key + "_drive_amt", f"*~ {_f(drive)}", 2)
    p.sig(key + "_drive_gain", "+~ 1.", 2)
    p.sig(key + "_pre", "*~", 2)
    # vanilla Max has no signal-rate sin~; the standard substitute is cycle~
    # with its frequency held at 0 and the signal fed into its phase inlet,
    # which cycle~ wraps automatically
    p.sig(key + "_zero", "sig~ 0.", 1)
    p.sig(key + "_sin", "cycle~", 2)
    p.connect(amount, 0, key + "_drive_amt", 0)
    p.connect(key + "_drive_amt", 0, key + "_drive_gain", 0)
    p.connect(src, 0, key + "_pre", 0)
    p.connect(key + "_drive_gain", 0, key + "_pre", 1)
    p.connect(key + "_zero", 0, key + "_sin", 0)
    p.connect(key + "_pre", 0, key + "_sin", 1)
    return crossfade(p, key, src, key + "_sin", amount)


def duck(p, key, env, init=0.):
    """A gain of 1 - env * depth: multiply something by the result and it dips
    against `env`. The depth is a message into "<key>_amt" inlet 1 (`init`
    until one arrives). Returns the gain signal's key."""
    p.sig(key + "_amt", f"*~ {_f(init)}", 2)
    p.sig(key + "_inv", "!-~ 1.", 2)
    p.connect(env, 0, key + "_amt", 0)
    p.connect(key + "_amt", 0, key + "_inv", 0)
    return key + "_inv"


def stereo_width(p, key, left, right, init=1.):
    """Mid/side width on a stereo pair, correlation-safe: the pair is encoded
    to mid + side, the side scaled, and decoded back. Folding the result to
    mono attenuates the side instead of cancelling it, so width 0 is a true
    mono image rather than silence. Width is a message into "<key>_sidew"
    inlet 1. Returns (left key, right key)."""
    p.sig(key + "_sum", "+~", 2)
    p.sig(key + "_mid", "*~ 0.5", 2)
    p.sig(key + "_diff", "-~", 2)
    p.sig(key + "_side", "*~ 0.5", 2)
    p.sig(key + "_sidew", f"*~ {_f(init)}", 2)
    p.sig(key + "_l", "+~", 2)
    p.sig(key + "_r", "-~", 2)
    p.connect(left, 0, key + "_sum", 0)
    p.connect(right, 0, key + "_sum", 1)
    p.connect(key + "_sum", 0, key + "_mid", 0)
    p.connect(left, 0, key + "_diff", 0)
    p.connect(right, 0, key + "_diff", 1)
    p.connect(key + "_diff", 0, key + "_side", 0)
    p.connect(key + "_side", 0, key + "_sidew", 0)
    p.connect(key + "_mid", 0, key + "_l", 0)
    p.connect(key + "_sidew", 0, key + "_l", 1)
    p.connect(key + "_mid", 0, key + "_r", 0)
    p.connect(key + "_sidew", 0, key + "_r", 1)
    return key + "_l", key + "_r"


def asym_sat(p, key, src):
    """Asymmetric tanh~ saturation. A DC offset ahead of the tanh~ clips one
    half-wave harder than the other, which is what puts *even* harmonics into
    the tone instead of only odd ones — the difference between a fuzz and a
    growl. The offset is a message into "<key>_add" inlet 1. The DC has to
    come back out afterwards or it eats headroom and thumps the low end, hence
    the 10 Hz onepole~ subtracted from the saturated signal. Returns the
    output key."""
    p.sig(key + "_add", "+~ 0.", 2)
    p.sig(key + "_sat", "tanh~", 1)
    p.sig(key + "_dc_lp", "onepole~ 10.", 2)
    p.sig(key + "_dc_block", "-~", 2)
    p.connect(src, 0, key + "_add", 0)
    p.connect(key + "_add", 0, key + "_sat", 0)
    p.connect(key + "_sat", 0, key + "_dc_lp", 0)
    p.connect(key + "_sat", 0, key + "_dc_block", 0)
    p.connect(key + "_dc_lp", 0, key + "_dc_block", 1)
    return key + "_dc_block"
