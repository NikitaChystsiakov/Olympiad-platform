import { useT } from '@/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  const t = useT();
  return (
    <EmptyState
      title={t('errors.notFoundTitle')}
      text={t('errors.notFoundText')}
      action={<ButtonLink to="/dashboard">{t('nav.olympiads')}</ButtonLink>}
    />
  );
}
