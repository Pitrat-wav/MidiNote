import * as Tone from 'tone'
import { WhiteNoise } from './WhiteNoise'

export class TR909Kick {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        const tune = 45 + pitch * 20 // 45Hz - 65Hz
        const decayTime = 0.2 + decay * 0.5 // 0.2s - 0.7s
        const clickDecay = 0.02

        // Body
        const bodyOsc = new Tone.Oscillator(tune * 4.7, 'triangle')
        const bodyEnv = new Tone.Gain(0).connect(this.destination)
        bodyOsc.connect(bodyEnv)

        bodyOsc.frequency.setValueAtTime(tune * 4.7, time)
        bodyOsc.frequency.exponentialRampToValueAtTime(tune, time + 0.1)

        bodyEnv.gain.setValueAtTime(velocity, time)
        bodyEnv.gain.exponentialRampToValueAtTime(0.001, time + decayTime)

        // Click
        const noiseBuf = WhiteNoise.getBuffer(Tone.context.rawContext as AudioContext)
        const clickSrc = new Tone.BufferSource(noiseBuf)
        const clickFilter = new Tone.Filter(1000, 'highpass')
        const clickEnv = new Tone.Gain(0).connect(this.destination)

        clickSrc.connect(clickFilter)
        clickFilter.connect(clickEnv)

        clickEnv.gain.setValueAtTime(velocity * 0.7, time)
        clickEnv.gain.exponentialRampToValueAtTime(0.001, time + clickDecay)

        bodyOsc.start(time)
        bodyOsc.stop(time + decayTime)
        clickSrc.start(time)
        clickSrc.stop(time + clickDecay)

        bodyOsc.onstop = () => {
            bodyOsc.dispose()
            bodyEnv.dispose()
            clickSrc.dispose()
            clickFilter.dispose()
            clickEnv.dispose()
        }
    }
}
