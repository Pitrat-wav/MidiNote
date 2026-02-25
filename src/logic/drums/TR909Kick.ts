import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 50Hz, maps to 45-65Hz
        const tune = 45 + pitch * 20;
        // decay: 0.5 -> 0.45s, maps to 0.2-0.7s
        const decayTime = 0.2 + decay * 0.5;

        // Body Layer
        const bodyOsc = new Tone.Oscillator(tune * 4.7, "triangle");
        const bodyGain = new Tone.Gain(0);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        bodyOsc.frequency.setValueAtTime(tune * 4.7, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(tune, time + 0.1);

        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(2000, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        noiseGain.gain.setValueAtTime(0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        bodyOsc.start(time).stop(time + decayTime);
        noiseSrc.start(time).stop(time + 0.02);

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
