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

        // 808 Membrane modes: fixed frequencies at 238Hz and 476Hz as per research
        const freqLow = 238;
        const freqHigh = 476;

        const oscLow = new Tone.Oscillator(freqLow, "sine");
        const oscHigh = new Tone.Oscillator(freqHigh, "sine");

        // Analog drift for frequencies
        const drift = (Math.random() * 2 - 1);
        oscLow.frequency.value = freqLow + drift;
        oscHigh.frequency.value = freqHigh + drift;

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

        // Tonal decay ~200ms
        const tonalDecay = 0.2;
        masterTonalGain.gain.setValueAtTime(1, time);
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + tonalDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // HPF (~1800Hz) to noise to prevent phase cancellation
        const noiseFilter = new Tone.Filter(1800 * (1 + (Math.random() * 0.04 - 0.02)), "highpass");
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        // Snappy decay: 250ms to 400ms as per research
        const snappyDecay = 0.25 + snappy * 0.15;

        snappyGain.gain.setValueAtTime(0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        oscLow.start(time).stop(time + tonalDecay);
        oscHigh.start(time).stop(time + tonalDecay);
        noiseSrc.start(time).stop(time + snappyDecay);

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
