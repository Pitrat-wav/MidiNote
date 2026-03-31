import * as Tone from 'tone'

export class TR808Clap {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        this.noiseBuffer = Tone.getContext().createBuffer(1, sampleRate * 0.5, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // Micro-randomization: Filter Cutoff Variance (+/- 2%)
        const bpfFreq = (1000 + pitch * 1000) * (1 + (Math.random() * 0.04 - 0.02));

        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const bpf = new Tone.Filter(bpfFreq, "bandpass");
        const gain = new Tone.Gain(0).connect(this.destination);

        noiseSrc.connect(bpf);
        bpf.connect(gain);

        // Micro-randomization: +/- 2% on snap intervals
        const snapIntervalVariation = 1 + (Math.random() * 0.04 - 0.02);

        // Triple attack "snaps"
        const snapCount = 3;
        const snapInterval = 0.01 * snapIntervalVariation;
        for (let i = 0; i < snapCount; i++) {
            const snapTime = time + i * snapInterval;
            // Velocity scaling for snaps
            gain.gain.setValueAtTime(velocity, snapTime);
            gain.gain.exponentialRampToValueAtTime(0.1 * velocity, snapTime + snapInterval * 0.8);
        }

        // Final decay
        // Micro-randomization: +/- 2% on decay time
        const decayVariation = 1 + (Math.random() * 0.04 - 0.02);
        const finalDecayStart = time + snapCount * snapInterval;
        const decayTime = (0.1 + decay * 0.5) * decayVariation;

        // Velocity scaling for final decay
        gain.gain.setValueAtTime(velocity, finalDecayStart);
        gain.gain.exponentialRampToValueAtTime(0.001, finalDecayStart + decayTime);

        noiseSrc.start(time).stop(finalDecayStart + decayTime);

        noiseSrc.onended = () => {
            noiseSrc.dispose();
            bpf.dispose();
            gain.dispose();
        };
    }
}
