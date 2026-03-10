import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // Research: Tune 45Hz - 60Hz
        const tune = 45 + pitch * 15;

        // Micro-randomization: Pitch Drift (+/- 1Hz)
        const drift = (Math.random() * 2 - 1);
        const tunedFreq = tune + drift;

        // Research: Decay 0.4s - 3.0s
        // Apply micro-randomization to decay (+/- 2%)
        const baseDecayTime = 0.4 + decay * 2.6;
        const decayTime = baseDecayTime * (1 + (Math.random() * 0.04 - 0.02));

        // 808 Kick Core: Bridged-T Network emulation
        const osc = new Tone.Oscillator(tunedFreq, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Research: Pitch Envelope: Start at tune * 2.5 and drop to tune over 0.05s
        const startFreq = tunedFreq * 2.5;
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(tunedFreq, time + 0.05);

        // VCA Amp Envelope: Instant attack, adjustable decay
        masterGain.gain.setValueAtTime(1, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
