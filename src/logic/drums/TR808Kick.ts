import * as Tone from 'tone'

export class TR808Kick {
    output: Tone.Gain

    constructor(destination?: Tone.ToneAudioNode) {
        this.output = new Tone.Gain()
        if (destination) {
            this.output.connect(destination)
        } else {
            this.output.toDestination()
        }
    }

    trigger(time: number, tune: number = 50, decay: number = 1.5, velocity: number = 0.8) {
        const osc = new Tone.Oscillator(tune, 'sine')
        const env = new Tone.Gain(0)

        osc.connect(env)
        env.connect(this.output)

        // Pitch Envelope
        osc.frequency.setValueAtTime(tune * 2.5, time)
        osc.frequency.exponentialRampToValueAtTime(tune, time + 0.05)

        // Amplitude Envelope
        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.001, time + decay)
        env.gain.linearRampToValueAtTime(0, time + decay + 0.01)

        osc.start(time).stop(time + decay + 0.02)

        // Cleanup
        osc.onstop = () => {
            osc.dispose()
            env.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
