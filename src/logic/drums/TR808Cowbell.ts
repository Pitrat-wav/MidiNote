import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    private activeGains: Set<Tone.Gain> = new Set();

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // 808 Cowbell oscillators: 540Hz and 800Hz from the Schmitt trigger matrix
        const freq1 = 540;
        const freq2 = 800;

        // Pitch maps to frequency multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        const osc1 = new Tone.Oscillator(applyPitchDrift(freq1 * pitchMultiplier, 1.0), "square");
        const osc2 = new Tone.Oscillator(applyPitchDrift(freq2 * pitchMultiplier, 1.0), "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(applyVariance(800 * pitchMultiplier, 0.02), "bandpass");
        const hpf = new Tone.Filter(applyVariance(600 * pitchMultiplier, 0.02), "highpass");
        const vca = new Tone.Gain(0);

        this.activeGains.add(vca);

        osc1.connect(mixGain);
        osc2.connect(mixGain);
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(vca);
        vca.connect(this.destination);

        // Decay: 0.1s to 0.6s
        const decayTime = applyVariance(0.1 + decay * 0.5, 0.02);

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
            this.activeGains.delete(vca);
        };
    }

    stop(time: number) {
        this.activeGains.forEach(vca => {
            vca.gain.cancelScheduledValues(time);
            vca.gain.rampTo(0, 0.02, time);
        });
        this.activeGains.clear();
    }
}
