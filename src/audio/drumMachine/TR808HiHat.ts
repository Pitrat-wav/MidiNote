import * as Tone from 'tone'

export class TR808HiHat {
    private output: Tone.ToneAudioNode
    private frequencies = [205.3, 304.4, 369.6, 522.7, 800, 540]

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
    }

    trigger(time: number, isOpen: boolean = false, velocity: number = 0.8, decayParam?: number) {
        const mixGain = new Tone.Gain(0.15)
        const oscillators: Tone.Oscillator[] = []

        this.frequencies.forEach(freq => {
            const drift = (Math.random() - 0.5) * 4
            const osc = new Tone.Oscillator(freq + drift, 'square').connect(mixGain)
            oscillators.push(osc)
        })

        const bpf1 = new Tone.Filter(3440 * (1 + (Math.random() * 0.04 - 0.02)), 'bandpass')
        bpf1.Q.value = 1.5
        const bpf2 = new Tone.Filter(7100 * (1 + (Math.random() * 0.04 - 0.02)), 'bandpass')
        bpf2.Q.value = 1.5

        const envGain = new Tone.Gain(0)
        const hpf = new Tone.Filter(7000, 'highpass').connect(this.output)

        mixGain.connect(bpf1)
        mixGain.connect(bpf2)
        bpf1.connect(envGain)
        bpf2.connect(envGain)
        envGain.connect(hpf)

        let decay = isOpen ? 0.4 : 0.05
        if (decayParam !== undefined) {
            // Scale decay by parameter (0.5 is neutral)
            decay *= (decayParam * 2)
        }
        decay *= (1 + (Math.random() * 0.1 - 0.05))

        envGain.gain.setValueAtTime(velocity, time)
        envGain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.01, decay))

        oscillators.forEach(osc => {
            osc.start(time)
            osc.stop(time + decay + 0.1)
        })

        oscillators[0].onstop = () => {
            oscillators.forEach(osc => osc.dispose())
            mixGain.dispose()
            bpf1.dispose()
            bpf2.dispose()
            envGain.dispose()
            hpf.dispose()
        }
    }
}
