import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Core frequencies from the Schmitt trigger matrix: 540Hz and 800Hz
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.5x to 1.5x) to allow some tuning range
        const pitchMultiplier = 0.5 + pitch;

        // Apply analog drift
        const f1 = applyPitchDrift(freq1 * pitchMultiplier, 1.5);
        const f2 = applyPitchDrift(freq2 * pitchMultiplier, 2.0);

        const osc1 = new Tone.Oscillator(f1, "square");
        const osc2 = new Tone.Oscillator(f2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mix = new Tone.Gain(0.5);
        osc1.connect(mix);
        osc2.connect(mix);

        // Filter: Resonant Bandpass (~800Hz) and HPF as per research
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        bpf.Q.value = 2.5;

        const hpf = new Tone.Filter(applyVariance(600, 0.02), "highpass");

        const envGain = new Tone.Gain(0);

        mix.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // Decay range: 0.1s to 0.4s
        const decayTime = applyVariance(0.1 + decay * 0.3, 0.02);

        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc1.start(time).stop(time + decayTime);
        osc2.start(time).stop(time + decayTime);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            mix.dispose();
            bpf.dispose();
            hpf.dispose();
            envGain.dispose();
        };
    }
}
