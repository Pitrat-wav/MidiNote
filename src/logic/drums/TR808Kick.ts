import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 50Hz, maps to 40-80Hz range
        const tune = 40 + pitch * 40;
        // decay: 0.5 -> 1.5s, maps to 0.1-3.0s range
        const decayTime = 0.1 + decay * 2.9;

        const osc = new Tone.Oscillator(tune * 2.5, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const gain = new Tone.Gain(0);

        osc.connect(gain);
        gain.connect(this.destination);

        // Micro-randomization: Pitch Drift
        const drift = (Math.random() * 2 - 1) * 0.5;

        osc.frequency.setValueAtTime(tune * 2.5 + drift, time);
        osc.frequency.exponentialRampToValueAtTime(tune + drift, time + 0.05);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            gain.dispose();
        };
    }
}
