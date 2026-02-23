import * as Tone from 'tone'

export class TR808HiHat {
    private destination: Tone.ToneAudioNode

    constructor(destination: Tone.ToneAudioNode) {
        this.destination = destination
    }

    trigger(time: number, isOpen: boolean = false, decay: number = 0.05, velocity: number = 0.8) {
        const oscFrequencies = [205.3, 304.4, 369.6, 522.7, 800, 540]
        const oscillators: Tone.Oscillator[] = []

        const mixGain = new Tone.Gain(0.15)

        oscFrequencies.forEach(freq => {
            const osc = new Tone.Oscillator(freq + (Math.random() - 0.5) * 4, 'square')
            osc.connect(mixGain)
            oscillators.push(osc)
        })

        const bpf1 = new Tone.BiquadFilter(3440, 'bandpass')
        bpf1.Q.value = 1.5
        const bpf2 = new Tone.BiquadFilter(7100, 'bandpass')
        bpf2.Q.value = 1.5

        const envGain = new Tone.Gain(velocity)
        const hpf = new Tone.BiquadFilter(7000, 'highpass')

        mixGain.connect(bpf1)
        mixGain.connect(bpf2)
        bpf1.connect(envGain)
        bpf2.connect(envGain)
        envGain.connect(hpf)
        hpf.connect(this.destination)

        envGain.gain.setValueAtTime(velocity, time)
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decay)

        oscillators.forEach(osc => osc.start(time).stop(time + decay))

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
