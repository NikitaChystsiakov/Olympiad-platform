import { Moon, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getTheme, setTheme, type ThemeMode } from '@/utils/theme';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <Button variant="ghost" className="w-11 px-0" onClick={toggleTheme} aria-label="Переключить тему">
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <SunMedium className="h-5 w-5" />}
    </Button>
  );
}
