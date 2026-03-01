import * as Tone from 'tone';

export class TR909Kick {
    private output: Tone.ToneAudioNode;
    private noiseBuffer: AudioBuffer;

    constructor(output: Tone.ToneAudioNode) {
        this.output = output;

        // Generate a short white noise buffer for the click once
        const bufferSize = Tone.getContext().sampleRate * 0.05;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, tune: number, decay: number, velocity: number = 0.8) {
        // --- Body Layer (Triangle VCO) ---
        const bodyOsc = new Tone.Oscillator('triangle');
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.output);

        // Pitch Envelope: Strong "chest punch"
        const startFreq = tune * 4.7;
        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(tune, time + 0.1);

        // Amplitude Envelope
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        bodyOsc.start(time).stop(time + decay);

        // --- Click Layer (Filtered Noise) ---
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter({
            type: 'highpass',
            frequency: 1000
        });
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.output);

        // Fast click envelope (10-20ms)
        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        noiseSrc.start(time).stop(time + 0.03);

        // Cleanup
        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            bodyGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            noiseGain.dispose();
        };
    }
}
