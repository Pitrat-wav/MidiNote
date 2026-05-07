import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Dual Square Oscillators (from Schmitt trigger matrix research)
        // Standard frequencies: 540Hz and 800Hz
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        const osc1 = new Tone.Oscillator(applyPitchDrift(freq1 * pitchMultiplier, 2.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(freq2 * pitchMultiplier, 2.0), "square");

        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        const hpf = new Tone.Filter(applyVariance(500 * pitchMultiplier, 0.02), "highpass");
        const envGain = new Tone.Gain(0);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // Q values for resonance
        bpf.Q.value = 2.0;

        const decayTime = applyVariance(0.1 + decay * 0.4, 0.02);

        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc1.start(time).stop(time + decayTime);
        osc2.start(time).stop(time + decayTime);

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
