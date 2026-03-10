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
        // Research: Tune 45Hz - 55Hz
        const tune = 45 + pitch * 10;

        // Micro-randomization: Pitch Drift (+/- 1Hz)
        const drift = (Math.random() * 2 - 1);
        const tunedFreq = tune + drift;

        // Research: Decay 0.3s - 0.6s
        // Apply micro-randomization to decay (+/- 2%)
        const baseDecayTime = 0.3 + decay * 0.3;
        const decayTime = baseDecayTime * (1 + (Math.random() * 0.04 - 0.02));

        // 909 Kick Core: Triangle + Soft Clipper
        const bodyOsc = new Tone.Oscillator(tunedFreq, "triangle");

        // Custom Soft Clipper WaveShaper
        const clipper = new Tone.WaveShaper((val) => {
            return Math.tanh(val * 1.5);
        });

        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(clipper);
        clipper.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Research: Pitch Envelope: Start at tune * 4.7 and drop to tune over 0.1s
        const startFreq = tunedFreq * 4.7;
        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(tunedFreq, time + 0.1);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Research: Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1500Hz
        const noiseFilter = new Tone.Filter(1500 * (1 + (Math.random() * 0.04 - 0.02)), "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Research: 20ms click decay
        const clickDecay = 0.02;
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
