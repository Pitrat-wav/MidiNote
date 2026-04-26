import * as Tone from 'tone'

/**
 * TR-808 Snare Drum: Dual Bridged-T and Filtered Noise
 * Based on research: "Программный синтез аналоговых ударных инструментов: Глубокий DSP-анализ"
 */
export class TR808Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5; // 500ms white noise buffer
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number, velocity: number = 0.8) {
        // pitch parameter maps to Tone Balance (relative levels of low vs high modes)
        const toneBalance = pitch;

        // Micro-randomization
        const drift = (Math.random() * 2 - 1) * 1.0;
        const vcaDecay = 0.2 * (1 + (Math.random() * 0.04 - 0.02));
        const snappyDecayBase = 0.25 + snappy * 0.15;
        const snappyDecay = snappyDecayBase * (1 + (Math.random() * 0.04 - 0.02));
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02);

        // 1. TONAL BODY (Dual Bridged-T Emulation)
        // Average frequencies from research: Low ~238Hz, High ~476Hz
        const oscLow = new Tone.Oscillator(238 + drift, "sine");
        const oscHigh = new Tone.Oscillator(476 + drift, "sine");
        oscLow.phase = Math.random() * 360;
        oscHigh.phase = Math.random() * 360;

        const gainLow = new Tone.Gain(0);
        const gainHigh = new Tone.Gain(0);

        oscLow.connect(gainLow);
        oscHigh.connect(gainHigh);
        gainLow.connect(this.destination);
        gainHigh.connect(this.destination);

        // Authenticity: High mode decays faster than low mode
        gainLow.gain.setValueAtTime(velocity * (1 - toneBalance), time);
        gainLow.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        gainHigh.gain.setValueAtTime(velocity * toneBalance, time);
        gainHigh.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay * 0.75);

        // 2. SNAPPY LAYER (Filtered Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // High-pass filter (>1800Hz) with Butterworth Q (0.707) to avoid "Phase Trap"
        const noiseFilter = new Tone.Filter({
            frequency: 1800 * filterVariance,
            type: "highpass",
            Q: 0.707
        });
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        snappyGain.gain.setValueAtTime(velocity * 0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        // Start and Dispose
        oscLow.start(time).stop(time + vcaDecay);
        oscHigh.start(time).stop(time + vcaDecay);
        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        // Cleanup: Consolidate disposal to the longest-running source (noise)
        // to ensure all nodes live until the sound fully decays.
        noiseSrc.onended = () => {
            oscLow.dispose();
            oscHigh.dispose();
            gainLow.dispose();
            gainHigh.dispose();
            noiseSrc.dispose();
            noiseFilter.dispose();
            snappyGain.dispose();
        };
    }
}
