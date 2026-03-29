import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 0.8) {
        // Create nodes
        const mixGain = new Tone.Gain(0.15);

        // Micro-randomization: Filter Cutoff Variance (+/- 2%)
        const bpf1Freq = 3440 * (1 + (Math.random() * 0.04 - 0.02));
        const bpf2Freq = 7100 * (1 + (Math.random() * 0.04 - 0.02));

        const bpf1 = new Tone.Filter(bpf1Freq, "bandpass");
        const bpf2 = new Tone.Filter(bpf2Freq, "bandpass");
        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass");

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Create 6 Square Wave Oscillators (Schmitt Trigger Matrix)
        const oscillators = this.frequencies.map(freq => {
            // Analog drift: +/- 2Hz
            const drift = (Math.random() - 0.5) * 4;
            const osc = new Tone.Oscillator(freq * pitchMultiplier + drift, "square");
            // Analog phase randomization: ensure each hit starts with random phase
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

        // Decay: Closed Hat (40-60ms), Open Hat (300-500ms)
        let decayTime = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);

        // Micro-randomization: Decay Variance (+/- 2%)
        decayTime *= (1 + (Math.random() * 0.04 - 0.02));

        // VCA Envelope: scale by velocity
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
