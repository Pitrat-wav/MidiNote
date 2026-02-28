import * as Tone from 'tone'

export class TR808Snare {
    private noiseBuffer: AudioBuffer
    output: Tone.Gain

    constructor(destination?: Tone.ToneAudioNode) {
        const bufferSize = Tone.getContext().sampleRate * 0.5
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate)
        const data = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        this.output = new Tone.Gain()
        if (destination) {
            this.output.connect(destination)
        } else {
            this.output.toDestination()
        }
    }

    trigger(time: number, toneBalance: number = 0.5, snappyDecay: number = 0.3, velocity: number = 0.8) {
        // Tonal
        const oscLow = new Tone.Oscillator(238, 'sine')
        const oscHigh = new Tone.Oscillator(476, 'sine')
        const gainLow = new Tone.Gain(1 - toneBalance)
        const gainHigh = new Tone.Gain(toneBalance)
        const masterTonalGain = new Tone.Gain(0)

        oscLow.connect(gainLow)
        oscHigh.connect(gainHigh)
        gainLow.connect(masterTonalGain)
        gainHigh.connect(masterTonalGain)
        masterTonalGain.connect(this.output)

        masterTonalGain.gain.setValueAtTime(velocity, time)
        masterTonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
        masterTonalGain.gain.linearRampToValueAtTime(0, time + 0.21)

        oscLow.start(time).stop(time + 0.22)
        oscHigh.start(time).stop(time + 0.22)

        // Cleanup tonal part (onstop of any osc)
        oscLow.onstop = () => {
            oscLow.dispose()
            oscHigh.dispose()
            gainLow.dispose()
            gainHigh.dispose()
            masterTonalGain.dispose()
        }

        // Noise
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.BiquadFilter(1800, 'highpass')
        const snappyGain = new Tone.Gain(0)

        noiseSrc.connect(noiseFilter)
        noiseFilter.connect(snappyGain)
        snappyGain.connect(this.output)

        snappyGain.gain.setValueAtTime(velocity * 0.8, time)
        snappyGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)
        snappyGain.gain.linearRampToValueAtTime(0, time + snappyDecay + 0.01)

        noiseSrc.start(time).stop(time + snappyDecay + 0.05)
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            noiseFilter.dispose()
            snappyGain.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
