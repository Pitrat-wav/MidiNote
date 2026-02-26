import * as Tone from 'tone'

export class TR909Snare {
    private voices: {
        osc1: Tone.Oscillator,
        osc2: Tone.Oscillator,
        tonalGain: Tone.Gain,
        noise: Tone.Noise,
        hpf: Tone.BiquadFilter,
        lpf: Tone.BiquadFilter,
        noiseGain: Tone.Gain
    }[] = []
    private nextVoice = 0

    constructor(private output: Tone.ToneAudioNode) {
        for (let i = 0; i < 2; i++) {
            const osc1 = new Tone.Oscillator(160, 'triangle').start()
            const osc2 = new Tone.Oscillator(220, 'triangle').start()
            const tonalGain = new Tone.Gain(0)
            const noise = new Tone.Noise('white').start()
            const hpf = new Tone.BiquadFilter(1000, 'highpass')
            const lpf = new Tone.BiquadFilter(5000, 'lowpass')
            const noiseGain = new Tone.Gain(0)

            osc1.connect(tonalGain)
            osc2.connect(tonalGain)
            tonalGain.connect(this.output)

            noise.connect(hpf)
            hpf.connect(lpf)
            lpf.connect(noiseGain)
            noiseGain.connect(this.output)

            this.voices.push({ osc1, osc2, tonalGain, noise, hpf, lpf, noiseGain })
        }
    }

    trigger(time: number, velocity: number, pitch: number, decay: number) {
        const v = this.voices[this.nextVoice]
        this.nextVoice = (this.nextVoice + 1) % this.voices.length

        const freq1 = 160 * (0.5 + pitch)
        const freq2 = 220 * (0.5 + pitch)
        const snappyDecay = 0.1 + decay * 0.4

        v.osc1.frequency.cancelScheduledValues(time)
        v.osc1.frequency.setValueAtTime(freq1 * 2, time)
        v.osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05)

        v.osc2.frequency.cancelScheduledValues(time)
        v.osc2.frequency.setValueAtTime(freq2 * 2, time)
        v.osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05)

        v.tonalGain.gain.cancelScheduledValues(time)
        v.tonalGain.gain.setValueAtTime(velocity, time)
        v.tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        v.lpf.frequency.setValueAtTime(5000 + pitch * 3000, time)

        v.noiseGain.gain.cancelScheduledValues(time)
        v.noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        v.noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)
    }
}
