import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 52.5Hz, maps to 45-60Hz range
        const tune = 45 + pitch * 15;

        // Micro-randomization:
        // 1. Pitch Drift (+/- 1-2 cents or ~0.5Hz)
        const drift = (Math.random() * 2 - 1) * 0.5;

        // 2. Decay variance (+/- 5%)
        const decayVariance = 1 + (Math.random() * 0.1 - 0.05);
        // decay: 0.5 -> 1.7s, maps to 0.4-3.0s range
        const decayTime = (0.4 + decay * 2.6) * decayVariance;

        // 808 Kick Core: Bridged-T Network emulation
        const osc = new Tone.Oscillator(tune + drift, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Pitch Envelope: Start high (Tune * 2.5) and drop quickly to simulate the membrane hit ('tonk')
        const startFreq = ((tune + drift) * 2.5);
        const endFreq = tune + drift;
        const pitchDropTime = 0.05; // 50ms drop

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + pitchDropTime);

        // VCA Amp Envelope: Instant attack, adjustable exponential decay
        // Scale by velocity
        masterGain.gain.setValueAtTime(velocity, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
