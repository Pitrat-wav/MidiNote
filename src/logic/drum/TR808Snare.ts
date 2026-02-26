import * as Tone from 'tone'

export class TR808Snare {
    private voices: {
        oscLow: Tone.Oscillator,
        oscHigh: Tone.Oscillator,
        tonalGain: Tone.Gain,
        noise: Tone.Noise,
        noiseFilter: Tone.BiquadFilter,
        snappyGain: Tone.Gain
    }[] = []
    private nextVoice = 0

    constructor(private output: Tone.ToneAudioNode) {
        for (let i = 0; i < 2; i++) {
            const oscLow = new Tone.Oscillator(238, 'sine').start()
            const oscHigh = new Tone.Oscillator(476, 'sine').start()
            const tonalGain = new Tone.Gain(0)
            const noise = new Tone.Noise('white').start()
            const noiseFilter = new Tone.BiquadFilter(1800, 'highpass')
            const snappyGain = new Tone.Gain(0)

            oscLow.connect(tonalGain)
            oscHigh.connect(tonalGain)
            tonalGain.connect(this.output)

            noise.connect(noiseFilter)
            noiseFilter.connect(snappyGain)
            snappyGain.connect(this.output)

            this.voices.push({ oscLow, oscHigh, tonalGain, noise, noiseFilter, snappyGain })
        }
    }

    trigger(time: number, velocity: number, pitch: number, decay: number) {
        const v = this.voices[this.nextVoice]
        this.nextVoice = (this.nextVoice + 1) % this.voices.length

        const freqLow = 238 * (0.5 + pitch)
        const freqHigh = 476 * (0.5 + pitch)
        const snappyDecay = 0.1 + decay * 0.3

        v.oscLow.frequency.setValueAtTime(freqLow, time)
        v.oscHigh.frequency.setValueAtTime(freqHigh, time)

        v.tonalGain.gain.cancelScheduledValues(time)
        v.tonalGain.gain.setValueAtTime(velocity, time)
        v.tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        v.snappyGain.gain.cancelScheduledValues(time)
        v.snappyGain.gain.setValueAtTime(velocity * 0.8, time)
        v.snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)
    }
}
