import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // Research: Base frequency (Tune) 45 Hz – 60 Hz
        const tune = 45 + pitch * 15;
        // Research: Amplitude Decay 0.4 sec – 3.0 sec
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation (Sine wave)
        const osc = new Tone.Oscillator(tune, "sine");

        // Analog drift: phase randomization
        osc.phase = Math.random() * 360;

        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Pitch Drift (+/- 1-2 cents)
        const drift = (Math.random() * 2 - 1) * 0.5;
        const baseFreq = tune + drift;

        // Pitch Envelope: Imitation of diode frequency shift.
        // Research: Start at Tune * 2.5, drop to Tune over 50ms (0.05s)
        const startFreq = baseFreq * 2.5;

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.05);

        // VCA Amp Envelope: Exponential Decay
        // Target 0.001 to avoid math errors with exponentialRamp
        masterGain.gain.setValueAtTime(1, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Lifecycle management
        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
