import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Initialize from localStorage if available
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null
    };
  });

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}