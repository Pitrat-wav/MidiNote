# JULES TECHNICAL ROADMAP: MidiNote Audio Engine Overhaul

## I. DSP Synthesis & Research Implementation (TR-808/909)
*Based on "Analog Drum Synthesis in Web Audio API" research.*

1.  **Remove Samples:** Completely replace sample-based `Kick`, `Snare`, and `Hi-Hats` with procedural generation.
2.  **Audio Context Time:** Rewrite sequencer timing from `setInterval` to `audioCtx.currentTime` for sample-accurate scheduling.
3.  **Soft Clipper Node:** Implement a custom `WaveShaperNode` with a hyperbolic tangent curve for master bus saturation.
4.  **Analog Drift Utility:** Create an `AnalogDrift` utility to inject random frequency deviations (±1-2 cents) per trigger.
5.  **808 Kick Core:** Implement `Bridged-T Network` emulation using Sine Oscillator + Pitch Envelope (start ~150Hz, drop to ~50Hz in 0.05s).
6.  **808 Amp Envelope:** Implement VCA envelope with separate instantaneous Attack and long Decay (up to 3s).
7.  **808 Pulse Click:** Add a Dirac impulse or fast Pitch Sweep (5ms) for the attack transient.
8.  **909 Kick Oscillator:** Implement Triangle wave core passed through Soft Clipper for harmonics.
9.  **909 Pitch Env:** Create aggressive pitch envelope (Start ~230Hz, drop to ~50Hz) for the "punch".
10. **909 Noise Click:** Add filtered noise layer (HPF > 1kHz) with ultra-short envelope (10-20ms).
11. **Snare Tonal Core (808):** Implement dual sine oscillators (~180Hz & ~330Hz) for membrane modes.
12. **Snare Noise (808):** Create White Noise generator for the "Snappy" component.
13. **Snare Filter (808):** Apply HPF (~2kHz) to noise to prevent phase cancellation with tonal oscillators.
14. **909 Snare Tone:** Implement Triangle waves with pitch sweep (~300Hz to ~180Hz).
15. **LFSR Noise (909):** Emulate 6-bit LFSR noise instead of pure white noise for digital texture.
16. **Hi-Hat Oscillator Matrix:** Create a bank of 6 Square Oscillators (205.3, 304.4, 369.6, 522.7, 800, 540 Hz).
17. **Inharmonic Summing:** Mix the 6 oscillators to create the metallic spectrum base.
18. **Bandpass Filtering:** Route the sum through two parallel Bandpass filters (3.5kHz & 7kHz).
19. **High-Pass Cleanup:** Add final HPF (7kHz) for the "sizzle".
20. **VCA Hi-Hats:** Implement distinct envelopes for Closed (short) and Open (long) hats sharing the same source.
21. **Phase Randomization:** Randomize oscillator phases on start to emulate analog free-running behavior.
22. **Gain Staging:** Calibrate all synthesized instruments to peak at -3dB max.
23. **Cleanup:** Ensure `osc.stop()` and `disconnect()` are called immediately after envelopes finish to save CPU.
24. **Preset Logic:** Implement backend logic to switch synthesis algorithms between "808 Mode" and "909 Mode".

## II. Core Audio & Stability (Bug Fixes)
25. **Audio Context Fix:** Eliminate clicks/pops when starting/stopping `Tone.Transport`.
26. **State Sync:** Ensure `audioStore.currentStep` syncs perfectly with audio thread without visual lag.
27. **Drum Muting Fix:** Fix bug where changing Euclidean pulses in real-time causes note drops.
28. **Haptic Logic:** Optimize haptic feedback triggers to strictly follow the rhythm (strong on downbeat).
29. **Memory Leaks:** Fix potential memory leaks in `Oscilloscope` audio node connections.
30. **Knob Values:** Fix floating point precision issues in knob value updates.
31. **AcidSynth Cutoff:** Smooth out filter frequency transitions to prevent stepping artifacts.
32. **MIDI Export Logic:** Verify exported MIDI file quantization against current BPM.
33. **iOS Silent Switch:** Improve the silent audio buffer workaround for iOS mute switch.
34. **Zustand Selectors:** Optimize store subscriptions to prevent unnecessary logic re-runs.
35. **Background Handling:** Auto-suspend `AudioContext` when app is minimized/backgrounded.
36. **Bass Pattern Persistence:** Fix data loss of bass patterns when switching views.
37. **Build Errors:** Resolve all TypeScript strict mode warnings in the build process.
38. **Error Boundaries:** Wrap audio engine initialization in try/catch to prevent app crash.
39. **API Security:** Securely handle `VITE_API_URL` and add connection health checks.

## III. Performance Optimization
40. **Canvas Rendering:** Refactor Sequencer grid rendering to use HTML5 Canvas instead of DOM nodes.
41. **Lazy Loading:** Implement lazy loading for any remaining fallback samples.
42. **Web Worker:** Move sequencing clock logic to a Web Worker for stable timing off the main thread.
43. **Memoization:** Apply `React.memo` to heavy logic components in the sequencer.
44. **Bundle Size:** Tree-shake `tonaljs` and `lucide-react` imports.
45. **Storage:** Implement `zustand/persist` for local storage of sessions.
46. **Throttling:** Throttle high-frequency event listeners (knobs/sliders).
47. **Oscilloscope Decimation:** Reduce FFT size and draw rate for the oscilloscope to save GPU/CPU.
48. **Audio Node Garbage Collection:** Explicitly dispose of unused Tone.js nodes.
49. **React Profiling:** Fix re-render loops in `App.tsx` triggered by BPM changes.

## IV. Feature Logic (No UI Design)
50. **Harmony Progressions:** Implement logic for chord progression generation (II-V-I presets).
51. **Mixer Panning:** Add `StereoPannerNode` to each instrument channel in the audio graph.
52. **Velocity Logic:** Map pad touch position (Y-axis) to velocity gain.
53. **Pattern Randomizer:** Implement the algorithm for randomizing Euclidean parameters.
54. **AcidSynth Slide:** Implement Portamento/Glide logic in the Acid synth.
55. **Mixer Effects:** Add Reverb and Delay nodes to the master bus chain.
56. **AI Pattern Logic:** Integrate basic Markov Chain or random walk for melody generation.
57. **Multi-Track Recording:** Implement `MediaRecorder` API to capture session output to WAV.
58. **Preset System:** Create JSON schema and handlers for saving/loading instrument presets.
59. **Step Probability:** Add probability logic to the sequencer trigger function.
60. **Scale Locking:** Implement note quantization logic to force inputs into a specific scale.
61. **Session Sharing:** Generate/Parse URL parameters to share state.
62. **MIDI Input:** Add `navigator.requestMIDIAccess` listeners to control synth via external hardware.
63. **Arpeggiator Logic:** Implement an arpeggiator clock and note sorter for the Harmony engine.
64. **Voice-to-MIDI:** Implement pitch detection (autocorrelation) to convert microphone input to MIDI notes.
65. **Keyboard Shortcuts:** Add global event listeners for transport control (Spacebar, etc).
66. **Project Cleanup:** Remove unused legacy files and artifacts.
67. **SEO/Meta:** Update meta tags for correct preview generation.
