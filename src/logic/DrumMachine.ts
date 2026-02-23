import * as Tone from 'tone'
import { TR808Kick } from './drums/TR808Kick'
import { TR909Kick } from './drums/TR909Kick'
import { TR808Snare } from './drums/TR808Snare'
import { TR909Snare } from './drums/TR909Snare'
import { TR808HiHat } from './drums/TR808HiHat'
import { TR808Clap } from './drums/TR808Clap'

export class DrumMachine {
    kick808: TR808Kick
    kick909: TR909Kick
    snare808: TR808Snare
    snare909: TR909Snare
    hihat808: TR808HiHat
    clap808: TR808Clap

    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    masterGain: Tone.Gain
    currentKit: '808' | '909' = '808'

    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.masterGain = new Tone.Gain(1)
        this.shaper = new Tone.WaveShaper(this.makeDistortionCurve(20)).connect(this.masterGain)
        this.comp = new Tone.Compressor(-24, 4).connect(this.shaper)
        this.masterGain.toDestination()

        this.kick808 = new TR808Kick(this.comp)
        this.kick909 = new TR909Kick(this.comp)
        this.snare808 = new TR808Snare(this.comp)
        this.snare909 = new TR909Snare(this.comp)
        this.hihat808 = new TR808HiHat(this.comp)
        this.clap808 = new TR808Clap(this.comp)
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

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        const { pitch, decay } = this.params[drum]

        // Micro-randomization (Analog Drift)
        const pitchDrift = (Math.random() - 0.5) * 0.02
        const randomizedPitch = Math.max(0, Math.min(1, pitch + pitchDrift))
        const randomizedDecay = decay * (1 + (Math.random() - 0.5) * 0.05)

        if (this.currentKit === '808') {
            switch (drum) {
                case 'kick':
                    this.kick808.trigger(time, 40 + randomizedPitch * 40, 0.1 + randomizedDecay * 2.9, velocity)
                    break
                case 'snare':
                    this.snare808.trigger(time, randomizedPitch, 0.1 + randomizedDecay * 0.4, velocity)
                    break
                case 'hihat':
                    this.hihat808.trigger(time, false, 0.03 + randomizedDecay * 0.1, velocity)
                    break
                case 'hihatOpen':
                    this.hihat808.trigger(time, true, 0.1 + randomizedDecay * 0.6, velocity)
                    break
                case 'clap':
                    this.clap808.trigger(time, 0.1 + randomizedDecay * 0.4, velocity)
                    break
            }
        } else {
            switch (drum) {
                case 'kick':
                    this.kick909.trigger(time, 45 + randomizedPitch * 20, 0.2 + randomizedDecay * 0.5, velocity)
                    break
                case 'snare':
                    this.snare909.trigger(time, 2000 + randomizedPitch * 6000, 0.1 + randomizedDecay * 0.4, velocity)
                    break
                case 'hihat':
                    this.hihat808.trigger(time, false, 0.03 + randomizedDecay * 0.1, velocity)
                    break
                case 'hihatOpen':
                    this.hihat808.trigger(time, true, 0.1 + randomizedDecay * 0.6, velocity)
                    break
                case 'clap':
                    this.clap808.trigger(time, 0.1 + randomizedDecay * 0.4, velocity)
                    break
            }
        }
    }
}
