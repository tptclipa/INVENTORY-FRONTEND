import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'theme';
const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
  }
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === THEMES.LIGHT || saved === THEMES.DARK || saved === THEMES.SYSTEM) return saved;
    return THEMES.SYSTEM;
  });

  const resolvedDark = themeMode === THEMES.SYSTEM ? getSystemPrefersDark() : themeMode === THEMES.DARK;

  useEffect(() => {
    const effectiveDark = themeMode === THEMES.SYSTEM ? getSystemPrefersDark() : themeMode === THEMES.DARK;
    applyDarkMode(effectiveDark);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== THEMES.SYSTEM) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyDarkMode(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [themeMode]);

  const setTheme = (mode) => setThemeMode(mode);
  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === THEMES.LIGHT) return THEMES.DARK;
      if (prev === THEMES.DARK) return THEMES.SYSTEM;
      return THEMES.LIGHT;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setTheme,
        cycleTheme,
        isDarkMode: resolvedDark,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
