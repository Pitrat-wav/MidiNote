import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 matrix
        const f1 = 540;
        const f2 = 800;

        // Pitch Multiplier (0.5x to 1.5x)
        const pitchMultiplier = 0.5 + pitch;

        // Micro-randomization
        const d1 = applyPitchDrift(f1 * pitchMultiplier, 1.0);
        const d2 = applyPitchDrift(f2 * pitchMultiplier, 1.5);
        const finalDecay = applyVariance(0.1 + decay * 0.5, 0.02);

        // Two square wave oscillators
        const osc1 = new Tone.Oscillator(d1, "square");
        const osc2 = new Tone.Oscillator(d2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        bpf.Q.value = 2.0;
        const hpf = new Tone.Filter(applyVariance(600 * pitchMultiplier, 0.02), "highpass");
        const envGain = new Tone.Gain(0);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // Envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        osc1.start(time).stop(time + finalDecay);
        osc2.start(time).stop(time + finalDecay);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            mixGain.dispose();
            bpf.dispose();
            hpf.dispose();
            envGain.dispose();
        };
    }
}
