import * as Tone from 'tone'

export class TR808Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5; // 500ms
        this.noiseBuffer = (Tone.getContext().rawContext as AudioContext).createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // pitch maps to tone balance (balance between low and high modes)
        const toneBalance = pitch;

        // 808 Membrane modes: Fixed frequencies 238Hz and 476Hz according to research
        const oscLow = new Tone.Oscillator(238, "sine");
        const oscHigh = new Tone.Oscillator(476, "sine");

        // Micro-randomization: Pitch Drift
        const drift = (Math.random() * 2 - 1);
        oscLow.frequency.value = (oscLow.frequency.value as any) + drift;
        oscHigh.frequency.value = (oscHigh.frequency.value as any) + drift;

        const gainLow = new Tone.Gain(1 - toneBalance);
        const gainHigh = new Tone.Gain(toneBalance);
        const masterTonalGain = new Tone.Gain(0);

        oscLow.connect(gainLow);
        oscHigh.connect(gainHigh);
        gainLow.connect(masterTonalGain);
        gainHigh.connect(masterTonalGain);
        masterTonalGain.connect(this.destination);

        masterTonalGain.gain.setValueAtTime(1, time);
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2); // Tonal decay ~200ms

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // HPF (~1800Hz) to noise to prevent phase cancellation
        const noiseFilter = new Tone.Filter(1800, "highpass");

        // Micro-randomization: Filter Cutoff (+/- 2%)
        noiseFilter.frequency.value = (noiseFilter.frequency.value as any) * (1 + (Math.random() * 0.04 - 0.02));

        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        // snappyDecay: 0.25s to 0.4s range according to research
        const snappyDecayTime = 0.25 + snappy * 0.15;

        snappyGain.gain.setValueAtTime(0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecayTime);

        oscLow.start(time).stop(time + 0.2);
        oscHigh.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecayTime);

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
