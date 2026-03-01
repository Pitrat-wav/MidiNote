/**
 * Creates a tanh-based saturation curve for Tone.WaveShaper
 * @param amount - Intensity of saturation (0 to 100)
 */
export function makeDistortionCurve(amount: number = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

/**
 * Applies micro-randomization (drift) to a base value
 * @param baseValue - The original value
 * @param percentage - Maximum deviation percentage (e.g., 0.02 for 2%)
 */
export function applyDrift(baseValue: number, percentage: number = 0.02) {
    const drift = 1 + (Math.random() * percentage * 2 - percentage);
    return baseValue * drift;
}

/**
 * Applies pitch drift in cents
 * @param freq - Base frequency
 * @param cents - Deviation in cents (e.g., 2)
 */
export function applyPitchDrift(freq: number, cents: number = 2) {
    const ratio = Math.pow(2, (Math.random() * cents * 2 - cents) / 1200);
    return freq * ratio;
}
