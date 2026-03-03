import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        const mixGain = new Tone.Gain(0.15);
        const oscillators = this.frequencies.map(freq => {
            const drift = (Math.random() - 0.5) * 4;
            // Use pitch to shift all frequencies slightly
            const osc = new Tone.Oscillator(freq * (0.5 + pitch) + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        const bpf1 = new Tone.Filter(3440, "bandpass"); // 3440Hz
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass"); // 7100Hz
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass"); // 7kHz high-pass cleanup

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // decay: 0.5 maps to standard 808 times
        const decayTime = isOpen ? (0.2 + decay * 0.8) : (0.02 + decay * 0.1);

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
