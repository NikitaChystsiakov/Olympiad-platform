import { Camera, Check, ClipboardPaste, Github, Maximize, PanelsTopLeft, Play, ScanFace, Users } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { useT } from '@/i18n';
import type { ProctoringEventType, RiskLevel } from '@/types';
import { cn } from '@/utils/cn';
import { formatTimer } from '@/utils/format';
import { DemoRoleSwitch } from '@/components/domain/DemoLogin';
import { RiskBadge } from '@/components/domain/StatusBadges';
import { GITHUB_URL, PublicHeader } from '@/components/layout/PublicHeader';
import { LogoMark } from '@/components/ui/Logo';
import { ScoreBar } from '@/components/ui/ScoreBar';

export function LandingPage() {
  const t = useT();

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader anchors />

      <main>
        <Hero />
        <HowItWorks />
        <ProctoringSection />
        <RankingSection />
        <StackSection />

        <section className="page-shell py-16 sm:py-24">
          <div className="rounded-[28px] bg-accent px-6 py-12 text-center text-white sm:px-12 sm:py-16 dark:bg-accent-soft dark:text-fg">
            <h2 className="font-serif text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[44px]">{t('landing.cta.title')}</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[17px] text-white/85 dark:text-soft">{t('landing.cta.lead')}</p>
            <DemoRoleSwitch onDark className="mt-8" />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="page-shell flex flex-col gap-4 py-8 text-sm text-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <span>
              Olympus Proctor · {new Date().getFullYear()} · {t('landing.footer')}
            </span>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-fg hover:underline">
            <Github className="h-4 w-4" />
            {t('landing.stack.repo')}
          </a>
        </div>
      </footer>
    </div>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="overflow-hidden pt-10 sm:pt-16">
      <div className="page-shell text-center">
        <h1 className="mx-auto max-w-[17ch] font-serif text-display-sm font-semibold sm:text-display">
          {t('landing.titleBefore')}
          <span className="marker">{t('landing.titleMark')}</span>
          {t('landing.titleAfter')}
        </h1>
        <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-relaxed text-soft sm:text-lg">{t('landing.lead')}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <DemoRoleSwitch />
          <p className="text-[13px] text-soft">{t('demo.hint')}</p>
        </div>
      </div>
      <div className="page-shell mt-12 sm:mt-14">
        <ExamPreview />
      </div>
    </section>
  );
}

