import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tokenStore } from '../api/client';
import { authApi } from '../api/endpoints';
import type { Member, SignupRequest, TokenResponse } from '../api/types';

interface AuthContextValue {
  member: Member | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Member>;
  signup: (body: SignupRequest) => Promise<Member>;
  logout: () => void;
  refresh: () => Promise<void>;
  /** 비회원이면 회원가입 페이지로 보내고 false를 돌려줍니다. */
  requireMember: (reason?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setMember(null);
      setLoading(false);
      return;
    }
    try {
      setMember(await authApi.me());
    } catch {
      tokenStore.clear();
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const accept = (res: TokenResponse) => {
    tokenStore.set(res.accessToken);
    setMember(res.member);
    return res.member;
  };

  const login = useCallback(async (email: string, password: string) => accept(await authApi.login(email, password)), []);
  const signup = useCallback(async (body: SignupRequest) => accept(await authApi.signup(body)), []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setMember(null);
    navigate('/');
  }, [navigate]);

  const requireMember = useCallback(
    (reason?: string) => {
      if (member) return true;
      navigate('/signup', { state: { from: location.pathname + location.search, reason } });
      return false;
    },
    [member, navigate, location],
  );

  const value = useMemo(
    () => ({ member, loading, login, signup, logout, refresh, requireMember }),
    [member, loading, login, signup, logout, refresh, requireMember],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
