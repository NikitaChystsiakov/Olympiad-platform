import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  fullName: z.string().min(5, 'Введите ФИО полностью'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      await registerUser(values);
      toast.success('Регистрация завершена');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-md">
      <Card className="rounded-[28px] p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--success),0.12)] text-[rgb(var(--success))]">
          <UserPlus className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold">Создание аккаунта</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
          После регистрации вы сразу попадёте в рабочую панель.
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold">ФИО</label>
            <Input placeholder="Иванов Иван Иванович" {...register('fullName')} />
            {errors.fullName && (
              <p className="mt-2 text-sm text-rose-500">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Email</label>
            <Input placeholder="organizer@example.com" {...register('email')} />
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
            {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-[rgb(var(--text-soft))]">
          Уже есть аккаунт?{' '}
          <Link className="font-semibold text-[rgb(var(--primary))]" to="/login">
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
}
