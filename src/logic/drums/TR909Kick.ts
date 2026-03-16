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
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz according to research
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s according to research
        const decayTime = 0.3 + decay * 0.3;

        // 909 Kick Core: Distorted Triangle wave
        const bodyOsc = new Tone.Oscillator(tune, "triangle");
        bodyOsc.phase = Math.random() * 360;

        // Custom Soft Clipper WaveShaper for "analog" saturation
        const clipper = new Tone.WaveShaper((val) => {
            return Math.tanh(val * 1.5);
        });

        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(clipper);
        clipper.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Micro-randomization: Pitch Drift
        const drift = (Math.random() * 2 - 1) * 1.0;

        // Aggressive Pitch Envelope: Start high (~4.7x tune) -> chest punch
        // Research: 200Hz - 250Hz start
        const startFreq = tune * 4.7 + drift;
        const endFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // 100ms drop

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // HPF to isolate click and avoid phase issues with body
        const hpfFreq = 1000 + Math.random() * 1000; // 1kHz - 2kHz range
        const noiseFilter = new Tone.Filter(hpfFreq, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms)
        const clickDecay = 0.01 + Math.random() * 0.01;
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
