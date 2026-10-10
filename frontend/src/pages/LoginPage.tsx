import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { errorMessage } from '@/api/http';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated } = useAuthStore();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const schema = z.object({
    email: z.string().trim().email(t('auth.emailInvalid')),
    password: z.string().min(6, t('auth.passwordShort')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const render = () => {
      const google = window.google;
      if (!google?.accounts?.id || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            await loginWithGoogle(response.credential);
            navigate(redirectTo, { replace: true });
          } catch (error) {
            toast.error(errorMessage(error, 'auth.loginFailed'));
          }
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: googleButtonRef.current.clientWidth || 360,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [googleClientId, loginWithGoogle, navigate, redirectTo]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const user = await login(values);
      toast.success(t('auth.welcomeBack', { name: user.fullName }));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'auth.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title={t('auth.loginTitle')} lead={t('auth.loginLead')} redirectTo={redirectTo}>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field label={t('common.email')} htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field label={t('common.password')} htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {t('auth.submitLogin')}
        </Button>
      </form>

      {googleClientId && <div className="mt-4" ref={googleButtonRef} />}

      <p className="mt-6 border-t border-line pt-5 text-sm text-soft">
        {t('auth.noAccount')}{' '}
        <Link className="font-semibold text-accent hover:underline" to="/register">
          {t('auth.toRegister')}
        </Link>
      </p>
    </AuthLayout>
  );
}
