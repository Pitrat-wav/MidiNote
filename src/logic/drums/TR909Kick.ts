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
        // According to research:
        // Tune parameter on 909 console controls Pitch Envelope decay time, not just base pitch.
        // Base frequency: 45Hz - 55Hz
        const baseFreq = 50;

        // Pitch Envelope Decay: 0.05s to 0.15s (mapped to pitch param)
        const pitchDecay = 0.05 + pitch * 0.1;

        // Amplitude Decay: 0.3s to 0.6s
        const ampDecay = 0.3 + decay * 0.3;

        // Micro-randomization
        const drift = (Math.random() * 2 - 1) * 0.5; // +/- 0.5Hz drift
        const finalAmpDecay = ampDecay * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% decay
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02); // +/- 2% filter

        // 909 Kick Body: Triangle Oscillator
        const bodyOsc = new Tone.Oscillator(baseFreq * 4.7 + drift, "triangle");
        bodyOsc.phase = Math.random() * 360;
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: Start at ~4.7x base freq (~235Hz) and drop to baseFreq
        const startFreq = baseFreq * 4.7 + drift;
        const endFreq = baseFreq + drift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + pitchDecay);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + finalAmpDecay);

        // Click Layer 1: Noise (HPF > 1kHz, 10-20ms decay)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(1000 * filterVariance, "highpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        const clickDecay = 0.02 * (1 + (Math.random() * 0.04 - 0.02));
        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        // Click Layer 2: Rectangular Pulse
        const pulseOsc = new Tone.Oscillator(baseFreq * 2, "square");
        const pulseGain = new Tone.Gain(0);
        pulseOsc.connect(pulseGain);
        pulseGain.connect(this.destination);

        pulseGain.gain.setValueAtTime(velocity * 0.4, time);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005);

        bodyOsc.start(time).stop(time + finalAmpDecay);
        noiseSrc.start(time).stop(time + clickDecay);
        pulseOsc.start(time).stop(time + 0.005);

        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            bodyGain.dispose();
            pulseOsc.dispose();
            pulseGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            noiseFilter.dispose();
            noiseGain.dispose();
        };
    }
}
