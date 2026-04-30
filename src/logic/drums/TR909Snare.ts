import * as Tone from 'tone'
import { makeDistortionCurve, applyPitchDrift, applyVariance } from '../DrumUtils'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;
    private bodyCurve: Float32Array;

    constructor(private destination: Tone.ToneAudioNode) {
        // Soft Clipping curve from research
        this.bodyCurve = makeDistortionCurve(15);

        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // While original used LFSR, research says Math.random() is sufficient for Web Audio API context
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number, velocity: number = 0.8) {
        // 909 Snare Body: 2 triangle oscillators fixed at ~160Hz and ~220Hz
        const freq1 = 160;
        const freq2 = 220;

        // Micro-randomization using shared utilities
        const vcaDecay = applyVariance(0.2, 0.02);
        const snappyDecayBase = 0.1 + snappy * 0.4;
        const snappyDecay = applyVariance(snappyDecayBase, 0.02);
        const noiseHPFFreq = applyVariance(1000, 0.02);
        const toneDrift1 = applyPitchDrift(freq1, 1.0);
        const toneDrift2 = applyPitchDrift(freq2, 1.0);

        const osc1 = new Tone.Oscillator(toneDrift1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(toneDrift2 * 2, "triangle");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;
        // Routing with gain compensation to prevent clipping before the shaper
        const preShaperGain = new Tone.Gain(0.5);
        const bodyShaper = new Tone.WaveShaper(this.bodyCurve);
        bodyShaper.oversample = '4x';
        const postShaperGain = new Tone.Gain(2.0);
        const tonalGain = new Tone.Gain(0);

        osc1.connect(preShaperGain);
        osc2.connect(preShaperGain);
        preShaperGain.connect(bodyShaper);
        bodyShaper.connect(postShaperGain);
        postShaperGain.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch Sweep: ~320Hz to ~160Hz over 30ms (as per research spec)
        const sweepTime = 0.03;
        const startFreq1 = toneDrift1 * 2;
        const startFreq2 = toneDrift2 * 2;

        osc1.frequency.setValueAtTime(startFreq1, time);
        osc1.frequency.exponentialRampToValueAtTime(toneDrift1, time + sweepTime);
        osc2.frequency.setValueAtTime(startFreq2, time);
        osc2.frequency.exponentialRampToValueAtTime(toneDrift2, time + sweepTime);

        tonalGain.gain.setValueAtTime(velocity, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(noiseHPFFreq, "highpass"); // HPF to protect fundamental
        // LPF controlled by 'Tone' (pitch parameter here), range 4kHz to 8kHz (research: toneCutoff)
        const toneCutoff = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(applyVariance(toneCutoff, 0.02), "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + vcaDecay);
        osc2.start(time).stop(time + vcaDecay);
        noiseSrc.start(time).stop(time + snappyDecay + 0.1);

        osc1.onstop = () => {
            osc1.dispose();
            osc2.dispose();
            preShaperGain.dispose();
            bodyShaper.dispose();
            postShaperGain.dispose();
            tonalGain.dispose();
        };
        noiseSrc.onended = () => {
            noiseSrc.dispose();
            hpf.dispose();
            lpf.dispose();
            noiseGain.dispose();
        };
    }
}
