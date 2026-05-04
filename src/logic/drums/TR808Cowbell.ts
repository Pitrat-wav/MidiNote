import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from Schmitt trigger matrix: 540Hz and 800Hz
        // Pitch parameter shifts these frequencies (approx 0.7x to 1.3x)
        const pitchMultiplier = 0.7 + pitch * 0.6;
        const freq1 = applyPitchDrift(540 * pitchMultiplier, 2.0);
        const freq2 = applyPitchDrift(800 * pitchMultiplier, 2.0);

        const osc1 = new Tone.Oscillator(freq1, "square");
        const osc2 = new Tone.Oscillator(freq2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Resonant Bandpass filter around 800Hz
        const bpf = new Tone.Filter({
            frequency: applyVariance(800, 0.02),
            type: "bandpass",
            Q: 2.0
        });

        // High-pass filter to clean up the bottom end
        const hpf = new Tone.Filter({
            frequency: applyVariance(600, 0.02),
            type: "highpass"
        });

        const vca = new Tone.Gain(0);

        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(vca);
        vca.connect(this.destination);

        // Decay: approx 0.1s to 0.8s
        const decayTime = applyVariance(0.1 + decay * 0.7, 0.02);

        // VCA Envelope
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
