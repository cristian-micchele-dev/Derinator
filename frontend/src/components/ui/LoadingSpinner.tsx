export function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: 'rgba(245,243,255,0.6)',
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid rgba(245,243,255,0.15)',
        borderTopColor: '#f5944e', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
