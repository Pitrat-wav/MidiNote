import * as Tone from 'tone'

export class TR808HiHat {
    // Exact Schmitt trigger oscillator frequencies (HD14584) from research
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        // Master mixer for the 6 square waves
        const mixGain = new Tone.Gain(0.15);

        const oscillators = this.frequencies.map(freq => {
            // Analog drift: +/- 2Hz
            const drift = (Math.random() * 4 - 2);
            // In the original circuit, pitch wasn't variable like this,
            // but we'll keep a small pitch shift factor for user control
            const pitchShift = 0.9 + pitch * 0.2;
            const osc = new Tone.Oscillator(freq * pitchShift + drift, "square");
            osc.phase = Math.random() * 360;
            osc.connect(mixGain);
            return osc;
        });

        // Parallel Bandpass Filters as per research
        const bpf1 = new Tone.Filter(3440, "bandpass");
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        // Final Sizzle Highpass Filter at 7000Hz
        const hpf = new Tone.Filter(7000, "highpass");

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // Decay times: ~50ms for Closed, ~400ms for Open
        const decayTime = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);

        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal
        oscillators[0].onstop = () => {
            oscillators.forEach(o => o.dispose());
            mixGain.dispose();
            bpf1.dispose();
            bpf2.dispose();
            envGain.dispose();
            hpf.dispose();
        };
    }
}
