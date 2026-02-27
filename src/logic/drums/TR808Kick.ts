import * as Tone from 'tone';

export class TR808Kick {
  private osc: Tone.Oscillator;
  private ampEnv: Tone.Gain;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    this.osc = new Tone.Oscillator({
      type: 'sine',
      frequency: 50,
    }).start();

    this.ampEnv = new Tone.Gain(0);
    this.output = new Tone.Gain();

    this.osc.connect(this.ampEnv);
    this.ampEnv.connect(this.output);
    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, tune: number = 50, decay: number = 1.5, velocity: number = 0.8) {
    // 1. Pitch Envelope (Bridged-T diode sweep emulation)
    this.osc.frequency.cancelScheduledValues(time);
    this.osc.frequency.setValueAtTime(tune * 2.5, time);
    this.osc.frequency.exponentialRampToValueAtTime(tune, Tone.Time(time).toSeconds() + 0.05);

    // 2. Amplitude Envelope
    this.ampEnv.gain.cancelScheduledValues(time);
    this.ampEnv.gain.setValueAtTime(velocity, time);
    this.ampEnv.gain.exponentialRampToValueAtTime(0.001, Tone.Time(time).toSeconds() + decay);
  }

  dispose() {
    this.osc.dispose();
    this.ampEnv.dispose();
    this.output.dispose();
  }
}
