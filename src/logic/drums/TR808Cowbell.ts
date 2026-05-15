import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    private activeGains: Set<Tone.Gain> = new Set();

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Core frequencies from 808 Schmitt trigger matrix: 540Hz and 800Hz
        const pitchMultiplier = 0.8 + pitch * 0.4;
        const freq1 = applyPitchDrift(540 * pitchMultiplier, 1.0);
        const freq2 = applyPitchDrift(800 * pitchMultiplier, 1.0);

        const osc1 = new Tone.Oscillator(freq1, "square");
        const osc2 = new Tone.Oscillator(freq2, "square");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;

        const mixGain = new Tone.Gain(0.5);
        osc1.connect(mixGain);
        osc2.connect(mixGain);

        // Resonant Bandpass Filter around 800Hz
        const bpfFreq = applyVariance(800, 0.02);
        const bpf = new Tone.Filter(bpfFreq, "bandpass");
        bpf.Q.value = 1.0;

        // Highpass filter to clean up lows
        const hpf = new Tone.Filter(600, "highpass");

        const envGain = new Tone.Gain(0);
        this.activeGains.add(envGain);

        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        const decayTime = applyVariance(0.3 + decay * 0.5, 0.02);

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
            this.activeGains.delete(envGain);
        };
    }

    stop(time: number = Tone.now()) {
        this.activeGains.forEach(gain => {
            gain.gain.cancelScheduledValues(time);
            gain.gain.rampTo(0, 0.02, time);
        });
        this.activeGains.clear();
    }
}
