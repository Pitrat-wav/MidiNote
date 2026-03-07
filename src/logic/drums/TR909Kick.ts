import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        // Research: Click buffer size (50ms)
        const bufferSize = sampleRate * 0.05;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, decay: number) {
        // Research: Base frequency (Tune) 45 Hz – 55 Hz
        const tune = 45 + pitch * 10;
        // Research: Amplitude Decay 0.3 sec – 0.6 sec
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Distorted Triangle wave
        const bodyOsc = new Tone.Oscillator(tune, "triangle");

        // Custom Soft Clipper for body (as described in 909 section)
        const clipper = new Tone.WaveShaper((val) => Math.tanh(val * 1.5));
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(clipper);
        clipper.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Research: Pitch Envelope start is ~4.7x base freq
        const startFreq = tune * 4.7;

        // Analog drift: slight pitch variation
        const drift = (Math.random() * 2 - 1) * 0.5;
        const targetFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq + drift, time);
        // Research: Pitch Decay 0.05s - 0.15s. We'll use 0.1s as standard.
        bodyOsc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.1);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1000-2000Hz (we'll use 1500Hz)
        const noiseFilter = new Tone.Filter(1500, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Research: Click decay 10-20ms (0.02s)
        const clickDecay = 0.02;
        noiseGain.gain.setValueAtTime(0.8, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        // Lifecycle management
        bodyOsc.start(time).stop(time + decayTime);
        noiseSrc.start(time).stop(time + clickDecay);

        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            clipper.dispose();
            bodyGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            noiseGain.dispose();
        };
    }
}
