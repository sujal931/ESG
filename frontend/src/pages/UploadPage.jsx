import { useState, useRef } from 'react';
import { ingestionAPI } from '../api';
import { StatusBadge } from '../components/Badges';
import { SectionHeader } from '../components/Shared';

const SOURCE_CONFIGS = [
  { type: 'sap', title: 'SAP Fuel & Procurement', description: 'SAP material movement exports. German column names, mixed units, inconsistent dates.', dot: '#6366F1', expected: ['BUKRS', 'WERKS', 'MATNR', 'MENGE', 'MEINS', 'BUDAT', 'DMBTR'] },
  { type: 'utility', title: 'Utility Electricity', description: 'Electricity billing data. Duplicate detection, kWh normalization, usage flagging.', dot: '#F59E0B', expected: ['meter_id', 'billing_start', 'billing_end', 'kwh', 'tariff', 'cost'] },
  { type: 'travel', title: 'Corporate Travel', description: 'Concur/Navan exports. Missing flight distance estimation from airport codes.', dot: '#06B6D4', expected: ['traveler_name', 'category', 'origin_airport', 'destination_airport', 'cabin_class'] },
];

function UploadCard({ config }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null); setResult(null);
    try { const res = await ingestionAPI.upload(file, config.type); setResult(res.data); setFile(null); if (fileRef.current) fileRef.current.value = ''; }
    catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setUploading(false); }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const dropped = e.dataTransfer.files?.[0]; if (dropped?.name.toLowerCase().endsWith('.csv')) setFile(dropped); };

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.dot, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>{config.title}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{config.description}</p>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Expected Columns</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {config.expected.map((col) => (
              <span key={col} style={{ padding: '2px 8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{col}</span>
            ))}
          </div>
        </div>
        <div
          style={{ border: `1px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border)'}`, borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', backgroundColor: dragOver ? 'var(--accent-bg)' : file ? 'var(--success-bg)' : 'var(--bg-card)', transition: 'all 0.15s ease' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-body)', fontWeight: 500 }}>{file.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Drop CSV here or click to browse</p>
          )}
        </div>
        <button onClick={handleUpload} disabled={!file || uploading}
          style={{ width: '100%', marginTop: '12px', padding: '9px 16px', backgroundColor: !file || uploading ? 'var(--bg-hover)' : 'var(--accent)', color: !file || uploading ? 'var(--text-dim)' : '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: !file || uploading ? '1px solid var(--border)' : 'none', cursor: !file || uploading ? 'not-allowed' : 'pointer' }}
        >
          {uploading ? 'Processing…' : 'Upload & Process'}
        </button>
        {result && (
          <div style={{ marginTop: '12px', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '8px' }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>Upload Complete</span>
              <StatusBadge status={result.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Total', value: result.total_rows },
                { label: 'Processed', value: result.processed_rows, color: 'var(--success)' },
                { label: 'Errors', value: result.error_rows, color: 'var(--danger)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: color || 'var(--text-h)' }}>{value}</p>
                  <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px' }} className="animate-fade-in">
            <p style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>Upload Center</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>Upload CSV data from source systems. Files are parsed, normalized, and validated automatically.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {SOURCE_CONFIGS.map((config) => <UploadCard key={config.type} config={config} />)}
      </div>
    </div>
  );
}
