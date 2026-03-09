import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        const mixGain = new Tone.Gain(0.15);
        const oscillators = this.frequencies.map(freq => {
            // Analog drift: +/- 2Hz
            const drift = (Math.random() - 0.5) * 4;
            // Use pitch to shift all frequencies slightly
            const osc = new Tone.Oscillator(freq * (0.8 + pitch * 0.4) + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Parallel Band Pass Filters
        const bpf1 = new Tone.Filter(3440, "bandpass");
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass"); // Sizzle

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // decay: 0 -> Closed (40ms), 1 -> Open (500ms) with range adjustments
        // Closed: 40-60ms, Open: 300-500ms
        let baseDecay = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);
        const decayTime = baseDecay * (1 + (Math.random() * 0.04 - 0.02));

        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime + 0.1);
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
