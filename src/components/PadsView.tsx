import { usePadStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { useAudioStore } from '../store/audioStore'
import { TransportControls } from './TransportControls'

export function PadsView() {
    const { active, brightness, complexity, setParams } = usePadStore()
    const { padSynth } = useAudioStore()

    const handleBrightnessChange = (v: number) => {
        setParams({ brightness: v })
        if (padSynth) padSynth.setParams(v)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TransportControls title="Эмбиент Пэды" channel="pads" />
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Настройки Пэдов</h3>
                    <button
                        onClick={() => setParams({ active: !active })}
                        style={{
                            background: active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                            color: 'white',
                            fontSize: '10px',
                            padding: '6px 12px'
                        }}
                    >
                        {active ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px', gap: '12px' }}>
                    <Knob
                        label="Яркость"
                        value={brightness}
                        min={0} max={1} step={0.01}
                        onChange={handleBrightnessChange}
                        size={70}
                    />
                    <Knob
                        label="Сложность"
                        value={complexity}
                        min={0} max={1} step={0.01}
                        onChange={(v) => setParams({ complexity: v })}
                        size={70}
                    />
                </div>

                <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '24px', textAlign: 'center' }}>
                    Пэды автоматически следуют глобальной гармонии и меняются каждые 2 такта.
                </p>
            </section>
        </div>
    )
}
