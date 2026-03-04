import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // Emulate LFSR pseudo-random noise
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // Tonal Body (2 triangle oscillators)
        const freq1 = 160;
        const freq2 = 220; // Dissonance for body modes

        const osc1 = new Tone.Oscillator(freq1, "triangle");
        const osc2 = new Tone.Oscillator(freq2, "triangle");

        // Analog Drift
        osc1.frequency.value = freq1 + (Math.random() * 2 - 1);
        osc2.frequency.value = freq2 + (Math.random() * 2 - 1);
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch Sweep: start at freq * 2 and drop to freq in 50ms
        osc1.frequency.setValueAtTime(osc1.frequency.value * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(osc1.frequency.value, time + 0.05);
        osc2.frequency.setValueAtTime(osc2.frequency.value * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(osc2.frequency.value, time + 0.05);

        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer (Noise with HPF/LPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000, "highpass");
        // LPF for tuning the noise (Tone control)
        const lpfFreq = 4000 + pitch * 4000; // 4k-8k range
        const lpf = new Tone.Filter(lpfFreq, "lowpass");
        const noiseGain = new Tone.Gain(0);

        // Analog drift on filter
        lpf.frequency.value = lpfFreq * (1 + (Math.random() * 0.04 - 0.02));

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        const snappyDecay = 0.1 + snappy * 0.4;

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + 0.2);
        osc2.start(time).stop(time + 0.2);
        noiseSrc.start(time).stop(time + snappyDecay);

        // Cleanup: Noise is the longest part, use its onended callback
        noiseSrc.onended = () => {
            osc1.dispose();
            osc2.dispose();
            tonalGain.dispose();
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            noiseGain.dispose();
        };
    }
}
