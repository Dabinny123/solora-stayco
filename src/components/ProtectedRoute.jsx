// Protected Route Component for Solora StayCo
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserData } from '../auth/authService';

function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, userData, loading, refreshUserData } = useAuth();
  const [checkingRole, setCheckingRole] = useState(false);
  const [actualRole, setActualRole] = useState(userData?.role);

  // Refresh user data to ensure role is up-to-date
  useEffect(() => {
    const refreshData = async () => {
      if (currentUser && refreshUserData) {
        try {
          const freshData = await refreshUserData();
          if (freshData) {
            setActualRole(freshData.role);
          }
        } catch (error) {
          console.error('Error refreshing user data in ProtectedRoute:', error);
        }
      } else if (currentUser && !userData) {
        // If userData is not loaded yet, fetch it
        try {
          setCheckingRole(true);
          const freshData = await getCurrentUserData(currentUser.uid);
          if (freshData) {
            setActualRole(freshData.role);
          }
        } catch (error) {
          console.error('Error fetching user data in ProtectedRoute:', error);
        } finally {
          setCheckingRole(false);
        }
      }
    };

    refreshData();
  }, [currentUser, refreshUserData]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-soft">
            <span className="text-2xl">☀️</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // Use actualRole if available, otherwise fallback to userData
  const userRole = actualRole || userData?.role;

  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    // Normalize role for comparison
    const normalizedRole = typeof userRole === 'string' ? userRole.trim().toLowerCase() : 'guest';
    
    // Redirect based on user's actual role
    if (normalizedRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (normalizedRole === 'host') {
      return <Navigate to="/host/dashboard" replace />;
    } else {
      return <Navigate to="/guest/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;

