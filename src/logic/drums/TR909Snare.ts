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

    trigger(time: number, pitch: number, snappy: number) {
        // 909 Snare Body: 2 triangle oscillators fixed at ~160Hz and ~220Hz
        const freq1 = 160;
        const freq2 = 220;

        // Micro-randomization: Pitch Drift (+/- 1Hz)
        const drift1 = (Math.random() * 2 - 1) * 1;
        const drift2 = (Math.random() * 2 - 1) * 1;

        const osc1 = new Tone.Oscillator((freq1 + drift1) * 2, "triangle");
        const osc2 = new Tone.Oscillator((freq2 + drift2) * 2, "triangle");
        osc1.phase = Math.random() * 360; // Analog phase randomization
        osc2.phase = Math.random() * 360;
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // 2x Pitch Sweep over 30ms (Tweak from 50ms as per research)
        const sweepTime = 0.03;
        osc1.frequency.setValueAtTime((freq1 + drift1) * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1 + drift1, time + sweepTime);
        osc2.frequency.setValueAtTime((freq2 + drift2) * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2 + drift2, time + sweepTime);

        tonalGain.gain.setValueAtTime(1, time);
        // Micro-randomization: Tonal Decay (+/- 2%)
        const tonalDecay = 0.2 * (1 + (Math.random() * 0.04 - 0.02));
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + tonalDecay);

        // Snappy Layer
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Micro-randomization: Filter Cutoff (+/- 2%)
        const hpfCutoff = 1000 * (1 + (Math.random() * 0.04 - 0.02));
        const lpfCutoff = (4000 + pitch * 4000) * (1 + (Math.random() * 0.04 - 0.02));

        const hpf = new Tone.Filter(hpfCutoff, "highpass"); // HPF to protect fundamental
        // LPF controlled by 'Tone' (pitch parameter here), range 4kHz to 8kHz
        const lpf = new Tone.Filter(lpfCutoff, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Micro-randomization: Snappy Decay (+/- 2%)
        const snappyDecay = (0.1 + snappy * 0.4) * (1 + (Math.random() * 0.04 - 0.02));

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + tonalDecay);
        osc2.start(time).stop(time + tonalDecay);
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
