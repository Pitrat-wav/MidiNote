import * as Tone from 'tone'

export class TR808Kick {
    private osc: Tone.Oscillator
    private gain: Tone.Gain

    constructor(private output: Tone.ToneAudioNode) {
        this.osc = new Tone.Oscillator('sine').start()
        this.gain = new Tone.Gain(0)
        this.osc.connect(this.gain)
        this.gain.connect(this.output)
    }

    trigger(time: number, velocity: number, pitch: number, decay: number) {
        const freq = 45 + pitch * 15
        const decayTime = 0.4 + decay * 2.6

        this.osc.frequency.cancelScheduledValues(time)
        this.osc.frequency.setValueAtTime(freq * 2.5, time)
        this.osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05)

        this.gain.gain.cancelScheduledValues(time)
        this.gain.gain.setValueAtTime(velocity, time)
        this.gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    }
}
