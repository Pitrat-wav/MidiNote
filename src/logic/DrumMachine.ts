import * as Tone from 'tone'
import { TR808Kick } from './drums/TR808Kick'
import { TR909Kick } from './drums/TR909Kick'
import { TR808Snare } from './drums/TR808Snare'
import { TR909Snare } from './drums/TR909Snare'
import { TR808HiHat } from './drums/TR808HiHat'
import { TRClap } from './drums/TRClap'
import { WhiteNoise } from './drums/WhiteNoise'

export class DrumMachine {
    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    volume: Tone.Gain
    currentKit: '808' | '909' = '808'

    private k808: TR808Kick
    private k909: TR909Kick
    private s808: TR808Snare
    private s909: TR909Snare
    private h808: TR808HiHat
    private clapSynth: TRClap

    private params: Record<string, { pitch: number, decay: number }> = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.volume = new Tone.Gain(1.0)
        this.comp = new Tone.Compressor(-24, 4)
        this.shaper = new Tone.WaveShaper(this.makeDistortionCurve(15))

        // Chain: Instruments -> Comp -> Volume -> Shaper -> Destination
        this.comp.connect(this.volume)
        this.volume.connect(this.shaper)
        this.shaper.toDestination()

        this.k808 = new TR808Kick(this.comp)
        this.k909 = new TR909Kick(this.comp)
        this.s808 = new TR808Snare(this.comp)
        this.s909 = new TR909Snare(this.comp)
        this.h808 = new TR808HiHat(this.comp)
        this.clapSynth = new TRClap(this.comp)
    }

    private makeDistortionCurve(amount: number) {
        const k = amount
        const n_samples = 44100
        const curve = new Float32Array(n_samples)
        const deg = Math.PI / 180
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
        }
        return curve
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
    }

    setDrumParams(drum: string, pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        const p = this.params[drum]
        const v = velocity * (1 + (Math.random() * 0.1 - 0.05))
        const t = time + (Math.random() * 0.002)

        if (this.currentKit === '808') {
            switch (drum) {
                case 'kick': this.k808.trigger(t, p.pitch, p.decay, v); break
                case 'snare': this.s808.trigger(t, p.pitch, p.decay, v); break
                case 'hihat': this.h808.trigger(t, false, p.pitch, p.decay, v); break
                case 'hihatOpen': this.h808.trigger(t, true, p.pitch, p.decay, v); break
                case 'clap': this.clapSynth.trigger(t, p.pitch, p.decay, v); break
            }
        } else {
            switch (drum) {
                case 'kick': this.k909.trigger(t, p.pitch, p.decay, v); break
                case 'snare': this.s909.trigger(t, p.pitch, p.decay, v); break
                case 'hihat': this.h808.trigger(t, false, p.pitch, p.decay, v); break
                case 'hihatOpen': this.h808.trigger(t, true, p.pitch, p.decay, v); break
                case 'clap': this.clapSynth.trigger(t, p.pitch, p.decay, v); break
            }
        }
    }
}
