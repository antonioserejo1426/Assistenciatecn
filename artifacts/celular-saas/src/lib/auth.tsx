import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useMe, getMeQueryKey } from "@workspace/api-client-react";
import type { MeResponse } from "@workspace/api-client-react";

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  user: MeResponse["user"] | null;
  empresa: MeResponse["empresa"] | null;
  assinaturaStatus: string | null;
  features: string[];
  hasFeature: (code: string) => boolean;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("tecnofix_token"));
  const [, setLocation] = useLocation();

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("tecnofix_token", newToken);
    } else {
      localStorage.removeItem("tecnofix_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setLocation("/login");
  };

  const { data: meData, isLoading, isError } = useMe({
    query: {
      queryKey: getMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  const features = (meData?.features ?? []) as string[];
  const hasFeature = (code: string) => features.includes(code);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user: meData?.user ?? null,
        empresa: meData?.empresa ?? null,
        assinaturaStatus: meData?.assinaturaStatus ?? null,
        features,
        hasFeature,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
