import { useSequencerStore, useHarmonyStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useEffect } from 'react'
import { Scale, Note } from '@tonaljs/tonal'
import { TransportControls } from './TransportControls'

const GATE_MODES = ['Mute', 'Single', 'Multi', 'Hold']

export function SequencerView() {
    const { stages, snakePattern, setSnakePattern, setStage, snakeGrid, currentStageIndex, currentSnakeIndex, setSnakeNote } = useSequencerStore()
    const { root, scale } = useHarmonyStore()

    useEffect(() => {
        // Regenerate Snake Grid notes based on scale
        const notes = Scale.get(`${root} ${scale}`).notes
        if (notes.length > 0) {
            const newGrid = [...snakeGrid]
            for (let i = 0; i < 16; i++) {
                const noteName = notes[i % notes.length]
                const octave = Math.floor(i / notes.length) + 3
                const midi = Note.midi(`${noteName}${octave}`)
                if (midi) newGrid[i] = midi
            }
            useSequencerStore.setState({ snakeGrid: newGrid })
        }
    }, [root, scale])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TransportControls title="Секвенсор ML-185" channel="lead" />
            <section className="card">
                <h3 style={{ margin: 0 }}>Паттерн</h3>
                <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                    Настройка 8 стадий ритма
                </p>

                <div style={{ overflowX: 'auto', display: 'flex', gap: '12px', paddingBottom: '12px', marginTop: '16px' }}>
                    {stages.map((stage, i) => (
                        <div
                            key={i}
                            style={{
                                minWidth: '94px',
                                padding: '12px',
                                background: 'var(--tg-theme-bg-color)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                alignItems: 'center',
                                border: currentStageIndex === i ? '2px solid var(--tg-theme-button-color)' : '1px solid var(--glass-border)',
                                boxShadow: currentStageIndex === i ? '0 0 10px var(--tg-theme-button-color)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span style={{ fontSize: '11px', fontWeight: '800' }}>СТАДИЯ {i + 1}</span>
                            <Knob
                                label="Длина"
                                value={stage.length}
                                min={1} max={8} step={1}
                                onChange={(v) => setStage(i, { length: v })}
                                size={44}
                            />
                            <Knob
                                label="Повт"
                                value={stage.pulseCount}
                                min={1} max={8} step={1}
                                onChange={(v) => setStage(i, { pulseCount: v })}
                                size={44}
                            />
                            <Knob
                                label="Веро"
                                value={stage.probability}
                                min={0} max={1} step={0.1}
                                onChange={(v) => setStage(i, { probability: v })}
                                size={44}
                                defaultValue={1}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'center' }}>GATE</label>
                                <button
                                    onClick={() => setStage(i, { gateMode: ((stage.gateMode + 1) % 4) as any })}
                                    style={{
                                        fontSize: '10px',
                                        padding: '4px',
                                        background: stage.gateMode > 0 ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                        color: 'white'
                                    }}
                                >
                                    {GATE_MODES[stage.gateMode]}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Сетка MDD Snake</h3>
                    <select
                        value={snakePattern}
                        onChange={(e) => setSnakePattern(e.target.value as any)}
                        style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px' }}
                    >
                        <option value="linear">Line</option>
                        <option value="zigzag">ZigZag</option>
                        <option value="spiral">Spiral</option>
                        <option value="random">Rand</option>
                    </select>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    aspectRatio: '1',
                    marginTop: '16px'
                }}>
                    {snakeGrid.map((note, i) => (
                        <div
                            key={i}
                            style={{
                                background: currentSnakeIndex === i ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-bg-color)',
                                borderRadius: '8px',
                                border: currentSnakeIndex === i ? '2px solid white' : '1px solid var(--glass-border)',
                                boxShadow: currentSnakeIndex === i ? '0 0 15px var(--tg-theme-button-color)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                color: currentSnakeIndex === i ? 'white' : 'inherit',
                                transition: 'all 0.1s ease'
                            }}
                        >
                            {Tone.Frequency(note, "midi").toNote()}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
