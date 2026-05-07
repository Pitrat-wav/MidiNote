import { useDrumStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { useBassStore, useHarmonyStore } from '../store/instrumentStore'
import { generateBassPattern } from '../logic/StingGenerator'
import { Dices } from 'lucide-react'
import { useAudioStore, AudioState } from '../store/audioStore'
import { bjorklund, rotateArray } from '../logic/bjorklund'
import { TransportControls } from './TransportControls'

export function DrumsView() {
    const { kick, snare, hihat, hihatOpen, clap, cowbell, kit, drive, setParams, setKit, setDrive } = useDrumStore()
    const { drumMachine, volumes, setVolume } = useAudioStore()

    const updateDrum = (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'cowbell', params: any) => {
        setParams(drum, params)
        if (drumMachine) {
            const d = useDrumStore.getState()[drum]
            const finalParams = { ...d, ...params }
            drumMachine.setDrumParams(drum, finalParams.pitch, finalParams.decay)
        }
    }

    const handleKitChange = (newKit: '808' | '909') => {
        setKit(newKit)
        if (drumMachine) drumMachine.setKit(newKit)
    }

    const handleDriveChange = (v: number) => {
        setDrive(v)
        if (drumMachine) drumMachine.setSaturation(v)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TransportControls title="Драм-машина" />

            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Настройки</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Knob
                            label="DRIVE"
                            value={drive}
                            min={0} max={100} step={1}
                            onChange={handleDriveChange}
                            size={40}
                        />
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '8px' }}>
                            {(['808', '909'] as const).map(k => (
                                <button
                                    key={k}
                                    onClick={() => handleKitChange(k)}
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: '11px',
                                        borderRadius: '6px',
                                        background: kit === k ? 'var(--tg-theme-button-color)' : 'transparent',
                                        color: kit === k ? 'white' : 'inherit',
                                        border: 'none'
                                    }}
                                >{k}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
                    {[
                        { id: 'kick' as const, label: 'KICK' },
                        { id: 'snare' as const, label: 'SNARE' },
                        { id: 'hihat' as const, label: 'HI-HAT' },
                        { id: 'hihatOpen' as const, label: 'OPEN HAT' },
                        { id: 'clap' as const, label: 'CLAP' },
                        { id: 'cowbell' as const, label: 'COWBELL' }
                    ].map(d => (
                        <div key={d.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px' }}>
                            <div style={{ width: '60px', fontWeight: 'bold', fontSize: '10px' }}>{d.label}</div>
                            <Knob
                                label="Пульс"
                                value={useDrumStore((state) => state[d.id].pulses)}
                                min={0} max={16} step={1}
                                onChange={(v) => updateDrum(d.id, { pulses: v })}
                                size={40}
                            />
                            <Knob
                                label="Tone"
                                value={useDrumStore((state) => state[d.id].pitch)}
                                min={0} max={1} step={0.01}
                                onChange={(v) => updateDrum(d.id, { pitch: v })}
                                size={40}
                            />
                            <Knob
                                label={d.id === 'snare' ? 'Snappy' : 'Decay'}
                                value={useDrumStore((state) => state[d.id].decay)}
                                min={0} max={1} step={0.01}
                                onChange={(v) => updateDrum(d.id, { decay: v })}
                                size={40}
                            />
                            <Knob
                                label="PROB"
                                value={useDrumStore((state) => state[d.id].probability)}
                                min={0} max={1} step={0.01}
                                onChange={(v) => updateDrum(d.id, { probability: v })}
                                size={40}
                            />
                            <Knob
                                label="Vol"
                                value={volumes[d.id]}
                                min={0} max={1} step={0.01}
                                onChange={(v) => setVolume(d.id, v)}
                                size={40}
                            />
                        </div>
                    ))}
                </div>

                {/* Pattern Visualizer */}
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { name: 'KICK', data: kick },
                        { name: 'SNARE', data: snare },
                        { name: 'HIHAT', data: hihat },
                        { name: 'OPEN', data: hihatOpen },
                        { name: 'CLAP', data: clap },
                        { name: 'COW', data: cowbell }
                    ].map((d, idx) => {
                        const pattern = rotateArray(bjorklund(d.data.steps, d.data.pulses), d.data.rotate)
                        return (
                            <div key={idx}>
                                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.5 }}>{d.name}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '4px' }}>
                                    {pattern.map((active, i) => (
                                        <div key={i} style={{
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: active ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
                                            opacity: active ? 1 : 0.2,
                                            border: (useAudioStore((s: AudioState) => s.currentStep) === i) ? '1px solid white' : ((i % 4 === 0) ? '1px solid var(--tg-theme-button-color)' : 'none'),
                                            boxShadow: (useAudioStore((s: AudioState) => s.currentStep) === i) ? '0 0 8px var(--tg-theme-button-color)' : 'none'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
