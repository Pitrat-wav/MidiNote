import * as Tone from 'tone'
import { WhiteNoise } from './WhiteNoise'

export class TR808Snare {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        const toneBalance = pitch // Use pitch as tone balance [0, 1]
        const snappyDecay = 0.1 + decay * 0.4 // 0.1s - 0.5s

        // Tonal Body
        const oscLow = new Tone.Oscillator(238, 'sine')
        const oscHigh = new Tone.Oscillator(476, 'sine')
        const gainLow = new Tone.Gain(1 - toneBalance)
        const gainHigh = new Tone.Gain(toneBalance)
        const tonalEnv = new Tone.Gain(velocity).connect(this.destination)

        oscLow.connect(gainLow).connect(tonalEnv)
        oscHigh.connect(gainHigh).connect(tonalEnv)

        tonalEnv.gain.setValueAtTime(velocity, time)
        tonalEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        // Snappy
        const noiseBuf = WhiteNoise.getBuffer(Tone.context.rawContext as AudioContext)
        const noiseSrc = new Tone.BufferSource(noiseBuf)
        const noiseFilter = new Tone.Filter(1800, 'highpass')
        const snappyEnv = new Tone.Gain(velocity * 0.8).connect(this.destination)

        noiseSrc.connect(noiseFilter).connect(snappyEnv)

        snappyEnv.gain.setValueAtTime(velocity * 0.8, time)
        snappyEnv.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)

        oscLow.start(time)
        oscHigh.start(time)
        noiseSrc.start(time)

        const totalDecay = Math.max(0.2, snappyDecay)
        oscLow.stop(time + 0.2)
        oscHigh.stop(time + 0.2)
        noiseSrc.stop(time + totalDecay)

        noiseSrc.onended = () => {
            oscLow.dispose()
            oscHigh.dispose()
            gainLow.dispose()
            gainHigh.dispose()
            tonalEnv.dispose()
            noiseSrc.dispose()
            noiseFilter.dispose()
            snappyEnv.dispose()
        }
    }
}
