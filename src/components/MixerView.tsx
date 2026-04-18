import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'

export function MixerView() {
    const { volumes, setVolume } = useAudioStore()

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Микшер</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px' }}>
                <Knob
                    label="Bass"
                    value={volumes.bass}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('bass', v)}
                    size={48}
                />
                <Knob
                    label="Lead"
                    value={volumes.lead}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('lead', v)}
                    size={48}
                />
                <Knob
                    label="Kick"
                    value={volumes.kick}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('kick', v)}
                    size={48}
                />
                <Knob
                    label="Snare"
                    value={volumes.snare}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('snare', v)}
                    size={48}
                />
                <Knob
                    label="HiHat"
                    value={volumes.hihat}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('hihat', v)}
                    size={48}
                />
                <Knob
                    label="OpenH"
                    value={volumes.hihatOpen}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('hihatOpen', v)}
                    size={48}
                />
                <Knob
                    label="Pads"
                    value={volumes.pads}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('pads', v)}
                    size={48}
                />
            </div>
        </section>
    )
}
