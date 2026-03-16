import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer;

    constructor(private destination: Tone.ToneAudioNode) {
        const sampleRate = Tone.getContext().sampleRate;
        const bufferSize = sampleRate * 0.5;
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        // Research says standard white noise is fine as difference from 300kHz LFSR is negligible in browser
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    trigger(time: number, pitch: number, snappy: number) {
        // Tonal Body (2 triangle oscillators)
        // Research: ~160Hz and ~220Hz
        const freq1 = 160;
        const freq2 = 220;

        const osc1 = new Tone.Oscillator(freq1 * 2, "triangle");
        const osc2 = new Tone.Oscillator(freq2 * 2, "triangle");
        const tonalGain = new Tone.Gain(0);

        osc1.connect(tonalGain);
        osc2.connect(tonalGain);
        tonalGain.connect(this.destination);

        // Pitch Envelope: Pitch sweep from 2x freq to freq in 50ms
        const drift = (Math.random() * 2 - 1) * 2;
        osc1.frequency.setValueAtTime((freq1 + drift) * 2, time);
        osc1.frequency.exponentialRampToValueAtTime(freq1 + drift, time + 0.05);
        osc2.frequency.setValueAtTime((freq2 + drift) * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq2 + drift, time + 0.05);

        // Research: Tonal decay ~0.2s
        const tonalDecay = 0.2;
        tonalGain.gain.setValueAtTime(1, time);
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + tonalDecay);

        // Snappy Layer (Noise with LPF/HPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer);
        // Research: HPF ~1000Hz
        const hpf = new Tone.Filter(1000, "highpass");
        // Research: LPF ~4000Hz - 8000Hz (controlled by tone/pitch)
        const lpfFreq = 4000 + pitch * 4000;
        const lpf = new Tone.Filter(lpfFreq, "lowpass");
        const noiseGain = new Tone.Gain(0);

        noiseSrc.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(noiseGain);
        noiseGain.connect(this.destination);

        // Research: Snappy decay ~0.3s
        const snappyDecay = 0.3;

        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay);

        osc1.start(time).stop(time + tonalDecay);
        osc2.start(time).stop(time + tonalDecay);
        noiseSrc.start(time).stop(time + snappyDecay);

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
