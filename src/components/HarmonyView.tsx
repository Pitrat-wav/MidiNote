import { useHarmonyStore, ScaleType } from '../store/instrumentStore'

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SCALES: ScaleType[] = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'pentatonic', 'chromatic']

export function HarmonyView() {
    const { root, scale, setRoot, setScale } = useHarmonyStore()

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Гармония</h3>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--tg-theme-button-color)' }}>
                    {root} {scale.toUpperCase()}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6 }}>ТОНИКА</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {ROOTS.map(r => (
                            <button
                                key={r}
                                onClick={() => setRoot(r)}
                                style={{
                                    padding: '6px 0',
                                    fontSize: '10px',
                                    background: root === r ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                    color: root === r ? 'white' : 'inherit',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6 }}>ЛАД</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', overflowY: 'auto', maxHeight: '100px' }}>
                        {SCALES.map(s => (
                            <button
                                key={s}
                                onClick={() => setScale(s)}
                                style={{
                                    padding: '6px',
                                    textAlign: 'left',
                                    fontSize: '10px',
                                    background: scale === s ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                    color: scale === s ? 'white' : 'inherit',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
