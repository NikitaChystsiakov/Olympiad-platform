import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleRoute } from '@/components/layout/RoleRoute';
import { useAuth } from '@/hooks/useAuth';
import { translate, useLocale } from '@/i18n';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';

// The landing and login pages ship in the main bundle; everything behind them loads on demand.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })));

const AdminUsersPage = page(() => import('@/pages/AdminUsersPage'), 'AdminUsersPage');
const CodeRunnerPage = page(() => import('@/pages/CodeRunnerPage'), 'CodeRunnerPage');
const DashboardPage = page(() => import('@/pages/DashboardPage'), 'DashboardPage');
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage');
const OlympiadFormPage = page(() => import('@/pages/OlympiadFormPage'), 'OlympiadFormPage');
const OlympiadResultsPage = page(() => import('@/pages/OlympiadResultsPage'), 'OlympiadResultsPage');
const ProctoringAnalyticsPage = page(() => import('@/pages/ProctoringAnalyticsPage'), 'ProctoringAnalyticsPage');
const ProfilePage = page(() => import('@/pages/ProfilePage'), 'ProfilePage');
const QuestionsPage = page(() => import('@/pages/QuestionsPage'), 'QuestionsPage');
const RegisterPage = page(() => import('@/pages/RegisterPage'), 'RegisterPage');
const ResultsPage = page(() => import('@/pages/ResultsPage'), 'ResultsPage');
const TakeOlympiadPage = page(() => import('@/pages/TakeOlympiadPage'), 'TakeOlympiadPage');

const MANAGERS = ['ORGANIZER', 'ADMIN'] as const;

function Guarded({ roles }: { roles?: ReadonlyArray<'STUDENT' | 'ORGANIZER' | 'ADMIN'> }) {
  return (
    <ProtectedRoute>
      {roles ? (
        <RoleRoute roles={[...roles]}>
          <Outlet />
        </RoleRoute>
      ) : (
        <Outlet />
      )}
    </ProtectedRoute>
  );
}

export default function App() {
  const { hydrate } = useAuth();
  const locale = useLocale();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `Olympus Proctor — ${translate(locale, 'brand.tagline')}`;
  }, [locale]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* The attempt runs full-screen, outside the app chrome. */}
        <Route element={<Guarded roles={['STUDENT']} />}>
          <Route path="/olympiads/:id/take" element={<TakeOlympiadPage />} />
        </Route>

        <Route element={<Guarded />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/results/:participationId" element={<ResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/code-runner" element={<CodeRunnerPage />} />

            <Route element={<Guarded roles={MANAGERS} />}>
              <Route path="/olympiads/create" element={<OlympiadFormPage />} />
              <Route path="/olympiads/:id/edit" element={<OlympiadFormPage />} />
              <Route path="/olympiads/:id/questions" element={<QuestionsPage />} />
              <Route path="/admin/olympiads/:id/results" element={<OlympiadResultsPage />} />
              <Route path="/admin/olympiads/:id/proctoring" element={<ProctoringAnalyticsPage />} />
            </Route>

            <Route element={<Guarded roles={['ADMIN']} />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
