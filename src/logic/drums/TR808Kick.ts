import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // Research: Base frequency (Tune) 45Hz - 60Hz
        const tune = 45 + pitch * 15;
        // Research: Amplitude decay 0.4s - 3.0s
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation (Sine wave)
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Pitch Drift (+/- 1-2 cents)
        const drift = (Math.random() * 2 - 1) * 0.5;
        const finalTune = tune + drift;

        // Pitch Envelope: Start high (tune * 2.5) and drop to base tune in 50ms
        // This emulates the diode shift in the Bridged-T circuit
        const startFreq = finalTune * 2.5;

        osc.frequency.setValueAtTime(startFreq, time);
        // Research: Pitch Decay 0.04s - 0.06s. We'll use 0.05s as average.
        osc.frequency.exponentialRampToValueAtTime(finalTune, time + 0.05);

        // VCA Amp Envelope: Instant attack, exponential decay to 0.001
        masterGain.gain.setValueAtTime(1, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
