  import { createContext, useContext, useEffect, useMemo, useState } from "react";
  import {
    getCurrentUser,
    loginLocal,
    loginWithGoogle,
    logout as logoutApi,
    onAuthChange,
    refreshAccessToken,
    registerLocal,
  } from "../utils/auth";

  const AuthContext = createContext(null);

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(getCurrentUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthChange(({ user: nextUser }) => {
        setUser(nextUser);
      });

      refreshAccessToken().finally(() => setLoading(false));
      return unsubscribe;
    }, []);

    const value = useMemo(
      () => ({
        user,
        loading,
        isAuthenticated: Boolean(user),
        login: loginLocal,
        register: registerLocal,
        loginWithGoogle,
        logout: logoutApi,
      }),
      [user, loading]
    );

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
      throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
    }

    return context;
  }
