import * as Tone from 'tone'

/**
 * TR-808 Bass Drum: Bridged T-Network Emulation
 * Based on research: "Программный синтез аналоговых ударных инструментов: Глубокий DSP-анализ"
 */
export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 52.5Hz, maps to 45-60Hz range (Physical size of drum)
        const tune = 45 + pitch * 15;
        // decay: 0.5 -> 1.7s, maps to 0.4-3.0s range (Bridged-T resonance duration)
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Sine wave resonance of the T-bridge
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization (free-running behavior)
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Analog Drift (+/- 1Hz)
        const drift = (Math.random() * 2 - 1) * 1.0;
        // VCA Decay variance (+/- 2%)
        const finalDecay = decayTime * (1 + (Math.random() * 0.04 - 0.02));

        // Pitch Envelope: Diode-induced frequency shift
        // Start high (Tune * 2.5) and drop quickly (50ms) to simulate the "tonk" attack
        const startFreq = (tune * 2.5) + drift;
        const endFreq = tune + drift;

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.05);

        // VCA Amp Envelope: Exponential Decay (V(t) = V0 * e^(-t/RC))
        // Target 0.001 to avoid log(0) errors in Web Audio API
        masterGain.gain.setValueAtTime(velocity, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + finalDecay);

        osc.start(time).stop(time + finalDecay);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
