/**
 * Shared DSP utilities for drum synthesis based on research specs.
 */

/**
 * Creates a soft-clipping saturation curve (hyperbolic tangent approximation).
 * Formula: (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
 * @param amount - Intensity of saturation (0 to 100)
 */
export function makeDistortionCurve(amount: number = 20): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
        let x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

/**
 * Applies micro-randomization to a base frequency (Pitch Drift).
 * Typically +/- 1Hz as per research.
 * @param base - Base frequency in Hz
 * @param range - Drift range in Hz (default 1.0)
 */
export function applyPitchDrift(base: number, range: number = 1.0): number {
    return base + (Math.random() * 2 - 1) * range;
}

/**
 * Applies micro-randomization to a parameter (Filter Cutoff or Decay).
 * Typically +/- 2% as per research.
 * @param base - Base value
 * @param variance - Variance percentage (e.g. 0.02 for 2%)
 */
export function applyVariance(base: number, variance: number = 0.02): number {
    // Math.random() * 0.04 - 0.02 gives range [-0.02, 0.02]
    return base * (1 + (Math.random() * (variance * 2) - variance));
}
