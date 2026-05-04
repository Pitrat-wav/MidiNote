import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];
    private activeGains: Set<Tone.Gain> = new Set();

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 0.8) {
        // Create nodes
        const mixGain = new Tone.Gain(0.15);
        const bpf1 = new Tone.Filter(3440, "bandpass");
        const bpf2 = new Tone.Filter(7100, "bandpass");
        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass");

        // Track active gain for choking
        this.activeGains.add(envGain);

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Create 6 Square Wave Oscillators (Schmitt Trigger Matrix)
        const oscillators = this.frequencies.map(freq => {
            const driftedFreq = applyPitchDrift(freq * pitchMultiplier, 2.0); // +/- 2Hz drift for hats
            const osc = new Tone.Oscillator(driftedFreq, "square");
            osc.phase = Math.random() * 360;
            osc.connect(mixGain);
            return osc;
        });

        // Routing Graph
        // Oscillators -> MixGain -> [BPF1, BPF2] (Parallel) -> EnvGain -> HPF -> Destination
        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // Filter Q values and randomization
        bpf1.Q.value = 1.5;
        bpf2.Q.value = 1.5;
        bpf1.frequency.value = applyVariance(3440, 0.02);
        bpf2.frequency.value = applyVariance(7100, 0.02);
        hpf.frequency.value = applyVariance(7000, 0.02);

        // Decay: Closed Hat (40-60ms), Open Hat (300-500ms)
        const decayBase = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);
        const decayTime = applyVariance(decayBase, 0.02);

        // VCA Envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Scheduling
        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal - Explicitly clean up all 11-12 nodes to prevent memory leaks
        // We use the first oscillator's onstop event to trigger the cleanup
        oscillators[0].onstop = () => {
            oscillators.forEach(o => o.dispose());
            mixGain.dispose();
            bpf1.dispose();
            bpf2.dispose();
            envGain.dispose();
            this.activeGains.delete(envGain);
            hpf.dispose();
        };
    }

    /**
     * Supports hi-hat choking: quickly ramps down all active voices.
     */
    stop(time: number) {
        this.activeGains.forEach(gain => {
            gain.gain.cancelScheduledValues(time);
            gain.gain.setValueAtTime(gain.gain.value as number, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        });
    }
}
