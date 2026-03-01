import * as Tone from 'tone'
import { TR808Kick } from './TR808Kick'
import { TR909Kick } from './TR909Kick'
import { TR808Snare } from './TR808Snare'
import { TR909Snare } from './TR909Snare'
import { TR808HiHat } from './TR808HiHat'
import { TR808Clap } from './TR808Clap'
import { makeDistortionCurve, applyDrift, applyPitchDrift } from './DrumUtils'

export class DrumMachine {
    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    output: Tone.Gain
    currentKit: '808' | '909' = '808'

    // Synthesis models
    private kick808: TR808Kick
    private kick909: TR909Kick
    private snare808: TR808Snare
    private snare909: TR909Snare
    private hihat808: TR808HiHat
    private clap808: TR808Clap

    // Parameters cache
    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.output = new Tone.Gain(1).toDestination()
        this.shaper = new Tone.WaveShaper(makeDistortionCurve(15)).connect(this.output)
        this.comp = new Tone.Compressor(-24, 4).connect(this.shaper)

        this.kick808 = new TR808Kick(this.comp)
        this.kick909 = new TR909Kick(this.comp)
        this.snare808 = new TR808Snare(this.comp)
        this.snare909 = new TR909Snare(this.comp)
        this.hihat808 = new TR808HiHat(this.comp)
        this.clap808 = new TR808Clap(this.comp)
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
    }

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        const p = this.params[drum]

        switch (drum) {
            case 'kick':
                if (this.currentKit === '808') {
                    const tune = applyPitchDrift(40 + p.pitch * 40) // 40Hz to 80Hz
                    const decay = applyDrift(0.1 + p.decay * 2.9) // 0.1s to 3s
                    this.kick808.trigger(time, tune, decay, velocity)
                } else {
                    const tune = applyPitchDrift(45 + p.pitch * 20) // 45Hz to 65Hz
                    const decay = applyDrift(0.2 + p.decay * 0.4) // 0.2s to 0.6s
                    this.kick909.trigger(time, tune, decay, velocity)
                }
                break
            case 'snare':
                if (this.currentKit === '808') {
                    const balance = p.pitch // maps to tone balance
                    const decay = applyDrift(0.2 + p.decay * 0.2) // snappy decay
                    this.snare808.trigger(time, balance, decay, velocity)
                } else {
                    const cutoff = applyDrift(4000 + p.pitch * 4000) // 4kHz to 8kHz
                    const decay = applyDrift(0.1 + p.decay * 0.4) // snappy decay
                    this.snare909.trigger(time, cutoff, decay, velocity)
                }
                break
            case 'hihat':
                const hhDecay = applyDrift(0.03 + p.decay * 0.07) // 30ms to 100ms
                this.hihat808.trigger(time, hhDecay, velocity)
                break
            case 'hihatOpen':
                const ohDecay = applyDrift(0.3 + p.decay * 0.5) // 300ms to 800ms
                this.hihat808.trigger(time, ohDecay, velocity)
                break
            case 'clap':
                const clapDecay = applyDrift(0.1 + p.decay * 0.4) // 100ms to 500ms
                this.clap808.trigger(time, clapDecay, velocity)
                break
        }
    }
}
