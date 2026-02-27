import * as Tone from 'tone';

export class TR909Kick {
  private bodyOsc: Tone.Oscillator;
  private bodyGain: Tone.Gain;
  private noiseBuffer: AudioBuffer;
  private noiseFilter: Tone.BiquadFilter;
  private noiseGain: Tone.Gain;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    this.bodyOsc = new Tone.Oscillator({
      type: 'triangle',
      frequency: 50,
    }).start();

    this.bodyGain = new Tone.Gain(0);
    this.output = new Tone.Gain();

    // Noise Click layer
    const bufferSize = Tone.getContext().sampleRate * 0.05;
    this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseFilter = new Tone.BiquadFilter({
      type: 'highpass',
      frequency: 1000
    });
    this.noiseGain = new Tone.Gain(0);

    this.bodyOsc.connect(this.bodyGain);
    this.bodyGain.connect(this.output);

    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.output);

    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, tune: number = 50, decay: number = 0.5, velocity: number = 0.8) {
    // 1. Body Pitch Envelope (VCO Sweep)
    const startFreq = tune * 4.7;
    this.bodyOsc.frequency.cancelScheduledValues(time);
    this.bodyOsc.frequency.setValueAtTime(startFreq, time);
    this.bodyOsc.frequency.exponentialRampToValueAtTime(tune, Tone.Time(time).toSeconds() + 0.1);

    // 2. Body Amp Envelope
    this.bodyGain.gain.cancelScheduledValues(time);
    this.bodyGain.gain.setValueAtTime(velocity, time);
    this.bodyGain.gain.exponentialRampToValueAtTime(0.001, Tone.Time(time).toSeconds() + decay);

    // 3. Click Layer (Noise)
    const noiseTime = Tone.Time(time).toSeconds();
    const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer).connect(this.noiseFilter);
    this.noiseGain.gain.cancelScheduledValues(noiseTime);
    this.noiseGain.gain.setValueAtTime(velocity * 0.7, noiseTime);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.001, noiseTime + 0.02);
    noiseSrc.start(noiseTime);
    noiseSrc.stop(noiseTime + 0.05);
  }

  dispose() {
    this.bodyOsc.dispose();
    this.bodyGain.dispose();
    this.noiseFilter.dispose();
    this.noiseGain.dispose();
    this.output.dispose();
  }
}
