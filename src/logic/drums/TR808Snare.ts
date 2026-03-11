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
        // Research: Tone balance (pitch parameter)
        const toneBalance = pitch;

        // Research: Dual Bridged-T modes at ~238Hz and ~476Hz
        const oscLow = new Tone.Oscillator(238, "sine");
        const oscHigh = new Tone.Oscillator(476, "sine");

        const gainLow = new Tone.Gain(1 - toneBalance);
        const gainHigh = new Tone.Gain(toneBalance);
        const masterTonalGain = new Tone.Gain(0);

        oscLow.connect(gainLow);
        oscHigh.connect(gainHigh);
        gainLow.connect(masterTonalGain);
        gainHigh.connect(masterTonalGain);
        masterTonalGain.connect(this.destination);

        // Research: Tonal decay ~0.2s
        masterTonalGain.gain.setValueAtTime(1, time);
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1800Hz - 2000Hz
        const noiseFilter = new Tone.Filter(1800, "highpass");
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(snappyGain);
        snappyGain.connect(this.destination);

        // Research: Snappy decay 0.25s - 0.4s
        const snappyDecay = 0.25 + snappy * 0.15;

        snappyGain.gain.setValueAtTime(0.8, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        oscLow.start(time).stop(time + 0.2);
        oscHigh.start(time).stop(time + 0.2);
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
