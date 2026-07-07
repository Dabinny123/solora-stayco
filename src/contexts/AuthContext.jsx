// Authentication Context for Solora StayCo
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, getCurrentUserData } from '../auth/authService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data from Firestore
  const refreshUserData = useCallback(async () => {
    if (currentUser) {
      try {
        const freshUserData = await getCurrentUserData(currentUser.uid);
        setUserData(freshUserData);
        return freshUserData;
      } catch (error) {
        console.error('Error refreshing user data:', error);
        return null;
      }
    }
    return null;
  }, [currentUser]);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange(async (authData) => {
      if (authData) {
        setCurrentUser(authData.user);
        // Always fetch fresh user data to ensure role changes are reflected
        const freshUserData = await getCurrentUserData(authData.user.uid);
        setUserData(freshUserData || authData.userData);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    isAuthenticated: !!currentUser,
    isGuest: userData?.role === 'guest',
    isHost: userData?.role === 'host',
    isAdmin: userData?.role === 'admin',
    isEmailVerified: userData?.emailVerified === true || currentUser?.emailVerified === true,
    refreshUserData, // Expose refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

