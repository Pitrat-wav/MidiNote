import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;
    private bodyCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        // Soft Clipping curve from research
        this.bodyCurve = this.makeDistortionCurve(15);

        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // While original used LFSR, research says Math.random() is sufficient for Web Audio API context
        for (let i = 0; i < data.length; i++) {
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

    trigger(time: number, pitch: number, snappy: number, velocity: number = 0.8) {
        // 909 Snare Body: 2 triangle oscillators fixed at ~160Hz and ~220Hz
        const freq1 = 160;
        const freq2 = 220;

        // Micro-randomization
        const drift = (Math.random() * 2 - 1) * 1.0; // +/- 1Hz drift
        const vcaDecay = 0.2 * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% decay
        const snappyDecayBase = 0.1 + snappy * 0.4;
        const snappyDecay = snappyDecayBase * (1 + (Math.random() * 0.04 - 0.02));
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02);

        const osc1 = new Tone.Oscillator(freq1 * 2 + drift, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2 + drift, "triangle");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;
        // Routing with gain compensation to prevent clipping before the shaper
        const preShaperGain = new Tone.Gain(0.5);
        const bodyShaper = new Tone.WaveShaper(this.bodyCurve);
        bodyShaper.oversample = '4x';
        const postShaperGain = new Tone.Gain(2.0);
        const tonalGain = new Tone.Gain(0);

        osc1.connect(preShaperGain);
        osc2.connect(preShaperGain);
        preShaperGain.connect(bodyShaper);
        bodyShaper.connect(postShaperGain);
        postShaperGain.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch Sweep: ~300Hz to ~160Hz over 30ms (as per research)
        const sweepTime = 0.03;
        const startFreq1 = 300 + drift;
        const startFreq2 = 330 + drift;

        osc1.frequency.setValueAtTime(startFreq1, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1 + drift, time + sweepTime);
        osc2.frequency.setValueAtTime(startFreq2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2 + drift, time + sweepTime);

        tonalGain.gain.setValueAtTime(velocity, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000 * filterVariance, "highpass"); // HPF to protect fundamental
        // LPF controlled by 'Tone' (pitch parameter here), range 4kHz to 8kHz
        const lpf = new Tone.Filter((4000 + pitch * 4000) * filterVariance, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + vcaDecay);
        osc2.start(time).stop(time + vcaDecay);
        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            preShaperGain.dispose();
            bodyShaper.dispose();
            postShaperGain.dispose();
            tonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            noiseGain.dispose();
        };
    }
}
