import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { memberApi } from '../../api/endpoints';
import type { Address } from '../../api/types';
import { useToast } from '../../components/Toast';
import { openPostcode } from '../../lib/postcode';
import { useMyPage } from './MyPageLayout';
import styles from './MyPage.module.css';

const EMPTY: Address = { recipientName: '', recipientPhone: '', zipCode: '', address1: '', address2: '' };

export default function MyAddress() {
  const { summary, reload } = useMyPage();
  const toast = useToast();
  const [form, setForm] = useState<Address>(EMPTY);

  useEffect(() => {
    if (summary?.address) setForm({ ...summary.address, address2: summary.address.address2 ?? '' });
    else if (summary) setForm({ ...EMPTY, recipientName: summary.member.name, recipientPhone: summary.member.phone ?? '' });
  }, [summary]);

  const search = async () => {
    try {
      const result = await openPostcode();
      if (result) setForm((f) => ({ ...f, zipCode: result.zipCode, address1: result.address }));
    } catch {
      toast('주소 검색을 열지 못했어요. 직접 입력해 주세요.');
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await memberApi.changeAddress(form);
      await reload();
      toast('기본 배송지를 저장했어요. 주문서에 자동으로 채워져요.');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '저장하지 못했어요.');
    }
  };

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2>배송지 관리</h2>
        <span>{summary?.address ? '기본 배송지가 등록되어 있어요.' : '아직 기본 배송지가 없어요.'}</span>
      </div>
      <form className={styles.form} onSubmit={save}>
        <div className={styles.pair}>
          <label className={styles.formField}>
            받는 분
            <input className="input" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
          </label>
          <label className={styles.formField}>
            연락처
            <input className="input" inputMode="tel" value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} required />
          </label>
        </div>
        <div className={styles.pair}>
          <label className={styles.formField}>
            우편번호
            <input className="input" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
          </label>
          <div className={styles.formField}>
            <span aria-hidden>&nbsp;</span>
            <button type="button" className="btn btn-ghost" style={{ height: 50 }} onClick={search}>
              주소 검색
            </button>
          </div>
        </div>
        <label className={styles.formField}>
          기본 주소
          <input className="input" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} required />
        </label>
        <label className={styles.formField}>
          상세 주소
          <input className="input" value={form.address2 ?? ''} onChange={(e) => setForm({ ...form, address2: e.target.value })} />
        </label>
        <div className={styles.formActions}>
          <button className="btn btn-primary">기본 배송지로 저장</button>
        </div>
      </form>
    </section>
  );
}
