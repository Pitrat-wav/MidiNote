import * as Tone from 'tone'

export class TR808Snare {
    private output: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
        this.noiseBuffer = this.generateNoiseBuffer(0.5)
    }

    trigger(time: number, toneBalance: number = 0.5, snappyDecay: number = 0.3, velocity: number = 0.8) {
        // Micro-randomization
        const freqDrift = (Math.random() * 4) - 2
        const actualSnappyDecay = snappyDecay * (1 + (Math.random() * 0.06 - 0.03))

        // Tonal Body
        const oscLow = new Tone.Oscillator(238 + freqDrift, 'sine')
        const oscHigh = new Tone.Oscillator(476 + freqDrift, 'sine')
        const gainLow = new Tone.Gain(1 - toneBalance)
        const gainHigh = new Tone.Gain(toneBalance)
        const masterTonalGain = new Tone.Gain(0).connect(this.output)

        oscLow.connect(gainLow).connect(masterTonalGain)
        oscHigh.connect(gainHigh).connect(masterTonalGain)

        masterTonalGain.gain.setValueAtTime(velocity, time)
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        // Snappy (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.Filter(1800 * (1 + (Math.random() * 0.04 - 0.02)), 'highpass').connect(this.output)
        const snappyGain = new Tone.Gain(0).connect(noiseFilter)
        noiseSrc.connect(snappyGain)

        snappyGain.gain.setValueAtTime(velocity * 0.8, time)
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + actualSnappyDecay)

        oscLow.start(time)
        oscHigh.start(time)
        noiseSrc.start(time)

        const stopTime = time + Math.max(0.2, actualSnappyDecay) + 0.1
        oscLow.stop(stopTime)
        oscHigh.stop(stopTime)
        noiseSrc.stop(stopTime)

        oscLow.onstop = () => {
            oscLow.dispose()
            oscHigh.dispose()
            gainLow.dispose()
            gainHigh.dispose()
            masterTonalGain.dispose()
        }
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            noiseFilter.dispose()
            snappyGain.dispose()
        }
    }

    private generateNoiseBuffer(duration: number) {
        const sampleRate = Tone.getContext().sampleRate
        const bufferSize = sampleRate * duration
        const buffer = (Tone.getContext().rawContext as AudioContext).createBuffer(1, bufferSize, sampleRate)
        const output = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }
        return buffer
    }
}
