import * as Tone from 'tone'
import { WhiteNoise } from './WhiteNoise'

export class TRClap {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        const noiseBuf = WhiteNoise.getBuffer(Tone.context.rawContext as AudioContext)
        const noiseSrc = new Tone.BufferSource(noiseBuf)
        const filter = new Tone.Filter(1200 + pitch * 3000, 'bandpass').connect(this.destination)
        const env = new Tone.Gain(0).connect(filter)
        noiseSrc.connect(env)

        const clapDecay = 0.1 + decay * 0.3

        env.gain.setValueAtTime(0, time)
        env.gain.linearRampToValueAtTime(velocity, time + 0.001)
        env.gain.exponentialRampToValueAtTime(0.1, time + 0.01)
        env.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.011)
        env.gain.exponentialRampToValueAtTime(0.1, time + 0.02)
        env.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.021)
        env.gain.exponentialRampToValueAtTime(0.001, time + clapDecay)

        noiseSrc.start(time)
        noiseSrc.stop(time + clapDecay)

        noiseSrc.onended = () => {
            noiseSrc.dispose()
            filter.dispose()
            env.dispose()
        }
    }
}
