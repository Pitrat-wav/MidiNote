import * as Tone from 'tone'
import { makeDistortionCurve, applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR909Kick {
    private noiseBuffer: AudioBuffer;
    private bodyCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        // Soft Clipping curve from research
        this.bodyCurve = makeDistortionCurve(10);

        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.05; // 50ms click
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        // 909 Kick base frequency is fixed around 50Hz
        const tune = 50;
        // The 'Pitch' parameter on 909 maps to the frequency sweep duration
        // Range: 0.05s to 0.15s
        const sweepDuration = 0.05 + pitch * 0.1;
        // decay: 0.5 -> 0.45s, maps to 0.3-0.6s
        const decayTime = 0.3 + decay * 0.3;

        // Micro-randomization using shared utilities
        const tuneDrift = applyPitchDrift(tune, 0.5);
        const vcaDecay = applyVariance(decayTime, 0.02);
        const noiseFilterFreq = applyVariance(1000, 0.02);

        // 909 Kick Body: Triangle Oscillator with saturation and Low-Pass smoothing
        const bodyOsc = new Tone.Oscillator(tuneDrift * 4.7, "triangle");
        bodyOsc.phase = Math.random() * 360;
        const bodyShaper = new Tone.WaveShaper(this.bodyCurve);
        bodyShaper.oversample = '4x';
        const bodyFilter = new Tone.Filter(1000, "lowpass");
        const bodyGain = new Tone.Gain(0);

        bodyOsc.connect(bodyShaper);
        bodyShaper.connect(bodyFilter);
        bodyFilter.connect(bodyGain);
        bodyGain.connect(this.destination);

        // Aggressive Pitch Envelope: Start at Tune * 4.7 (~235Hz) and drop over sweepDuration
        const startFreq = tuneDrift * 4.7;
        const endFreq = tuneDrift;

        bodyOsc.frequency.setValueAtTime(startFreq, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, time + sweepDuration);

        // VCA Envelope
        bodyGain.gain.setValueAtTime(velocity, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        // Click Layer (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const noiseFilter = new Tone.Filter(noiseFilterFreq, "highpass"); // HPF > 1kHz to avoid phase trap
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Ultra short envelope (10-20ms) for the click
        const clickDecay = applyVariance(0.02, 0.02);
        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        // Rectangular Pulse Click: Short 5ms impulse for attack articulation
        const pulseOsc = new Tone.Oscillator(100, "square"); // Research: 100Hz square wave pulse
        const pulseGain = new Tone.Gain(0);
        pulseOsc.connect(pulseGain);
        pulseGain.connect(this.destination);

        pulseGain.gain.setValueAtTime(velocity * 0.5, time);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005);

        bodyOsc.start(time).stop(time + vcaDecay);
        noiseSrc.start(time).stop(time + clickDecay);
        pulseOsc.start(time).stop(time + 0.005);

        bodyOsc.onstop = () => {
            bodyOsc.dispose();
            bodyShaper.dispose();
            bodyFilter.dispose();
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
