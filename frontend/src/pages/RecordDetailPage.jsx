import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recordsAPI, approvalsAPI, auditAPI } from '../api';
import { StatusBadge, ScopeBadge, SourceBadge, SeverityBadge } from '../components/Badges';
import { LoadingSpinner, ErrorState, SectionHeader } from '../components/Shared';

export default function RecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('normalized');
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, auditRes, approvalRes] = await Promise.all([recordsAPI.get(id), auditAPI.getEntityLogs('EmissionRecord', id), approvalsAPI.getHistory(id)]);
      setRecord(recRes.data); setAuditLogs(auditRes.data.results || auditRes.data || []); setApprovalHistory(approvalRes.data.results || approvalRes.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try { if (action === 'approved') await approvalsAPI.approve(id, comment); else await approvalsAPI.reject(id, comment); setComment(''); fetchData(); }
    catch (err) { alert(err.response?.data?.error || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner message="Loading record…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!record) return null;

  const tabs = [{ id: 'normalized', label: 'Normalized' }, { id: 'raw', label: 'Raw Data' }, { id: 'metadata', label: 'Metadata' }];
  const card = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' };
  const sectionHdr = { padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' };
  const btnStyle = (bg) => ({ flex: 1, padding: '8px', backgroundColor: bg, color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <SourceBadge source={record.source_type} /> <ScopeBadge scope={record.scope} /> <StatusBadge status={record.status} />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace', marginLeft: '8px' }}>ID: {record.id}</span>
        </div>
        <button onClick={() => setPanelOpen(true)} style={{ padding: '7px 14px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Review Actions</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        <div>
          {/* Tabs */}
          <div style={card}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: '-1px' }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ padding: '20px' }}>
              {activeTab === 'normalized' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Field label="Source Type" value={<SourceBadge source={record.source_type} />} />
                  <Field label="Scope" value={<ScopeBadge scope={record.scope} />} />
                  <Field label="Category" value={<span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', textTransform: 'capitalize' }}>{record.category}</span>} />
                  <Field label="Activity Value" value={<span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'monospace' }}>{record.activity_value != null ? Number(record.activity_value).toLocaleString() : '—'}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-dim)', marginLeft: '4px' }}>{record.activity_unit}</span></span>} />
                  <Field label="Normalized Value" value={<span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{record.normalized_value != null ? Number(record.normalized_value).toLocaleString() : '—'}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-dim)', marginLeft: '4px' }}>{record.normalized_unit}</span></span>} />
                  <Field label="Reporting Date" value={<span style={{ fontSize: '13px', color: 'var(--text-body)' }}>{record.reporting_date || '—'}</span>} />
                  {record.description && (
                    <div style={{ gridColumn: 'span 3', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: '20px' }}>{record.description}</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'raw' && record.raw_data && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {Object.entries(record.raw_data).map(([key, value], i) => (
                        <tr key={key} style={{ borderBottom: i < Object.keys(record.raw_data).length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <td style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'top', backgroundColor: 'var(--bg-surface)', width: '160px' }}>{key}</td>
                          <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-body)' }}>{value || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '12px' }}>empty</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'metadata' && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-surface)' }}>
                  {record.metadata && Object.keys(record.metadata).length > 0
                    ? <pre style={{ fontSize: '12px', color: 'var(--text-body)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '18px', margin: 0 }}>{JSON.stringify(record.metadata, null, 2)}</pre>
                    : <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No metadata available</p>}
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div style={{ ...card, marginTop: '16px', padding: '20px' }}>
            <SectionHeader>Audit Trail</SectionHeader>
            {auditLogs.length === 0 ? <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No audit entries yet</p> : (
              <div>
                {auditLogs.map((log, i) => (
                  <div key={log.id} style={{ display: 'flex', gap: '10px', position: 'relative', paddingBottom: i < auditLogs.length - 1 ? '16px' : 0 }}>
                    {i < auditLogs.length - 1 && <div style={{ position: 'absolute', left: '7px', top: '18px', bottom: 0, width: '1px', backgroundColor: 'var(--border)' }} />}
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', border: '2px solid var(--accent-border)', flexShrink: 0, marginTop: '2px', zIndex: 1 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-body)' }}><span style={{ fontWeight: 600 }}>{log.actor_name || 'System'}</span> <span style={{ color: 'var(--text-muted)' }}>{log.action.replace(/_/g, ' ')}</span></p>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <div style={card}>
            <div style={{ ...sectionHdr, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Validation Issues</span>
              {record.validation_issues?.length > 0 && <span style={{ padding: '1px 6px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '999px', fontSize: '10px', fontWeight: 600, color: 'var(--danger)' }}>{record.validation_issues.length}</span>}
            </div>
            <div style={{ padding: '12px 16px' }}>
              {!record.validation_issues || record.validation_issues.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--success)', fontSize: '13px' }}>✓</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--success-text)' }}>No issues found</span>
                </div>
              ) : (
                record.validation_issues.map((issue, i) => (
                  <div key={issue.id} style={{ padding: '10px 0', borderBottom: i < record.validation_issues.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><SeverityBadge severity={issue.severity} /><span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{issue.rule_name}</span></div>
                    <p style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: '18px' }}>{issue.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...card, marginTop: '12px' }}>
            <div style={sectionHdr}>Approval History</div>
            <div style={{ padding: '12px 16px' }}>
              {approvalHistory.length === 0 ? <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>No approval actions yet</p> : (
                approvalHistory.map((action, i) => (
                  <div key={action.id} style={{ padding: '10px 0', borderBottom: i < approvalHistory.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>{action.reviewer_name}</span><StatusBadge status={action.action} /></div>
                    {action.comment && <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>"{action.comment}"</p>}
                    <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>{new Date(action.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...card, marginTop: '12px' }}>
            <div style={sectionHdr}>Review</div>
            <div style={{ padding: '12px 16px' }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a review comment…" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-body)', backgroundColor: 'var(--bg-input)', resize: 'none', height: '72px', fontFamily: 'Inter, sans-serif' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => handleAction('approved')} disabled={actionLoading} style={btnStyle('var(--btn-success)')}>Approve</button>
                <button onClick={() => handleAction('rejected')} disabled={actionLoading} style={btnStyle('var(--btn-danger)')}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Panel */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} className="panel-overlay" style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div className="animate-slide-in-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '620px', backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)', zIndex: 70, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>Record Detail</h3><p style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace', marginTop: '2px' }}>ID: {record.id}</p></div>
              <button onClick={() => setPanelOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}><SourceBadge source={record.source_type} /><ScopeBadge scope={record.scope} /><StatusBadge status={record.status} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Category" value={<span style={{ fontSize: '13px', color: 'var(--text-body)', textTransform: 'capitalize' }}>{record.category}</span>} />
                <Field label="Reporting Date" value={<span style={{ fontSize: '13px', color: 'var(--text-body)' }}>{record.reporting_date || '—'}</span>} />
                <Field label="Activity Value" value={<span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-h)', fontFamily: 'monospace' }}>{record.activity_value != null ? Number(record.activity_value).toLocaleString() : '—'} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-dim)' }}>{record.activity_unit}</span></span>} />
                <Field label="Normalized Value" value={<span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{record.normalized_value != null ? Number(record.normalized_value).toLocaleString() : '—'} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-dim)' }}>{record.normalized_unit}</span></span>} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment…" style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-body)', backgroundColor: 'var(--bg-input)', resize: 'none', height: '40px', fontFamily: 'Inter, sans-serif' }} />
              <button onClick={() => { handleAction('approved'); setPanelOpen(false); }} style={{ padding: '8px 16px', backgroundColor: 'var(--btn-success)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Approve</button>
              <button onClick={() => { handleAction('rejected'); setPanelOpen(false); }} style={{ padding: '8px 16px', backgroundColor: 'var(--btn-danger)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
      <div>{value}</div>
    </div>
  );
}
