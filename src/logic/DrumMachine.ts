import * as Tone from 'tone'
import { TR808Kick } from './drums/TR808Kick'
import { TR909Kick } from './drums/TR909Kick'
import { TR808Snare } from './drums/TR808Snare'
import { TR909Snare } from './drums/TR909Snare'
import { TR808HiHat } from './drums/TR808HiHat'
import { TR808Clap } from './drums/TR808Clap'

export class DrumMachine {
    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    output: Tone.Gain
    currentKit: '808' | '909' = '808'

    private kit808: {
        kick: TR808Kick,
        snare: TR808Snare,
        hihat: TR808HiHat,
        clap: TR808Clap
    }
    private kit909: {
        kick: TR909Kick,
        snare: TR909Snare,
        hihat: TR808HiHat,
        clap: TR808Clap
    }

    private params: Record<string, { pitch: number, decay: number }> = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.comp = new Tone.Compressor(-24, 4)
        this.shaper = new Tone.WaveShaper(this.makeDistortionCurve(15))
        this.output = new Tone.Gain(1)

        this.comp.chain(this.shaper, this.output, Tone.Destination)

        this.kit808 = {
            kick: new TR808Kick(this.comp),
            snare: new TR808Snare(this.comp),
            hihat: new TR808HiHat(this.comp),
            clap: new TR808Clap(this.comp)
        }

        this.kit909 = {
            kick: new TR909Kick(this.comp),
            snare: new TR909Snare(this.comp),
            hihat: new TR808HiHat(this.comp),
            clap: new TR808Clap(this.comp)
        }
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
        const kit808 = this.kit808
        const kit909 = this.kit909

        if (this.currentKit === '808') {
            switch (drum) {
                case 'kick': kit808.kick.trigger(time, p.pitch, p.decay); break
                case 'snare': kit808.snare.trigger(time, p.pitch, p.decay); break
                case 'hihat': kit808.hihat.trigger(time, false, p.pitch, p.decay); break
                case 'hihatOpen': kit808.hihat.trigger(time, true, p.pitch, p.decay); break
                case 'clap': kit808.clap.trigger(time, p.pitch, p.decay); break
            }
        } else {
            switch (drum) {
                case 'kick': kit909.kick.trigger(time, p.pitch, p.decay); break
                case 'snare': kit909.snare.trigger(time, p.pitch, p.decay); break
                case 'hihat': kit909.hihat.trigger(time, false, p.pitch, p.decay); break
                case 'hihatOpen': kit909.hihat.trigger(time, true, p.pitch, p.decay); break
                case 'clap': kit909.clap.trigger(time, p.pitch, p.decay); break
            }
        }
    }
}
