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
        // Research: Tonal Body (2 triangle oscillators at ~160Hz and ~220Hz)
        const freq1 = 160;
        const freq2 = 220;

        const osc1 = new Tone.Oscillator(freq1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2, "triangle");
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Research: Pitch sweep (start at 2x base freq)
        osc1.frequency.setValueAtTime(freq1 * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05);
        osc2.frequency.setValueAtTime(freq2 * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05);

        // Research: Tonal decay ~0.2s
        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer (LFSR-like noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1000Hz
        const hpf = new Tone.Filter(1000, "highpass");
        // Research: LPF (Tone control) ~4000Hz - 8000Hz
        const toneCutoff = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(toneCutoff, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Research: Snappy decay 0.25s - 0.4s
        const snappyDecay = 0.25 + snappy * 0.15;

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + 0.2);
        osc2.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecay);

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
