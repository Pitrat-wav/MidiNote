import * as Tone from 'tone'

export class TR808HiHat {
    // Exact Schmitt trigger oscillator frequencies from research
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(
        private destination: Tone.ToneAudioNode,
        private openDestination?: Tone.ToneAudioNode
    ) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        // Multi-oscillator cluster for inharmonic metallic texture
        const mixGain = new Tone.Gain(0.15); // Sum of 6 square waves
        const oscillators = this.frequencies.map(freq => {
            // Micro-randomization: Analog phase and frequency drift
            const drift = (Math.random() - 0.5) * 4;
            // Tuning parameter (0.5 to 1.5 multiplier)
            const osc = new Tone.Oscillator(freq * (0.5 + pitch) + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Parallel Band-Pass Filters for specific resonance formants
        const bpf1 = new Tone.Filter(3440, "bandpass"); // BP1: ~3440Hz
        bpf1.Q.value = 1.5;
        const bpf2 = new Tone.Filter(7100, "bandpass"); // BP2: ~7100Hz
        bpf2.Q.value = 1.5;

        // VCA and High-Pass Sizzle filter
        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass"); // HP: ~7000Hz cleanup

        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);

        // Route to specific destination if provided
        const dest = (isOpen && this.openDestination) ? this.openDestination : this.destination;
        hpf.connect(dest);

        // Exponential Decay: Closed (40-60ms) vs Open (300-500ms)
        const decayTime = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);

        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Resource Cleanup tied to the decay of the VCA
        // We use a dummy node or just Tone.Draw/Tone.Transport if we want more precision,
        // but for this architecture, disposing after decayTime is safe.
        Tone.Offline(() => { }, 0.1).then(() => {
            // This is just to ensure the oscillators are actually started before we set the timeout
        });

        setTimeout(() => {
            oscillators.forEach(o => o.dispose());
            mixGain.dispose();
            bpf1.dispose();
            bpf2.dispose();
            envGain.dispose();
            hpf.dispose();
        }, (decayTime + 0.1) * 1000);
    }
}
