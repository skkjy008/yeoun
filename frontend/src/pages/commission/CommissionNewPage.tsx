import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { commissionApi } from '../../api/endpoints';
import { CompactFooter } from '../../components/layout/Footer';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/Toast';
import { formatPrice } from '../../lib/format';
import OrderIntro from '../order/OrderIntro';
import styles from './Commission.module.css';

const CATEGORIES = [
  { code: '', label: '조향사 제안에 맡길게요' },
  { code: '001', label: '방향제' },
  { code: '002', label: '인센스' },
  { code: '003', label: '향수' },
  { code: '004', label: '캔들' },
];
const BUDGETS = [50_000, 100_000, 150_000, 200_000];

export default function CommissionNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', incCd: '', moods: '', description: '', budget: '100000', desiredDate: '' });
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const budget = Number(form.budget.replace(/[^0-9]/g, ''));
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = '의뢰 제목을 입력해 주세요.';
    if (form.description.trim().length < 20) next.description = '원하는 향을 20자 이상 들려주세요.';
    if (!budget || budget < 30_000) next.budget = '예산은 30,000원 이상으로 정해 주세요.';
    setErrors(next);
    const firstError = Object.keys(next)[0];
    if (firstError) {
      // 입력 칸 아래 안내만으로는 놓치기 쉬워(버튼은 오른쪽 아래) 토스트와 함께 해당 칸으로 이동합니다.
      toast(next[firstError]);
      const target = document.getElementById(`commission-${firstError}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const created = await commissionApi.create({
        title: form.title.trim(),
        incCd: form.incCd,
        moods: form.moods,
        description: form.description.trim(),
        budget,
        desiredDate: form.desiredDate || null,
        referenceImages: images,
      });
      toast('의뢰를 등록했어요. 인증된 조향사들에게 알림을 보냈어요.');
      navigate(`/custom/${created.summary.id}`, { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '의뢰를 등록하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <OrderIntro
        crumbs={[{ label: '커스텀', to: '/custom' }, { label: '의뢰 쓰기' }]}
        eyebrow="WRITE YOUR SCENE"
        title="어떤 장면을 향으로 남기고 싶나요?"
      />
      <form className={`page px ${styles.body}`} onSubmit={submit} noValidate>
        <div className={`${styles.main} ${styles.form}`}>
          <label className={styles.field}>
            의뢰 제목<span className="sr-only"> (필수)</span>
            <input id="commission-title" className="input" maxLength={60} placeholder="예: 비 오는 날의 오래된 서재" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </label>

          <div className={styles.field}>
            <span>원하는 향 종류</span>
            <div className={styles.choices} role="radiogroup" aria-label="향 종류">
              {CATEGORIES.map((c) => (
                <button key={c.code} type="button" role="radio" aria-checked={form.incCd === c.code} className={styles.choice} onClick={() => setForm({ ...form, incCd: c.code })}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            떠오르는 키워드 (쉼표로 구분)
            <input className="input" maxLength={200} placeholder="예: 비, 오래된 책, 나무 책장" value={form.moods} onChange={(e) => setForm({ ...form, moods: e.target.value })} />
          </label>

          <label className={styles.field}>
            장면 이야기
            <textarea
              id="commission-description"
              className="input"
              rows={9}
              maxLength={2000}
              placeholder="언제, 어디서, 누구와 있던 순간인지 들려주세요. 좋았던 냄새와 피하고 싶은 냄새를 함께 적어 주면 조향사가 방향을 잡기 쉬워요."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <span className={styles.counter}>{form.description.length} / 2,000</span>
            {errors.description && <span className="error-text">{errors.description}</span>}
          </label>

          <div className={styles.field}>
            <span>참고 이미지 (선택 · 최대 3장)</span>
            <div className={styles.uploads}>
              {images.map((src) => (
                <div key={src} className={styles.uploadThumb}>
                  <img src={src} alt="참고 이미지" />
                  <button type="button" aria-label="이미지 빼기" onClick={() => setImages((list) => list.filter((x) => x !== src))}>
                    ×
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <ImageUpload purpose="COMMISSION" className={styles.uploadAdd} label="사진 추가" onUploaded={(url) => setImages((list) => [...list, url])} />
              )}
            </div>
            <span className="help">떠오르는 장소나 물건의 사진을 함께 올리면 조향사가 장면을 그리기 쉬워요.</span>
          </div>

          <div className={styles.pair}>
            <div className={styles.field}>
              <label htmlFor="commission-budget">예산</label>
              <input id="commission-budget" className="input" inputMode="numeric" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              <div className={styles.choices}>
                {BUDGETS.map((b) => (
                  <button key={b} type="button" className={styles.choice} aria-checked={Number(form.budget) === b} role="radio" onClick={() => setForm({ ...form, budget: String(b) })}>
                    {formatPrice(b)}
                  </button>
                ))}
              </div>
              {errors.budget && <span className="error-text">{errors.budget}</span>}
            </div>
            <label className={styles.field}>
              희망 완료일 (선택)
              <input className="input" type="date" min={today} value={form.desiredDate} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })} />
            </label>
          </div>
        </div>

        <aside className={styles.aside}>
          <div className={`${styles.panel} ${styles.panelDark}`}>
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>의뢰는 이렇게 진행돼요</h2>
            <ol className={styles.policy} style={{ color: 'var(--color-sand)' }}>
              <li>등록과 동시에 인증된 조향사 모두에게 실시간 알림이 가요.</li>
              <li>제안이 오면 가격과 작업 기간, 향의 방향을 비교해 한 분을 고르세요.</li>
              <li>선택과 함께 선결제하면 다른 제안은 자동으로 마감되고, 조향사가 제작을 시작해요.</li>
              <li>제작 전에는 전액, 제작 중에는 50%를 환불받을 수 있어요. 전달된 뒤에는 환불되지 않아요.</li>
              <li>향을 받으면 구매 확정과 함께 향 만족도·조향사 평가를 남겨 주세요. 7일이 지나면 자동 확정돼요.</li>
            </ol>
          </div>
          <div className={styles.panel}>
            <p>조향사를 고르기 전까지는 언제든 의뢰를 취소할 수 있어요. 결제는 토스페이먼츠(키가 없으면 모의 결제)로 진행돼요.</p>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? '등록 중…' : '의뢰 등록하기'}
            </button>
            {Object.keys(errors).length > 0 && (
              <p className="error-text" role="alert">
                {Object.values(errors)[0]}
              </p>
            )}
            <Link to="/custom" className={styles.back}>
              ← 의뢰 게시판으로
            </Link>
          </div>
        </aside>
      </form>
      <CompactFooter />
    </>
  );
}
