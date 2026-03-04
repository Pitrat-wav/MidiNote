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

        // 808 Membrane modes: Fixed frequencies 238Hz and 476Hz
        const oscLow = new Tone.Oscillator(238, "sine");
        const oscHigh = new Tone.Oscillator(476, "sine");

        // Analog Drift
        oscLow.frequency.value = 238 + (Math.random() * 2 - 1);
        oscHigh.frequency.value = 476 + (Math.random() * 2 - 1);
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

        // Independent decays: High slightly faster than low
        const decayLow = 0.15 + (Math.random() * 0.04 - 0.02); // 0.15-0.2s target
        const decayHigh = 0.1 + (Math.random() * 0.04 - 0.02); // 0.1-0.15s target

        masterTonalGain.gain.setValueAtTime(1, time);
        // Exponentially ramp to zero-ish
        gainLow.gain.exponentialRampToValueAtTime(0.001, time + decayLow);
        gainHigh.gain.exponentialRampToValueAtTime(0.001, time + decayHigh);
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Apply HPF (1800Hz) to noise to prevent phase cancellation with tonal oscillators
        const noiseFilter = new Tone.Filter(1800, "highpass");
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        const snappyDecay = 0.25 + snappy * 0.15; // 0.25s to 0.4s

        snappyGain.gain.setValueAtTime(0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        oscLow.start(time).stop(time + 0.2);
        oscHigh.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecay);

        // Cleanup: Use noiseSrc.onended as it's the longest component
        noiseSrc.onended = () => {
            oscLow.dispose();
            oscHigh.dispose();
            gainLow.dispose();
            gainHigh.dispose();
            masterTonalGain.dispose();
            noiseSrc.dispose();
            noiseFilter.dispose();
            snappyGain.dispose();
        };
    }
}
