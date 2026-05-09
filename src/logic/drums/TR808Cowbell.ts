import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 Schmitt trigger matrix: 540Hz and 800Hz
        // pitch maps to frequency offset
        const freqMultiplier = 0.5 + pitch; // Range: 0.5x to 1.5x base frequencies
        const baseFreq1 = 540 * freqMultiplier;
        const baseFreq2 = 800 * freqMultiplier;

        // Micro-randomization
        const freq1 = applyPitchDrift(baseFreq1, 1.0);
        const freq2 = applyPitchDrift(baseFreq2, 1.0);
        const finalDecay = applyVariance(0.1 + decay * 0.4, 0.02);

        // Two Square Wave Oscillators
        const osc1 = new Tone.Oscillator(freq1, "square");
        const osc2 = new Tone.Oscillator(freq2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Bandpass filter centered around 800Hz (resonant)
        const bpf = new Tone.Filter({
            frequency: 800 * freqMultiplier,
            type: "bandpass",
            Q: 2
        });

        // High-pass filter to clean up the bottom
        const hpf = new Tone.Filter(600 * freqMultiplier, "highpass");

        const vca = new Tone.Gain(0);

        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(vca);
        vca.connect(this.destination);

        // Envelope
        vca.gain.setValueAtTime(velocity, time);
        vca.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        osc1.start(time).stop(time + finalDecay);
        osc2.start(time).stop(time + finalDecay);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            mixGain.dispose();
            bpf.dispose();
            hpf.dispose();
            vca.dispose();
        };
    }
}
