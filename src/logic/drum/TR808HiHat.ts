import * as Tone from 'tone'

export class TR808HiHat {
    private oscillators: Tone.Oscillator[]
    private mixGain: Tone.Gain
    private bpf1: Tone.BiquadFilter
    private bpf2: Tone.BiquadFilter
    private hpf: Tone.BiquadFilter
    private envGain: Tone.Gain

    constructor(private output: Tone.ToneAudioNode) {
        this.mixGain = new Tone.Gain(0.15)
        this.oscillators = [205.3, 304.4, 369.6, 522.7, 800, 540].map(freq => {
            return new Tone.Oscillator(freq, 'square').start().connect(this.mixGain)
        })
        this.bpf1 = new Tone.BiquadFilter(3440, 'bandpass')
        this.bpf2 = new Tone.BiquadFilter(7100, 'bandpass')
        this.hpf = new Tone.BiquadFilter(7000, 'highpass')
        this.envGain = new Tone.Gain(0)

        this.mixGain.connect(this.bpf1)
        this.mixGain.connect(this.bpf2)
        this.bpf1.connect(this.envGain)
        this.bpf2.connect(this.envGain)
        this.envGain.connect(this.hpf)
        this.hpf.connect(this.output)
    }

    trigger(time: number, velocity: number, pitch: number, decay: number, isOpen: boolean = false) {
        const decayTime = isOpen ? (0.2 + decay * 0.6) : (0.03 + decay * 0.07)

        // Update frequencies with slight analog drift
        const baseFreqs = [205.3, 304.4, 369.6, 522.7, 800, 540]
        this.oscillators.forEach((osc, i) => {
            const drift = (Math.random() - 0.5) * 4
            osc.frequency.setValueAtTime(baseFreqs[i] * (0.5 + pitch) + drift, time)
        })

        this.envGain.gain.cancelScheduledValues(time)
        this.envGain.gain.setValueAtTime(velocity, time)
        this.envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    }
}
