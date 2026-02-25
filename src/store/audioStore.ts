import { create } from 'zustand'
import * as Tone from 'tone'
import { AcidSynth } from '../logic/AcidSynth'
import { DrumMachine } from '../logic/DrumMachine'
import { PadSynth } from '../logic/PadSynth'

export interface AudioState {
    isInitialized: boolean
    isPlaying: boolean
    bpm: number
    swing: number
    currentStep: number
    acidSynth: AcidSynth | null
    drumMachine: DrumMachine | null
    padSynth: PadSynth | null
    volumes: { acid: number, drums: number, pads: number }
    initialize: () => Promise<void>
    togglePlay: () => void
    setBpm: (bpm: number) => void
    setSwing: (swing: number) => void
    setCurrentStep: (step: number) => void
    setVolume: (channel: 'acid' | 'drums' | 'pads', value: number) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
    isInitialized: false,
    isPlaying: false,
    bpm: 128,
    swing: 0,
    currentStep: 0,
    acidSynth: null,
    drumMachine: null,
    padSynth: null,
    volumes: { acid: 0.8, drums: 0.8, pads: 0.5 },

    initialize: async () => {
        if (get().isInitialized) return

        await Tone.start()

        // iOS Silent Switch Workaround: Play a short silent buffer via HTML5 Audio
        const silentAudio = new Audio()
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/'
        silentAudio.play().catch(e => console.warn('Silent play failed', e))

        const acid = new AcidSynth()
        const drums = new DrumMachine()
        const pads = new PadSynth()

        Tone.Transport.bpm.value = get().bpm
        Tone.Transport.swing = get().swing

        set({
            isInitialized: true,
            acidSynth: acid,
            drumMachine: drums,
            padSynth: pads
        })
        console.log('Аудио-движок и инструменты инициализированы')
    },

    togglePlay: () => {
        if (!get().isInitialized) return
        if (get().isPlaying) {
            Tone.Transport.stop()
            set({ isPlaying: false })
        } else {
            Tone.Transport.start()
            set({ isPlaying: true })
        }
    },

    setVolume: (channel, value) => {
        set((state) => ({ volumes: { ...state.volumes, [channel]: value } }))
        const { acidSynth, drumMachine, padSynth } = get()
        if (channel === 'acid' && acidSynth) acidSynth.synth.volume.value = Tone.gainToDb(value)
        if (channel === 'drums' && drumMachine) drumMachine.output.gain.value = value
        if (channel === 'pads' && padSynth) padSynth.synth.volume.value = Tone.gainToDb(value)
    },

    setBpm: (bpm: number) => {
        Tone.Transport.bpm.value = bpm
        set({ bpm })
    },

    setSwing: (swing: number) => {
        Tone.Transport.swing = swing
        set({ swing })
    },

    setCurrentStep: (currentStep: number) => set({ currentStep })
}))
