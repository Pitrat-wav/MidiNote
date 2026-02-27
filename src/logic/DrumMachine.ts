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
    waveShaper: Tone.WaveShaper
    output: Tone.Gain
    currentKit: '808' | '909' = '808'

    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.output = new Tone.Gain().toDestination()
        this.comp = new Tone.Compressor(-24, 4).connect(this.output)

        // Master Saturation Stage
        this.waveShaper = new Tone.WaveShaper((x) => Math.tanh(x * 1.5)).connect(this.comp)

        // Initialize all engines
        this.kick808 = new TR808Kick(this.waveShaper)
        this.kick909 = new TR909Kick(this.waveShaper)
        this.snare808 = new TR808Snare(this.waveShaper)
        this.snare909 = new TR909Snare(this.waveShaper)
        this.hihat808 = new TR808HiHat(this.waveShaper)
        this.clap808 = new TR808Clap(this.waveShaper)
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
    }

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        // Apply micro-randomization to velocity
        const v = velocity * (0.9 + Math.random() * 0.2)
        const t = Tone.Time(time).toSeconds()

        const p = this.params[drum]

        switch (drum) {
            case 'kick':
                if (this.currentKit === '808') {
                    // Map pitch 0.5 to 50Hz, range 40-80Hz
                    const tune = 40 + p.pitch * 40
                    // Map decay 0.5 to 1.5s, range 0.1s-3s
                    const decay = 0.1 + p.decay * 2.9
                    this.kick808.trigger(t, tune, decay, v)
                } else {
                    // Map pitch 0.5 to 50Hz, range 45-65Hz
                    const tune = 45 + p.pitch * 20
                    // Map decay 0.5 to 0.5s, range 0.2s-0.8s
                    const decay = 0.2 + p.decay * 0.6
                    this.kick909.trigger(t, tune, decay, v)
                }
                break
            case 'snare':
                if (this.currentKit === '808') {
                    // Tone balance maps to p.pitch
                    const snappyDecay = 0.1 + p.decay * 0.4
                    this.snare808.trigger(t, p.pitch, snappyDecay, v)
                } else {
                    // Filter cutoff maps to p.pitch (1000Hz - 8000Hz)
                    const cutoff = 1000 + p.pitch * 7000
                    const snappyDecay = 0.1 + p.decay * 0.4
                    this.snare909.trigger(t, cutoff, snappyDecay, v)
                }
                break
            case 'hihat':
                // Decay maps to p.decay (0.02s - 0.1s)
                const hhDecay = 0.02 + p.decay * 0.08
                this.hihat808.trigger(t, hhDecay, v)
                break
            case 'hihatOpen':
                // Decay maps to p.decay (0.2s - 0.8s)
                const hoDecay = 0.2 + p.decay * 0.6
                this.hihat808.trigger(t, hoDecay, v)
                break
            case 'clap':
                // Decay maps to p.decay (0.1s - 0.6s)
                const clapDecay = 0.1 + p.decay * 0.5
                this.clap808.trigger(t, clapDecay, v)
                break
        }
    }
}
