import { useBassStore, useHarmonyStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { generateBassPattern } from '../logic/StingGenerator'
import { Dices } from 'lucide-react'
import { useAudioStore, AudioState } from '../store/audioStore'

export function BassView() {
    const { density, type, pattern, seed, setDensity, setType, setSeed, setPattern } = useBassStore()
    const { root, scale } = useHarmonyStore()

    const handleGenerate = () => {
        const newSeed = Math.random()
        setSeed(newSeed)
        const newPattern = generateBassPattern(density, type, root, scale, 2, newSeed)
        setPattern(newPattern)
    }

    const updateDensity = (v: number) => {
        setDensity(v)
        const newPattern = generateBassPattern(v, type, root, scale, 2, seed)
        setPattern(newPattern)
    }

    const updateType = (v: number) => {
        setType(v)
        const newPattern = generateBassPattern(density, v, root, scale, 2, seed)
        setPattern(newPattern)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Кислотный Бас</h3>
                        <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', margin: 0 }}>
                            Логика Sting by Iftah
                        </p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        style={{
                            backgroundColor: 'var(--tg-theme-button-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Dices size={18} />
                        Gen
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px' }}>
                    <Knob
                        label="Плотность"
                        value={density}
                        min={0} max={1} step={0.01}
                        onChange={updateDensity}
                        size={80}
                    />
                    <Knob
                        label="Тип"
                        value={type}
                        min={0} max={1} step={0.01}
                        onChange={updateType}
                        size={80}
                    />
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        onClick={() => useAudioStore.getState().bassSynth?.setOscillatorType('sawtooth')}
                        className="card"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                    >Saw</button>
                    <button
                        onClick={() => useAudioStore.getState().bassSynth?.setOscillatorType('square')}
                        className="card"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                    >Square</button>
                </div>

                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                    {pattern.map((step, i) => (
                        <div
                            key={i}
                            style={{
                                height: '24px',
                                background: step.active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                borderRadius: '4px',
                                opacity: step.active ? (step.accent ? 1 : 0.6) : 0.3,
                                border: step.slide ? '2px solid gold' : (useAudioStore((s: AudioState) => s.currentStep) === i ? '2px solid white' : 'none'),
                                boxShadow: useAudioStore((s: AudioState) => s.currentStep) === i ? '0 0 10px var(--tg-theme-button-color)' : 'none'
                            }}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
