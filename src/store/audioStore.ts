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
    drumSaturation: number
    bassSynth: AcidSynth | null
    leadSynth: AcidSynth | null
    drumMachine: DrumMachine | null
    padSynth: PadSynth | null
    volumes: {
        bass: number,
        lead: number,
        kick: number,
        snare: number,
        hihat: number,
        hihatOpen: number,
        clap: number,
        pads: number
    }
    initialize: () => Promise<void>
    togglePlay: () => void
    setBpm: (bpm: number) => void
    setSwing: (swing: number) => void
    setCurrentStep: (step: number) => void
    setDrumSaturation: (amount: number) => void
    setVolume: (channel: 'bass' | 'lead' | 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'pads', value: number) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
    isInitialized: false,
    isPlaying: false,
    bpm: 128,
    swing: 0,
    currentStep: 0,
    drumSaturation: 20,
    bassSynth: null,
    leadSynth: null,
    drumMachine: null,
    padSynth: null,
    volumes: { bass: 0.8, lead: 0.8, kick: 0.8, snare: 0.8, hihat: 0.8, hihatOpen: 0.8, clap: 0.8, pads: 0.5 },

    initialize: async () => {
        if (get().isInitialized) return

        await Tone.start()

        // iOS Silent Switch Workaround: Play a short silent buffer via HTML5 Audio
        const silentAudio = new Audio()
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/'
        silentAudio.play().catch(e => console.warn('Silent play failed', e))

        const bassSynth = new AcidSynth()
        const leadSynth = new AcidSynth()
        const drums = new DrumMachine()
        const pads = new PadSynth()

        Tone.Transport.bpm.value = get().bpm
        Tone.Transport.swing = get().swing

        set({
            isInitialized: true,
            bassSynth: bassSynth,
            leadSynth: leadSynth,
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
        const { bassSynth, leadSynth, drumMachine, padSynth } = get()
        if (channel === 'bass' && bassSynth) bassSynth.synth.volume.value = Tone.gainToDb(value)
        if (channel === 'lead' && leadSynth) leadSynth.synth.volume.value = Tone.gainToDb(value)

        if (drumMachine) {
            if (channel === 'kick') drumMachine.outputKick.gain.value = value
            if (channel === 'snare') drumMachine.outputSnare.gain.value = value
            if (channel === 'hihat') drumMachine.outputHihat.gain.value = value
            if (channel === 'hihatOpen') drumMachine.outputOpenHat.gain.value = value
            if (channel === 'clap') drumMachine.outputClap.gain.value = value
        }

        if (channel === 'pads' && padSynth) padSynth.synth.volume.value = Tone.gainToDb(value)
    },

    setDrumSaturation: (amount: number) => {
        const { drumMachine } = get()
        if (drumMachine) drumMachine.setSaturation(amount)
        set({ drumSaturation: amount })
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
