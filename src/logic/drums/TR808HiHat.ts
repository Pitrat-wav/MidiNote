import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        const mixGain = new Tone.Gain(0.15);
        const oscillators = this.frequencies.map(freq => {
            // Analog phase and pitch drift randomization
            const drift = (Math.random() - 0.5) * 4;
            // Use pitch to shift all frequencies slightly (+/- 10%)
            const osc = new Tone.Oscillator(freq * (0.9 + pitch * 0.2) + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Parallel bandpass filters at 3440Hz and 7100Hz as per research
        const bpf1 = new Tone.Filter(3440, "bandpass");
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass"); // 7kHz "sizzle" filter

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // Closed: 40-60ms, Open: 300-500ms as per research
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
