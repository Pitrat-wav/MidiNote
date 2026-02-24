import * as Tone from 'tone'

export class TR909Snare {
    private output: Tone.ToneAudioNode
    private noiseBuffer: AudioBuffer

    constructor(output: Tone.ToneAudioNode) {
        this.output = output
        this.noiseBuffer = this.generateNoiseBuffer(0.5)
    }

    trigger(time: number, toneCutoff: number = 5000, snappyDecay: number = 0.3, velocity: number = 0.8) {
        // Micro-randomization
        const freqDrift = (Math.random() * 4) - 2
        const actualSnappyDecay = snappyDecay * (1 + (Math.random() * 0.06 - 0.03))

        // Tonal Body
        const freq1 = 160 + freqDrift
        const freq2 = 220 + freqDrift
        const osc1 = new Tone.Oscillator(freq1, 'triangle')
        const osc2 = new Tone.Oscillator(freq2, 'triangle')
        const tonalGain = new Tone.Gain(0).connect(this.output)

        osc1.connect(tonalGain)
        osc2.connect(tonalGain)

        // Pitch Sweep
        osc1.frequency.setValueAtTime(freq1 * 2, time)
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05)
        osc2.frequency.setValueAtTime(freq2 * 2, time)
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05)

        tonalGain.gain.setValueAtTime(velocity, time)
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

        // Noise
        const noiseSrc = new Tone.BufferSource(this.noiseBuffer)
        const hpf = new Tone.Filter(1000 * (1 + (Math.random() * 0.04 - 0.02)), 'highpass')
        const lpf = new Tone.Filter(toneCutoff, 'lowpass').connect(this.output)
        const noiseGain = new Tone.Gain(0).connect(hpf)

        noiseSrc.connect(noiseGain)
        hpf.connect(lpf)

        noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + actualSnappyDecay)

        osc1.start(time)
        osc2.start(time)
        noiseSrc.start(time)

        const stopTime = time + Math.max(0.2, actualSnappyDecay) + 0.1
        osc1.stop(stopTime)
        osc2.stop(stopTime)
        noiseSrc.stop(stopTime)

        osc1.onstop = () => {
            osc1.dispose()
            osc2.dispose()
            tonalGain.dispose()
        }
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            hpf.dispose()
            lpf.dispose()
            noiseGain.dispose()
        }
    }

    private generateNoiseBuffer(duration: number) {
        const sampleRate = Tone.getContext().sampleRate
        const bufferSize = sampleRate * duration
        const buffer = (Tone.getContext().rawContext as AudioContext).createBuffer(1, bufferSize, sampleRate)
        const output = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }
        return buffer
    }
}
