import * as Tone from 'tone';

export class TR808Kick {
    private output: Tone.ToneAudioNode;

    constructor(output: Tone.ToneAudioNode) {
        this.output = output;
    }

    trigger(time: number, tune: number, decay: number, velocity: number = 0.8) {
        const osc = new Tone.Oscillator('sine');
        const gain = new Tone.Gain(0);

        osc.connect(gain);
        gain.connect(this.output);

        // Pitch Envelope: Diode-like pitch shift
        const startFreq = tune * 2.5;
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(tune, time + 0.05);

        // Amplitude Envelope: Bridged-T decay
        gain.gain.setValueAtTime(velocity, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        osc.start(time).stop(time + decay);

        // Cleanup to prevent memory leaks
        osc.onstop = () => {
            osc.dispose();
            gain.dispose();
        };
    }
}
