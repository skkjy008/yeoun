import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** 비회원이 접근하면 회원가입 페이지로 연결합니다. */
export function RequireMember({ children, reason }: { children: ReactNode; reason?: string }) {
  const { member, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!member) return <Navigate to="/signup" replace state={{ from: location.pathname, reason }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!member) return <Navigate to="/login" replace state={{ from: location.pathname, reason: '관리자 계정으로 로그인해 주세요.' }} />;
  if (member.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}
