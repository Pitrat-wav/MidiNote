import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    trigger(time: number, pitch: number, snappy: number) {
        // Tonal Body (2 triangle oscillators)
        const freq1 = 160 + pitch * 40;
        const freq2 = 220 + pitch * 50;

        const osc1 = new Tone.Oscillator(freq1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2, "triangle");
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        osc1.frequency.setValueAtTime(freq1 * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05);
        osc2.frequency.setValueAtTime(freq2 * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05);

        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        // Snappy Layer (LFSR-like noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000, "highpass");
        const lpf = new Tone.Filter(4000 + pitch * 4000, "lowpass"); // pitch controls tone cutoff
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        const snappyDecay = 0.1 + snappy * 0.4;

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + 0.15);
        osc2.start(time).stop(time + 0.15);
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
