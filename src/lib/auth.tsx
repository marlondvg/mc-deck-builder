import { createContext, useContext, useState, type ReactNode } from "react";

// Mock auth: just remembers a username in localStorage.
// Replace with real login once the backend exists.

const KEY = "mcdb:username";

interface AuthValue {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readStored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(readStored);

  const login = (name: string) => {
    setUsername(name);
    try {
      localStorage.setItem(KEY, name);
    } catch {
      /* storage unavailable: keep in-memory only */
    }
  };

  const logout = () => {
    setUsername(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
