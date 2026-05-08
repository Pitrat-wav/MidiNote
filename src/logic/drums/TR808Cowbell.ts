import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Dual Square Wave Oscillators from Schmitt trigger matrix
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        const osc1 = new Tone.Oscillator(applyPitchDrift(freq1 * pitchMultiplier, 1.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(freq2 * pitchMultiplier, 1.0), "square");

        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        // Resonant Bandpass filter around 800Hz
        const bpf = new Tone.Filter({
            frequency: applyVariance(800, 0.02),
            type: "bandpass",
            Q: 2.0
        });
        // High-pass filter to clean up low end
        const hpf = new Tone.Filter({
            frequency: applyVariance(600, 0.02),
            type: "highpass"
        });
        const envGain = new Tone.Gain(0);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

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
