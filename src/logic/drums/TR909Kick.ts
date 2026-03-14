import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;
    private distortionCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Pre-calculate the soft clipping curve once
        this.distortionCurve = this.makeDistortionCurve(15);
    }

    private makeDistortionCurve(amount: number) {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const k = amount;
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            // Use the tanh approximation from the report if preferred, or just Math.tanh
            // Let's use the one from the report to be faithful
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz per report
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s per report
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Triangle + Soft Clipper
        const bodyOsc = new Tone.Oscillator(tune * 4.7, "triangle");
        const clipper = new Tone.WaveShaper(this.distortionCurve);
        const bodyGain = new Tone.Gain(0);

        bodyOsc.chain(clipper, bodyGain, this.destination);

        const startFreq = tune * 4.7;
        const endFreq = tune;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1);

        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        const clickDecay = 0.02;
        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        bodyOsc.start(time).stop(time + decayTime);
        noiseSrc.start(time).stop(time + clickDecay);

        // Coordination: Dispose everything after the longest component finishes
        // bodyOsc decay is longer than noiseSrc decay
        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            clipper.dispose();
            bodyGain.dispose();
            // Since noiseSrc is shorter, it might be gone, but we still need to clean it up
            // if we didn't handle its onended separately.
        };

        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            noiseGain.dispose();
        };
    }
}
