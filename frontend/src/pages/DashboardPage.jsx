import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recordsAPI, ingestionAPI } from '../api';
import { StatCard, LoadingSpinner, ErrorState, SectionHeader } from '../components/Shared';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [dashRes, uploadRes] = await Promise.all([recordsAPI.dashboard(), ingestionAPI.getStats()]);
      setStats(dashRes.data); setUploadStats(uploadRes.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const s = stats || {}, u = uploadStats || {};

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>Overview</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>Your ESG data pipeline at a glance</p>
        </div>
        <Link to="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Upload Data
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Records" value={s.total_records || 0} />
        <StatCard label="Pending Review" value={s.by_status?.pending || 0} accent="amber" />
        <StatCard label="Needs Review" value={s.by_status?.needs_review || 0} accent="red" />
        <StatCard label="Approved" value={s.by_status?.approved || 0} accent="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* By Source */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <SectionHeader>Records by Source</SectionHeader>
          {[
            { label: 'SAP Fuel & Procurement', key: 'sap', color: '#6366F1' },
            { label: 'Utility Electricity', key: 'utility', color: '#F59E0B' },
            { label: 'Corporate Travel', key: 'travel', color: '#06B6D4' },
          ].map(({ label, key, color }, i, arr) => {
            const count = s.by_source?.[key] || 0, total = s.total_records || 1, pct = Math.round((count / total) * 100) || 0;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>{count}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* By Scope */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <SectionHeader>Records by Scope</SectionHeader>
          {[
            { label: 'Scope 1 — Direct Emissions', key: 'scope_1', color: '#8B5CF6' },
            { label: 'Scope 2 — Energy (Indirect)', key: 'scope_2', color: '#0EA5E9' },
            { label: 'Scope 3 — Value Chain', key: 'scope_3', color: '#14B8A6' },
          ].map(({ label, key, color }, i, arr) => {
            const count = s.by_scope?.[key] || 0, total = s.total_records || 1, pct = Math.round((count / total) * 100) || 0;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>{count}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Activity */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <SectionHeader>Pipeline Activity</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total Uploads', value: u.total_uploads || 0 },
            { label: 'Rows Processed', value: u.total_rows_processed || 0 },
            { label: 'Error Rows', value: u.total_error_rows || 0, accent: 'var(--danger)' },
            { label: 'Validation Issues', value: s.validation_issues || 0, accent: 'var(--warning)' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: accent || 'var(--text-h)', letterSpacing: '-0.02em' }}>{value.toLocaleString()}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader>Quick Actions</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { to: '/records?status=needs_review', title: 'Review Flagged', desc: `${s.by_status?.needs_review || 0} records need attention` },
          { to: '/records?status=pending', title: 'Pending Approvals', desc: `${s.by_status?.pending || 0} records awaiting approval` },
          { to: '/upload', title: 'Upload New Data', desc: 'SAP, Utility, or Travel CSVs' },
        ].map(({ to, title, desc }) => (
          <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-faint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>{title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{desc}</p>
            </div>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
