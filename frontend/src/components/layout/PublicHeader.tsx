import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { LocaleSwitch, ThemeToggle } from '@/components/domain/Preferences';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export const GITHUB_URL = 'https://github.com/NikitaChystsiakov/Olympiad-platform';

export function PublicHeader({ anchors = false }: { anchors?: boolean }) {
  const t = useT();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <header className="page-shell flex h-[72px] items-center justify-between gap-4">
      <Logo />
      {anchors && (
        <nav className="hidden items-center gap-7 text-sm font-medium text-soft md:flex">
          <a href="#how" className="transition-colors hover:text-fg">{t('nav.features')}</a>
          <a href="#proctoring" className="transition-colors hover:text-fg">{t('nav.proctoring')}</a>
          <a href="#stack" className="transition-colors hover:text-fg">{t('nav.stack')}</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg">{t('nav.github')}</a>
        </nav>
      )}
      <div className="flex items-center gap-2">
        <LocaleSwitch />
        <ThemeToggle />
        {isAuthenticated ? (
          <ButtonLink to="/dashboard" variant="ink" size="sm" className="h-9">
            {t('nav.olympiads')}
          </ButtonLink>
        ) : (
          <ButtonLink to="/login" variant="ink" size="sm" className="h-9 px-4 text-sm">
            {t('nav.login')}
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
