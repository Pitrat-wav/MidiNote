import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click buffer
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, decay: number) {
        // pitch: 0.0 -> 1.0, maps to 45Hz-55Hz
        const tune = 45 + pitch * 10;
        // decay: 0.0 -> 1.0, maps to 0.3s-0.6s
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Body: Distorted Triangle wave
        const bodyOsc = new Tone.Oscillator(tune, "triangle");
        bodyOsc.phase = Math.random() * 360;
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Micro-randomization
        const drift = (Math.random() * 2 - 1);

        // Pitch Envelope: 4.7x base freq sweep over 100ms
        const startFreq = (tune * 4.7) + drift;
        const endFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // 100ms sweep

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000 + (Math.random() * 200 - 100), "highpass"); // HPF > 1kHz
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Short click envelope (10-20ms)
        const clickDecay = 0.01 + Math.random() * 0.01;
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
