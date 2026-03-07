import * as Tone from 'tone'

export class TR808HiHat {
    // Research: Standard Schmitt trigger frequencies
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        // Research: mixGain should attenuate sum of 6 square waves
        const mixGain = new Tone.Gain(0.15);
        const oscillators = this.frequencies.map(freq => {
            // Research: Analog drift +/- 2Hz
            const drift = (Math.random() - 0.5) * 4;
            const osc = new Tone.Oscillator(freq + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Research: Parallel Band Pass Filters
        // BPF 1: ~3440 Hz
        const bpf1 = new Tone.Filter(3440, "bandpass");
        bpf1.Q.value = 1.5;
        // BPF 2: ~7100 Hz
        const bpf2 = new Tone.Filter(7100, "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        // Research: Final High Pass Filter (Sizzle) ~7000 Hz
        const hpf = new Tone.Filter(7000, "highpass");

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // Research: Closed Hat (40-60ms), Open Hat (300-500ms)
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
