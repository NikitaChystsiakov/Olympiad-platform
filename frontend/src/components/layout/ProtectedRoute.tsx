import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
