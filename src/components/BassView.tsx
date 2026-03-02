import { useBassStore, useHarmonyStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { generateBassPattern } from '../logic/StingGenerator'
import { Dices } from 'lucide-react'
import { useAudioStore, AudioState } from '../store/audioStore'
import { TransportControls } from './TransportControls'

export function BassView() {
    const { density, type, pattern, seed, cutoff, resonance, envMod, decay, setDensity, setType, setSeed, setPattern, setParams } = useBassStore()
    const { root, scale } = useHarmonyStore()
    const { bassSynth } = useAudioStore()

    const updateAcid = (params: Partial<{ cutoff: number, resonance: number, envMod: number, decay: number }>) => {
        setParams(params)
        if (bassSynth) {
            const state = useBassStore.getState()
            bassSynth.setParams(
                params.cutoff ?? state.cutoff,
                params.resonance ?? state.resonance,
                params.envMod ?? state.envMod,
                params.decay ?? state.decay
            )
        }
    }

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
            <TransportControls title="Кислотный Бас" channel="bass" />

            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Паттерн генератор</h3>
                        <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', margin: 0 }}>
                            Алгоритм Sting
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

                <div style={{ marginTop: '24px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px' }}>
                    {pattern.map((step, i) => (
                        <div
                            key={i}
                            style={{
                                minWidth: '38px',
                                height: '38px',
                                background: step.active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                borderRadius: '4px',
                                opacity: step.active ? (step.accent ? 1 : 0.6) : 0.2,
                                border: step.slide ? '2px solid gold' : (useAudioStore((s: AudioState) => s.currentStep) === i ? '2px solid white' : 'none'),
                                boxShadow: useAudioStore((s: AudioState) => s.currentStep) === i ? '0 0 10px var(--tg-theme-button-color)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', color: 'white', fontWeight: 'bold'
                            }}
                        >
                            {step.active ? (step.slide ? '~' : (step.accent ? '!' : '•')) : ''}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '24px', justifyContent: 'center' }}>
                    <Knob label="Плотность" value={density} min={0} max={1} step={0.01} onChange={updateDensity} size={50} />
                    <Knob label="Тип" value={type} min={0} max={1} step={0.01} onChange={updateType} size={50} />
                    <Knob label="Cutoff" value={cutoff} min={50} max={3000} step={1} onChange={(v) => updateAcid({ cutoff: v })} size={50} />
                    <Knob label="Res" value={resonance} min={0} max={20} step={0.1} onChange={(v) => updateAcid({ resonance: v })} size={50} />
                    <Knob label="EnvMod" value={envMod} min={0} max={10} step={0.1} onChange={(v) => updateAcid({ envMod: v })} size={50} />
                    <Knob label="Decay" value={decay} min={0.1} max={2} step={0.01} onChange={(v) => updateAcid({ decay: v })} size={50} />
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        onClick={() => bassSynth?.setOscillatorType('sawtooth')}
                        className="card"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                    >Saw</button>
                    <button
                        onClick={() => bassSynth?.setOscillatorType('square')}
                        className="card"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                    >Square</button>
                </div>
            </section>
        </div>
    )
}
