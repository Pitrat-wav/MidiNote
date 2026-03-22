import * as Tone from 'tone'

export class TR808Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5; // 500ms
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // pitch maps to tone balance here (balance between low and high modes)
        const toneBalance = pitch;

        // Micro-randomization: Pitch Drift (+/- 1Hz) and Phase randomization
        const drift = (Math.random() * 2 - 1);

        // 808 Membrane modes: fixed at ~238Hz and ~476Hz according to research
        const oscLow = new Tone.Oscillator(238 + drift, "sine");
        const oscHigh = new Tone.Oscillator(476 + drift, "sine");
        oscLow.phase = Math.random() * 360;
        oscHigh.phase = Math.random() * 360;
        const gainLow = new Tone.Gain(1 - toneBalance);
        const gainHigh = new Tone.Gain(toneBalance);
        const masterTonalGain = new Tone.Gain(0);

        oscLow.connect(gainLow);
        oscHigh.connect(gainHigh);
        gainLow.connect(masterTonalGain);
        gainHigh.connect(masterTonalGain);
        masterTonalGain.connect(this.destination);

        masterTonalGain.gain.setValueAtTime(1, time);
        // Tonal body decay is short (~200ms) (+/- 2% variance)
        const tonalDecay = 0.2 * (1 + (Math.random() * 0.04 - 0.02));
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + tonalDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // High-pass filter (>1800Hz) to prevent phase trap (+/- 2% cutoff variance)
        const noiseFilter = new Tone.Filter(1800 * (1 + (Math.random() * 0.04 - 0.02)), "highpass");
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        // Snappy decay range: 0.25s to 0.4s (+/- 2% variance)
        const snappyDecay = (0.25 + snappy * 0.15) * (1 + (Math.random() * 0.04 - 0.02));

        snappyGain.gain.setValueAtTime(0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        oscLow.start(time).stop(time + tonalDecay);
        oscHigh.start(time).stop(time + tonalDecay);
        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        // Cleanup
        oscLow.onstop = () => {
            oscLow.dispose();
            oscHigh.dispose();
            gainLow.dispose();
            gainHigh.dispose();
            masterTonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            snappyGain.dispose();
        };
    }
}
