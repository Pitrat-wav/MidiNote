import * as Tone from 'tone'

export class TR808Kick {
    private destination: Tone.ToneAudioNode

    constructor(destination: Tone.ToneAudioNode) {
        this.destination = destination
    }

    trigger(time: number, tune: number = 50, decay: number = 1.5, velocity: number = 0.8) {
        const osc = new Tone.Oscillator(tune * 2.5, 'sine')
        const env = new Tone.Gain(velocity)

        osc.connect(env)
        env.connect(this.destination)

        osc.frequency.setValueAtTime(tune * 2.5, time)
        osc.frequency.exponentialRampToValueAtTime(tune, time + 0.05)

        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.001, time + decay)

        osc.start(time).stop(time + decay)

        osc.onstop = () => {
            osc.dispose()
            env.dispose()
        }
    }
}
