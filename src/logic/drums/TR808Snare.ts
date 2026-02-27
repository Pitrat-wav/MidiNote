import * as Tone from 'tone';

export class TR808Snare {
  private oscLow: Tone.Oscillator;
  private oscHigh: Tone.Oscillator;
  private gainLow: Tone.Gain;
  private gainHigh: Tone.Gain;
  private masterTonalGain: Tone.Gain;
  private noiseBuffer: AudioBuffer;
  private noiseFilter: Tone.BiquadFilter;
  private snappyGain: Tone.Gain;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    this.oscLow = new Tone.Oscillator(238, 'sine').start();
    this.oscHigh = new Tone.Oscillator(476, 'sine').start();

    this.gainLow = new Tone.Gain(0.5);
    this.gainHigh = new Tone.Gain(0.5);
    this.masterTonalGain = new Tone.Gain(0);

    // Noise (Snappy)
    const bufferSize = Tone.getContext().sampleRate * 0.5;
    this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseFilter = new Tone.BiquadFilter({
      type: 'highpass',
      frequency: 1800
    });
    this.snappyGain = new Tone.Gain(0);
    this.output = new Tone.Gain();

    this.oscLow.connect(this.gainLow);
    this.oscHigh.connect(this.gainHigh);
    this.gainLow.connect(this.masterTonalGain);
    this.gainHigh.connect(this.masterTonalGain);

    this.noiseFilter.connect(this.snappyGain);

    this.masterTonalGain.connect(this.output);
    this.snappyGain.connect(this.output);
    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, toneBalance: number = 0.5, snappyDecay: number = 0.3, velocity: number = 0.8) {
    const t = Tone.Time(time).toSeconds();

    // Tonal Balance
    this.gainLow.gain.setValueAtTime(1 - toneBalance, t);
    this.gainHigh.gain.setValueAtTime(toneBalance, t);

    // Tonal Envelope
    this.masterTonalGain.gain.cancelScheduledValues(t);
    this.masterTonalGain.gain.setValueAtTime(velocity, t);
    this.masterTonalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    // Snappy (Noise)
    const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer).connect(this.noiseFilter);
    this.snappyGain.gain.cancelScheduledValues(t);
    this.snappyGain.gain.setValueAtTime(velocity * 0.8, t);
    this.snappyGain.gain.exponentialRampToValueAtTime(0.001, t + snappyDecay);
    noiseSrc.start(t);
    noiseSrc.stop(t + snappyDecay + 0.1);
  }

  dispose() {
    this.oscLow.dispose();
    this.oscHigh.dispose();
    this.gainLow.dispose();
    this.gainHigh.dispose();
    this.masterTonalGain.dispose();
    this.noiseFilter.dispose();
    this.snappyGain.dispose();
    this.output.dispose();
  }
}
