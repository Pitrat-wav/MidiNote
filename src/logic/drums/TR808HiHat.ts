import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode, private openDestination?: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number) {
        // Use openDestination if provided and isOpen is true
        const currentDest = (isOpen && this.openDestination) ? this.openDestination : this.destination;

        // Create nodes
        const mixGain = new Tone.Gain(0.15);
        // Micro-randomization: Filter Cutoff Variance (+/- 2%)
        const bpf1Freq = 3440 * (1 + (Math.random() * 0.04 - 0.02));
        const bpf2Freq = 7100 * (1 + (Math.random() * 0.04 - 0.02));
        const bpf1 = new Tone.Filter(bpf1Freq, "bandpass");
        const bpf2 = new Tone.Filter(bpf2Freq, "bandpass");
        const envGain = new Tone.Gain(0);
        const hpfFreq = 7000 * (1 + (Math.random() * 0.04 - 0.02));
        const hpf = new Tone.Filter(hpfFreq, "highpass");

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Create 6 Square Wave Oscillators (Schmitt Trigger Matrix)
        const oscillators = this.frequencies.map(freq => {
            const drift = (Math.random() - 0.5) * 4; // Analog drift
            const osc = new Tone.Oscillator(freq * pitchMultiplier + drift, "square");
            osc.phase = Math.random() * 360;
            osc.connect(mixGain);
            return osc;
        });

        // Routing Graph
        // Oscillators -> MixGain -> [BPF1, BPF2] (Parallel) -> EnvGain -> HPF -> Destination
        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(currentDest);

        // Filter Q values
        bpf1.Q.value = 1.5;
        bpf2.Q.value = 1.5;

        // Decay: Closed Hat (40-60ms), Open Hat (300-500ms)
        const decayBase = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);
        // Micro-randomization: +/- 2% decay time variance
        const decayTime = decayBase * (1 + (Math.random() * 0.04 - 0.02));

        // VCA Envelope
        envGain.gain.setValueAtTime(1, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Scheduling
        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal - Explicitly clean up all nodes to prevent memory leaks
        // Use the first oscillator's onstop event to trigger the cleanup
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
