import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0 -> 45Hz, 1 -> 60Hz
        const tune = 45 + pitch * 15;

        // Micro-randomization: Pitch Drift (+/- 2 cents approx)
        const pitchDrift = (Math.random() * 2 - 1) * 0.05;
        const finalTune = tune + pitchDrift;

        // decay: 0 -> 0.4s, 1 -> 3.0s
        // Apply micro-randomization (+/- 2%)
        const baseDecay = 0.4 + decay * 2.6;
        const decayTime = baseDecay * (1 + (Math.random() * 0.04 - 0.02));

        // 808 Kick Core: Bridged-T Network emulation
        const osc = new Tone.Oscillator(finalTune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Pitch Envelope: Start high (tune * 2.5) and drop to tune
        const startFreq = finalTune * 2.5;
        const pitchDropTime = 0.05; // 50ms drop

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(finalTune, time + pitchDropTime);

        // VCA Amp Envelope: Instant attack, adjustable decay
        masterGain.gain.setValueAtTime(1, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // 808 Kick often has a small click/transient
        // The research mentions it's part of the Bridged-T excitement.
        // We'll keep a subtle version of the previous click logic but align it.
        const clickOsc = new Tone.Oscillator(startFreq * 1.2, "sine");
        const clickGain = new Tone.Gain(0);
        clickOsc.connect(clickGain);
        clickGain.connect(this.destination);

        clickOsc.frequency.setValueAtTime(startFreq * 1.2, time);
        clickOsc.frequency.exponentialRampToValueAtTime(10, time + 0.02);

        clickGain.gain.setValueAtTime(0.4, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

        osc.start(time).stop(time + decayTime + 0.1);
        clickOsc.start(time).stop(time + 0.02);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };

        clickOsc.onstop = () => {
            clickOsc.dispose();
            clickGain.dispose();
        };
    }
}
