import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // Emulate 6-bit LFSR pseudo-random noise
        let lfsr = 0x3F; // 6 bits
        for (let i = 0; i < data.length; i++) {
            const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
            lfsr = (lfsr >> 1) | (bit << 5);
            data[i] = (bit * 2) - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // Tonal Body (2 triangle oscillators)
        const freq1 = 160;
        const freq2 = 220;

        // Micro-randomization
        const drift1 = (Math.random() * 2 - 1) * 0.1;
        const drift2 = (Math.random() * 2 - 1) * 0.1;
        const finalFreq1 = freq1 + drift1;
        const finalFreq2 = freq2 + drift2;

        const osc1 = new Tone.Oscillator(finalFreq1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(finalFreq2 * 2, "triangle");
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch sweep (2x frequency to 1x frequency over 50ms)
        osc1.frequency.setValueAtTime(finalFreq1 * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(finalFreq1, time + 0.05);
        osc2.frequency.setValueAtTime(finalFreq2 * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(finalFreq2, time + 0.05);

        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer (LFSR-like noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);

        // Filter variance
        const filterDrift = 1 + (Math.random() * 0.04 - 0.02);
        const hpf = new Tone.Filter(1000 * filterDrift, "highpass");

        // Tone control: 4000Hz - 8000Hz
        const toneCutoff = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(toneCutoff * filterDrift, "lowpass");

        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        // snappyDecay: 0.1s to 0.5s (as before, but adding randomization)
        const baseSnappyDecay = 0.1 + snappy * 0.4;
        const snappyDecay = baseSnappyDecay * (1 + (Math.random() * 0.04 - 0.02));

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + 0.2);
        osc2.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            tonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            noiseGain.dispose();
        };
    }
}
