import { Play, Square } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'

interface TransportControlsProps {
    title: string;
    channel?: 'bass' | 'lead' | 'kick' | 'snare' | 'hihat' | 'pads';
}

export function TransportControls({ title, channel }: TransportControlsProps) {
    const { isPlaying, togglePlay, volumes, setVolume } = useAudioStore()

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={togglePlay}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '24px',
                        padding: 0,
                        backgroundColor: isPlaying ? 'var(--tg-theme-destructive-text-color, #ff3b30)' : 'var(--tg-theme-button-color, #3390ec)',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {isPlaying ? <Square size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '4px' }} />}
                </button>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.5 }}>
                        {isPlaying ? 'ИГРАЕТ' : 'СТОП'}
                    </div>
                </div>
            </div>

            {channel && (
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '12px' }}>
                    <Knob
                        label="Громкость"
                        value={volumes[channel]}
                        min={0} max={1} step={0.01}
                        onChange={(v) => setVolume(channel, v)}
                        size={44}
                    />
                </div>
            )}
        </div>
    )
}
