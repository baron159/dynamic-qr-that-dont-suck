// PrivateRoute.tsx
import type React from 'react';
import { Route, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth.ctx.tsx';

interface PrivateRouteProps {
  path: string;
  component: React.FC;
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ path, component: Component, redirectTo='/login' }) => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation(redirectTo);
    return null;
  }

  return <Route path={path} component={Component} />;
};

export default PrivateRoute;