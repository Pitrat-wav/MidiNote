import * as Tone from 'tone'

export class TR909Kick {
    private noiseBuffer: AudioBuffer
    output: Tone.Gain

    constructor(destination?: Tone.ToneAudioNode) {
        // Pre-generate noise buffer once
        const bufferSize = Tone.getContext().sampleRate * 0.05
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

    trigger(time: number, tune: number = 50, decay: number = 0.5, velocity: number = 0.8) {
        // Body
        const bodyOsc = new Tone.Oscillator(tune, 'triangle')
        const bodyEnv = new Tone.Gain(0)
        bodyOsc.connect(bodyEnv)
        bodyEnv.connect(this.output)

        const startFreq = tune * 4.7
        bodyOsc.frequency.setValueAtTime(startFreq, time)
        bodyOsc.frequency.exponentialRampToValueAtTime(tune, time + 0.1)

        bodyEnv.gain.setValueAtTime(velocity, time)
        bodyEnv.gain.exponentialRampToValueAtTime(0.001, time + decay)
        bodyEnv.gain.linearRampToValueAtTime(0, time + decay + 0.01)

        bodyOsc.start(time).stop(time + decay + 0.02)
        bodyOsc.onstop = () => {
            bodyOsc.dispose()
            bodyEnv.dispose()
        }

        // Click
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.BiquadFilter(1000, 'highpass')
        const noiseEnv = new Tone.Gain(0)

        noiseSrc.connect(noiseFilter)
        noiseFilter.connect(noiseEnv)
        noiseEnv.connect(this.output)

        noiseEnv.gain.setValueAtTime(velocity * 0.7, time)
        noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.02)
        noiseEnv.gain.linearRampToValueAtTime(0, time + 0.03)

        noiseSrc.start(time).stop(time + 0.05)
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            noiseFilter.dispose()
            noiseEnv.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
