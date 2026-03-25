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
        // Micro-randomization: Filter Cutoff Variance (+/- 2%)
        const bpfBaseFreq = 1000 + pitch * 1000;
        const bpfFreq = bpfBaseFreq * (1 + (Math.random() * 0.04 - 0.02));
        const bpf = new Tone.Filter(bpfFreq, "bandpass");
        const gain = new Tone.Gain(0).connect(this.destination);

        noiseSrc.connect(bpf);
        bpf.connect(gain);

        // Triple attack "snaps"
        const snapCount = 3;
        const snapIntervalBase = 0.01;
        let lastSnapTime = time;
        for (let i = 0; i < snapCount; i++) {
            // Micro-randomization: Snap interval variance (+/- 2%)
            const snapInterval = snapIntervalBase * (1 + (Math.random() * 0.04 - 0.02));
            const snapTime = time + i * snapInterval;
            gain.gain.setValueAtTime(1, snapTime);
            gain.gain.exponentialRampToValueAtTime(0.1, snapTime + snapInterval * 0.8);
            lastSnapTime = snapTime + snapInterval;
        }

        // Final decay
        const finalDecayStart = lastSnapTime;
        const decayBase = 0.1 + decay * 0.5;
        // Micro-randomization: +/- 2% decay time variance
        const decayTime = decayBase * (1 + (Math.random() * 0.04 - 0.02));
        gain.gain.setValueAtTime(1, finalDecayStart);
        gain.gain.exponentialRampToValueAtTime(0.001, finalDecayStart + decayTime);

        const totalTime = (finalDecayStart + decayTime) - time;
        noiseSrc.start(time).stop(finalDecayStart + decayTime);

        // Cleanup noise nodes
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            bpf.dispose();
            gain.dispose();
        };
    }
}
