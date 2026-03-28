import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, useSequencerStore } from '../store/instrumentStore'
import { bjorklund } from '../logic/bjorklund'
import { GridWalker } from '../logic/GridWalker'
import { useHarmonyStore, usePadStore } from '../store/instrumentStore'
import { generatePadProgression } from '../logic/PadGenerator'

export function SequencerLoop() {
    const { isPlaying, bassSynth, leadSynth, drumMachine, padSynth, isInitialized } = useAudioStore()
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
        if (isPlaying) {
            stepRef.current = 0
            stagePulseRef.current = 0
            useSequencerStore.getState().setCurrentStageIndex(0)
            useSequencerStore.getState().setCurrentSnakeIndex(0)
            useAudioStore.getState().setCurrentStep(0)
        }
    }, [isPlaying])

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
        if (!isInitialized || !bassSynth || !leadSynth || !drumMachine) return

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
            const velocity = 0.8 // Default velocity for Euclidean steps
            if (patterns.kick[step % patterns.kick.length]) drumMachine.triggerDrum('kick', time, velocity)
            if (patterns.snare[step % patterns.snare.length]) drumMachine.triggerDrum('snare', time, velocity)
            if (patterns.hihat[step % patterns.hihat.length]) drumMachine.triggerDrum('hihat', time, velocity)
            if (patterns.hihatOpen[step % patterns.hihatOpen.length]) drumMachine.triggerDrum('hihatOpen', time, velocity)
            if (patterns.clap[step % patterns.clap.length]) drumMachine.triggerDrum('clap', time, velocity)

            // 2. Bass (Sting logic)
            const bassStep = currentBass.pattern[step]
            const prevBassStep = currentBass.pattern[(step + 15) % 16]
            if (bassStep && bassStep.active) {
                const isContinuing = prevBassStep.active && prevBassStep.slide
                if (bassSynth) {
                    bassSynth.triggerNote(bassStep.note, '16n', time, bassStep.velocity, bassStep.slide, bassStep.accent, isContinuing)
                }
            }

            // 3. Sequencer (ML-185 + Snake Grid)
            const stage = currentSeq.stages[currentSeq.currentStageIndex]

            // Helper to trigger note and optionally advance snake
            const triggerStep = (duration: string, velocity: number, advanceSnake: boolean) => {
                const shouldPlay = Math.random() < stage.probability
                if (shouldPlay && leadSynth) {
                    const note = currentSeq.snakeGrid[currentSeq.currentSnakeIndex]
                    leadSynth.triggerNote(Tone.Frequency(note, 'midi').toNote(), duration, time, velocity)

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
    }, [isInitialized, bassSynth, leadSynth, drumMachine])

    return null // This is a logic-only component
}
