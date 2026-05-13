import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleRoute } from '@/components/layout/RoleRoute';
import { useAuth } from '@/hooks/useAuth';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { CodeRunnerPage } from '@/pages/CodeRunnerPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { OlympiadFormPage } from '@/pages/OlympiadFormPage';
import { OlympiadResultsPage } from '@/pages/OlympiadResultsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProctoringAnalyticsPage } from '@/pages/ProctoringAnalyticsPage';
import { QuestionsPage } from '@/pages/QuestionsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { TakeOlympiadPage } from '@/pages/TakeOlympiadPage';

export default function App() {
  const { hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/olympiads/create"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ORGANIZER', 'ADMIN']}>
                <OlympiadFormPage mode="create" />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/olympiads/:id/edit"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ORGANIZER', 'ADMIN']}>
                <OlympiadFormPage mode="edit" />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/olympiads/:id/questions"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ORGANIZER', 'ADMIN']}>
                <QuestionsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/olympiads/:id/take"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['STUDENT']}>
                <TakeOlympiadPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:participationId"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/code-runner"
          element={
            <ProtectedRoute>
              <CodeRunnerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ADMIN']}>
                <AdminUsersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/olympiads/:id/proctoring"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ORGANIZER', 'ADMIN']}>
                <ProctoringAnalyticsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/olympiads/:id/results"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['ORGANIZER', 'ADMIN']}>
                <OlympiadResultsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
