import * as Tone from 'tone'

export class TR808Kick {
    private output: Tone.ToneAudioNode

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
    }

    trigger(time: number, tune: number = 50, decay: number = 1.5, velocity: number = 0.8) {
        // Micro-randomization
        const pitchDrift = (Math.random() * 2) - 1
        const actualTune = tune + pitchDrift
        const actualDecay = decay * (1 + (Math.random() * 0.04 - 0.02))

        const osc = new Tone.Oscillator({
            type: 'sine',
            frequency: actualTune * 2.5
        })

        const env = new Tone.Gain(0).connect(this.output)
        osc.connect(env)

        // Pitch Envelope: ~120-150Hz -> tune (45-60Hz) over 50ms
        osc.frequency.setValueAtTime(actualTune * 2.5, time)
        osc.frequency.exponentialRampToValueAtTime(actualTune, time + 0.05)

        // Amplitude Envelope
        env.gain.setValueAtTime(velocity, time)
        env.gain.exponentialRampToValueAtTime(0.001, time + actualDecay)

        osc.start(time)
        osc.stop(time + actualDecay)

        osc.onstop = () => {
            osc.dispose()
            env.dispose()
        }
    }
}
