import * as Tone from 'tone';

export class TR808Clap {
  private noiseBuffer: AudioBuffer;
  private noiseFilter: Tone.BiquadFilter;
  private envGain: Tone.Gain;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    const bufferSize = Tone.getContext().sampleRate * 0.5;
    this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseFilter = new Tone.BiquadFilter({
      type: 'bandpass',
      frequency: 1000,
      Q: 1
    });

    this.envGain = new Tone.Gain(0);
    this.output = new Tone.Gain();

    this.noiseFilter.connect(this.envGain);
    this.envGain.connect(this.output);
    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, decay: number = 0.3, velocity: number = 0.8) {
    const t = Tone.Time(time).toSeconds();
    const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer).connect(this.noiseFilter);

    // Triple attack envelope for the "snap"
    this.envGain.gain.cancelScheduledValues(t);

    // 1st burst
    this.envGain.gain.setValueAtTime(velocity, t);
    this.envGain.gain.exponentialRampToValueAtTime(0.01, t + 0.01);

    // 2nd burst
    this.envGain.gain.setValueAtTime(velocity * 0.8, t + 0.012);
    this.envGain.gain.exponentialRampToValueAtTime(0.01, t + 0.022);

    // 3rd burst (final decay)
    this.envGain.gain.setValueAtTime(velocity * 0.6, t + 0.024);
    this.envGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    noiseSrc.start(t);
    noiseSrc.stop(t + decay + 0.1);
  }

  dispose() {
    this.noiseFilter.dispose();
    this.envGain.dispose();
    this.output.dispose();
  }
}
