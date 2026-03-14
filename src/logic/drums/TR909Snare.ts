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
        const freq2 = 220; // Fixed resonant modes per report

        const osc1 = new Tone.Oscillator(freq1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2, "triangle");
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch sweep: 2x freq to base over 50ms per report
        osc1.frequency.setValueAtTime(freq1 * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05);
        osc2.frequency.setValueAtTime(freq2 * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05);

        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2); // 200ms body decay

        // Snappy Layer (LFSR-like noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000, "highpass"); // HPF ~1000Hz per report

        // LPF for tone control (Tone control in 909): 4000-8000Hz per report
        const toneCutoff = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(toneCutoff, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        const snappyDecay = 0.2 + snappy * 0.3; // Approx range for 909 snappy

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + 0.2);
        osc2.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecay);

        // Cleanup: anchored to noiseSrc.onended since it has the longest tail
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            noiseGain.dispose();
            osc1.dispose();
            osc2.dispose();
            tonalGain.dispose();
        };
    }
}
