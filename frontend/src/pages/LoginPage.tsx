import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleButtonRef.current) return;

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return;
          try {
            setIsSubmitting(true);
            await loginWithGoogle(response.credential);
            toast.success('Вход через Google выполнен');
            navigate(redirectTo, { replace: true });
          } catch {
            toast.error('Не удалось войти через Google');
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.clientWidth || 320,
      });
    };

    if ((window as any).google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [googleClientId, loginWithGoogle, navigate, redirectTo]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      await login(values);
      toast.success('Вход выполнен');
      navigate(redirectTo, { replace: true });
    } catch {
      toast.error('Не удалось выполнить вход');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-md">
      <Card className="rounded-[28px] p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--primary),0.12)] text-[rgb(var(--primary))]">
          <LogIn className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold">Вход в систему</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
          Войдите, чтобы управлять олимпиадами или приступить к прохождению.
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold">Email</label>
            <Input placeholder="student@example.com" {...register('email')} />
            {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Пароль</label>
            <Input type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && (
              <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Выполняем вход...' : 'Войти'}
          </Button>
        </form>

        {googleClientId ? (
          <div className="mt-4" ref={googleButtonRef} />
        ) : (
          <p className="mt-4 rounded-xl bg-[rgba(var(--surface-muted),0.75)] p-3 text-sm text-[rgb(var(--text-soft))]">
            Google вход появится после настройки VITE_GOOGLE_CLIENT_ID.
          </p>
        )}

        <p className="mt-6 text-sm text-[rgb(var(--text-soft))]">
          Нет аккаунта?{' '}
          <Link className="font-semibold text-[rgb(var(--primary))]" to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </div>
  );
}
