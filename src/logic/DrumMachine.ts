import * as Tone from 'tone'
import { TR808Kick } from '../audio/drumMachine/TR808Kick'
import { TR909Kick } from '../audio/drumMachine/TR909Kick'
import { TR808Snare } from '../audio/drumMachine/TR808Snare'
import { TR909Snare } from '../audio/drumMachine/TR909Snare'
import { TR808HiHat } from '../audio/drumMachine/TR808HiHat'
import { TR808Clap } from '../audio/drumMachine/TR808Clap'

export class DrumMachine {
    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    currentKit: '808' | '909' = '808'

    private kick808: TR808Kick
    private kick909: TR909Kick
    private snare808: TR808Snare
    private snare909: TR909Snare
    private hihat808: TR808HiHat
    private clap808: TR808Clap

    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.comp = new Tone.Compressor(-24, 4).toDestination()
        this.shaper = new Tone.WaveShaper(this.makeDistortionCurve(15)).connect(this.comp)
        this.shaper.oversample = '4x'

        const output = this.shaper

        this.kick808 = new TR808Kick(output)
        this.kick909 = new TR909Kick(output)
        this.snare808 = new TR808Snare(output)
        this.snare909 = new TR909Snare(output)
        this.hihat808 = new TR808HiHat(output)
        this.clap808 = new TR808Clap(output)
    }

    private makeDistortionCurve(amount: number = 20) {
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

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        const { pitch, decay } = this.params[drum]

        switch (drum) {
            case 'kick':
                if (this.currentKit === '808') {
                    const tune = 40 + pitch * 40
                    const d = 0.1 + decay * 2.9
                    this.kick808.trigger(time, tune, d, velocity)
                } else {
                    const tune = 45 + pitch * 20
                    const d = 0.2 + decay * 0.4
                    this.kick909.trigger(time, tune, d, velocity)
                }
                break
            case 'snare':
                if (this.currentKit === '808') {
                    this.snare808.trigger(time, pitch, 0.1 + decay * 0.5, velocity)
                } else {
                    this.snare909.trigger(time, 2000 + pitch * 6000, 0.1 + decay * 0.5, velocity)
                }
                break
            case 'hihat':
                this.hihat808.trigger(time, false, velocity, decay)
                break
            case 'hihatOpen':
                this.hihat808.trigger(time, true, velocity, decay)
                break
            case 'clap':
                this.clap808.trigger(time, velocity, decay)
                break
        }
    }
}
