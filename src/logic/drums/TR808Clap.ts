import * as Tone from 'tone'

export class TR808Clap {
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

    trigger(time: number, decay: number = 0.3, velocity: number = 0.8) {
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const filter = new Tone.BiquadFilter(1200, 'bandpass')
        const env = new Tone.Gain(0)

        noiseSrc.connect(filter)
        filter.connect(env)
        env.connect(this.destination)

        const burst = 0.01
        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.01, time + burst)
        env.gain.setValueAtTime(velocity, time + burst + 0.005)
        env.gain.exponentialRampToValueAtTime(0.01, time + (burst * 2) + 0.005)
        env.gain.setValueAtTime(velocity, time + (burst * 2) + 0.01)
        env.gain.exponentialRampToValueAtTime(0.001, time + decay)

        noiseSrc.start(time).stop(time + decay + 0.1)
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            filter.dispose()
            env.dispose()
        }
    }
}
