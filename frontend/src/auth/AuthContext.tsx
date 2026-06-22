import { useState, createContext, useContext, ReactNode } from "react";

interface User {
  username: string;
  role: string;
  name: string;
  department: string;
  employee_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, login: async () => false, logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("wfp_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("wfp_token"));

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("wfp_user", JSON.stringify(data.user));
        localStorage.setItem("wfp_token", data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("wfp_user");
    localStorage.removeItem("wfp_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
