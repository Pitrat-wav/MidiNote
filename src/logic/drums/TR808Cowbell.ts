import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 Schmitt trigger matrix
        const f1 = 540;
        const f2 = 800;

        // Pitch multiplier based on the 'pitch' parameter (0.5 to 1.5x)
        const pitchMultiplier = 0.5 + pitch;

        // Apply drift
        const freq1 = applyPitchDrift(f1 * pitchMultiplier, 1.0);
        const freq2 = applyPitchDrift(f2 * pitchMultiplier, 1.0);

        const osc1 = new Tone.Oscillator(freq1, "square");
        const osc2 = new Tone.Oscillator(freq2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Filters based on 808 Cowbell circuit analysis
        const bpf = new Tone.Filter({
            frequency: applyVariance(800 * pitchMultiplier, 0.02),
            type: "bandpass",
            Q: 2.5
        });

        const hpf = new Tone.Filter({
            frequency: applyVariance(500 * pitchMultiplier, 0.02),
            type: "highpass"
        });

        const envGain = new Tone.Gain(0);

        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        const decayTime = applyVariance(0.1 + decay * 0.5, 0.02);

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
