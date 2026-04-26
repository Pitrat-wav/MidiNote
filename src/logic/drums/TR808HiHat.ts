import * as Tone from 'tone'

/**
 * TR-808 Hi-Hat: Schmitt Trigger Oscillator Matrix and Parallel Bandpass Filters
 * Based on research: "Программный синтез аналоговых ударных инструментов: Глубокий DSP-анализ"
 */
export class TR808HiHat {
    // Reference frequencies for the 6 Schmitt trigger inverters (HD14584)
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540];

    constructor(private destination: Tone.ToneAudioNode) { }

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 0.8) {
        // Core summing node
        const mixGain = new Tone.Gain(0.15); // Attenuate sum of 6 oscillators

        // Parallel Bandpass Filters (BPF 1: ~3440Hz, BPF 2: ~7100Hz)
        const bpf1 = new Tone.Filter(3440, "bandpass");
        const bpf2 = new Tone.Filter(7100, "bandpass");

        const envGain = new Tone.Gain(0);
        const hpf = new Tone.Filter(7000, "highpass"); // Final Sizzle cleaning

        // Pitch Multiplier (0.8x to 1.2x) based on pitch param
        const pitchMultiplier = 0.8 + pitch * 0.4;
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02);

        // 1. SCHMITT TRIGGER MATRIX (6 Square Oscillators)
        const oscillators = this.frequencies.map(freq => {
            const drift = (Math.random() - 0.5) * 4; // Analog Phase/Freq drift
            const osc = new Tone.Oscillator(freq * pitchMultiplier + drift, "square");
            osc.phase = Math.random() * 360;
            osc.connect(mixGain);
            return osc;
        });

        // 2. PARALLEL ROUTING
        mixGain.connect(bpf1);
        mixGain.connect(bpf2);
        bpf1.connect(envGain);
        bpf2.connect(envGain);
        envGain.connect(hpf);
        hpf.connect(this.destination);

        bpf1.Q.value = 1.5;
        bpf2.Q.value = 1.5;
        bpf1.frequency.value = 3440 * filterVariance;
        bpf2.frequency.value = 7100 * filterVariance;
        hpf.frequency.value = 7000 * filterVariance;

        // 3. AMPLITUDE ENVELOPE (VCA)
        // Decay ranges from research: Closed (40-60ms), Open (300-500ms)
        const decayBase = isOpen ? (0.3 + decay * 0.2) : (0.04 + decay * 0.02);
        const decayTime = decayBase * (1 + (Math.random() * 0.04 - 0.02));

        envGain.gain.setValueAtTime(velocity, time);
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Schedule playback
        oscillators.forEach(osc => {
            osc.start(time).stop(time + decayTime);
        });

        // Cleanup: Use first oscillator as anchor for disposal
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
