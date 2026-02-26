import * as Tone from 'tone'

export class TR909Kick {
    private bodyOsc: Tone.Oscillator
    private bodyGain: Tone.Gain
    private noise: Tone.Noise
    private noiseFilter: Tone.BiquadFilter
    private noiseGain: Tone.Gain

    constructor(private output: Tone.ToneAudioNode) {
        this.bodyOsc = new Tone.Oscillator('triangle').start()
        this.bodyGain = new Tone.Gain(0)
        this.bodyOsc.connect(this.bodyGain)
        this.bodyGain.connect(this.output)

        this.noise = new Tone.Noise('white').start()
        this.noiseFilter = new Tone.BiquadFilter(1000, 'highpass')
        this.noiseGain = new Tone.Gain(0)
        this.noise.connect(this.noiseFilter)
        this.noiseFilter.connect(this.noiseGain)
        this.noiseGain.connect(this.output)
    }

    trigger(time: number, velocity: number, pitch: number, decay: number) {
        const freq = 45 + pitch * 10
        const decayTime = 0.3 + decay * 0.3

        this.bodyOsc.frequency.cancelScheduledValues(time)
        this.bodyOsc.frequency.setValueAtTime(freq * 4.7, time)
        this.bodyOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.1)

        this.bodyGain.gain.cancelScheduledValues(time)
        this.bodyGain.gain.setValueAtTime(velocity, time)
        this.bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime)

        this.noiseGain.gain.cancelScheduledValues(time)
        this.noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        this.noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02)
    }
}
