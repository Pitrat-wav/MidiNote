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
    const currentStageIdxRef = useRef(0)
    const snakeWalkerRef = useRef(new GridWalker())

    useEffect(() => {
        if (!isInitialized || !acidSynth || !drumMachine) return

        const loop = new Tone.Loop((time) => {
            const step = stepRef.current % 16
            const totalStep = stepRef.current

            // Access current state directly from store to avoid loop restarts
            const currentDrums = useDrumStore.getState()
            const currentBass = useBassStore.getState()
            const currentSeq = useSequencerStore.getState()
            const currentHarmony = useHarmonyStore.getState()
            const currentPads = usePadStore.getState()

            // 1. Drums (Euclidean)
            if (bjorklund(currentDrums.kick.steps, currentDrums.kick.pulses)[step]) drumMachine.triggerDrum('kick', time)
            if (bjorklund(currentDrums.snare.steps, currentDrums.snare.pulses)[step]) drumMachine.triggerDrum('snare', time)
            if (bjorklund(currentDrums.hihat.steps, currentDrums.hihat.pulses)[step]) drumMachine.triggerDrum('hihat', time)
            if (bjorklund(currentDrums.hihatOpen.steps, currentDrums.hihatOpen.pulses)[step]) drumMachine.triggerDrum('hihatOpen', time)
            if (bjorklund(currentDrums.clap.steps, currentDrums.clap.pulses)[step]) drumMachine.triggerDrum('clap', time)

            // 2. Bass (Sting logic)
            const bassStep = currentBass.pattern[step]
            const prevBassStep = currentBass.pattern[(step + 15) % 16]
            if (bassStep && bassStep.active) {
                const isContinuing = prevBassStep.active && prevBassStep.slide
                acidSynth.triggerNote(bassStep.note, '16n', time, bassStep.velocity, bassStep.slide, bassStep.accent, isContinuing)
            }

            // 3. Sequencer (ML-185 + Snake Grid)
            const stage = currentSeq.stages[currentSeq.currentStageIndex]

            // Helper to trigger note and optionally advance snake
            const triggerStep = (duration: string, velocity: number, advanceSnake: boolean) => {
                const shouldPlay = Math.random() < stage.probability
                if (shouldPlay && acidSynth) {
                    const note = currentSeq.snakeGrid[currentSeq.currentSnakeIndex]
                    acidSynth.triggerNote(Tone.Frequency(note, 'midi').toNote(), duration, time, velocity)

                    if (advanceSnake) {
                        const nextSnake = GridWalker.getNextIndex(currentSeq.currentSnakeIndex, currentSeq.snakePattern)
                        useSequencerStore.getState().setCurrentSnakeIndex(nextSnake)
                    }
                }
            }

            if (stagePulseRef.current === 0) {
                if (stage.gateMode === 1) { // Single
                    triggerStep('16n', stage.velocity, true)
                } else if (stage.gateMode === 2) { // Multi start
                    triggerStep('16n', stage.velocity, true)
                } else if (stage.gateMode === 3) { // Hold/Tie
                    // Hold mode: trigger note (longer duration) but DO NOT advance snake index (repeat same pitch)
                    // Added probability check here
                    triggerStep('8n', stage.velocity, false)
                }
            } else if (stage.gateMode === 2) { // Multi pulse repeats
                const pulseStep = stagePulseRef.current % Math.max(1, stage.length)
                if (pulseStep === 0) {
                    // Multi repeats: shorter duration, slightly lower velocity, advance snake
                    triggerStep('32n', stage.velocity * 0.8, true)
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
