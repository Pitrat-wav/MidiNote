import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    private activeGains: Set<Tone.Gain> = new Set();

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 Schmitt trigger matrix
        const f1 = 540;
        const f2 = 800;

        // Pitch scaling (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Create oscillators
        const osc1 = new Tone.Oscillator(applyPitchDrift(f1 * pitchMultiplier, 1.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(f2 * pitchMultiplier, 1.0), "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        // Mixing and filtering
        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        bpf.Q.value = 2.0; // High Q for characteristic resonance

        const hpf = new Tone.Filter(applyVariance(1000, 0.02), "highpass");
        const envGain = new Tone.Gain(0);

        // Tracking active gain for stop()
        this.activeGains.add(envGain);

        // Routing
        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // Decay: approx 0.1s to 0.5s
        const decayBase = 0.1 + decay * 0.4;
        const decayTime = applyVariance(decayBase, 0.02);

        // VCA Envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Scheduling
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
            this.activeGains.delete(envGain);
        };
    }

    stop(time: number) {
        this.activeGains.forEach(gain => {
            gain.gain.cancelScheduledValues(time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        });
        this.activeGains.clear();
    }
}
