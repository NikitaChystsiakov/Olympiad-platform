import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useDemoLogin() {
  const t = useT();
  const navigate = useNavigate();
  const loginAsDemo = useAuthStore((state) => state.loginAsDemo);
  const [pending, setPending] = useState<UserRole | null>(null);

  const signIn = async (role: UserRole, redirectTo = '/dashboard') => {
    try {
      setPending(role);
      await loginAsDemo(role);
      toast.success(t('demo.welcome', { role: t(`roles.${role}`).toLowerCase() }));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'auth.loginFailed'));
    } finally {
      setPending(null);
    }
  };

  return { signIn, pending };
}
