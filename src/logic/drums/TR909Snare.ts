import * as Tone from 'tone'
import { WhiteNoise } from './WhiteNoise'

export class TR909Snare {
    constructor(private destination: Tone.ToneAudioNode) {}

    trigger(time: number, pitch: number, decay: number, velocity: number = 0.8) {
        const toneCutoff = 2000 + pitch * 8000 // 2kHz - 10kHz
        const snappyDecay = 0.1 + decay * 0.5 // 0.1s - 0.6s

        // Tonal Body
        const osc1 = new Tone.Oscillator(160 * 2, 'triangle')
        const osc2 = new Tone.Oscillator(220 * 2, 'triangle')
        const tonalEnv = new Tone.Gain(velocity).connect(this.destination)

        osc1.connect(tonalEnv)
        osc2.connect(tonalEnv)

        osc1.frequency.setValueAtTime(160 * 2, time)
        osc1.frequency.exponentialRampToValueAtTime(160, time + 0.05)
        osc2.frequency.setValueAtTime(220 * 2, time)
        osc2.frequency.exponentialRampToValueAtTime(220, time + 0.05)

        tonalEnv.gain.setValueAtTime(velocity, time)
        tonalEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        // Snappy
        const noiseBuf = WhiteNoise.getBuffer(Tone.context.rawContext as AudioContext)
        const noiseSrc = new Tone.BufferSource(noiseBuf)
        const hpf = new Tone.Filter(1000, 'highpass')
        const lpf = new Tone.Filter(toneCutoff, 'lowpass')
        const snappyEnv = new Tone.Gain(velocity * 0.7).connect(this.destination)

        noiseSrc.connect(hpf).connect(lpf).connect(snappyEnv)

        snappyEnv.gain.setValueAtTime(velocity * 0.7, time)
        snappyEnv.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)

        osc1.start(time)
        osc2.start(time)
        noiseSrc.start(time)

        const totalDecay = Math.max(0.2, snappyDecay)
        osc1.stop(time + 0.2)
        osc2.stop(time + 0.2)
        noiseSrc.stop(time + totalDecay)

        noiseSrc.onended = () => {
            osc1.dispose()
            osc2.dispose()
            tonalEnv.dispose()
            noiseSrc.dispose()
            hpf.dispose()
            lpf.dispose()
            snappyEnv.dispose()
        }
    }
}
