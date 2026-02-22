import * as Tone from 'tone'

export class TR808Kick {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        const tune = 40 + pitch * 40 // 40Hz - 80Hz
        const decayTime = 0.1 + decay * 2.9 // 0.1s - 3.0s

        const osc = new Tone.Oscillator(tune * 2.5, 'sine')
        const env = new Tone.Gain(0).connect(this.destination)
        osc.connect(env)

        osc.frequency.setValueAtTime(tune * 2.5, time)
        osc.frequency.exponentialRampToValueAtTime(tune, time + 0.05)

        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.001, time + decayTime)

        osc.start(time)
        osc.stop(time + decayTime)

        osc.onstop = () => {
            osc.dispose()
            env.dispose()
        }
    }
}
