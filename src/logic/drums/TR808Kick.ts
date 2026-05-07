import * as Tone from 'tone'
import { applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 52.5Hz, maps to 45-60Hz range
        const tune = 45 + pitch * 15;
        // decay: 0.5 -> 1.7s, maps to 0.4-3.0s range
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation (Sine wave)
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization using shared utilities
        const tuneDrift = applyPitchDrift(tune, 1.0);
        const finalDecay = applyVariance(decayTime, 0.02);

        // Pitch Envelope: Start high (Tune * 2.5) and drop quickly (50ms) to simulate the membrane hit ('tonk')
        // This rapid sweep generates the punch without needing a separate click oscillator
        const startFreq = tuneDrift * 2.5;
        const endFreq = tuneDrift;

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.05);

        // VCA Amp Envelope: Instant attack, two-stage exponential decay
        masterGain.gain.setValueAtTime(velocity, time);
        // Stage 1: Accelerated initial decay (20ms) to emulate diode damping
        masterGain.gain.exponentialRampToValueAtTime(velocity * 0.5, time + 0.02);
        // Stage 2: Main decay
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        osc.start(time).stop(time + finalDecay);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
