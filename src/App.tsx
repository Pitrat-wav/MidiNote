/// <reference types="vite/client" />
import { useEffect, useState } from 'react'
import { useAudioStore } from './store/audioStore'
import { TabNavigation, TabId } from './components/TabNavigation'
import { DrumsView } from './components/DrumsView'
import { BassView } from './components/BassView'
import { SequencerView } from './components/SequencerView'
import { HarmonyView } from './components/HarmonyView'
import { PadsView } from './components/PadsView'
import { MixerView } from './components/MixerView'
import { Oscilloscope } from './components/Oscilloscope'
import { SequencerLoop } from './components/SequencerLoop'
import { Knob } from './components/Knob'
import { Play, Square, Send } from 'lucide-react'
import { exportToMidi } from './logic/MidiExporter'
import { useDrumStore, useBassStore, usePadStore, useHarmonyStore, useSequencerStore } from './store/instrumentStore'
import { bjorklund } from './logic/bjorklund'

import { motion, AnimatePresence } from 'framer-motion'

function App() {
    const { isInitialized, isPlaying, bpm, initialize, togglePlay, setBpm } = useAudioStore()

    // Haptic feedback effect
    useEffect(() => {
        if (window.Telegram?.WebApp?.HapticFeedback && isPlaying) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }, [isPlaying])
    const drums = useDrumStore()
    const bass = useBassStore()
    const [activeTab, setActiveTab] = useState<TabId>('drums')
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready()
            window.Telegram.WebApp.expand()

            // Тестировщик: Оптимизируем опыт использования Mini App
            if (window.Telegram.WebApp.enableClosingConfirmation) {
                window.Telegram.WebApp.enableClosingConfirmation()
            }
            // Отключаем вертикальные свайпы, так как у нас есть регуляторы (Knobs)
            if (window.Telegram.WebApp.disableVerticalSwipes) {
                window.Telegram.WebApp.disableVerticalSwipes()
            }
        }
    }, [])

    useEffect(() => {
        if (window.Telegram?.WebApp && isInitialized) {
            const mainBtn = window.Telegram.WebApp.MainButton

            if (activeTab === 'export') {
                mainBtn.setText('ЭКСПОРТ MIDI')
                mainBtn.setParams({ color: '#31b545', text_color: '#ffffff' })
                const handleExportBtn = () => handleExport()
                mainBtn.onClick(handleExportBtn)
                mainBtn.show()
                return () => mainBtn.offClick(handleExportBtn)
            } else {
                mainBtn.setText(isPlaying ? 'СТОП' : 'ИГРАТЬ')
                mainBtn.setParams({
                    color: isPlaying ? '#ff3b30' : '#3390ec',
                    text_color: '#ffffff'
                })
                const handlePlayBtn = () => togglePlay()
                mainBtn.onClick(handlePlayBtn)
                mainBtn.show()
                return () => mainBtn.offClick(handlePlayBtn)
            }
        }
    }, [isInitialized, isPlaying, togglePlay, activeTab])

    // Global Transport Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isInitialized) return

            // Ignore if focus is on an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            if (e.code === 'Space') {
                e.preventDefault() // Prevent scrolling
                togglePlay()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isInitialized, togglePlay])

    const seq = useSequencerStore()
    const harmony = useHarmonyStore()
    const pad = usePadStore()

    const handleExport = async () => {
        if (!window.Telegram?.WebApp) return
        setIsExporting(true)

        try {
            // 1. Подготовка данных для экспорта
            const patterns = {
                kick: bjorklund(drums.kick.steps, drums.kick.pulses),
                snare: bjorklund(drums.snare.steps, drums.snare.pulses),
                hihat: bjorklund(drums.hihat.steps, drums.hihat.pulses),
                hihatOpen: bjorklund(drums.hihatOpen.steps, drums.hihatOpen.pulses),
                clap: bjorklund(drums.clap.steps, drums.clap.pulses)
            }

            // 2. Генерация MIDI
            const midiData = exportToMidi(
                bpm,
                patterns,
                bass.pattern,
                seq.stages,
                seq.snakeGrid,
                seq.snakePattern,
                { notes: [harmony.root + '3'], active: pad.active } // Simplified pad notes for now
            )
            const base64Midi = btoa(String.fromCharCode(...midiData))

            // 3. Отправка на бэкенд
            // В продакшене используйте реальный URL вашего сервера
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

            const response = await fetch(`${API_URL}/upload-midi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: window.Telegram.WebApp.initData,
                    midiBase64: base64Midi,
                    filename: `midi_studio_${Date.now()}.mid`
                })
            })

            if (response.ok) {
                window.Telegram.WebApp.showAlert('MIDI файл отправлен в чат! 🎹')
            } else {
                throw new Error('Server error')
            }
        } catch (err) {
            console.error(err)
            window.Telegram.WebApp.showAlert('Ошибка экспорта. Убедитесь, что сервер запущен.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div id="root" style={{ paddingBottom: '90px' }}>
            <SequencerLoop />

            <header style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--tg-theme-bg-color)'
            }}>
                <h1 style={{ margin: 0, fontSize: '20px' }}>MIDI Studio</h1>
                {isInitialized && (
                    <motion.span
                        animate={{ opacity: isPlaying ? [1, 0.4, 1] : 0.6 }}
                        transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                        style={{ fontSize: '11px', fontWeight: '800', color: isPlaying ? 'var(--tg-theme-accent-text-color)' : 'var(--tg-theme-hint-color)' }}
                    >
                        {isPlaying ? '• ПРЯМОЙ ЭФИР' : 'ПАУЗА'}
                    </motion.span>
                )}
            </header>

            <main className="app-container">
                {!isInitialized ? (
                    <div className="card" style={{ textAlign: 'center', margin: '40px 0' }}>
                        <h2 style={{ marginBottom: '8px' }}>Acid & Euclidean</h2>
                        <p style={{ color: 'var(--tg-theme-hint-color)', marginBottom: '24px' }}>
                            Создавай музыку прямо в Telegram
                        </p>
                        <button
                            onClick={initialize}
                            style={{
                                backgroundColor: 'var(--tg-theme-button-color)',
                                color: 'var(--tg-theme-button-text-color)',
                                width: '100%',
                                padding: '18px'
                            }}
                        >
                            Запустить движок
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button
                                    onClick={togglePlay}
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '28px',
                                        padding: 0,
                                        backgroundColor: isPlaying ? 'var(--tg-theme-destructive-text-color)' : 'var(--tg-theme-button-color)',
                                        color: 'white',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {isPlaying ? <Square size={24} fill="white" /> : <Play size={24} fill="white" style={{ marginLeft: '4px' }} />}
                                </button>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.5 }}>СТАТУС</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{isPlaying ? 'ИГРАЕТ' : 'СТОП'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Knob
                                    label="ТЕМП"
                                    value={bpm}
                                    min={60} max={200} step={1}
                                    onChange={(v) => setBpm(v)}
                                    size={48}
                                />
                                <Knob
                                    label="СВИНГ"
                                    value={useAudioStore.getState().swing}
                                    min={0} max={1} step={0.01}
                                    onChange={(v) => useAudioStore.getState().setSwing(v)}
                                    size={48}
                                />
                            </div>
                        </div>

                        <MixerView />
                        <Oscilloscope />

                        <div style={{ position: 'relative' }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                >
                                    {activeTab === 'drums' && <DrumsView />}
                                    {activeTab === 'bass' && <BassView />}
                                    {activeTab === 'sequencer' && <SequencerView />}
                                    {activeTab === 'pads' && <PadsView />}
                                    {activeTab === 'harmony' && <HarmonyView />}
                                    {activeTab === 'export' && (
                                        <div className="card" style={{ textAlign: 'center' }}>
                                            <h3>Экспортировать сессию</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                                                Мы отправим MIDI-файл в твой чат Telegram
                                            </p>
                                            <button
                                                disabled={isExporting}
                                                onClick={handleExport}
                                                style={{
                                                    marginTop: '20px',
                                                    width: '100%',
                                                    padding: '18px',
                                                    backgroundColor: 'var(--tg-theme-button-color)',
                                                    color: 'white',
                                                    opacity: isExporting ? 0.5 : 1
                                                }}
                                            >
                                                <Send size={18} />
                                                {isExporting ? 'Отправляем...' : 'Отправить в Telegram'}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </main>

            {isInitialized && (
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
        </div>
    )
}

export default App
