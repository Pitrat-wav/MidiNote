import { create } from 'zustand'
import { SnakePattern } from '../logic/GridWalker'
import { BassStep } from '../logic/StingGenerator'

// Harmony Store
export type ScaleType = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'pentatonic' | 'chromatic'

interface HarmonyState {
    root: string
    scale: ScaleType
    setRoot: (r: string) => void
    setScale: (s: ScaleType) => void
}

export const useHarmonyStore = create<HarmonyState>((set) => ({
    root: 'C',
    scale: 'minor',
    setRoot: (root) => set({ root }),
    setScale: (scale) => set({ scale })
}))

// Drum Store
interface DrumState {
    kick: { steps: number, pulses: number, rotate: number, decay: number, pitch: number }
    snare: { steps: number, pulses: number, rotate: number, decay: number, pitch: number }
    hihat: { steps: number, pulses: number, rotate: number, decay: number, pitch: number }
    hihatOpen: { steps: number, pulses: number, rotate: number, decay: number, pitch: number }
    clap: { steps: number, pulses: number, rotate: number, decay: number, pitch: number }
    kit: '808' | '909'
    setParams: (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', params: Partial<{ steps: number, pulses: number, rotate: number, decay: number, pitch: number }>) => void
    setKit: (kit: '808' | '909') => void
}

export const useDrumStore = create<DrumState>((set) => ({
    kick: { steps: 16, pulses: 4, rotate: 0, decay: 0.5, pitch: 0.5 },
    snare: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5 },
    hihat: { steps: 16, pulses: 8, rotate: 0, decay: 0.5, pitch: 0.5 },
    hihatOpen: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5 },
    clap: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5 },
    kit: '808',
    setParams: (drum, params) => set((state) => ({
        [drum]: { ...state[drum], ...params }
    })),
    setKit: (kit) => set({ kit })
}))

// Pad Store
interface PadState {
    active: boolean
    brightness: number
    complexity: number
    setParams: (params: Partial<{ active: boolean, brightness: number, complexity: number }>) => void
}

export const usePadStore = create<PadState>((set) => ({
    active: true,
    brightness: 0.5,
    complexity: 0.5,
    setParams: (params) => set((state) => ({ ...state, ...params }))
}))

// Bass Store
interface BassState {
    density: number
    type: number
    seed: number
    cutoff: number
    resonance: number
    envMod: number
    decay: number
    pattern: BassStep[]
    setDensity: (d: number) => void
    setType: (t: number) => void
    setSeed: (s: number) => void
    setPattern: (p: BassStep[]) => void
    setParams: (params: Partial<{ cutoff: number, resonance: number, envMod: number, decay: number }>) => void
}

export const useBassStore = create<BassState>((set) => ({
    density: 0.5,
    type: 0.2,
    seed: Math.random(),
    cutoff: 400,
    resonance: 2,
    envMod: 4,
    decay: 0.2,
    pattern: [],
    setDensity: (density) => set({ density }),
    setType: (type) => set({ type }),
    setSeed: (seed) => set({ seed }),
    setPattern: (pattern) => set({ pattern }),
    setParams: (params) => set((state) => ({ ...state, ...params }))
}))

// Sequencer Store (ML-185 + Snake)
export interface Stage {
    pitch: number
    velocity: number
    length: number // in 1/16th pulses
    pulseCount: number // repeats
    gateMode: 0 | 1 | 2 | 3 // Mute, Single, Multi, Hold
    probability: number // 0-1
}

interface SequencerState {
    stages: Stage[]
    snakePattern: SnakePattern
    snakeGrid: number[] // 16 MIDI note numbers
    currentStageIndex: number
    currentPulseInStage: number
    currentSnakeIndex: number
    setStage: (index: number, stage: Partial<Stage>) => void
    setSnakePattern: (p: SnakePattern) => void
    setSnakeNote: (index: number, note: number) => void
    setCurrentStageIndex: (index: number) => void
    setCurrentSnakeIndex: (index: number) => void
}

const initialStages: Stage[] = Array.from({ length: 8 }, () => ({
    pitch: 60,
    velocity: 0.8,
    length: 1,
    pulseCount: 1,
    gateMode: 1,
    probability: 1.0
}))

export const useSequencerStore = create<SequencerState>((set) => ({
    stages: initialStages,
    snakePattern: 'linear',
    snakeGrid: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86],
    currentStageIndex: 0,
    currentPulseInStage: 0,
    currentSnakeIndex: 0,
    setStage: (index, stage) => set((state) => {
        const newStages = [...state.stages]
        newStages[index] = { ...newStages[index], ...stage }
        return { stages: newStages }
    }),
    setSnakePattern: (snakePattern) => set({ snakePattern }),
    setSnakeNote: (index, note) => set((state) => {
        const newGrid = [...state.snakeGrid]
        newGrid[index] = note
        return { snakeGrid: newGrid }
    }),
    setCurrentStageIndex: (currentStageIndex) => set({ currentStageIndex }),
    setCurrentSnakeIndex: (currentSnakeIndex) => set({ currentSnakeIndex })
}))
