import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { Loader } from './States';

export default function AuthGate({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
