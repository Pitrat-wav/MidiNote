import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = (Tone.getContext().rawContext as AudioContext).createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz
        const tune = 45 + pitch * 10;

        // Micro-randomization on filter and decay (+/- 2%)
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02);
        const decayVariance = 1 + (Math.random() * 0.04 - 0.02);

        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s
        const decayTime = (0.3 + decay * 0.3) * decayVariance;

        // 909 Kick Body: Triangle Oscillator
        const bodyOsc = new Tone.Oscillator(tune * 4.7, "triangle");
        bodyOsc.phase = Math.random() * 360; // Analog phase randomization
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: Start at Tune * 4.7 (~235Hz) and drop over 100ms
        const drift = (Math.random() * 2 - 1) * 0.5; // Pitch Drift (+/- 0.5Hz)
        const startFreq = tune * 4.7 + drift;
        const endFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000 * filterVariance, "highpass"); // HPF > 1kHz to avoid phase trap
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms) for the click
        const clickDecay = 0.02 * decayVariance;
        noiseGain.gain.setValueAtTime(0.7 * velocity, time);
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