/** A working miniature of the attempt screen: the timer really counts down. */
function ExamPreview() {
  const t = useT();
  const [seconds, setSeconds] = useState(42 * 60 + 17);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 42 * 60 + 17)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden
      className="relative mx-auto grid max-w-[1180px] overflow-hidden rounded-t-[22px] border border-b-0 border-line bg-surface text-left shadow-float md:grid-cols-[200px_1fr_250px] lg:grid-cols-[220px_1fr_270px]"
    >
      <div className="hidden border-r border-line p-5 md:block">
        <p className="label">{t('landing.preview.questions')}</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={cn(
                'grid h-9 place-items-center rounded-[9px] text-[13px] font-semibold',
                n < 4 && 'bg-accent-soft text-accent',
                n === 4 && 'bg-marker text-[#3A3000]',
                n === 5 && 'bg-muted text-soft',
              )}
            >
              {n}
            </span>
          ))}
        </div>
        <p className="mt-7 text-[13px] font-semibold leading-snug">{t('landing.preview.olympiad')}</p>
      </div>

      <div className="min-w-0 p-5 sm:p-7">
        <div className="mb-5 space-y-3 md:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-ink px-4 py-3 text-white dark:bg-[#0A0C0B]">
            <span className="font-mono text-[28px] font-semibold leading-none tabular-nums">{formatTimer(seconds)}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7FD1AE]">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" />
              {t('landing.preview.faceOk')}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn(
                  'grid h-8 place-items-center rounded-[8px] text-[13px] font-semibold',
                  n < 4 && 'bg-accent-soft text-accent',
                  n === 4 && 'bg-marker text-[#3A3000]',
                  n === 5 && 'bg-muted text-soft',
                )}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[13px] font-medium text-soft">{t('landing.preview.question', { n: 4 })}</p>
        <p className="mt-1.5 font-serif text-[22px] font-semibold leading-snug">{t('landing.preview.task')}</p>
        <div className="mt-5 rounded-[14px] bg-[#16191C] p-4 font-mono text-[13px] leading-[1.75] text-[#E6E6E1]">
          <div>
            <span className="text-[#F6DD5A]">def</span> fib(n):
          </div>
          <div className="pl-5">
            a, b = <span className="text-[#7FD1AE]">0</span>, <span className="text-[#7FD1AE]">1</span>
          </div>
          <div className="pl-5">
            <span className="text-[#F6DD5A]">for</span> _ <span className="text-[#F6DD5A]">in</span> range(n):
          </div>
          <div className="pl-10">a, b = b, a + b</div>
          <div className="pl-5">
            <span className="text-[#F6DD5A]">return</span> a
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-control bg-ink px-3.5 text-sm font-semibold text-white dark:bg-fg dark:text-[#0F1211]">
            <Play className="h-3.5 w-3.5" />
            {t('landing.preview.run')}
          </span>
          <span className="font-mono text-[13px] text-soft">{t('landing.preview.output')}</span>
        </div>
      </div>

      <div className="hidden flex-col gap-3 border-l border-line p-5 md:flex">
        <div className={cn('rounded-[16px] p-4 text-white', seconds < 300 ? 'bg-risk-high' : 'bg-ink dark:bg-[#0A0C0B]')}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">{t('landing.preview.left')}</p>
          <p className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums tracking-[-0.02em]">{formatTimer(seconds)}</p>
        </div>
        <div className="relative grid h-[124px] place-items-center overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#7E8B83,#4C5751)]">
          <ScanFace className="h-14 w-14 text-white/85" strokeWidth={1.25} />
          <svg className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)] text-marker" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <path d="M0 14V4a4 4 0 0 1 4-4h10M86 0h10a4 4 0 0 1 4 4v10M100 86v10a4 4 0 0 1-4 4H86M14 100H4a4 4 0 0 1-4-4V86" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse-dot rounded-full bg-[#FF5A4E]" />
        </div>
        <ul className="space-y-1.5 text-[13px] font-medium text-risk-low">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {t('landing.preview.faceOk')}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {t('landing.preview.fullscreen')}
          </li>
        </ul>
      </div>
    </div>
  );
}

