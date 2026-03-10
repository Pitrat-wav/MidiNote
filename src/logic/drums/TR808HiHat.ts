import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        const mixGain = new Tone.Gain(0.15);
        const oscillators = this.frequencies.map(freq => {
            // Research: Analog drift +/- 2Hz
            const drift = (Math.random() - 0.5) * 4;
            // Use pitch to shift all frequencies slightly
            const osc = new Tone.Oscillator(freq * (0.5 + pitch) + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Research: Two parallel Bandpass filters (3440Hz & 7100Hz)
        const bpf1 = new Tone.Filter(3440 * (1 + (Math.random() * 0.04 - 0.02)), "bandpass");
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100 * (1 + (Math.random() * 0.04 - 0.02)), "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        // Research: Final HPF at 7000Hz (Sizzle)
        const hpf = new Tone.Filter(7000, "highpass");

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        // Research: Closed Hat (0.05s) vs Open Hat (0.4s)
        const baseDecay = isOpen ? 0.4 : 0.05;
        // Apply user decay control (+/- 50% for flavor) and micro-randomization
        const decayTime = baseDecay * (0.5 + decay) * (1 + (Math.random() * 0.04 - 0.02));

        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal - use onended of the source as an anchor
        // Since we have multiple oscillators, we'll use the first one as trigger
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
