import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'manager' | 'staff'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role restrictions are specified and user has required role
  if (allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role);
    
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark-900">
          <div className="text-white text-2xl mb-4">Access Denied</div>
          <div className="text-gray-400 text-lg">
            You don't have permission to access this page.
          </div>
          <button
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  // If authenticated and has permission, render the children
  return <>{children}</>;
};

export default ProtectedRoute;