import * as Tone from 'tone'

export class WhiteNoise {
    private static buffer: AudioBuffer | null = null

    static getBuffer(context: AudioContext): AudioBuffer {
        if (!this.buffer) {
            const bufferSize = context.sampleRate * 2 // 2 seconds of noise
            this.buffer = context.createBuffer(1, bufferSize, context.sampleRate)
            const output = this.buffer.getChannelData(0)
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1
            }
        }
        return this.buffer
    }
}
