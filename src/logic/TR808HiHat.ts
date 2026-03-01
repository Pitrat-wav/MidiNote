import * as Tone from 'tone';

export class TR808HiHat {
    private output: Tone.ToneAudioNode;
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(output: Tone.ToneAudioNode) {
        this.output = output;
    }

    trigger(time: number, decay: number, velocity: number = 0.8) {
        const oscillators: Tone.Oscillator[] = [];
        const mixGain = new Tone.Gain(0.15);

        const bpf1 = new Tone.Filter(3440, 'bandpass', -12);
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, 'bandpass', -12);
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, 'highpass', -12);

        this.frequencies.forEach(f => {
            const osc = new Tone.Oscillator(f + (Math.random() - 0.5) * 4, 'square');
            osc.connect(mixGain);
            oscillators.push(osc);
        });

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.output);

        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        oscillators.forEach(osc => osc.start(time).stop(time + decay + 0.1));

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
