import * as Tone from 'tone'

export class TR808Clap {
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

    trigger(time: number, decay: number = 0.3, velocity: number = 0.8) {
        const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer)
        const filter = new Tone.BiquadFilter(1200, 'bandpass')
        filter.Q.value = 1
        const envGain = new Tone.Gain(0)

        noiseSrc.connect(filter)
        filter.connect(envGain)
        envGain.connect(this.output)

        // Triple attack
        envGain.gain.setValueAtTime(velocity, time)
        envGain.gain.exponentialRampToValueAtTime(0.1, time + 0.01)
        envGain.gain.setValueAtTime(velocity, time + 0.012)
        envGain.gain.exponentialRampToValueAtTime(0.1, time + 0.022)
        envGain.gain.setValueAtTime(velocity, time + 0.024)
        envGain.gain.exponentialRampToValueAtTime(0.1, time + 0.034)
        envGain.gain.setValueAtTime(velocity, time + 0.036)
        envGain.gain.exponentialRampToValueAtTime(0.001, time + 0.036 + decay)
        envGain.gain.linearRampToValueAtTime(0, time + 0.036 + decay + 0.01)

        noiseSrc.start(time).stop(time + 0.036 + decay + 0.05)
        noiseSrc.onended = () => {
            noiseSrc.dispose()
            filter.dispose()
            envGain.dispose()
        }
    }

    dispose() {
        this.output.dispose()
    }
}
