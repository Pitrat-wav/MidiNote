import * as Tone from 'tone'
import { TR808Kick } from './drums/TR808Kick'
import { TR909Kick } from './drums/TR909Kick'
import { TR808Snare } from './drums/TR808Snare'
import { TR909Snare } from './drums/TR909Snare'
import { TR808HiHat } from './drums/TR808HiHat'
import { TR808Clap } from './drums/TR808Clap'
import { TR808Cowbell } from './drums/TR808Cowbell'
import { makeDistortionCurve } from './DrumUtils'

export class DrumMachine {
    comp: Tone.Compressor
    shaper: Tone.WaveShaper
    output: Tone.Gain // Optional master output
    outputKick: Tone.Gain
    outputSnare: Tone.Gain
    outputHihat: Tone.Gain
    outputOpenHat: Tone.Gain
    outputClap: Tone.Gain
    outputCowbell: Tone.Gain
    currentKit: '808' | '909' = '808'

    private kit808: {
        kick: TR808Kick,
        snare: TR808Snare,
        hihat: TR808HiHat,
        hihatOpen: TR808HiHat,
        clap: TR808Clap,
        cowbell: TR808Cowbell
    }
    private kit909: {
        kick: TR909Kick,
        snare: TR909Snare,
        hihat: TR808HiHat,
        hihatOpen: TR808HiHat,
        clap: TR808Clap,
        cowbell: TR808Cowbell
    }

    private params: Record<string, { pitch: number, decay: number }> = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 },
        cowbell: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.comp = new Tone.Compressor(-24, 4)
        this.shaper = new Tone.WaveShaper(makeDistortionCurve(20))
        this.shaper.oversample = '4x'
        this.output = new Tone.Gain(1)
        this.outputKick = new Tone.Gain(1)
        this.outputSnare = new Tone.Gain(1)
        this.outputHihat = new Tone.Gain(1)
        this.outputOpenHat = new Tone.Gain(1)
        this.outputClap = new Tone.Gain(1)
        this.outputCowbell = new Tone.Gain(1)

        this.comp.chain(this.shaper, this.output, Tone.Destination)

        // Route all individual drum outputs through the master compressor
        this.outputKick.connect(this.comp)
        this.outputSnare.connect(this.comp)
        this.outputHihat.connect(this.comp)
        this.outputOpenHat.connect(this.comp)
        this.outputClap.connect(this.comp)
        this.outputCowbell.connect(this.comp)

        this.kit808 = {
            kick: new TR808Kick(this.outputKick),
            snare: new TR808Snare(this.outputSnare),
            hihat: new TR808HiHat(this.outputHihat),
            hihatOpen: new TR808HiHat(this.outputOpenHat),
            clap: new TR808Clap(this.outputClap),
            cowbell: new TR808Cowbell(this.outputCowbell)
        }

        this.kit909 = {
            kick: new TR909Kick(this.outputKick),
            snare: new TR909Snare(this.outputSnare),
            hihat: new TR808HiHat(this.outputHihat),
            hihatOpen: new TR808HiHat(this.outputOpenHat),
            clap: new TR808Clap(this.outputClap),
            cowbell: new TR808Cowbell(this.outputCowbell)
        }
    }

    setSaturation(amount: number) {
        this.shaper.curve = makeDistortionCurve(amount)
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
    }

    setDrumParams(drum: string, pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'cowbell', time: number, velocity: number = 0.8) {
        const p = this.params[drum]
        const kit808 = this.kit808
        const kit909 = this.kit909

        // Hi-hat choking: Closed hat stops open hat
        if (drum === 'hihat') {
            if (this.currentKit === '808') kit808.hihatOpen.stop(time);
            else kit909.hihatOpen.stop(time);
        }

        if (this.currentKit === '808') {
            switch (drum) {
                case 'kick': kit808.kick.trigger(time, p.pitch, p.decay, velocity); break
                case 'snare': kit808.snare.trigger(time, p.pitch, p.decay, velocity); break
                case 'hihat': kit808.hihat.trigger(time, false, p.pitch, p.decay, velocity); break
                case 'hihatOpen': kit808.hihatOpen.trigger(time, true, p.pitch, p.decay, velocity); break
                case 'clap': kit808.clap.trigger(time, p.pitch, p.decay, velocity); break
                case 'cowbell': kit808.cowbell.trigger(time, p.pitch, p.decay, velocity); break
            }
        } else {
            switch (drum) {
                case 'kick': kit909.kick.trigger(time, p.pitch, p.decay, velocity); break
                case 'snare': kit909.snare.trigger(time, p.pitch, p.decay, velocity); break
                case 'hihat': kit909.hihat.trigger(time, false, p.pitch, p.decay, velocity); break
                case 'hihatOpen': kit909.hihatOpen.trigger(time, true, p.pitch, p.decay, velocity); break
                case 'clap': kit909.clap.trigger(time, p.pitch, p.decay, velocity); break
                case 'cowbell': kit909.cowbell.trigger(time, p.pitch, p.decay, velocity); break
            }
        }
    }
}
