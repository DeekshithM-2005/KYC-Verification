import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized
    // Redirect to their respective dashboard or unauthorized page
    switch (user.role) {
      case 'Citizen': return <Navigate to="/citizen-dashboard" replace />;
      case 'Verifier': return <Navigate to="/verifier-dashboard" replace />;
      case 'Company': return <Navigate to="/company-dashboard" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
