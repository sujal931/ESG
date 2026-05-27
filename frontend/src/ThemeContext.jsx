import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('esg-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('esg-sidebar');
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('esg-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('esg-sidebar', String(sidebarOpen));
  }, [sidebarOpen]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
