import * as Tone from 'tone';

export class TR808Snare {
    private output: Tone.ToneAudioNode;
    private noiseBuffer: AudioBuffer;

    constructor(output: Tone.ToneAudioNode) {
        this.output = output;

        const bufferSize = Tone.getContext().sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, toneBalance: number, snappyDecay: number, velocity: number = 0.8) {
        // --- Tonal Layer (Dual Sine) ---
        const oscLow = new Tone.Oscillator(238, 'sine');
        const oscHigh = new Tone.Oscillator(476, 'sine');
        const gainLow = new Tone.Gain(1 - toneBalance);
        const gainHigh = new Tone.Gain(toneBalance);
        const tonalGain = new Tone.Gain(0);

        oscLow.connect(gainLow);
        oscHigh.connect(gainHigh);
        gainLow.connect(tonalGain);
        gainHigh.connect(tonalGain);
        tonalGain.connect(this.output);

        tonalGain.gain.setValueAtTime(velocity, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        oscLow.start(time).stop(time + 0.2);
        oscHigh.start(time).stop(time + 0.2);

        // --- Snappy Layer (HPF Noise) ---
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter({
            type: 'highpass',
            frequency: 1800
        });
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.output);

        snappyGain.gain.setValueAtTime(velocity * 0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        // Cleanup
        oscLow.onstop = () => {
            oscLow.dispose();
            oscHigh.dispose();
            gainLow.dispose();
            gainHigh.dispose();
            tonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            snappyGain.dispose();
        };
    }
}
