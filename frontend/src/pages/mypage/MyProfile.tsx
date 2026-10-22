import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { memberApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import { useMyPage } from './MyPageLayout';
import styles from './MyPage.module.css';

export default function MyProfile() {
  const { member, refresh } = useAuth();
  const { summary, reload } = useMyPage();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', marketingAgreed: false });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) setForm({ name: member.name, phone: member.phone ?? '', marketingAgreed: summary?.marketingAgreed ?? false });
  }, [member, summary]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await memberApi.updateProfile(form);
      await Promise.all([refresh(), reload()]);
      toast('회원정보를 저장했어요.');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '저장하지 못했어요.');
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (passwords.next.length < 8) return setError('새 비밀번호는 8자 이상이어야 해요.');
    if (passwords.next !== passwords.confirm) return setError('새 비밀번호가 서로 달라요.');
    try {
      await memberApi.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      toast('비밀번호를 바꿨어요.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '비밀번호를 바꾸지 못했어요.');
    }
  };

  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>회원정보 수정</h2>
          <span>{member?.email}</span>
        </div>
        <form className={styles.form} onSubmit={saveProfile}>
          <div className={styles.pair}>
            <label className={styles.formField}>
              이름
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={40} />
            </label>
            <label className={styles.formField}>
              휴대전화
              <input className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-1234-5678" />
            </label>
          </div>
          <label className="help" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={form.marketingAgreed} onChange={(e) => setForm({ ...form, marketingAgreed: e.target.checked })} />
            새로운 향과 이벤트 소식 받기 (선택)
          </label>
          <div className={styles.formActions}>
            <button className="btn btn-primary">저장하기</button>
          </div>
        </form>
      </section>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>비밀번호 변경</h2>
        </div>
        <form className={styles.form} onSubmit={savePassword}>
          <label className={styles.formField}>
            현재 비밀번호
            <input className="input" type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
          </label>
          <div className={styles.pair}>
            <label className={styles.formField}>
              새 비밀번호
              <input className="input" type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required />
            </label>
            <label className={styles.formField}>
              새 비밀번호 확인
              <input className="input" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className={styles.formActions}>
            <button className="btn btn-ghost">비밀번호 바꾸기</button>
          </div>
        </form>
      </section>
    </>
  );
}
