import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 52.5Hz, maps to 45-60Hz range
        const tune = 45 + pitch * 15;
        // decay: 0.5 -> 1.7s, maps to 0.4-3.0s range
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation
        // According to research, Bridged-T yields a clean sine wave
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Pitch Envelope: Start high (tune * 2.5) and drop quickly to simulate the membrane hit
        // This pitch sweep creates the characteristic "tonk" click
        const startFreq = tune * 2.5;
        const endFreq = tune;
        const pitchDropTime = 0.05; // 50ms drop

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + pitchDropTime);

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
