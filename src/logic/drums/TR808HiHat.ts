import * as Tone from 'tone'

export class TR808HiHat {
    // Exact frequencies from research (HD14584 Schmitt trigger matrix)
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode, private openDestination?: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        const mixGain = new Tone.Gain(0.15); // Attenuation to avoid clipping 6 squares

        const oscillators = this.frequencies.map(freq => {
            const osc = new Tone.Oscillator(freq, "square");
            // Micro-randomization: Analog Drift (+/- 2Hz)
            const drift = (Math.random() - 0.5) * 4;
            // Apply slight pitch shift based on parameter
            osc.frequency.value = freq * (0.8 + pitch * 0.4) + drift;
            osc.connect(mixGain);
            return osc;
        });

        // Parallel Bandpass Filters from research
        const bpf1 = new Tone.Filter(3440, "bandpass");
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass");
        bpf2.Q.value = 1.5;

        const envGain = new Tone.Gain(0);
        // Final High-pass filter (Sizzle) ~7kHz
        const hpf = new Tone.Filter(7000, "highpass");

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);

        // Use openDestination if provided and trigger is for open hat
        const finalDest = (isOpen && this.openDestination) ? this.openDestination : this.destination;
        hpf.connect(finalDest);

        // Research: Closed Hat ~0.05s, Open Hat ~0.4s
        const decayTime = isOpen ? 0.4 : 0.05;

        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal anchored to the first oscillator's onstop
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
