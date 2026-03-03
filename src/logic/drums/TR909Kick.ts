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
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Triangle + Soft Clipper
        const bodyOsc = new Tone.Oscillator(230, "triangle");

        // Custom Soft Clipper WaveShaper
        const clipper = new Tone.WaveShaper((val) => {
            // Hyperbolic tangent (tanh) soft clipping
            return Math.tanh(val * 1.5);
        });

        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(clipper);
        clipper.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: High start -> punch (tune * 4.7)
        const startFreq = tune * 4.7;
        const endFreq = tune;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // 100ms sweep

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1500, "highpass"); // HPF > 1.5kHz
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms)
        const clickDecay = 0.015;
        noiseGain.gain.setValueAtTime(0.8, time);
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
