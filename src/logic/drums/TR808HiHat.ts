import * as Tone from 'tone';

export class TR808HiHat {
  private oscillators: Tone.Oscillator[] = [];
  private mixGain: Tone.Gain;
  private bpf1: Tone.BiquadFilter;
  private bpf2: Tone.BiquadFilter;
  private envGain: Tone.Gain;
  private hpf: Tone.BiquadFilter;
  private output: Tone.Gain;

  constructor(output: Tone.ToneAudioNode) {
    const freqs = [205.3, 304.4, 369.6, 522.7, 800, 540];
    this.mixGain = new Tone.Gain(0.15);

    freqs.forEach(f => {
      const osc = new Tone.Oscillator(f, 'square').start();
      osc.connect(this.mixGain);
      this.oscillators.push(osc);
    });

    this.bpf1 = new Tone.BiquadFilter({ type: 'bandpass', frequency: 3440, Q: 1.5 });
    this.bpf2 = new Tone.BiquadFilter({ type: 'bandpass', frequency: 7100, Q: 1.5 });

    this.envGain = new Tone.Gain(0);
    this.hpf = new Tone.BiquadFilter({ type: 'highpass', frequency: 7000 });
    this.output = new Tone.Gain();

    this.mixGain.connect(this.bpf1);
    this.mixGain.connect(this.bpf2);

    this.bpf1.connect(this.envGain);
    this.bpf2.connect(this.envGain);

    this.envGain.connect(this.hpf);
    this.hpf.connect(this.output);
    this.output.connect(output);
  }

  trigger(time: Tone.Unit.Time, decay: number = 0.05, velocity: number = 0.8) {
    const t = Tone.Time(time).toSeconds();

    // Add micro-drift to oscillators
    this.oscillators.forEach(osc => {
      const drift = (Math.random() - 0.5) * 4;
      const currentFreq = (osc.frequency.value as any) as number;
      osc.frequency.setValueAtTime(currentFreq + drift, t);
    });

    this.envGain.gain.cancelScheduledValues(t);
    this.envGain.gain.setValueAtTime(velocity, t);
    this.envGain.gain.exponentialRampToValueAtTime(0.001, t + decay);
  }

  dispose() {
    this.oscillators.forEach(o => o.dispose());
    this.mixGain.dispose();
    this.bpf1.dispose();
    this.bpf2.dispose();
    this.envGain.dispose();
    this.hpf.dispose();
    this.output.dispose();
  }
}
