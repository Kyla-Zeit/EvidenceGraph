import React, { createContext, useContext, useState, useEffect } from "react";
import { UserDto } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(() => {
    const saved = localStorage.getItem("evidencegraph_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("evidencegraph_token");
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      api
        .getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem("evidencegraph_user", JSON.stringify(u));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("evidencegraph_token", res.token);
      localStorage.setItem("evidencegraph_user", JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("evidencegraph_token");
    localStorage.removeItem("evidencegraph_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
