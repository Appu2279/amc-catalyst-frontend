import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../lib/axiosInstance';


const AuthContext = createContext(undefined);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // In-memory blob URL for the profile picture. The image endpoint needs the
  // token, so an <img src> pointing straight at it would 401 — the bytes are
  // fetched with axios and turned into an object URL instead.
  const [avatarUrl, setAvatarUrl] = useState(null);

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


  const setAvatarObjectUrl = useCallback((next) => {
    setAvatarUrl((old) => {
      if (old && old !== next) URL.revokeObjectURL(old);
      return next;
    });
  }, []);

  // Pulls the current profile picture. Also used as `refreshAvatar` after an
  // upload, where `hasAvatar` may not have changed so the effect below won't fire.
  const refreshAvatar = useCallback(() => {
    axiosInstance
      .get('/me/avatar', { responseType: 'blob' })
      .then((res) => setAvatarObjectUrl(URL.createObjectURL(res.data)))
      .catch(() => setAvatarObjectUrl(null));
  }, [setAvatarObjectUrl]);

  useEffect(() => {
    if (token && user?.hasAvatar) {
      refreshAvatar();
    } else {
      setAvatarObjectUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.hasAvatar]);


  const login = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('amc_catalyst_user', JSON.stringify(user));
    localStorage.setItem('amc_catalyst_token', JSON.stringify(token));
  };


  // Merge fresh account fields (e.g. after a profile edit) into the stored user
  // so the whole app — greeting, avatar initial, sidebar — reflects the change
  // without a re-login. Token is untouched: editing a profile does not reissue it.
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('amc_catalyst_user', JSON.stringify(next));
      return next;
    });
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    setAvatarObjectUrl(null);
    localStorage.removeItem('amc_catalyst_user');
    localStorage.removeItem('amc_catalyst_token');
  };

  return (
    React.createElement(
      AuthContext.Provider,
      {
        value: {
          user,
          token,
          isAuthenticated: !!user && !!token,
          login,
          logout,
          updateUser,
          avatarUrl,
          refreshAvatar,
          isLoading,
        },
      },
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
