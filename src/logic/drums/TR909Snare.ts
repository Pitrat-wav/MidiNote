import * as Tone from 'tone'

export class TR909Snare {
    private destination: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(destination: Tone.ToneAudioNode) {
        this.destination = destination

        const rawContext = Tone.context.rawContext as AudioContext
        const bufferSize = rawContext.sampleRate * 0.5
        this.noiseBuffer = rawContext.createBuffer(1, bufferSize, rawContext.sampleRate)
        const output = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }
    }

    trigger(time: number, toneCutoff: number = 5000, snappyDecay: number = 0.3, velocity: number = 0.8) {
        // Tonal Body (Triangle waves with Pitch Envelope)
        const osc1 = new Tone.Oscillator(160, 'triangle')
        const osc2 = new Tone.Oscillator(220, 'triangle')
        const tonalGain = new Tone.Gain(velocity)

        osc1.frequency.setValueAtTime(160 * 2, time)
        osc1.frequency.exponentialRampToValueAtTime(160, time + 0.05)
        osc2.frequency.setValueAtTime(220 * 2, time)
        osc2.frequency.exponentialRampToValueAtTime(220, time + 0.05)

        osc1.connect(tonalGain)
        osc2.connect(tonalGain)
        tonalGain.connect(this.destination)

        tonalGain.gain.setValueAtTime(velocity, time)
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        osc1.start(time).stop(time + 0.2)
        osc2.start(time).stop(time + 0.2)

        // Snappy (Noise with HPF and LPF)
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const hpf = new Tone.BiquadFilter(1000, 'highpass')
        const lpf = new Tone.BiquadFilter(toneCutoff, 'lowpass')
        const noiseGain = new Tone.Gain(velocity * 0.7)

        noiseSrc.connect(hpf)
        hpf.connect(lpf)
        lpf.connect(noiseGain)
        noiseGain.connect(this.destination)

        noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)

        noiseSrc.start(time).stop(time + snappyDecay + 0.1)

        osc1.onstop = () => {
            osc1.dispose()
            osc2.dispose()
            tonalGain.dispose()
            noiseSrc.dispose()
            hpf.dispose()
            lpf.dispose()
            noiseGain.dispose()
        }
    }
}
