"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";

interface User {
  userId: string;
  nameFa: string;
  nameEn: string;
  role: string;
  officeId: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  refreshAccessToken: () => Promise<string | null>;
  loading: boolean;
  loggedIn: boolean;
  logout: () => void;
  fetchUser: (tokenOverride?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken = res.data.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        return newToken;
      }
      return null;
    } catch (err) {
      console.error("❌ Failed to refresh token:", err);
      return null;
    }
  };

  const fetchUser = async (tokenOverride?: string) => {
    try {
      const token = tokenOverride || accessToken;
      if (!token) throw new Error("No token available");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    const tryRestore = async () => {
      try {
        const token = await refreshAccessToken();
        if (token) await fetchUser(token);
      } catch (err) {
        console.error("❌ Auto-login failed:", err);
      } finally {
        setLoading(false);
      }
    };
    tryRestore();
  }, []);

  const logout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      window.location.href = "/auth/login";
    }
  };

  const loggedIn = useMemo(() => !!user && !!accessToken && !loading, [user, accessToken, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        setAccessToken,
        refreshAccessToken,
        loading,
        loggedIn,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
