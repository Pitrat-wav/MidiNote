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

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch: 0.5 -> 50Hz, maps to 45-55Hz
        const tune = 45 + pitch * 10;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s
        const baseDecay = 0.3 + decay * 0.3;

        // Micro-randomization: Decay Time (+/- 2%)
        const decayTime = baseDecay * (1 + (Math.random() * 0.04 - 0.02));

        // 909 Kick Body: Triangle Oscillator
        // Analog phase randomization
        const bodyOsc = new Tone.Oscillator(tune * 4.7, "triangle");
        bodyOsc.phase = Math.random() * 360;
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Micro-randomization: Pitch Drift (+/- 0.5Hz)
        const drift = (Math.random() * 2 - 1) * 0.5;

        // Aggressive Pitch Envelope: Start at Tune * 4.7 (~235Hz) and drop over 100ms
        const startFreq = (tune * 4.7) + drift;
        const endFreq = tune + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1);

        // VCA Envelope with velocity scaling
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);

        // Micro-randomization: Filter Cutoff (+/- 2%)
        const filterFreq = 1000 * (1 + (Math.random() * 0.04 - 0.02));
        const noiseFilter = new Tone.Filter(filterFreq, "highpass"); // HPF > 1kHz to avoid phase trap
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms) for the click, with randomization
        const clickDecay = 0.02 * (1 + (Math.random() * 0.04 - 0.02));
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
