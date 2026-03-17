import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;
    private distortionCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = (Tone.getContext().rawContext as AudioContext).createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Pre-calculate distortion curve for tanh soft clipping
        this.distortionCurve = this.makeDistortionCurve(1.5);
    }

    private makeDistortionCurve(amount: number) {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            curve[i] = Math.tanh(x * amount);
        }
        return curve;
    }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz according to research
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s according to research
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Triangle + Soft Clipper
        const bodyOsc = new Tone.Oscillator(tune * 4.7, "triangle");

        const clipper = new Tone.WaveShaper(this.distortionCurve);

        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(clipper);
        clipper.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: High start -> punch
        // Research: Start 4.7x base frequency (200-250Hz), decay 0.05 - 0.15 sec
        const startFreq = tune * 4.7;
        const endFreq = tune;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // 100ms drop

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // HPF around 1000-2000Hz
        const noiseFilter = new Tone.Filter(1500, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms)
        const clickDecay = 0.015;
        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

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
