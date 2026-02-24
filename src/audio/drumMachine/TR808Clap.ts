import * as Tone from 'tone'

export class TR808Clap {
    private output: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
        this.noiseBuffer = this.generateNoiseBuffer(1)
    }

    trigger(time: number, velocity: number = 0.8, decayParam: number = 0.5) {
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const filter = new Tone.Filter(1000 * (1 + (Math.random() * 0.1 - 0.05)), 'bandpass').connect(this.output)
        const env = new Tone.Gain(0).connect(filter)
        noiseSrc.connect(env)

        // Triple attack "snap"
        const attackStep = 0.01 * (1 + (Math.random() * 0.2 - 0.1))
        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.01, time + attackStep)

        env.gain.setValueAtTime(velocity * 0.8, time + attackStep + 0.005)
        env.gain.exponentialRampToValueAtTime(0.01, time + (attackStep * 2))

        env.gain.setValueAtTime(velocity * 0.6, time + (attackStep * 2) + 0.005)

        const decay = 0.3 * (decayParam * 2) * (1 + (Math.random() * 0.1 - 0.05))
        env.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.05, decay))

        noiseSrc.start(time)
        noiseSrc.stop(time + decay + 0.2)

        noiseSrc.onended = () => {
            noiseSrc.dispose()
            filter.dispose()
            env.dispose()
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
