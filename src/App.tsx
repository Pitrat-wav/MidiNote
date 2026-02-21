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
    const { isInitialized, isPlaying, bpm, swing, initialize, togglePlay, setBpm, setSwing } = useAudioStore()

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
                mainBtn.setText(isExporting ? 'ОТПРАВКА...' : 'ЭКСПОРТ MIDI')
                mainBtn.setParams({
                    color: '#31b545',
                    text_color: '#ffffff',
                    is_active: !isExporting
                })
                if (isExporting) mainBtn.showProgress()
                else mainBtn.hideProgress()

                const handleExportBtn = () => handleExport()
                mainBtn.onClick(handleExportBtn)
                mainBtn.show()
                return () => mainBtn.offClick(handleExportBtn)
            } else {
                mainBtn.hideProgress()
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

    const seq = useSequencerStore()
    const harmony = useHarmonyStore()
    const pad = usePadStore()

    const handleExport = async () => {
        const isTelegram = !!window.Telegram?.WebApp?.initData
        setIsExporting(true)

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        }

        try {
            // 1. Prepare patterns
            const patterns = {
                kick: bjorklund(drums.kick.steps, drums.kick.pulses),
                snare: bjorklund(drums.snare.steps, drums.snare.pulses),
                hihat: bjorklund(drums.hihat.steps, drums.hihat.pulses),
                hihatOpen: bjorklund(drums.hihatOpen.steps, drums.hihatOpen.pulses),
                clap: bjorklund(drums.clap.steps, drums.clap.pulses)
            }

            // 2. Generate MIDI
            const midiData = exportToMidi(
                bpm,
                patterns,
                bass.pattern,
                seq.stages,
                seq.snakeGrid,
                seq.snakePattern,
                {
                    root: harmony.root,
                    scale: harmony.scale,
                    complexity: pad.complexity,
                    active: pad.active
                }
            )

            const filename = `midi_studio_${Date.now()}.mid`

            // 3. Export logic
            if (isTelegram && window.Telegram) {
                const base64Midi = btoa(String.fromCharCode(...(midiData as any)))
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

                try {
                    const response = await fetch(`${API_URL}/upload-midi`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            initData: window.Telegram.WebApp.initData,
                            midiBase64: base64Midi,
                            filename
                        })
                    })

                    if (response.ok) {
                        window.Telegram.WebApp.showAlert('MIDI файл отправлен в чат! 🎹')
                    } else {
                        throw new Error('Server error')
                    }
                } catch (err) {
                    console.error('Backend export failed, falling back to download', err)
                    downloadFallback(midiData, filename)
                }
            } else {
                downloadFallback(midiData, filename)
            }
        } catch (err) {
            console.error(err)
            const msg = 'Ошибка экспорта.'
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(msg)
            } else {
                alert(msg)
            }
        } finally {
            setIsExporting(false)
        }
    }

    const downloadFallback = (data: Uint8Array, filename: string) => {
        const blob = new Blob([data as any], { type: 'audio/midi' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Файл скачан на устройство 💾')
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
                                    value={swing}
                                    min={0} max={1} step={0.01}
                                    onChange={(v) => setSwing(v)}
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
                                        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '32px',
                                                background: 'var(--tg-theme-button-color)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                                                color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                            }}>
                                                <Send size={32} />
                                            </div>
                                            <h3>Экспортировать сессию</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', marginTop: '8px', lineHeight: '1.4' }}>
                                                Создай полноценную композицию! Мы отправим MIDI-файл со всеми 4 дорожками в твой чат Telegram.
                                            </p>
                                            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <button
                                                    disabled={isExporting}
                                                    onClick={handleExport}
                                                    style={{
                                                        width: '100%',
                                                        padding: '16px',
                                                        backgroundColor: 'var(--tg-theme-button-color)',
                                                        color: 'var(--tg-theme-button-text-color)',
                                                        fontWeight: 'bold',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        opacity: isExporting ? 0.6 : 1
                                                    }}
                                                >
                                                    {isExporting ? 'ОБРАБОТКА...' : 'ОТПРАВИТЬ В ЧАТ'}
                                                </button>
                                                <p style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)' }}>
                                                    Если бот не отвечает, файл будет скачан напрямую.
                                                </p>
                                            </div>
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
