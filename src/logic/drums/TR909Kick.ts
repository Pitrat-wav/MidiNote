import * as Tone from 'tone'

export class TR909Kick {
    private destination: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(destination: Tone.ToneAudioNode) {
        this.destination = destination

        const rawContext = Tone.context.rawContext as AudioContext
        const bufferSize = rawContext.sampleRate * 0.05
        this.noiseBuffer = rawContext.createBuffer(1, bufferSize, rawContext.sampleRate)
        const output = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }
    }

    trigger(time: number, tune: number = 50, decay: number = 0.5, velocity: number = 0.8) {
        // Body (VCO)
        const bodyOsc = new Tone.Oscillator(tune * 4.7, 'triangle')
        const bodyGain = new Tone.Gain(velocity)

        bodyOsc.connect(bodyGain)
        bodyGain.connect(this.destination)

        bodyOsc.frequency.setValueAtTime(tune * 4.7, time)
        bodyOsc.frequency.exponentialRampToValueAtTime(tune, time + 0.1)

        bodyGain.gain.setValueAtTime(velocity, time)
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decay)

        bodyOsc.start(time).stop(time + decay)

        // Click (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.BiquadFilter(1000, 'highpass')
        const noiseGain = new Tone.Gain(velocity * 0.7)

        noiseSrc.connect(noiseFilter)
        noiseFilter.connect(noiseGain)
        noiseGain.connect(this.destination)

        noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02)

        noiseSrc.start(time).stop(time + 0.05)

        bodyOsc.onstop = () => {
            bodyOsc.dispose()
            bodyGain.dispose()
            noiseSrc.dispose()
            noiseFilter.dispose()
            noiseGain.dispose()
        }
    }
}
