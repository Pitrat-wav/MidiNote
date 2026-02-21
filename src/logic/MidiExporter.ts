import MidiWriter from 'midi-writer-js'
import { BassStep } from './StingGenerator'
import { Stage } from '../store/instrumentStore'
import * as Tone from 'tone'
import { generatePadProgression } from './PadGenerator'
import { GridWalker, SnakePattern } from './GridWalker'

export function exportToMidi(
    bpm: number,
    drums: { kick: number[], snare: number[], hihat: number[], hihatOpen: number[], clap: number[] },
    bassPattern: BassStep[],
    stages: Stage[],
    snakeGrid: number[],
    snakePattern: SnakePattern,
    harmony: { root: string, scale: any, complexity: number, active: boolean }
): Uint8Array {
    const track1 = new MidiWriter.Track()
    // @ts-ignore
    track1.setTempo(bpm)
    track1.addTrackName('Acid Bass')

    const track2 = new MidiWriter.Track()
    track2.addTrackName('Drums')

    const track3 = new MidiWriter.Track()
    track3.addTrackName('Lead (ML-185)')

    const track4 = new MidiWriter.Track()
    track4.addTrackName('Ambient Pads')

    const TICKS_PER_16TH = 32

    // 1. Bass Track (4 bars = 64 steps)
    for (let bar = 0; bar < 4; bar++) {
        let i = 0
        while (i < 16) {
            const step = bassPattern[i]
            if (step && step.active) {
                let durationTicks = TICKS_PER_16TH
                let skip = 1

                // Slide: extend note duration
                if (step.slide && i < 15) {
                    durationTicks += TICKS_PER_16TH
                    skip = 2
                }

                track1.addEvent(new MidiWriter.NoteEvent({
                    pitch: [step.note] as any,
                    duration: ('t' + durationTicks) as any,
                    velocity: step.accent ? 127 : 90,
                    sequential: true
                }))
                i += skip
            } else {
                track1.addEvent(new MidiWriter.NoteEvent({
                    pitch: [],
                    duration: ('t' + TICKS_PER_16TH) as any,
                    sequential: true
                }))
                i++
            }
        }
    }

    // 2. Drums Track (4 bars)
    for (let bar = 0; bar < 4; bar++) {
        for (let step = 0; step < 16; step++) {
            const notes = []
            if (drums.kick[step % drums.kick.length]) notes.push('C1')
            if (drums.snare[step % drums.snare.length]) notes.push('D1')
            if (drums.hihat[step % drums.hihat.length]) notes.push('F#1')
            if (drums.hihatOpen[step % drums.hihatOpen.length]) notes.push('A#1')
            if (drums.clap[step % drums.clap.length]) notes.push('D#1')

            if (notes.length > 0) {
                track2.addEvent(new MidiWriter.NoteEvent({
                    pitch: notes as any,
                    duration: ('t' + TICKS_PER_16TH) as any,
                    sequential: true
                }))
            } else {
                track2.addEvent(new MidiWriter.NoteEvent({
                    pitch: [],
                    duration: ('t' + TICKS_PER_16TH) as any,
                    sequential: true
                }))
            }
        }
    }

    // 3. Lead Track (ML-185 Simulation - 4 bars / 64 pulses)
    let currentSnakeIdx = 0
    let pulsesUsed = 0
    const totalPulses = 64
    let stageIdx = 0

    while (pulsesUsed < totalPulses) {
        const stage = stages[stageIdx % stages.length]
        const stageDuration = stage.length * stage.pulseCount

        for (let p = 0; p < stageDuration; p++) {
            if (pulsesUsed >= totalPulses) break

            const midiNote = snakeGrid[currentSnakeIdx]
            const noteName = Tone.Frequency(midiNote, 'midi').toNote()

            let played = false
            if (p === 0) { // Start of stage
                if (stage.gateMode === 1 || stage.gateMode === 2) { // Single or Multi
                    const shouldPlay = Math.random() < stage.probability
                    if (shouldPlay) {
                        track3.addEvent(new MidiWriter.NoteEvent({
                            pitch: [noteName] as any,
                            duration: ('t' + (stage.gateMode === 2 ? TICKS_PER_16TH : (stage.length * TICKS_PER_16TH))) as any,
                            velocity: Math.floor(stage.velocity * 127),
                            sequential: true
                        }))
                        played = true
                        currentSnakeIdx = GridWalker.getNextIndex(currentSnakeIdx, snakePattern)
                    }
                } else if (stage.gateMode === 3) { // Hold
                    track3.addEvent(new MidiWriter.NoteEvent({
                        pitch: [noteName] as any,
                        duration: ('t' + (stageDuration * TICKS_PER_16TH)) as any,
                        velocity: Math.floor(stage.velocity * 127),
                        sequential: true
                    }))
                    played = true
                    // In Hold mode, we consume all pulses of the stage
                    pulsesUsed += stageDuration
                    p = stageDuration // exit inner loop
                    continue
                }
            } else if (stage.gateMode === 2 && (p % stage.length === 0)) { // Multi-pulse
                const shouldPlay = Math.random() < stage.probability
                if (shouldPlay) {
                    track3.addEvent(new MidiWriter.NoteEvent({
                        pitch: [noteName] as any,
                        duration: ('t' + TICKS_PER_16TH) as any,
                        velocity: Math.floor(stage.velocity * 127 * 0.8),
                        sequential: true
                    }))
                    played = true
                    currentSnakeIdx = GridWalker.getNextIndex(currentSnakeIdx, snakePattern)
                }
            }

            if (!played) {
                track3.addEvent(new MidiWriter.NoteEvent({
                    pitch: [],
                    duration: ('t' + TICKS_PER_16TH) as any,
                    sequential: true
                }))
            }
            pulsesUsed++
        }
        stageIdx++
    }

    // 4. Pads Track (4 bars = 2 changes)
    if (harmony.active) {
        const progression = generatePadProgression(harmony.root, harmony.scale, harmony.complexity)
        for (let i = 0; i < 2; i++) { // 2 bars each chord
            const chord = progression[i % progression.length]
            track4.addEvent(new MidiWriter.NoteEvent({
                pitch: chord as any,
                duration: '1', // Whole note
                sequential: true,
                velocity: 50
            }))
            // Add another whole note to make it 2 bars
            track4.addEvent(new MidiWriter.NoteEvent({
                pitch: chord as any,
                duration: '1',
                sequential: true,
                velocity: 50
            }))
        }
    }

    const write = new MidiWriter.Writer([track1, track2, track3, track4])
    return write.buildFile()
}
