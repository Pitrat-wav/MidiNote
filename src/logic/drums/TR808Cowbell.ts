import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Dual square wave oscillators: 540Hz and 800Hz as per research (Schmitt trigger matrix)
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.7x to 1.3x)
        const pitchMultiplier = 0.7 + pitch * 0.6;

        const osc1 = new Tone.Oscillator(applyPitchDrift(freq1 * pitchMultiplier, 2.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(freq2 * pitchMultiplier, 2.0), "square");
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

        bpf.Q.value = 2.0;

        // Decay time: 0.05s to 0.5s
        const decayTime = applyVariance(0.05 + decay * 0.45, 0.02);

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
