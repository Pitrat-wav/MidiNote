import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // Research: 909 uses LFSR-like noise. Standard white noise is acceptable.
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // Research: Tonal Body (2 triangle oscillators)
        const freq1 = 160;
        const freq2 = 220; // Dissonance for membrane modes

        const osc1 = new Tone.Oscillator(freq1, "triangle");
        const osc2 = new Tone.Oscillator(freq2, "triangle");

        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Research: Pitch sweep (from ~2x base freq to base over 0.05s)
        osc1.frequency.setValueAtTime(freq1 * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05);
        osc2.frequency.setValueAtTime(freq2 * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05);

        // Research: Tonal decay ~0.2s
        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        // Snappy Layer (Noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1000 Hz to isolate from tonal body
        const hpf = new Tone.Filter(1000, "highpass");
        // Research: LPF ~4000 Hz - 8000 Hz (Tone control)
        const toneCutoff = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(toneCutoff, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        const snappyDecay = 0.1 + snappy * 0.4; // Keep existing snappy range for flexibility

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
