import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface RoleRouteProps extends PropsWithChildren {
  roles: UserRole[];
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
