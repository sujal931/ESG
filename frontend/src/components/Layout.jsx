import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
      </svg>
    ),
  },
  {
    to: '/upload',
    label: 'Upload',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    to: '/records',
    label: 'Records',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const adminNavItems = [
  {
    to: '/users',
    label: 'Users',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: '/rules',
    label: 'Rules',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/* ── Sun icon ─────── */
const SunIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

/* ── Moon icon ────── */
const MoonIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

/* ── Hamburger icon ─ */
const MenuIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

/* ── Close icon ───── */
const CloseIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function NavItem({ to, label, icon, sidebarOpen, isActive }) {
  return (
    <NavLink
      to={to} end={to === '/'}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: sidebarOpen ? '8px 10px' : '10px 0',
        borderRadius: '8px', fontSize: '13px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--accent)' : 'var(--text-body)',
        backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
        textDecoration: 'none', marginBottom: '2px',
        transition: 'all 0.15s ease',
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = isActive ? 'var(--accent-bg)' : 'transparent'; }}
    >
      <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }}>{icon}</span>
      {sidebarOpen && <span>{label}</span>}
      {isActive && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)',
          marginLeft: sidebarOpen ? 'auto' : 0,
          position: sidebarOpen ? 'static' : 'absolute', right: '4px', top: '8px',
        }} />
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically close sidebar on mobile when navigating pages
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      toggleSidebar();
    }
  }, [location.pathname, isMobile]);

  const sidebarWidth = 220; // Expanded width on mobile/desktop
  const collapsedWidth = 56; // Collapsed width on desktop

  const handleLogout = () => { logout(); navigate('/login'); };

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/upload') return 'Upload Center';
    if (location.pathname.startsWith('/records/')) return 'Record Detail';
    if (location.pathname === '/records') return 'Emission Records';
    if (location.pathname === '/users') return 'User Management';
    if (location.pathname === '/rules') return 'Validation Rules';
    return 'ESG Platform';
  };

  const isActivePath = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  /* Shared icon-button style */
  const iconBtn = {
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.15s ease',
  };

  // Determine sidebar horizontal position and main margin left based on viewport size
  const sidebarLeft = isMobile ? (sidebarOpen ? '0px' : '-220px') : '0px';
  const sidebarWidthActual = isMobile ? '220px' : (sidebarOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`);
  const mainMarginLeft = isMobile ? '0px' : (sidebarOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-page)' }}>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="panel-overlay animate-fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 45,
            cursor: 'pointer',
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarWidthActual,
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          position: 'fixed', top: 0, left: sidebarLeft, bottom: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          transition: 'all 0.2s ease', overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: (isMobile || sidebarOpen) ? '16px 16px' : '16px 0',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '10px',
            height: '52px', justifyContent: (isMobile || sidebarOpen) ? 'flex-start' : 'center',
          }}
        >
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700 }}>E</span>
          </div>
          {(isMobile || sidebarOpen) && (
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)', whiteSpace: 'nowrap' }}>ESG Platform</p>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: (isMobile || sidebarOpen) ? '8px 12px' : '8px 8px' }}>
          {(isMobile || sidebarOpen) && (
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '8px 8px 6px' }}>
              Navigation
            </p>
          )}
          {navItems.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} sidebarOpen={isMobile || sidebarOpen} isActive={isActivePath(to)} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              {(isMobile || sidebarOpen) && (
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '16px 8px 6px' }}>
                  Admin
                </p>
              )}
              {!(isMobile || sidebarOpen) && <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 4px' }} />}
              {adminNavItems.map(({ to, label, icon }) => (
                <NavItem key={to} to={to} label={label} icon={icon} sidebarOpen={isMobile || sidebarOpen} isActive={isActivePath(to)} />
              ))}
            </>
          )}
        </nav>

        {/* Org badge */}
        {(isMobile || sidebarOpen) && (
          <div style={{ padding: '0 16px', marginBottom: '12px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '999px',
              fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              {user?.organization_name || 'Organization'}
            </div>
          </div>
        )}

        {/* User footer */}
        <div style={{
          padding: (isMobile || sidebarOpen) ? '12px 16px' : '12px 8px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px',
          justifyContent: (isMobile || sidebarOpen) ? 'flex-start' : 'center',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: '11px', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          {(isMobile || sidebarOpen) && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isAdmin ? 'Admin' : 'Analyst'}
                </p>
              </div>
              <button
                onClick={handleLogout} title="Sign out"
                style={{ ...iconBtn, width: '28px', height: '28px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: mainMarginLeft, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'all 0.2s ease', overflowX: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '52px', backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', padding: isMobile ? '0 12px' : '0 24px', gap: isMobile ? '8px' : '12px',
        }}>
          {/* Hamburger toggle */}
          <button onClick={toggleSidebar} style={iconBtn} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {(isMobile ? sidebarOpen : sidebarOpen) ? <CloseIcon /> : <MenuIcon />}
          </button>

          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '120px' : 'none' }}>
            {getPageTitle()}
          </h2>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
            {/* Role badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 8px', backgroundColor: isAdmin ? 'var(--warning-bg)' : 'var(--info-bg)',
              border: `1px solid ${isAdmin ? 'var(--warning-border)' : 'var(--info-border)'}`, borderRadius: '999px',
              fontSize: '9px', fontWeight: 600, color: isAdmin ? 'var(--warning-text)' : 'var(--info-text)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isAdmin ? 'var(--warning)' : 'var(--accent)' }} />
              {isAdmin ? 'Admin' : 'Analyst'}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} style={iconBtn} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Online pill - hidden on mobile to prevent crowding */}
            {!isMobile && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: '999px',
                fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                Online
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: isMobile ? '16px' : '32px 36px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
