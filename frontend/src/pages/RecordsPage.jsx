import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recordsAPI, approvalsAPI } from '../api';
import { useAuth } from '../AuthContext';
import { StatusBadge, ScopeBadge, SourceBadge } from '../components/Badges';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/Shared';

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filters, setFilters] = useState({
    source_type: searchParams.get('source_type') || '', scope: searchParams.get('scope') || '',
    status: searchParams.get('status') || '', search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const fetchRecords = async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filters.source_type) params.source_type = filters.source_type;
      if (filters.scope) params.scope = filters.scope;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      params.page = filters.page;
      const res = await recordsAPI.list(params);
      setRecords(res.data.results || []);
      setPagination({ count: res.data.count || 0, next: res.data.next, previous: res.data.previous });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRecords();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== '' && v !== 1) params.set(k, v); });
    setSearchParams(params, { replace: true });
  }, [filters]);

  const updateFilter = (key, value) => { setFilters((p) => ({ ...p, [key]: value, page: 1 })); setSelected(new Set()); };
  const toggleSelect = (id) => { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSelectAll = () => { selected.size === records.length ? setSelected(new Set()) : setSelected(new Set(records.map((r) => r.id))); };

  const handleBulkAction = async (action) => {
    if (selected.size === 0) return; setBulkLoading(true);
    try { await approvalsAPI.bulkAction([...selected], action); setSelected(new Set()); fetchRecords(); }
    catch (err) { alert(err.response?.data?.error || 'Bulk action failed'); }
    finally { setBulkLoading(false); }
  };

  const handleBulkLock = async (locked) => {
    if (selected.size === 0) return; setBulkLoading(true);
    try { await recordsAPI.bulkLock([...selected], locked); setSelected(new Set()); fetchRecords(); }
    catch (err) { alert(err.response?.data?.error || 'Lock action failed'); }
    finally { setBulkLoading(false); }
  };

  const totalPages = Math.ceil(pagination.count / 25);
  const hasActiveFilters = filters.source_type || filters.scope || filters.status || filters.search;
  const inputStyle = { padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-body)', backgroundColor: 'var(--bg-input)', outline: 'none' };

  const LockIcon = ({ locked, size = 12 }) => locked ? (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  ) : (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>Records</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{pagination.count} total record{pagination.count !== 1 ? 's' : ''}{hasActiveFilters && ' (filtered)'}</p>
        </div>
        <Link to="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Upload
        </Link>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <input type="text" placeholder="Search records…" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} style={{ ...inputStyle, flex: '1', minWidth: '180px', maxWidth: '280px' }} />
          {[
            { key: 'source_type', label: 'All Sources', options: [['sap','SAP'],['utility','Utility'],['travel','Travel']] },
            { key: 'scope', label: 'All Scopes', options: [['scope_1','Scope 1'],['scope_2','Scope 2'],['scope_3','Scope 3']] },
            { key: 'status', label: 'All Statuses', options: [['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['needs_review','Needs Review']] },
          ].map(({ key, label, options }) => (
            <select key={key} value={filters[key]} onChange={(e) => updateFilter(key, e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: '32px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}>
              <option value="">{label}</option>
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          {hasActiveFilters && (
            <button onClick={() => setFilters({ source_type: '', scope: '', status: '', search: '', page: 1 })} style={{ padding: '8px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer' }}>Clear</button>
          )}
        </div>
        {selected.size > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }} className="animate-fade-in">
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)' }}>{selected.size} selected</span>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
            {isAdmin && (
              <>
                <button onClick={() => handleBulkAction('approved')} disabled={bulkLoading} style={{ padding: '6px 14px', backgroundColor: 'var(--btn-success)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: bulkLoading ? 0.5 : 1 }}>Approve</button>
                <button onClick={() => handleBulkAction('rejected')} disabled={bulkLoading} style={{ padding: '6px 14px', backgroundColor: 'var(--btn-danger)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: bulkLoading ? 0.5 : 1 }}>Reject</button>
                <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
                <button onClick={() => handleBulkLock(true)} disabled={bulkLoading} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LockIcon locked={true} size={11} /> Lock
                </button>
                <button onClick={() => handleBulkLock(false)} disabled={bulkLoading} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LockIcon locked={false} size={11} /> Unlock
                </button>
              </>
            )}
            {!isAdmin && <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>Bulk actions require admin access</span>}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={fetchRecords} /> : records.length === 0 ? <EmptyState title="No records found" message="Upload some data first, or adjust your filters." /> : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', width: '40px', borderBottom: '1px solid var(--border)' }}><input type="checkbox" checked={selected.size === records.length && records.length > 0} onChange={toggleSelectAll} /></th>
                  {['Source', 'Scope', 'Category', 'Value', 'Unit', 'Status', 'Issues', 'Date', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: h === 'Value' ? 'right' : h === 'Issues' ? 'center' : 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-light)', opacity: record.is_locked ? 0.75 : 1 }}>
                    <td style={{ padding: '10px 16px' }}><input type="checkbox" checked={selected.has(record.id)} onChange={() => toggleSelect(record.id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ textDecoration: 'none' }}><SourceBadge source={record.source_type} /></Link></td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ textDecoration: 'none' }}><ScopeBadge scope={record.scope} /></Link></td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ fontSize: '13px', color: 'var(--text-body)', textDecoration: 'none', textTransform: 'capitalize' }}>{record.category}</Link></td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}><Link to={`/records/${record.id}`} style={{ fontSize: '13px', color: 'var(--text-h)', fontWeight: 500, fontFamily: 'monospace', textDecoration: 'none' }}>{record.activity_value != null ? Number(record.activity_value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : <span style={{ color: 'var(--text-faint)' }}>—</span>}</Link></td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>{record.activity_unit || '—'}</Link></td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ textDecoration: 'none' }}><StatusBadge status={record.status} /></Link></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <Link to={`/records/${record.id}`} style={{ textDecoration: 'none' }}>
                        {record.issue_count > 0
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--danger-border)' }}>{record.issue_count}</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', fontSize: '11px', borderRadius: '6px', border: '1px solid var(--success-border)' }}>✓</span>}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 16px' }}><Link to={`/records/${record.id}`} style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>{record.reporting_date || '—'}</Link></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      {record.is_locked && (
                        <span title="Locked for audit" style={{ color: 'var(--warning)', display: 'inline-flex' }}>
                          <LockIcon locked={true} size={14} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {filters.page} of {totalPages} ({pagination.count} records)</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} disabled={!pagination.previous} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)', cursor: pagination.previous ? 'pointer' : 'not-allowed', opacity: pagination.previous ? 1 : 0.4, color: 'var(--text-body)' }}>Previous</button>
                <button onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} disabled={!pagination.next} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)', cursor: pagination.next ? 'pointer' : 'not-allowed', opacity: pagination.next ? 1 : 0.4, color: 'var(--text-body)' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
