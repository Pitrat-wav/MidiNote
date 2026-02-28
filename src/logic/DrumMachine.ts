import * as Tone from 'tone'
import { TR808Kick } from './drums/TR808Kick'
import { TR909Kick } from './drums/TR909Kick'
import { TR808Snare } from './drums/TR808Snare'
import { TR909Snare } from './drums/TR909Snare'
import { TR808HiHat } from './drums/TR808HiHat'
import { TR808Clap } from './drums/TR808Clap'

export class DrumMachine {
    private kick808: TR808Kick
    private kick909: TR909Kick
    private snare808: TR808Snare
    private snare909: TR909Snare
    private hihat808: TR808HiHat
    private clap808: TR808Clap

    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    output: Tone.Gain
    currentKit: '808' | '909' = '808'

    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor(destination?: Tone.ToneAudioNode) {
        this.comp = new Tone.Compressor(-24, 4)
        this.shaper = new Tone.WaveShaper(this.makeDistortionCurve(15))
        this.shaper.oversample = '4x'
        this.output = new Tone.Gain()

        this.comp.chain(this.shaper, this.output)

        if (destination) {
            this.output.connect(destination)
        } else {
            this.output.toDestination()
        }

        // Initialize all synthesized models
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
            const x = i * 2 / n_samples - 1
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
        const p = this.params[drum]

        // Micro-randomization (Analog Drift)
        const vDrift = velocity * (1 + (Math.random() * 0.1 - 0.05))
        const pDrift = p.pitch * (1 + (Math.random() * 0.02 - 0.01))
        const dDrift = p.decay * (1 + (Math.random() * 0.04 - 0.02))

        switch (drum) {
            case 'kick':
                if (this.currentKit === '808') {
                    // 808 Kick: tune 40-80Hz, decay 0.1-3s
                    const tune = 40 + (pDrift * 40)
                    const dec = 0.1 + (dDrift * 2.9)
                    this.kick808.trigger(time, tune, dec, vDrift)
                } else {
                    // 909 Kick: tune 45-65Hz, decay 0.1-0.6s
                    const tune = 45 + (pDrift * 20)
                    const dec = 0.1 + (dDrift * 0.5)
                    this.kick909.trigger(time, tune, dec, vDrift)
                }
                break
            case 'snare':
                if (this.currentKit === '808') {
                    // 808 Snare: toneBalance 0-1, snappyDecay 0.1-0.5s
                    const balance = pDrift
                    const dec = 0.1 + (dDrift * 0.4)
                    this.snare808.trigger(time, balance, dec, vDrift)
                } else {
                    // 909 Snare: toneCutoff 2000-8000Hz, snappyDecay 0.1-0.5s
                    const cutoff = 2000 + (pDrift * 6000)
                    const dec = 0.1 + (dDrift * 0.4)
                    this.snare909.trigger(time, cutoff, dec, vDrift)
                }
                break
            case 'hihat':
                // 808 Hi-Hat (common for both kits here as standard)
                this.hihat808.trigger(time, false, vDrift)
                break
            case 'hihatOpen':
                this.hihat808.trigger(time, true, vDrift)
                break
            case 'clap':
                // 808 Clap: decay 0.1-0.6s
                const cDec = 0.1 + (dDrift * 0.5)
                this.clap808.trigger(time, cDec, vDrift)
                break
        }
    }
}
