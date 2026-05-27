export function StatusBadge({ status }) {
  const config = {
    pending:      { bg: 'var(--bg-card)', border: 'var(--border)', dot: 'var(--text-dim)', text: 'var(--text-muted)', label: 'Pending' },
    approved:     { bg: 'var(--success-bg)', border: 'var(--success-border)', dot: 'var(--success)', text: 'var(--success-text)', label: 'Approved' },
    rejected:     { bg: 'var(--danger-bg)', border: 'var(--danger-border)', dot: 'var(--danger)', text: 'var(--danger-text)', label: 'Rejected' },
    needs_review: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', dot: 'var(--warning)', text: 'var(--warning-text)', label: 'Needs Review' },
    completed:    { bg: 'var(--success-bg)', border: 'var(--success-border)', dot: 'var(--success)', text: 'var(--success-text)', label: 'Completed' },
    processing:   { bg: 'var(--info-bg)', border: 'var(--info-border)', dot: 'var(--accent)', text: 'var(--info-text)', label: 'Processing' },
    failed:       { bg: 'var(--danger-bg)', border: 'var(--danger-border)', dot: 'var(--danger)', text: 'var(--danger-text)', label: 'Failed' },
    partial:      { bg: 'var(--warning-bg)', border: 'var(--warning-border)', dot: 'var(--warning)', text: 'var(--warning-text)', label: 'Partial' },
  };
  const c = config[status] || { bg: 'var(--bg-card)', border: 'var(--border)', dot: 'var(--text-dim)', text: 'var(--text-muted)', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: c.text, lineHeight: '16px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const config = {
    error:   { bg: 'var(--danger-bg)', border: 'var(--danger-border)', dot: 'var(--danger)', text: 'var(--danger-text)', label: 'Error' },
    warning: { bg: 'var(--warning-bg)', border: 'var(--warning-border)', dot: 'var(--warning)', text: 'var(--warning-text)', label: 'Warning' },
    info:    { bg: 'var(--info-bg)', border: 'var(--info-border)', dot: 'var(--accent)', text: 'var(--info-text)', label: 'Info' },
  };
  const c = config[severity] || { bg: 'var(--bg-hover)', border: 'var(--border)', dot: 'var(--text-dim)', text: 'var(--text-muted)', label: severity };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '999px', fontSize: '10px', fontWeight: 600, color: c.text, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '16px' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export function ScopeBadge({ scope }) {
  const config = {
    scope_1: { dot: '#8B5CF6', label: 'Scope 1' },
    scope_2: { dot: '#0EA5E9', label: 'Scope 2' },
    scope_3: { dot: '#14B8A6', label: 'Scope 3' },
  };
  const c = config[scope] || { dot: 'var(--text-dim)', label: scope };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', lineHeight: '16px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export function SourceBadge({ source }) {
  const config = {
    sap:     { label: 'SAP', dot: '#6366F1' },
    utility: { label: 'Utility', dot: '#F59E0B' },
    travel:  { label: 'Travel', dot: '#06B6D4' },
  };
  const c = config[source] || { label: source, dot: 'var(--text-dim)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: 'var(--text-body)', lineHeight: '16px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}
