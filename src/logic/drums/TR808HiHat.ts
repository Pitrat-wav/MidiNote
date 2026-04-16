import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 1.0) {
        // Create nodes
        const mixGain = new Tone.Gain(0.15);
        const bpf1 = new Tone.Filter(3440, "bandpass");
        const bpf2 = new Tone.Filter(7100, "bandpass");
        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass");

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        const filterVariance = 1 + (Math.random() * 0.04 - 0.02); // +/- 2% filter

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
        hpf.connect(this.destination);

        // Filter Q values
        bpf1.Q.value = 1.5;
        bpf2.Q.value = 1.5;
        bpf1.frequency.value = 3440 * filterVariance;
        bpf2.frequency.value = 7100 * filterVariance;
        hpf.frequency.value = 7000 * filterVariance;

        // Decay: Closed Hat (40-60ms), Open Hat (300-500ms)
        const decayBase = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);
        const decayTime = decayBase * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% decay

        // VCA Envelope
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Scheduling
        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Disposal - Explicitly clean up all 11-12 nodes to prevent memory leaks
        // We use the first oscillator's onstop event to trigger the cleanup
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
