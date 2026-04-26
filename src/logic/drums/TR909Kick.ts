import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;
    private bodyCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        // Soft Clipping curve from research
        this.bodyCurve = this.makeDistortionCurve(10);

        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    private makeDistortionCurve(amount: number) {
        const k = amount;
        const n_samples = 4096;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s
        const decayTime = 0.3 + decay * 0.3;

        // Micro-randomization
        const drift = (Math.random() * 2 - 1) * 0.5; // +/- 0.5Hz drift
        const vcaDecay = decayTime * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% decay
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02); // +/- 2% filter

        // 909 Kick Body: Triangle Oscillator with saturation and Low-Pass smoothing
        const bodyOsc = new Tone.Oscillator(tune * 4.7 + drift, "triangle");
        bodyOsc.phase = Math.random() * 360;
        const bodyShaper = new Tone.WaveShaper(this.bodyCurve);
        bodyShaper.oversample = '4x';
        const bodyFilter = new Tone.Filter(1000, "lowpass");
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyShaper);
        bodyShaper.connect(bodyFilter);
        bodyFilter.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: Start at Tune * 4.7 (~235Hz) and drop over 100ms
        const startFreq = tune * 4.7 + drift;
        const endFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000 * filterVariance, "highpass"); // HPF > 1kHz to avoid phase trap
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms) for the click
        const clickDecay = 0.02 * (1 + (Math.random() * 0.04 - 0.02));
        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        // Rectangular Pulse Click: Short 5ms impulse for attack articulation
        const pulseOsc = new Tone.Oscillator(0, "square");
        const pulseGain = new Tone.Gain(0);
        pulseOsc.connect(pulseGain);
        pulseGain.connect(this.destination);

        pulseGain.gain.setValueAtTime(velocity * 0.5, time);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005);

        bodyOsc.start(time).stop(time + vcaDecay);
        noiseSrc.start(time).stop(time + clickDecay);
        pulseOsc.start(time).stop(time + 0.005);

        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            bodyShaper.dispose();
            bodyFilter.dispose();
            bodyGain.dispose();
            pulseOsc.dispose();
            pulseGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            noiseGain.dispose();
        };
    }
}
