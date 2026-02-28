import * as Tone from 'tone'

export class TR909Snare {
    private noiseBuffer: AudioBuffer
    output: Tone.Gain

    constructor(destination?: Tone.ToneAudioNode) {
        const bufferSize = Tone.getContext().sampleRate * 0.5
        this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate)
        const data = this.noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        this.output = new Tone.Gain()
        if (destination) {
            this.output.connect(destination)
        } else {
            this.output.toDestination()
        }
    }

    trigger(time: number, toneCutoff: number = 5000, snappyDecay: number = 0.3, velocity: number = 0.8) {
        const freq1 = 160
        const freq2 = 220

        // Tonal
        const osc1 = new Tone.Oscillator(freq1, 'triangle')
        const osc2 = new Tone.Oscillator(freq2, 'triangle')
        const tonalGain = new Tone.Gain(0)

        osc1.connect(tonalGain)
        osc2.connect(tonalGain)
        tonalGain.connect(this.output)

        osc1.frequency.setValueAtTime(freq1 * 2, time)
        osc1.frequency.exponentialRampToValueAtTime(freq1, time + 0.05)
        osc2.frequency.setValueAtTime(freq2 * 2, time)
        osc2.frequency.exponentialRampToValueAtTime(freq2, time + 0.05)

        tonalGain.gain.setValueAtTime(velocity, time)
        tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
        tonalGain.gain.linearRampToValueAtTime(0, time + 0.21)

        osc1.start(time).stop(time + 0.22)
        osc2.start(time).stop(time + 0.22)
        osc1.onstop = () => {
            osc1.dispose()
            osc2.dispose()
            tonalGain.dispose()
        }

        // Noise
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer)
        const hpf = new Tone.BiquadFilter(1000, 'highpass')
        const lpf = new Tone.BiquadFilter(toneCutoff, 'lowpass')
        const noiseGain = new Tone.Gain(0)

        noiseSrc.connect(hpf)
        hpf.connect(lpf)
        lpf.connect(noiseGain)
        noiseGain.connect(this.output)

        noiseGain.gain.setValueAtTime(velocity * 0.7, time)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + snappyDecay)
        noiseGain.gain.linearRampToValueAtTime(0, time + snappyDecay + 0.01)

        noiseSrc.start(time).stop(time + snappyDecay + 0.05)
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            hpf.dispose()
            lpf.dispose()
            noiseGain.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
