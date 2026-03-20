import * as Tone from 'tone'

export class TR808HiHat {
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 0.8) {
        // Micro-randomization
        const filterDrift = 1 + (Math.random() * 0.06 - 0.03); // +/- 3%
        const decayVariance = 1 + (Math.random() * 0.1 - 0.05);

        // Create nodes
        const mixGain = new Tone.Gain(0.15);
        const bpf1 = new Tone.Filter(3440 * filterDrift, "bandpass");
        const bpf2 = new Tone.Filter(7100 * filterDrift, "bandpass");
        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000 * filterDrift, "highpass");

        // Pitch Multiplier (0.8x to 1.2x)
        const pitchMultiplier = 0.8 + pitch * 0.4;

        // Create 6 Square Wave Oscillators (Schmitt Trigger Matrix)
        const oscillators = this.frequencies.map(freq => {
            const drift = (Math.random() - 0.5) * 4; // Analog drift
            const osc = new Tone.Oscillator(freq * pitchMultiplier + drift, "square");
            osc.connect(mixGain);
            return osc;
        });

        // Routing Graph
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
        const decayTime = (isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02)) * decayVariance;

        // VCA Envelope scaled by velocity
        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Scheduling
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
