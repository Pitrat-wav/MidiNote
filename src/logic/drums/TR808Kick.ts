import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, pitch: number, decay: number) {
        // Research: Base frequency 45Hz - 60Hz
        const tune = 45 + pitch * 15;
        // Research: Amplitude decay 0.4s - 3.0s
        const decayTime = 0.4 + decay * 2.6;

        // 808 Kick Core: Bridged-T Network emulation
        const osc = new Tone.Oscillator(tune, "sine");
        osc.phase = Math.random() * 360; // Analog phase randomization
        const masterGain = new Tone.Gain(0);

        osc.connect(masterGain);
        masterGain.connect(this.destination);

        // Micro-randomization: Pitch Drift
        const drift = (Math.random() * 2 - 1) * 0.5;

        // Pitch Envelope: Research says start at tune * 2.5 and drop in 50ms
        const startFreq = (tune * 2.5) + drift;
        const endFreq = tune + drift;
        const pitchDropTime = 0.05; // 50ms drop

        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + pitchDropTime);

        // VCA Amp Envelope: Instant attack, adjustable decay
        masterGain.gain.setValueAtTime(1, time);
        // Research: exponentialRampToValueAtTime(0.001, time + decay)
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        osc.start(time).stop(time + decayTime);

        osc.onstop = () => {
            osc.dispose();
            masterGain.dispose();
        };
    }
}
