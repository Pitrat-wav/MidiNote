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
        const baseCutoff = 1000 + pitch * 1000;
        const driftCutoff = baseCutoff * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% drift
        const bpf = new Tone.Filter(driftCutoff, "bandpass");
        const gain = new Tone.Gain(0).connect(this.destination);

        noiseSrc.connect(bpf);
        bpf.connect(gain);

        // Triple attack "snaps"
        const snapCount = 3;
        const snapInterval = 0.01;
        for (let i = 0; i < snapCount; i++) {
            const snapTime = time + i * snapInterval;
            gain.gain.setValueAtTime(1, snapTime);
            gain.gain.exponentialRampToValueAtTime(0.1, snapTime + snapInterval * 0.8);
        }

        // Final decay
        const finalDecayStart = time + snapCount * snapInterval;
        const driftDecay = (0.1 + decay * 0.5) * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% drift
        gain.gain.setValueAtTime(1, finalDecayStart);
        gain.gain.exponentialRampToValueAtTime(0.001, finalDecayStart + driftDecay);

        noiseSrc.start(time).stop(finalDecayStart + driftDecay);

        noiseSrc.onended = () => {
            noiseSrc.dispose();
            bpf.dispose();
            gain.dispose();
        };
    }
}
