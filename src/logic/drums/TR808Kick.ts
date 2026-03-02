import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 50Hz, maps to 40-80Hz range
        const tune = 40 + pitch * 40;
        // decay: 0.5 -> 1.5s, maps to 0.1-3.0s range
        const decayTime = 0.1 + decay * 2.9;

        // 808 Kick Core: Bridged-T Network emulation
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Pitch Drift
        const drift = (Math.random() * 2 - 1) * 0.5;

        // Pitch Envelope: Start high (~150Hz) and drop quickly to simulate the membrane hit
        const startFreq = 150 + drift;
        const endFreq = tune + drift;
        const pitchDropTime = 0.05; // 50ms drop

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + pitchDropTime);

        // VCA Amp Envelope: Instant attack, adjustable decay
        masterGain.gain.setValueAtTime(1, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Attack Click: Dirac impulse / very fast transient generator
        const clickOsc = new Tone.Oscillator(startFreq * 2, "sine");
        const clickGain = new Tone.Gain(0);
        clickOsc.connect(clickGain);
        clickGain.connect(this.destination);

        clickOsc.frequency.setValueAtTime(startFreq * 2, time);
        clickOsc.frequency.exponentialRampToValueAtTime(10, time + 0.02);

        clickGain.gain.setValueAtTime(0.5, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

        osc.start(time).stop(time + decayTime);
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
