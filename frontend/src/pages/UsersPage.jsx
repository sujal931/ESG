import { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../AuthContext';
import { SectionHeader, LoadingSpinner, ErrorState, ErrorBanner } from '../components/Shared';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', first_name: '', last_name: '', role: 'analyst', password: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try { const res = await authAPI.listUsers(); setUsers(res.data.results || res.data || []); }
    catch (err) { setError(err.response?.data?.detail || err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditUser(null); setFormData({ username: '', email: '', first_name: '', last_name: '', role: 'analyst', password: '' }); setFormError(''); setShowForm(true); };
  const openEdit = (u) => { setEditUser(u); setFormData({ username: u.username, email: u.email || '', first_name: u.first_name || '', last_name: u.last_name || '', role: u.role, password: '' }); setFormError(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditUser(null); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (editUser) {
        const data = { ...formData }; if (!data.password) delete data.password;
        await authAPI.updateUser(editUser.id, data);
      } else {
        if (!formData.password || formData.password.length < 8) { setFormError('Password must be at least 8 characters'); setSaving(false); return; }
        await authAPI.createUser(formData);
      }
      closeForm(); fetchUsers();
    } catch (err) { setFormError(err.response?.data?.detail || err.response?.data?.username?.[0] || JSON.stringify(err.response?.data) || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Remove this user from the organization?')) return;
    try { await authAPI.deleteUser(userId); fetchUsers(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete user'); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-h)', backgroundColor: 'var(--bg-input)' };

  if (loading) return <LoadingSpinner message="Loading users…" />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>User Management</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>{users.length} user{users.length !== 1 ? 's' : ''} in your organization</p>
        </div>
        <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: 'fixed', inset: 0, zIndex: 60 }} className="panel-overlay" />
          <div className="animate-slide-in-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)', zIndex: 70, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>{editUser ? 'Edit User' : 'Create User'}</h3>
              <button onClick={closeForm} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <ErrorBanner message={formError} onDismiss={() => setFormError('')} />
              {[
                { key: 'username', label: 'Username', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'first_name', label: 'First Name', type: 'text' },
                { key: 'last_name', label: 'Last Name', type: 'text' },
                { key: 'password', label: editUser ? 'New Password (leave blank to keep)' : 'Password', type: 'password', required: !editUser },
              ].map(({ key, label, type, required }) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>{label}</label>
                  <input type={type} value={formData[key]} onChange={(e) => setFormData(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} required={required} />
                </div>
              ))}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['analyst', 'admin'].map((role) => (
                    <button key={role} type="button" onClick={() => setFormData(p => ({ ...p, role }))}
                      style={{ flex: 1, padding: '10px', border: `1px solid ${formData.role === role ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', backgroundColor: formData.role === role ? 'var(--accent-bg)' : 'var(--bg-card)', color: formData.role === role ? 'var(--accent)' : 'var(--text-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: '10px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : editUser ? 'Update User' : 'Create User'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Users table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
              {['User', 'Email', 'Role', 'Status', 'Created', ''].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: u.role === 'admin' ? 'var(--warning)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                        {u.first_name?.[0] || 'U'}{u.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-h)' }}>{u.first_name} {u.last_name}{isSelf ? <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '6px' }}>(you)</span> : ''}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-body)' }}>{u.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', backgroundColor: u.role === 'admin' ? 'var(--warning-bg)' : 'var(--info-bg)', border: `1px solid ${u.role === 'admin' ? 'var(--warning-border)' : 'var(--info-border)'}`, borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: u.role === 'admin' ? 'var(--warning-text)' : 'var(--info-text)', textTransform: 'capitalize' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: u.role === 'admin' ? 'var(--warning)' : 'var(--accent)' }} />
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', backgroundColor: u.is_active !== false ? 'var(--success-bg)' : 'var(--danger-bg)', border: `1px solid ${u.is_active !== false ? 'var(--success-border)' : 'var(--danger-border)'}`, borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: u.is_active !== false ? 'var(--success-text)' : 'var(--danger-text)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: u.is_active !== false ? 'var(--success)' : 'var(--danger)' }} />
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-dim)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--text-body)', cursor: 'pointer' }}>Edit</button>
                      {!isSelf && <button onClick={() => handleDelete(u.id)} style={{ padding: '5px 10px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--danger-text)', cursor: 'pointer' }}>Remove</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
