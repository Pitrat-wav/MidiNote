import * as Tone from 'tone'

export class TR909Kick {
    private output: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
        this.noiseBuffer = this.generateNoiseBuffer(0.05)
    }

    trigger(time: number, tune: number = 50, decay: number = 0.5, velocity: number = 0.8) {
        // Micro-randomization
        const pitchDrift = (Math.random() * 2) - 1
        const actualTune = tune + pitchDrift
        const actualDecay = decay * (1 + (Math.random() * 0.04 - 0.02))

        // Body
        const bodyOsc = new Tone.Oscillator({
            type: 'triangle',
            frequency: actualTune * 4.7
        })
        const bodyGain = new Tone.Gain(0).connect(this.output)
        bodyOsc.connect(bodyGain)

        bodyOsc.frequency.setValueAtTime(actualTune * 4.7, time)
        bodyOsc.frequency.exponentialRampToValueAtTime(actualTune, time + 0.1)

        bodyGain.gain.setValueAtTime(velocity, time)
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + actualDecay)

        // Click (Noise)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const noiseFilter = new Tone.Filter(1000 + (Math.random() * 200 - 100), 'highpass').connect(this.output)
        const noiseGain = new Tone.Gain(0).connect(noiseFilter)
        noiseSrc.connect(noiseGain)

        noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02)

        bodyOsc.start(time)
        bodyOsc.stop(time + actualDecay)
        noiseSrc.start(time)
        noiseSrc.stop(time + 0.02)

        bodyOsc.onstop = () => {
            bodyOsc.dispose()
            bodyGain.dispose()
        }
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            noiseGain.dispose()
            noiseFilter.dispose()
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
