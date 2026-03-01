import * as Tone from 'tone';

export class TR909Snare {
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

    trigger(time: number, toneCutoff: number, snappyDecay: number, velocity: number = 0.8) {
        // --- Tonal Layer (Triangle with Pitch Sweep) ---
        const osc1 = new Tone.Oscillator(160, 'triangle');
        const osc2 = new Tone.Oscillator(220, 'triangle');
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.output);

        // Pitch Sweep
        osc1.frequency.setValueAtTime(320, time);
        osc1.frequency.exponentialRampToValueAtTime(160, time + 0.05);
        osc2.frequency.setValueAtTime(440, time);
        osc2.frequency.exponentialRampToValueAtTime(220, time + 0.05);

        tonalGain.gain.setValueAtTime(velocity, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc1.start(time).stop(time + 0.2);
        osc2.start(time).stop(time + 0.2);

        // --- Snappy Layer (HPF + LPF Noise) ---
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000, 'highpass');
        const lpf = new Tone.Filter(toneCutoff, 'lowpass');
        const snappyGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(snappyGain);
        snappyGain.connect(this.output);

        snappyGain.gain.setValueAtTime(velocity * 0.7, time);
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        // Cleanup
        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            tonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            snappyGain.dispose();
        };
    }
}
