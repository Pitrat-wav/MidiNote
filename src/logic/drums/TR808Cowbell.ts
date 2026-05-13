import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Core frequencies for 808 Cowbell are 540Hz and 800Hz
        const freq1 = 540;
        const freq2 = 800;

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Oscillators
        const osc1 = new Tone.Oscillator(applyPitchDrift(freq1 * pitchMultiplier, 1.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(freq2 * pitchMultiplier, 1.0), "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        // Mixer
        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Filters
        // Bandpass filter centered around 800Hz
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        bpf.Q.value = 1.5;

        // Highpass filter to clean up low end
        const hpf = new Tone.Filter(applyVariance(500 * pitchMultiplier, 0.02), "highpass");

        // VCA Envelope
        const envGain = new Tone.Gain(0);

        // Routing
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // Decay time calculation
        const decayTimeBase = 0.1 + decay * 0.5;
        const decayTime = applyVariance(decayTimeBase, 0.02);

        // Trigger envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Start/Stop
        osc1.start(time).stop(time + decayTime);
        osc2.start(time).stop(time + decayTime);

        // Disposal
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
