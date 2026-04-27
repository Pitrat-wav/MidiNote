import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 52.5Hz, maps to 45-60Hz range (research: 45Hz – 60Hz)
        const tune = 45 + pitch * 15;
        // decay: 0.5 -> 1.7s, maps to 0.4-3.0s range (research: 0.4s – 3.0s)
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation (pure sine resonance)
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Pitch Drift (+/- 1Hz)
        const drift = (Math.random() * 2 - 1) * 1.0;
        // VCA Decay variance (+/- 2%)
        const finalDecay = decayTime * (1 + (Math.random() * 0.04 - 0.02));

        // Pitch Envelope: Start high (Tune * 2.5) and drop quickly (50ms)
        // to simulate the 'tonk' attack from the diode shift (research: Tune * 2.5, 0.04 - 0.06s)
        const startFreq = (tune * 2.5) + drift;
        const endFreq = tune + drift;

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.05);

        // VCA Amp Envelope: Adjustable exponential decay (research: 0.4s – 3.0s)
        masterGain.gain.setValueAtTime(velocity, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        // As per research, no separate click oscillator is used for 808;
        // the attack transient is generated entirely by the rapid pitch sweep.

        osc.start(time).stop(time + finalDecay);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
