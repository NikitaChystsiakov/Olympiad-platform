const THEME_KEY = 'olympus_theme';

export type ThemeMode = 'light' | 'dark';

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Storage unavailable: the theme still applies for this session.
  }
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0F1211' : '#ECEEE9');
}

export function getTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
