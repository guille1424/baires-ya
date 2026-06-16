import {
  createContext,
  useContext,
  useState,
} from "react";
import type { ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  role: "admin" | "employee" | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const getRoleFromToken = (t: string | null) => {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.role || "admin";
    } catch {
      return null;
    }
  };

  const role = getRoleFromToken(token);

  const login = async (username: string, password: string) => {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json();
    setToken(data.token);
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ token, role, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
