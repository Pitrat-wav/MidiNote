import * as Tone from 'tone'

export class TR808Clap {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        this.noiseBuffer = Tone.getContext().createBuffer(1, sampleRate * 0.5, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    trigger(time: number, pitch: number, decay: number) {
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // BPF cutoff micro-randomization (+/- 2%)
        const cutoff = (1000 + pitch * 1000) * (1 + (Math.random() * 0.04 - 0.02));
        const bpf = new Tone.Filter(cutoff, "bandpass");
        const gain = new Tone.Gain(0).connect(this.destination);

        noiseSrc.connect(bpf);
        bpf.connect(gain);

        // Triple attack "snaps" (+/- 2ms interval randomization)
        const snapCount = 3;
        const baseSnapInterval = 0.01;
        for (let i = 0; i < snapCount; i++) {
            const snapInterval = baseSnapInterval * (1 + (Math.random() * 0.4 - 0.2)); // up to 2ms variation
            const snapTime = time + i * snapInterval;
            gain.gain.setValueAtTime(1, snapTime);
            gain.gain.exponentialRampToValueAtTime(0.1, snapTime + snapInterval * 0.8);
        }

        // Final decay (+/- 2% variance)
        const finalDecayStart = time + snapCount * baseSnapInterval;
        const decayTime = (0.1 + decay * 0.5) * (1 + (Math.random() * 0.04 - 0.02));
        gain.gain.setValueAtTime(1, finalDecayStart);
        gain.gain.exponentialRampToValueAtTime(0.001, finalDecayStart + decayTime);

        noiseSrc.start(time).stop(finalDecayStart + decayTime);

        noiseSrc.onended = () => {
            noiseSrc.dispose();
            bpf.dispose();
            gain.dispose();
        };
    }
}
