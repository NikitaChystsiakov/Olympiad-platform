import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { errorMessage } from '@/api/http';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    fullName: z.string().trim().min(2, t('auth.nameShort')),
    email: z.string().trim().email(t('auth.emailInvalid')),
    password: z.string().min(6, t('auth.passwordShort')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      await registerUser(values);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'auth.registerFailed'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthLayout title={t('auth.registerTitle')} lead={t('auth.registerLead')}>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field label={t('common.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
        </Field>
        <Field label={t('common.email')} htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field label={t('common.password')} htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {t('auth.submitRegister')}
        </Button>
      </form>
      <p className="mt-6 border-t border-line pt-5 text-sm text-soft">
        {t('auth.haveAccount')}{' '}
        <Link className="font-semibold text-accent hover:underline" to="/login">
          {t('auth.toLogin')}
        </Link>
      </p>
    </AuthLayout>
  );
}
