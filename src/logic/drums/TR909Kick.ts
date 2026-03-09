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
        // pitch: 0 -> 45Hz, 1 -> 55Hz
        const tune = 45 + pitch * 10;

        // Micro-randomization
        const pitchDrift = (Math.random() * 2 - 1) * 0.1;
        const finalTune = tune + pitchDrift;

        // decay: 0 -> 0.3s, 1 -> 0.6s
        const baseDecay = 0.3 + decay * 0.3;
        const decayTime = baseDecay * (1 + (Math.random() * 0.04 - 0.02));

        // 909 Kick Core: Triangle VCO
        const bodyOsc = new Tone.Oscillator(finalTune * 4.7, "triangle");
        bodyOsc.phase = Math.random() * 360;

        const bodyGain = new Tone.Gain(0);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: tune * 4.7 -> tune
        const startFreq = finalTune * 4.7;
        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(finalTune, time + 0.1); // 100ms sweep

        // VCA Envelope
        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000 * (1 + (Math.random() * 0.04 - 0.02)), "highpass"); // Filter variance
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms)
        const clickDecay = 0.01 + Math.random() * 0.01;
        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        bodyOsc.start(time).stop(time + decayTime + 0.1);
        noiseSrc.start(time).stop(time + clickDecay + 0.05);

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
