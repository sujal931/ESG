export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }} className="animate-fade-in">
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', maxWidth: '320px' }}>{message}</p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }} className="animate-fade-in">
      <div style={{ padding: '12px 20px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', marginBottom: '16px', maxWidth: '400px', width: '100%' }}>
        <p style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{ padding: '8px 20px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function StatCard({ label, value, subtitle, accent }) {
  const accentMap = { blue: 'var(--accent)', green: 'var(--success)', amber: 'var(--warning)', red: 'var(--danger)', violet: '#7C3AED', gray: 'var(--text-muted)' };
  const accentColor = accentMap[accent] || null;
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color: accentColor || 'var(--text-h)', letterSpacing: '-0.02em', lineHeight: '32px' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', paddingBottom: '8px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
      {children}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <p style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{message}</p>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>×</button>}
    </div>
  );
}
