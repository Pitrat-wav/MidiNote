import * as Tone from 'tone'

export class TR808Clap {
    private noise: Tone.Noise
    private filter: Tone.BiquadFilter
    private gain: Tone.Gain

    constructor(private output: Tone.ToneAudioNode) {
        this.noise = new Tone.Noise('white').start()
        this.filter = new Tone.BiquadFilter(1000, 'bandpass')
        this.gain = new Tone.Gain(0)
        this.noise.connect(this.filter)
        this.filter.connect(this.gain)
        this.gain.connect(this.output)
    }

    trigger(time: number, velocity: number, pitch: number, decay: number) {
        const decayTime = 0.1 + decay * 0.4

        this.filter.frequency.setValueAtTime(1000 + pitch * 1000, time)

        this.gain.gain.cancelScheduledValues(time)

        // Triple attack
        const attackTimes = [0, 0.01, 0.02]
        attackTimes.forEach(at => {
            this.gain.gain.setValueAtTime(velocity, time + at)
            this.gain.gain.exponentialRampToValueAtTime(0.01, time + at + 0.005)
        })

        this.gain.gain.setValueAtTime(velocity, time + 0.03)
        this.gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03 + decayTime)
    }
}
