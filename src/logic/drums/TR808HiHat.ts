import * as Tone from 'tone'

export class TR808HiHat {
    private freqs = [205.3, 304.4, 369.6, 522.7, 800, 540]

    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, isOpen: boolean, pitch: number, decay: number, velocity: number = 0.8) {
        // pitch can shift the whole metallic cluster
        const pitchShift = 1 + (pitch - 0.5) * 0.5 // 0.75x to 1.25x
        const decayTime = isOpen ? (0.2 + decay * 0.6) : (0.02 + decay * 0.08)

        const oscillators = this.freqs.map(f => {
            const osc = new Tone.Oscillator(f * pitchShift, 'square')
            // Micro-drift
            const freq = (osc.frequency.value as number) + (Math.random() - 0.5) * 4
            osc.frequency.value = freq
            return osc
        })

        const mixGain = new Tone.Gain(0.15)
        oscillators.forEach(osc => osc.connect(mixGain))

        const bpf1 = new Tone.Filter(3440, 'bandpass', -12)
        bpf1.Q.value = 1.5
        const bpf2 = new Tone.Filter(7100, 'bandpass', -12)
        bpf2.Q.value = 1.5

        const envGain = new Tone.Gain(velocity).connect(this.destination)
        const hpf = new Tone.Filter(7000, 'highpass').connect(envGain)

        mixGain.connect(bpf1).connect(hpf)
        mixGain.connect(bpf2).connect(hpf)

        envGain.gain.setValueAtTime(velocity, time)
        envGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime)

        oscillators.forEach(osc => {
            osc.start(time)
            osc.stop(time + decayTime)
        })

        oscillators[0].onstop = () => {
            oscillators.forEach(o => o.dispose())
            mixGain.dispose()
            bpf1.dispose()
            bpf2.dispose()
            envGain.dispose()
            hpf.dispose()
        }
    }
}
