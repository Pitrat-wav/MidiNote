import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    private frequencies = [540, 800];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Pitch Multiplier (0.5x to 1.5x)
        const pitchMultiplier = 0.5 + pitch;

        // Dual Square Oscillators
        const oscillators = this.frequencies.map(freq => {
            const driftedFreq = applyPitchDrift(freq * pitchMultiplier, 1.0);
            const osc = new Tone.Oscillator(driftedFreq, "square");
            osc.phase = Math.random() * 360;
            return osc;
        });

        const mixGain = new Tone.Gain(0.5);
        const bpf = new Tone.Filter(800 * pitchMultiplier, "bandpass");
        const hpf = new Tone.Filter(600 * pitchMultiplier, "highpass");
        const envGain = new Tone.Gain(0);

        bpf.Q.value = 1.5;

        // Routing
        oscillators.forEach(osc => osc.connect(mixGain));
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        const decayTime = applyVariance(0.1 + decay * 0.5, 0.02);

        // Envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        oscillators[0].onstop = () => {
            oscillators.forEach(o => o.dispose());
            mixGain.dispose();
            bpf.dispose();
            hpf.dispose();
            envGain.dispose();
        };
    }
}
