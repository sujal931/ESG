import { useState, useEffect } from 'react';
import { validationAPI } from '../api';
import { useAuth } from '../AuthContext';
import { SectionHeader, LoadingSpinner, ErrorState, ErrorBanner } from '../components/Shared';
import { SeverityBadge } from '../components/Badges';

export default function ValidationRulesPage() {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [formData, setFormData] = useState({ rule_name: '', display_name: '', description: '', severity: 'warning', is_enabled: true, source_types: ['sap', 'utility', 'travel'], threshold: {} });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchRules = async () => {
    setLoading(true); setError(null);
    try { const res = await validationAPI.listRules(); setRules(res.data.results || res.data || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRules(); }, []);

  const toggleRule = async (rule) => {
    if (!isAdmin) return;
    setToggling(rule.id);
    try { await validationAPI.updateRule(rule.id, { is_enabled: !rule.is_enabled }); fetchRules(); }
    catch (err) { alert('Failed to toggle rule'); }
    finally { setToggling(null); }
  };

  const openCreate = () => { setEditRule(null); setFormData({ rule_name: '', display_name: '', description: '', severity: 'warning', is_enabled: true, source_types: ['sap', 'utility', 'travel'], threshold: {} }); setFormError(''); setShowForm(true); };
  const openEdit = (r) => { setEditRule(r); setFormData({ rule_name: r.rule_name, display_name: r.display_name, description: r.description || '', severity: r.severity, is_enabled: r.is_enabled, source_types: r.source_types || [], threshold: r.threshold || {} }); setFormError(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditRule(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (editRule) { await validationAPI.updateRule(editRule.id, formData); }
      else { await validationAPI.createRule(formData); }
      closeForm(); fetchRules();
    } catch (err) { setFormError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this validation rule?')) return;
    try { await validationAPI.deleteRule(id); fetchRules(); }
    catch (err) { alert('Failed to delete rule'); }
  };

  const toggleSourceType = (type) => {
    setFormData(p => ({ ...p, source_types: p.source_types.includes(type) ? p.source_types.filter(t => t !== type) : [...p.source_types, type] }));
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-h)', backgroundColor: 'var(--bg-input)' };
  const sourceColors = { sap: '#6366F1', utility: '#F59E0B', travel: '#06B6D4' };

  if (loading) return <LoadingSpinner message="Loading rules…" />;
  if (error) return <ErrorState message={error} onRetry={fetchRules} />;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>Validation Rules</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>{rules.length} rule{rules.length !== 1 ? 's' : ''} configured{!isAdmin && ' (read-only)'}</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Rule
          </button>
        )}
      </div>

      {/* Form panel */}
      {showForm && isAdmin && (
        <>
          <div onClick={closeForm} style={{ position: 'fixed', inset: 0, zIndex: 60 }} className="panel-overlay" />
          <div className="animate-slide-in-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)', zIndex: 70, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>{editRule ? 'Edit Rule' : 'Create Rule'}</h3>
              <button onClick={closeForm} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <ErrorBanner message={formError} onDismiss={() => setFormError('')} />
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Rule ID</label>
                <input value={formData.rule_name} onChange={(e) => setFormData(p => ({ ...p, rule_name: e.target.value.replace(/\s/g, '_').toLowerCase() }))} style={inputStyle} placeholder="e.g. extreme_value" required disabled={!!editRule} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Display Name</label>
                <input value={formData.display_name} onChange={(e) => setFormData(p => ({ ...p, display_name: e.target.value }))} style={inputStyle} placeholder="Extreme Value Check" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: '72px', resize: 'none', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Severity</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['error', 'warning', 'info'].map((s) => (
                    <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, severity: s }))}
                      style={{ flex: 1, padding: '8px', border: `1px solid ${formData.severity === s ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', backgroundColor: formData.severity === s ? 'var(--accent-bg)' : 'var(--bg-card)', color: formData.severity === s ? 'var(--accent)' : 'var(--text-body)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Applies To</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['sap', 'utility', 'travel'].map((type) => {
                    const active = formData.source_types.includes(type);
                    return (
                      <button key={type} type="button" onClick={() => toggleSourceType(type)}
                        style={{ flex: 1, padding: '8px', border: `1px solid ${active ? sourceColors[type] : 'var(--border)'}`, borderRadius: '8px', backgroundColor: active ? 'var(--accent-bg)' : 'var(--bg-card)', color: active ? sourceColors[type] : 'var(--text-dim)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: active ? sourceColors[type] : 'var(--text-faint)', display: 'inline-block', marginRight: '6px' }} />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: '10px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : editRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Rules list */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {rules.map((rule) => (
          <div key={rule.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: rule.is_enabled ? 1 : 0.6, transition: 'opacity 0.2s ease' }}>
            {/* Toggle */}
            <button onClick={() => toggleRule(rule)} disabled={!isAdmin || toggling === rule.id}
              style={{ width: '40px', height: '22px', borderRadius: '999px', border: 'none', backgroundColor: rule.is_enabled ? 'var(--accent)' : 'var(--border)', cursor: isAdmin ? 'pointer' : 'default', position: 'relative', flexShrink: 0, transition: 'background-color 0.2s ease' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '3px', left: rule.is_enabled ? '21px' : '3px', transition: 'left 0.2s ease' }} />
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>{rule.display_name}</p>
                <SeverityBadge severity={rule.severity} />
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-dim)', padding: '1px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>{rule.rule_name}</span>
              </div>
              {rule.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px', marginBottom: '6px' }}>{rule.description}</p>}
              <div style={{ display: 'flex', gap: '4px' }}>
                {(rule.source_types || []).map((type) => (
                  <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: sourceColors[type] || 'var(--text-dim)' }} />
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => openEdit(rule)} style={{ padding: '5px 10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--text-body)', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(rule.id)} style={{ padding: '5px 10px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--danger-text)', cursor: 'pointer' }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
