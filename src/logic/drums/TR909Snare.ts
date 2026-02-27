import * as Tone from 'tone';

export class TR909Snare {
  private osc1: Tone.Oscillator;
  private osc2: Tone.Oscillator;
  private tonalGain: Tone.Gain;
  private noiseBuffer: AudioBuffer;
  private hpf: Tone.BiquadFilter;
  private lpf: Tone.BiquadFilter;
  private noiseGain: Tone.Gain;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    this.osc1 = new Tone.Oscillator(160, 'triangle').start();
    this.osc2 = new Tone.Oscillator(220, 'triangle').start();
    this.tonalGain = new Tone.Gain(0);

    const bufferSize = Tone.getContext().sampleRate * 0.5;
    this.noiseBuffer = Tone.getContext().createBuffer(1, bufferSize, Tone.getContext().sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.hpf = new Tone.BiquadFilter({ type: 'highpass', frequency: 1000 });
    this.lpf = new Tone.BiquadFilter({ type: 'lowpass', frequency: 5000 });
    this.noiseGain = new Tone.Gain(0);
    this.output = new Tone.Gain();

    this.osc1.connect(this.tonalGain);
    this.osc2.connect(this.tonalGain);

    this.hpf.connect(this.lpf);
    this.lpf.connect(this.noiseGain);

    this.tonalGain.connect(this.output);
    this.noiseGain.connect(this.output);
    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, toneCutoff: number = 5000, snappyDecay: number = 0.3, velocity: number = 0.8) {
    const t = Tone.Time(time).toSeconds();

    // Body Pitch Sweep
    const f1 = 160;
    const f2 = 220;
    this.osc1.frequency.cancelScheduledValues(t);
    this.osc1.frequency.setValueAtTime(f1 * 2, t);
    this.osc1.frequency.exponentialRampToValueAtTime(f1, t + 0.05);

    this.osc2.frequency.cancelScheduledValues(t);
    this.osc2.frequency.setValueAtTime(f2 * 2, t);
    this.osc2.frequency.exponentialRampToValueAtTime(f2, t + 0.05);

    // Body Amp
    this.tonalGain.gain.cancelScheduledValues(t);
    this.tonalGain.gain.setValueAtTime(velocity, t);
    this.tonalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    // Noise (Snappy)
    this.lpf.frequency.setValueAtTime(toneCutoff, t);
    const noiseSrc = new Tone.ToneBufferSource(this.noiseBuffer).connect(this.hpf);
    this.noiseGain.gain.cancelScheduledValues(t);
    this.noiseGain.gain.setValueAtTime(velocity * 0.7, t);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.001, t + snappyDecay);
    noiseSrc.start(t);
    noiseSrc.stop(t + snappyDecay + 0.1);
  }

  dispose() {
    this.osc1.dispose();
    this.osc2.dispose();
    this.tonalGain.dispose();
    this.hpf.dispose();
    this.lpf.dispose();
    this.noiseGain.dispose();
    this.output.dispose();
  }
}
