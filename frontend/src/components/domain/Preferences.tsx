import { Moon, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocaleStore, useT, type Locale } from '@/i18n';
import { cn } from '@/utils/cn';
import { getTheme, setTheme, type ThemeMode } from '@/utils/theme';

export function LocaleSwitch({ className }: { className?: string }) {
  const t = useT();
  const { locale, setLocale } = useLocaleStore();
  const options: Locale[] = ['ru', 'en'];
  return (
    <div role="radiogroup" aria-label={t('nav.language')} className={cn('inline-flex h-9 rounded-control border border-line bg-surface p-0.5', className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={locale === option}
          onClick={() => setLocale(option)}
          className={cn(
            'min-w-9 rounded-[8px] px-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150',
            locale === option ? 'bg-ink text-white dark:bg-fg dark:text-[#0F1211]' : 'text-soft hover:text-fg',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const [theme, setThemeState] = useState<ThemeMode>(getTheme);

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const next = theme === 'light' ? 'dark' : 'light';
  const label = next === 'dark' ? t('nav.themeDark') : t('nav.themeLight');

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
      className={cn('inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface text-soft transition-colors hover:text-fg', className)}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </button>
  );
}