function HowItWorks() {
  const t = useT();
  const steps = [1, 2, 3] as const;
  return (
    <section id="how" className="scroll-mt-6 border-t border-line bg-surface py-16 sm:py-24">
      <div className="page-shell">
        <div className="max-w-[640px]">
          <h2 className="font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{t('landing.how.title')}</h2>
          <p className="mt-3 text-[17px] text-soft">{t('landing.how.lead')}</p>
        </div>

        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-line md:block" />
          {steps.map((step) => (
            <li key={step} className="relative">
              <span
                className={cn(
                  'relative grid h-10 w-10 place-items-center rounded-full font-serif text-lg font-semibold',
                  'bg-ink text-white dark:bg-fg dark:text-[#0F1211]',
                )}
              >
                {step}
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em]">{t(`landing.how.s${step}`)}</h3>
              <p className="mt-2 max-w-[42ch] text-soft">{t(`landing.how.s${step}text`)}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <Check className="h-4 w-4" />
                {t(`landing.how.s${step}detail`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const SIGNALS: Array<{ icon: ComponentType<{ className?: string }>; key: string; rule: string; severe?: boolean }> = [
  { icon: PanelsTopLeft, key: 'tab', rule: 'tabRule' },
  { icon: Maximize, key: 'fullscreen', rule: 'fullscreenRule' },
  { icon: ScanFace, key: 'face', rule: 'faceRule' },
  { icon: Users, key: 'faces', rule: 'facesRule', severe: true },
  { icon: ClipboardPaste, key: 'paste', rule: 'pasteRule' },
  { icon: Camera, key: 'camera', rule: 'cameraRule', severe: true },
];

const EVENT_COLORS: Partial<Record<ProctoringEventType, string>> = {
  TAB_SWITCH: 'bg-white/45',
  FULLSCREEN_EXIT: 'bg-white/25',
  FACE_MISSING: 'bg-[#F2B65A]',
  COPY_PASTE: 'bg-[#8FB8FF]',
  MULTIPLE_FACES: 'bg-[#FF7A70]',
  CAMERA_UNAVAILABLE: 'bg-[#FF7A70]/55',
};

const REPORT_SAMPLE: Array<{ name: string; risk: RiskLevel; events: Partial<Record<ProctoringEventType, number>> }> = [
  { name: 'Ольга Морозова', risk: 'HIGH', events: { MULTIPLE_FACES: 1, TAB_SWITCH: 1 } },
  { name: 'Иван Новиков', risk: 'MEDIUM', events: { TAB_SWITCH: 5, COPY_PASTE: 1 } },
  { name: 'Анна Волкова', risk: 'MEDIUM', events: { FACE_MISSING: 3 } },
  { name: 'Артём Егоров', risk: 'MEDIUM', events: { CAMERA_UNAVAILABLE: 1, TAB_SWITCH: 2 } },
  { name: 'Дмитрий Козлов', risk: 'LOW', events: { TAB_SWITCH: 2, FULLSCREEN_EXIT: 1 } },
];

function ProctoringSection() {
  const t = useT();
  const maxEvents = Math.max(...REPORT_SAMPLE.map((row) => Object.values(row.events).reduce((a, b) => a + (b ?? 0), 0)));

  return (
    <section id="proctoring" className="scroll-mt-6 bg-ink py-16 text-white sm:py-24 dark:bg-[#0A0C0B]">
      <div className="page-shell grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{t('landing.proctor.title')}</h2>
          <p className="mt-4 max-w-[52ch] text-[17px] text-white/70">{t('landing.proctor.lead')}</p>
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10" aria-label={t('landing.proctor.signalsTitle')}>
            {SIGNALS.map(({ icon: Icon, key, rule, severe }) => (
              <div key={key} className="grid grid-cols-[18px_1fr] gap-x-3 gap-y-0.5 py-3 sm:grid-cols-[18px_1fr_auto] sm:items-center">
                <Icon className={cn('mt-0.5 h-[18px] w-[18px] sm:mt-0', severe ? 'text-[#FF7A70]' : 'text-marker')} />
                <dt className="font-medium">{t(`landing.proctor.${key}`)}</dt>
                <dd className="col-start-2 text-sm text-white/60 sm:col-start-3 sm:text-right">{t(`landing.proctor.${rule}`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="self-start rounded-[22px] border border-white/10 bg-[#1B201E] p-5 sm:p-7" aria-label={t('landing.proctor.reportTitle')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-xl font-semibold">{t('landing.proctor.reportTitle')}</p>
            <span className="text-xs font-medium text-white/50">{t('common.syntheticNote')}</span>
          </div>
          <p className="mt-1 text-sm text-white/55">Алгоритмы и структуры данных — весенний тур</p>
          <ul className="mt-6 space-y-5">
            {REPORT_SAMPLE.map((row) => {
              const total = Object.values(row.events).reduce((a, b) => a + (b ?? 0), 0);
              return (
                <li key={row.name}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{row.name}</span>
                    <RiskBadge level={row.risk} />
                  </div>
                  <div className="mt-2 flex h-3.5 w-full gap-[3px] overflow-hidden rounded-[5px] bg-white/[0.06]">
                    {Object.entries(row.events).flatMap(([type, count]) =>
                      Array.from({ length: count ?? 0 }, (_, index) => (
                        <span
                          key={`${type}-${index}`}
                          className={cn('h-full', EVENT_COLORS[type as ProctoringEventType])}
                          style={{ width: `${100 / Math.max(maxEvents, 1)}%` }}
                        />
                      )),
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-white/50">{total > 0 ? t('common.events', { count: total }) : t('proctoring.noEvents')}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
            {(Object.keys(EVENT_COLORS) as ProctoringEventType[]).map((type) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-sm', EVENT_COLORS[type])} />
                {t(`proctoring.types.${type}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mirrors the seeded olympiad (migration V6), so a reviewer can cross-check it in the app. */
const RANKING_SAMPLE: Array<{ place: number; name: string; score: number; risk: RiskLevel } | 'gap'> = [
  { place: 1, name: 'Алексей Смирнов', score: 40, risk: 'LOW' },
  { place: 2, name: 'Екатерина Соколова', score: 40, risk: 'LOW' },
  { place: 3, name: 'Мария Петрова', score: 30, risk: 'LOW' },
  { place: 4, name: 'Иван Новиков', score: 30, risk: 'MEDIUM' },
  'gap',
  { place: 7, name: 'Ольга Морозова', score: 12, risk: 'HIGH' },
];
const RANKING_MAX = 40;

function RankingSection() {
  const t = useT();
  return (
    <section className="py-16 sm:py-24">
      <div className="page-shell">
        <div className="max-w-[640px]">
          <h2 className="font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{t('landing.ranking.title')}</h2>
          <p className="mt-3 text-[17px] text-soft">{t('landing.ranking.lead')}</p>
        </div>
        <div className="mt-10 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4 sm:px-6">
            <p className="font-serif text-lg font-semibold">Алгоритмы и структуры данных — весенний тур</p>
            <span className="text-xs font-medium text-soft">
              {t('common.participants', { count: 9 })} · {t('common.syntheticNote')}
            </span>
          </div>
          <ol>
            {RANKING_SAMPLE.map((row) =>
              row === 'gap' ? (
                <li key="gap" aria-hidden className="border-b border-line/70 px-5 py-1.5 font-mono text-sm text-soft sm:px-6">
                  ⋯
                </li>
              ) : (
              <li key={row.place} className="grid grid-cols-[44px_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line/70 px-5 py-3.5 last:border-b-0 sm:grid-cols-[56px_1.3fr_1.4fr_160px] sm:px-6">
                <span
                  className={cn(
                    'grid h-8 w-10 place-items-center rounded-[8px] font-mono text-sm font-semibold',
                    row.place <= 3 ? 'bg-marker text-[#3A3000]' : 'text-soft',
                  )}
                >
                  {String(row.place).padStart(2, '0')}
                </span>
                <span className="font-medium">{row.name}</span>
                <div className="col-span-3 flex items-center gap-3 sm:col-span-1">
                  <span className="num w-[52px] font-serif text-lg font-semibold">
                    {row.score}
                    <span className="text-sm font-normal text-soft">/{RANKING_MAX}</span>
                  </span>
                  <ScoreBar value={row.score} max={RANKING_MAX} className="flex-1" />
                </div>
                <div className="col-start-3 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto">
                  <RiskBadge level={row.risk} />
                </div>
              </li>
              ),
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

function StackSection() {
  const t = useT();
  const rows = ['backend', 'frontend', 'infra'] as const;
  return (
    <section id="stack" className="scroll-mt-6 border-y border-line bg-surface py-16 sm:py-24">
      <div className="page-shell grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{t('landing.stack.title')}</h2>
          <p className="mt-3 max-w-[40ch] text-[17px] text-soft">{t('landing.stack.lead')}</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/85 dark:bg-fg dark:text-[#0F1211]"
          >
            <Github className="h-4 w-4" />
            {t('landing.stack.repo')}
          </a>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <div key={row} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
              <dt className="font-semibold">{t(`landing.stack.${row}`)}</dt>
              <dd className="text-soft">{t(`landing.stack.${row}Items`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
