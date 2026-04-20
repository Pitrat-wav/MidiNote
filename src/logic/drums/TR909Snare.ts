import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
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

        // Micro-randomization
        const drift = (Math.random() * 2 - 1) * 1.0; // +/- 1Hz drift
        const vcaDecay = 0.2 * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2% decay
        const snappyDecayBase = 0.1 + snappy * 0.4;
        const snappyDecay = snappyDecayBase * (1 + (Math.random() * 0.04 - 0.02));
        const filterVariance = 1 + (Math.random() * 0.04 - 0.02);

        const osc1 = new Tone.Oscillator(freq1 * 2 + drift, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2 + drift, "triangle");
        osc1.phase = Math.random() * 360;
        osc2.phase = Math.random() * 360;
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // 2x Pitch Sweep over 30ms (research says ~30ms for 909 Snare)
        const sweepTime = 0.03;
        osc1.frequency.setValueAtTime(freq1 * 2 + drift, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1 + drift, time + sweepTime);
        osc2.frequency.setValueAtTime(freq2 * 2 + drift, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2 + drift, time + sweepTime);

        tonalGain.gain.setValueAtTime(velocity, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + vcaDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        const hpf = new Tone.Filter(1000 * filterVariance, "highpass"); // HPF to protect fundamental
        // LPF controlled by 'Tone' (pitch parameter here), range 4kHz to 8kHz
        const lpf = new Tone.Filter((4000 + pitch * 4000) * filterVariance, "lowpass");
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
