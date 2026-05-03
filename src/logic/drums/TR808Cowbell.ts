import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Core frequencies for 808 Cowbell from the Schmitt trigger matrix
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Apply drift and multiplier
        const driftedFreq1 = applyPitchDrift(freq1 * pitchMultiplier, 1.0);
        const driftedFreq2 = applyPitchDrift(freq2 * pitchMultiplier, 1.0);

        const osc1 = new Tone.Oscillator(driftedFreq1, "square");
        const osc2 = new Tone.Oscillator(driftedFreq2, "square");

        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        const hpf = new Tone.Filter(applyVariance(500, 0.02), "highpass");
        const envGain = new Tone.Gain(0);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        bpf.Q.value = 1.0;

        // Decay time: typically 0.1s to 0.5s
        const decayBase = 0.1 + decay * 0.4;
        const decayTime = applyVariance(decayBase, 0.02);

        // VCA Envelope
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
