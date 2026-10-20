import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import { Field } from './SignupPage';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as { from?: string; reason?: string };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const member = await login(email.trim(), password);
      navigate(state.from ?? (member.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className={`page px ${styles.introduction}`}>
        <nav className={styles.breadcrumb} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>로그인</span>
        </nav>
        <div className={styles.pageHeading}>
          <div>
            <p className="eyebrow">WELCOME BACK</p>
            <h1 className="serif">다시 만나서 반가워요</h1>
          </div>
          <p className={styles.headingNote}>남겨 둔 취향이 기다리고 있어요</p>
        </div>
        {state.reason && <p className={styles.reason}>{state.reason}</p>}
      </section>
      <section className={`page px ${styles.loginLayout}`}>
        <form className={styles.loginForm} onSubmit={submit}>
          <Field label="이메일">
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="비밀번호">
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="error-text">{error}</p>}
          <button className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? '로그인하는 중…' : '로그인'}
          </button>
          <p className={styles.loginEntry}>
            아직 회원이 아니신가요?{' '}
            <Link to="/signup" state={state}>
              회원가입
            </Link>
          </p>
          <div className={styles.demo}>
            <p className="latin">DEMO ACCOUNTS</p>
            <p>회원 · yeon@yeoun.example / yeoun1234!</p>
            <p>관리자 · admin@yeoun.example / admin1234!</p>
          </div>
        </form>
      </section>
      <CompactFooter />
    </>
  );
}
