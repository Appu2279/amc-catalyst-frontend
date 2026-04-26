import React, { createContext, useContext, useState, useEffect } from 'react';


const AuthContext = createContext(undefined);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore user and token from localStorage
    const storedUser = localStorage.getItem('amc_catalyst_user');
    const storedToken = localStorage.getItem('amc_catalyst_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(JSON.parse(storedToken));
    }
    setIsLoading(false);
  }, []);


  const login = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('amc_catalyst_user', JSON.stringify(user));
    localStorage.setItem('amc_catalyst_token', JSON.stringify(token));
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('amc_catalyst_user');
    localStorage.removeItem('amc_catalyst_token');
  };

  return (
    React.createElement(
      AuthContext.Provider,
      { value: { user, token, isAuthenticated: !!user && !!token, login, logout, isLoading } },
      children
    )
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
