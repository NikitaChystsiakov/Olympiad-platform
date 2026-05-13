const THEME_KEY = 'olympus_theme';

export type ThemeMode = 'light' | 'dark';

export function initializeTheme() {
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function getTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
