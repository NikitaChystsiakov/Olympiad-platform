import { ArrowRight, MonitorPlay, Shield, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Shield,
    title: 'Прокторинг в реальном времени',
    description:
      'Фиксация подозрительных событий, контроль вкладок и сбор сигналов для честной оценки.',
  },
  {
    icon: Trophy,
    title: 'Полный цикл олимпиады',
    description:
      'Создание, публикация, управление вопросами, прохождение и хранение результатов в одном месте.',
  },
  {
    icon: MonitorPlay,
    title: 'Удобный онлайн-режим',
    description:
      'Адаптивный интерфейс для участников, организаторов и администраторов без перегруженных сценариев.',
  },
];

export function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[32px] border border-[rgba(var(--border),0.75)] bg-hero-mesh px-6 py-16 shadow-soft dark:bg-hero-mesh-dark sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl animate-floatIn">
            <p className="mb-4 inline-flex rounded-full bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[rgb(var(--primary))] dark:bg-slate-900/60">
              Онлайн-олимпиады с защитой от списывания
            </p>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Платформа, где контроль и удобство не мешают друг другу.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[rgb(var(--text-soft))]">
              Olympus Proctor помогает проводить олимпиады в цифровом формате: от регистрации
              участников до аналитики прокторинга и итоговых баллов.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button className="min-w-40">
                  Войти
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" className="min-w-40">
                  Зарегистрироваться
                </Button>
              </Link>
            </div>
          </div>

          <Card className="grid gap-5 rounded-[28px] bg-[rgba(var(--surface),0.72)] p-6">
            <div className="rounded-2xl bg-[rgb(var(--tide,15 23 42))] p-5 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-white/70">Контроль экзамена</p>
              <p className="mt-3 text-3xl font-extrabold">24/7</p>
              <p className="mt-2 text-sm text-white/80">
                Сигналы прокторинга, таймер попытки и журнал активности участника.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[rgba(var(--surface-muted),0.7)] p-4">
                <p className="text-sm text-[rgb(var(--text-soft))]">Роли</p>
                <p className="mt-2 text-xl font-bold">Student / Organizer / Admin</p>
              </div>
              <div className="rounded-2xl bg-[rgba(var(--surface-muted),0.7)] p-4">
                <p className="text-sm text-[rgb(var(--text-soft))]">Режим</p>
                <p className="mt-2 text-xl font-bold">Онлайн, адаптивно, быстро</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }, index) => (
          <Card
            key={title}
            className="animate-floatIn"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(var(--primary),0.12)] text-[rgb(var(--primary))]">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[rgb(var(--text-soft))]">{description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
