import * as Tone from 'tone'

export class TR808Snare {
    private destination: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(destination: Tone.ToneAudioNode) {
        this.destination = destination

        const rawContext = Tone.context.rawContext as AudioContext
        const bufferSize = rawContext.sampleRate * 0.5
        this.noiseBuffer = rawContext.createBuffer(1, bufferSize, rawContext.sampleRate)
        const output = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }
    }

    trigger(time: number, toneBalance: number = 0.5, snappyDecay: number = 0.3, velocity: number = 0.8) {
        // Tonal Body (Dual Bridged-T)
        const oscLow = new Tone.Oscillator(238, 'sine')
        const oscHigh = new Tone.Oscillator(476, 'sine')

        const gainLow = new Tone.Gain(1 - toneBalance)
        const gainHigh = new Tone.Gain(toneBalance)
        const masterTonalGain = new Tone.Gain(velocity)

        oscLow.connect(gainLow)
        oscHigh.connect(gainHigh)
        gainLow.connect(masterTonalGain)
        gainHigh.connect(masterTonalGain)
        masterTonalGain.connect(this.destination)

        masterTonalGain.gain.setValueAtTime(velocity, time)
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        oscLow.start(time).stop(time + 0.2)
        oscHigh.start(time).stop(time + 0.2)

        // Snappy (Filtered Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.BiquadFilter(1800, 'highpass')
        const snappyGain = new Tone.Gain(velocity * 0.8)

        noiseSrc.connect(noiseFilter)
        noiseFilter.connect(snappyGain)
        snappyGain.connect(this.destination)

        snappyGain.gain.setValueAtTime(velocity * 0.8, time)
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)

        noiseSrc.start(time).stop(time + snappyDecay + 0.1)

        oscLow.onstop = () => {
            oscLow.dispose()
            oscHigh.dispose()
            gainLow.dispose()
            gainHigh.dispose()
            masterTonalGain.dispose()
            noiseSrc.dispose()
            noiseFilter.dispose()
            snappyGain.dispose()
        }
    }
}
