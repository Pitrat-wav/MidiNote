import * as Tone from 'tone';

export class TR808Clap {
    private output: Tone.ToneAudioNode;
    private noiseBuffer: AudioBuffer;

    constructor(output: Tone.ToneAudioNode) {
        this.output = output;

        const bufferSize = Tone.getContext().sampleRate * 1;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, decay: number, velocity: number = 0.8) {
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer);
        const bandpass = new Tone.Filter(1000, 'bandpass');
        const gain = new Tone.Gain(0);

        noiseSrc.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.output);

        // Triple attack "snap"
        const attackTime = 0.01;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(velocity, time + 0.002);
        gain.gain.linearRampToValueAtTime(0, time + 0.005);

        gain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.007);
        gain.gain.linearRampToValueAtTime(0, time + 0.01);

        gain.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.012);
        gain.gain.linearRampToValueAtTime(0, time + 0.015);

        // Final long decay
        gain.gain.linearRampToValueAtTime(velocity, time + 0.017);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        noiseSrc.start(time).stop(time + decay + 0.1);

        noiseSrc.onended = () => {
            noiseSrc.dispose();
            bandpass.dispose();
            gain.dispose();
        };
    }
}
