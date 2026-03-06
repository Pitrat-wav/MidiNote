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
        // Research: Tune range 45Hz – 55Hz
        const tune = 45 + pitch * 10;
        // Research: Amp Decay 0.3s – 0.6s
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Triangle + Soft Clipper
        // Use triangle wave as it has neccessary odd harmonics for "chest punch"
        const bodyOsc = new Tone.Oscillator(tune, "triangle");
        bodyOsc.phase = Math.random() * 360;

        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Research: Pitch Envelope start is ~4.7x base frequency (approx 200–250 Hz)
        const startFreq = tune * 4.7;
        const endFreq = tune;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // Research: Decay 0.05s – 0.15s

        // VCA Envelope: Exponential decay
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1000 Hz – 2000 Hz
        const noiseFilter = new Tone.Filter(1500, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Research: Click Env Decay 0.01s – 0.02s
        const clickDecay = 0.02;
        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        bodyOsc.start(time).stop(time + decayTime);
        noiseSrc.start(time).stop(time + clickDecay);

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
