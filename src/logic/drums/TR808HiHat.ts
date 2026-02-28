import * as Tone from 'tone'

export class TR808HiHat {
    output: Tone.Gain

    constructor(destination?: Tone.ToneAudioNode) {
        this.output = new Tone.Gain()
        if (destination) {
            this.output.connect(destination)
        } else {
            this.output.toDestination()
        }
    }

    trigger(time: number, isOpen: boolean = false, velocity: number = 0.8) {
        const frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540]
        const oscillators: Tone.Oscillator[] = []
        const mixGain = new Tone.Gain(0.15)

        frequencies.forEach(freq => {
            const drift = (Math.random() - 0.5) * 4
            const osc = new Tone.Oscillator(freq + drift, 'square')
            osc.connect(mixGain)
            oscillators.push(osc)
        })

        const bpf1 = new Tone.BiquadFilter(3440, 'bandpass')
        bpf1.Q.value = 1.5
        const bpf2 = new Tone.BiquadFilter(7100, 'bandpass')
        bpf2.Q.value = 1.5

        const envGain = new Tone.Gain(0)
        const hpf = new Tone.BiquadFilter(7000, 'highpass')

        mixGain.connect(bpf1)
        mixGain.connect(bpf2)
        bpf1.connect(envGain)
        bpf2.connect(envGain)
        envGain.connect(hpf)
        hpf.connect(this.output)

        const decay = isOpen ? 0.4 : 0.05
        envGain.gain.setValueAtTime(velocity, time)
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decay)
        envGain.gain.linearRampToValueAtTime(0, time + decay + 0.01)

        oscillators.forEach(osc => osc.start(time).stop(time + decay + 0.02))

        // Cleanup using the first oscillator's onstop
        oscillators[0].onstop = () => {
            oscillators.forEach(osc => osc.dispose())
            mixGain.dispose()
            bpf1.dispose()
            bpf2.dispose()
            envGain.dispose()
            hpf.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
