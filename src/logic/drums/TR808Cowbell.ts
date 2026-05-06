import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

/**
 * TR808Cowbell synthesis based on physical circuit analysis.
 * Uses dual square wave oscillators (540Hz, 800Hz) from the Schmitt trigger matrix.
 */
export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from the 808 oscillator matrix
        const f1 = 540;
        const f2 = 800;

        // Pitch shift (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Micro-randomization
        const freq1 = applyPitchDrift(f1 * pitchMultiplier, 1.0);
        const freq2 = applyPitchDrift(f2 * pitchMultiplier, 1.0);
        const finalDecay = applyVariance(0.1 + decay * 0.5, 0.02);

        // Oscillators
        const osc1 = new Tone.Oscillator(freq1, "square");
        const osc2 = new Tone.Oscillator(freq2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Filters: Resonant Bandpass (~800Hz) and High-pass
        const bpf = new Tone.Filter({
            frequency: applyVariance(800 * pitchMultiplier, 0.02),
            type: "bandpass",
            Q: 2
        });

        const hpf = new Tone.Filter({
            frequency: applyVariance(500 * pitchMultiplier, 0.02),
            type: "highpass"
        });

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
