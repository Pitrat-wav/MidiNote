import * as Tone from 'tone'

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

        // Micro-randomization: Pitch Drift (+/- 1Hz)
        const drift = (Math.random() * 2 - 1) * 1.0;
        // VCA Decay variance (+/- 3%)
        const finalDecay = decayTime * (1 + (Math.random() * 0.06 - 0.03));

        // Pitch Envelope: Start high (Tune * 2.5) and drop quickly (50ms) to simulate the membrane hit ('tonk')
        // This rapid sweep generates the punch without needing a separate click oscillator
        const startFreq = (tune * 2.5) + drift;
        const endFreq = tune + drift;

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.05);

        // VCA Amp Envelope: Instant attack, adjustable exponential decay
        masterGain.gain.setValueAtTime(velocity, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        osc.start(time).stop(time + finalDecay);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
