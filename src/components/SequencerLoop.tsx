import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, useSequencerStore } from '../store/instrumentStore'
import { bjorklund } from '../logic/bjorklund'
import { GridWalker } from '../logic/GridWalker'
import { useHarmonyStore, usePadStore } from '../store/instrumentStore'
import { generatePadProgression } from '../logic/PadGenerator'

export function SequencerLoop() {
    const { acidSynth, drumMachine, padSynth, isInitialized } = useAudioStore()
    const drums = useDrumStore()
    const bass = useBassStore()
    const seq = useSequencerStore()
    const harmony = useHarmonyStore()
    const padState = usePadStore()

    const stepRef = useRef(0)
    const stagePulseRef = useRef(0)
    const snakeWalkerRef = useRef(new GridWalker())

    // Pattern Cache to optimize performance
    const drumPatternsRef = useRef<Record<string, number[]>>({
        kick: [], snare: [], hihat: [], hihatOpen: [], clap: []
    })

    useEffect(() => {
        const updatePatterns = () => {
            const d = useDrumStore.getState()
            drumPatternsRef.current = {
                kick: bjorklund(d.kick.steps, d.kick.pulses),
                snare: bjorklund(d.snare.steps, d.snare.pulses),
                hihat: bjorklund(d.hihat.steps, d.hihat.pulses),
                hihatOpen: bjorklund(d.hihatOpen.steps, d.hihatOpen.pulses),
                clap: bjorklund(d.clap.steps, d.clap.pulses)
            }
        }

        updatePatterns()
        return useDrumStore.subscribe(updatePatterns)
    }, [])

    useEffect(() => {
        if (!isInitialized || !acidSynth || !drumMachine) return

        const loop = new Tone.Loop((time) => {
            const step = stepRef.current % 16
            const totalStep = stepRef.current

            // Access current state directly from store to avoid loop restarts
            const currentBass = useBassStore.getState()
            const currentSeq = useSequencerStore.getState()
            const currentHarmony = useHarmonyStore.getState()
            const currentPads = usePadStore.getState()

            // 1. Drums (Euclidean - using cached patterns)
            const patterns = drumPatternsRef.current
            if (patterns.kick[step % patterns.kick.length]) drumMachine.triggerDrum('kick', time)
            if (patterns.snare[step % patterns.snare.length]) drumMachine.triggerDrum('snare', time)
            if (patterns.hihat[step % patterns.hihat.length]) drumMachine.triggerDrum('hihat', time)
            if (patterns.hihatOpen[step % patterns.hihatOpen.length]) drumMachine.triggerDrum('hihatOpen', time)
            if (patterns.clap[step % patterns.clap.length]) drumMachine.triggerDrum('clap', time)

            // 2. Bass (Sting logic)
            const bassStep = currentBass.pattern[step]
            const prevBassStep = currentBass.pattern[(step + 15) % 16]
            if (bassStep && bassStep.active) {
                const isContinuing = prevBassStep.active && prevBassStep.slide
                acidSynth.triggerNote(bassStep.note, '16n', time, bassStep.velocity, bassStep.slide, bassStep.accent, isContinuing)
            }

            // 3. Sequencer (ML-185 + Snake Grid)
            const stage = currentSeq.stages[currentSeq.currentStageIndex]
            if (stagePulseRef.current === 0) {
                const triggerGate = () => {
                    const shouldPlay = Math.random() < stage.probability
                    if (shouldPlay && acidSynth) {
                        const note = currentSeq.snakeGrid[currentSeq.currentSnakeIndex]
                        acidSynth.triggerNote(Tone.Frequency(note, 'midi').toNote(), '16n', time, stage.velocity)

                        const nextSnake = GridWalker.getNextIndex(currentSeq.currentSnakeIndex, currentSeq.snakePattern)
                        useSequencerStore.getState().setCurrentSnakeIndex(nextSnake)
                    }
                }

                if (stage.gateMode === 1 || stage.gateMode === 2) { // Single or Multi start
                    triggerGate()
                } else if (stage.gateMode === 3) { // Hold/Tie
                    const note = currentSeq.snakeGrid[currentSeq.currentSnakeIndex]
                    acidSynth?.triggerNote(Tone.Frequency(note, 'midi').toNote(), '8n', time, stage.velocity)
                }
            } else if (stage.gateMode === 2) { // Multi pulse
                const pulseStep = stagePulseRef.current % Math.max(1, stage.length)
                if (pulseStep === 0) {
                    const triggerGate = () => {
                        const shouldPlay = Math.random() < stage.probability
                        if (shouldPlay && acidSynth) {
                            const note = currentSeq.snakeGrid[currentSeq.currentSnakeIndex]
                            acidSynth.triggerNote(Tone.Frequency(note, 'midi').toNote(), '32n', time, stage.velocity * 0.8)

                            const nextSnake = GridWalker.getNextIndex(currentSeq.currentSnakeIndex, currentSeq.snakePattern)
                            useSequencerStore.getState().setCurrentSnakeIndex(nextSnake)
                        }
                    }
                    triggerGate()
                }
            }

            stagePulseRef.current++
            const stageDuration = stage.length * stage.pulseCount
            if (stagePulseRef.current >= stageDuration) {
                stagePulseRef.current = 0
                const nextStage = (currentSeq.currentStageIndex + 1) % 8
                useSequencerStore.getState().setCurrentStageIndex(nextStage)
            }

            // 4. Pads (Progression: change every 2 bars / 32 steps)
            if (currentPads.active && padSynth && totalStep % 32 === 0) {
                const progression = generatePadProgression(currentHarmony.root, currentHarmony.scale, currentPads.complexity)
                const chordIdx = Math.floor((totalStep / 32) % progression.length)
                padSynth.triggerChord(progression[chordIdx], '2n', time)
            }

            // Sync UI playhead
            Tone.Draw.schedule(() => {
                useAudioStore.getState().setCurrentStep(step)
            }, time)

            stepRef.current++
        }, '16n')

        loop.start(0)

        return () => {
            loop.dispose()
        }
    }, [isInitialized, acidSynth, drumMachine])

    return null // This is a logic-only component
}
