import * as Tone from 'tone'
import { TR808Kick } from './drum/TR808Kick'
import { TR909Kick } from './drum/TR909Kick'
import { TR808Snare } from './drum/TR808Snare'
import { TR909Snare } from './drum/TR909Snare'
import { TR808HiHat } from './drum/TR808HiHat'
import { TR808Clap } from './drum/TR808Clap'

export class DrumMachine {
    private kick808: TR808Kick
    private kick909: TR909Kick
    private snare808: TR808Snare
    private snare909: TR909Snare
    private hihat808: TR808HiHat
    private clap808: TR808Clap

    output: Tone.Gain
    saturation: Tone.WaveShaper
    comp: Tone.Compressor

    currentKit: '808' | '909' = '808'

    // Internal params cache
    private params = {
        kick: { pitch: 0.5, decay: 0.5 },
        snare: { pitch: 0.5, decay: 0.5 },
        hihat: { pitch: 0.5, decay: 0.5 },
        hihatOpen: { pitch: 0.5, decay: 0.5 },
        clap: { pitch: 0.5, decay: 0.5 }
    }

    constructor() {
        this.output = new Tone.Gain(1)
        this.saturation = new Tone.WaveShaper(this.makeDistortionCurve(15))
        this.comp = new Tone.Compressor(-24, 4)

        // Connect chain
        this.output.chain(this.saturation, this.comp, Tone.Destination)

        this.kick808 = new TR808Kick(this.output)
        this.kick909 = new TR909Kick(this.output)
        this.snare808 = new TR808Snare(this.output)
        this.snare909 = new TR909Snare(this.output)
        this.hihat808 = new TR808HiHat(this.output)
        this.clap808 = new TR808Clap(this.output)
    }

    private makeDistortionCurve(amount: number) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i ) {
            let x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
    }

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        this.params[drum] = { pitch, decay }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        const { pitch, decay } = this.params[drum]

        // Micro-randomization
        const pitchDrift = pitch + (Math.random() * 0.02 - 0.01)
        const v = velocity * (0.9 + Math.random() * 0.2) // Velocity variance

        if (this.currentKit === '808') {
            switch (drum) {
                case 'kick': this.kick808.trigger(time, v, pitchDrift, decay); break;
                case 'snare': this.snare808.trigger(time, v, pitchDrift, decay); break;
                case 'hihat': this.hihat808.trigger(time, v, pitchDrift, decay, false); break;
                case 'hihatOpen': this.hihat808.trigger(time, v, pitchDrift, decay, true); break;
                case 'clap': this.clap808.trigger(time, v, pitchDrift, decay); break;
            }
        } else {
            switch (drum) {
                case 'kick': this.kick909.trigger(time, v, pitchDrift, decay); break;
                case 'snare': this.snare909.trigger(time, v, pitchDrift, decay); break;
                case 'hihat': this.hihat808.trigger(time, v, pitchDrift, decay, false); break;
                case 'hihatOpen': this.hihat808.trigger(time, v, pitchDrift, decay, true); break;
                case 'clap': this.clap808.trigger(time, v, pitchDrift, decay); break;
            }
        }
    }
}
