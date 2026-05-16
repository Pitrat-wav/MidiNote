import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 Schmitt trigger matrix: 540Hz and 800Hz
        const f1 = 540;
        const f2 = 800;

        // Pitch multiplier (0.7x to 1.3x) based on user 'pitch' parameter
        const pitchMult = 0.7 + pitch * 0.6;

        const osc1 = new Tone.Oscillator(applyPitchDrift(f1 * pitchMult, 2.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(f2 * pitchMult, 2.0), "square");

        const mixGain = new Tone.Gain(0.5);
        // Resonant Bandpass filter around 800Hz (the dominant frequency)
        const bpf = new Tone.Filter(applyVariance(800 * pitchMult, 0.02), "bandpass");
        bpf.Q.value = 2.0;

        const hpf = new Tone.Filter(applyVariance(500 * pitchMult, 0.02), "highpass");
        const vca = new Tone.Gain(0);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(vca);
        vca.connect(this.destination);

        // Adjustable decay time: 0.3s to 0.8s
        const decayTime = applyVariance(0.3 + decay * 0.5, 0.02);

        vca.gain.setValueAtTime(velocity, time);
        vca.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc1.start(time).stop(time + decayTime);
        osc2.start(time).stop(time + decayTime);

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
