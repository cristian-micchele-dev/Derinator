import { useOnlineStatus } from './useOnlineStatus'

export default function NetworkIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: 'rgba(244, 63, 94, 0.9)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      📴 Sin conexión — Jugando en modo local
    </div>
  )
}
