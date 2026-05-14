import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Cowbell {
    private frequencies = [540, 800];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Base frequencies from 808 Schmitt trigger matrix
        // pitch multiplier 0.5x to 1.5x
        const pitchMultiplier = 0.5 + pitch;

        const mixGain = new Tone.Gain(0.2);

        // 1. Dual Square Wave Oscillators
        const oscillators = this.frequencies.map(freq => {
            const driftedFreq = applyPitchDrift(freq * pitchMultiplier, 1.0);
            const osc = new Tone.Oscillator(driftedFreq, "square");
            osc.phase = Math.random() * 360;
            osc.connect(mixGain);
            return osc;
        });

        // 2. Bandpass Filter (resonant around 800Hz)
        const bpf = new Tone.Filter({
            frequency: applyVariance(800 * pitchMultiplier, 0.02),
            type: "bandpass",
            Q: 2.0
        });

        // 3. Highpass Filter to clean up the low end
        const hpf = new Tone.Filter({
            frequency: applyVariance(500 * pitchMultiplier, 0.02),
            type: "highpass"
        });

        const envGain = new Tone.Gain(0);

        // Routing: Oscs -> Mix -> BPF -> HPF -> EnvGain -> Destination
        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(envGain);
        envGain.connect(this.destination);

        // 4. Exponential Decay
        const decayBase = 0.1 + decay * 0.5;
        const decayTime = applyVariance(decayBase, 0.02);

        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Start and stop
        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Cleanup
        oscillators[0].onstop = () => {
            oscillators.forEach(o => o.dispose());
            mixGain.dispose();
            bpf.dispose();
            hpf.dispose();
            envGain.dispose();
        };
    }
}
