import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { commissionApi } from '../../api/endpoints';
import type { CommissionDetail, CommissionProposal, PaymentMethod } from '../../api/types';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { formatDate, formatDateTime, formatPrice } from '../../lib/format';
import NotFoundPage from '../NotFoundPage';
import OrderIntro from '../order/OrderIntro';
import { StatusChip } from './CommissionListPage';
import styles from './Commission.module.css';

const STEPS = [
  { status: 'OPEN', label: '제안 받는 중' },
  { status: 'IN_PROGRESS', label: '선결제 · 제작 중' },
  { status: 'DELIVERED', label: '전달 완료' },
  { status: 'COMPLETED', label: '후기 완료' },
];

const PAYMENTS: { value: PaymentMethod; label: string }[] = [
  { value: 'CARD', label: '신용 / 체크카드' },
  { value: 'TRANSFER', label: '계좌이체' },
  { value: 'EASY_PAY', label: '간편결제' },
];

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className={styles.stars} role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-pressed={n <= value} aria-label={`${n}점`} onClick={() => onChange(n)}>
          ★
        </button>
      ))}
    </div>
  );
}

function ProposalCard({
  proposal,
  canChoose,
  busy,
  onChoose,
}: {
  proposal: CommissionProposal;
  canChoose: boolean;
  busy: boolean;
  onChoose: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const p = proposal.perfumer;
  return (
    <article
      className={`${styles.proposal} ${proposal.status === 'ACCEPTED' ? styles.proposalAccepted : ''} ${proposal.status === 'DECLINED' ? styles.proposalDeclined : ''}`}
    >
      <div className={styles.perfumer}>
        <div>
          <strong>{p.studioName}</strong>
          <span>
            {p.name} 조향사 · 경력 {p.careerYears}년 · 평점 {p.ratingAverage ? p.ratingAverage.toFixed(1) : '-'} · 완료 {p.completedCount}건
          </span>
        </div>
        <div className={styles.price}>
          {formatPrice(proposal.price)}
          <small>작업 {proposal.workingDays}일</small>
        </div>
      </div>
      <p>{proposal.message}</p>
      <div className={styles.proposalActions}>
        {proposal.status === 'ACCEPTED' && <span className={styles.chip}>선택한 제안</span>}
        {proposal.status === 'DECLINED' && <span className="help">마감된 제안</span>}
        {canChoose && (
          <>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} aria-label="결제수단">
              {PAYMENTS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" disabled={busy} onClick={() => onChoose(method)}>
              이 조향사에게 맡기기 · {formatPrice(proposal.price)} 선결제
            </button>
          </>
        )}
        <span className="help">{formatDate(proposal.createdAt)}</span>
      </div>
    </article>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [detail, setDetail] = useState<CommissionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState({ price: '', workingDays: '14', message: '' });
  const [note, setNote] = useState('');
  const [review, setReview] = useState({ scentRating: 5, perfumerRating: 5, content: '' });

  useEffect(() => {
    commissionApi
      .detail(Number(id))
      .then((d) => {
        setDetail(d);
        setProposal((p) => ({ ...p, price: p.price || String(d.summary.budget) }));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const act = useCallback(
    async (task: () => Promise<CommissionDetail>, done: string) => {
      setBusy(true);
      try {
        setDetail(await task());
        toast(done);
        return true;
      } catch (e) {
        toast(e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  if (notFound) return <NotFoundPage />;
  if (!detail) {
    return (
      <section className="page px" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="skeleton" style={{ height: 420 }} />
      </section>
    );
  }

  const { summary, viewer } = detail;
  const stepIndex = STEPS.findIndex((s) => s.status === summary.status);
  const commissionId = summary.id;

  const submitProposal = async (e: FormEvent) => {
    e.preventDefault();
    const price = Number(proposal.price.replace(/[^0-9]/g, ''));
    if (!price || !proposal.message.trim()) {
      toast('제안 금액과 향의 방향을 적어 주세요.');
      return;
    }
    await act(
      () => commissionApi.propose(commissionId, { price, workingDays: Number(proposal.workingDays) || 1, message: proposal.message.trim() }),
      '제안을 보냈어요. 의뢰인에게 알림이 갔어요.',
    );
  };

  const submitDelivery = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return toast('전달 메모를 남겨 주세요.');
    await act(() => commissionApi.deliver(commissionId, note.trim()), '완성된 향을 전달했어요.');
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!review.content.trim()) return toast('후기를 남겨 주세요.');
    await act(() => commissionApi.review(commissionId, { ...review, content: review.content.trim() }), '후기를 남겼어요. 고마워요.');
  };

  return (
    <>
      <OrderIntro crumbs={[{ label: '커스텀', to: '/custom' }, { label: summary.title }]} eyebrow="COMMISSION" title={summary.title} />
      <div className={`page px ${styles.body}`}>
        <div className={styles.main}>
          <ol className={styles.progress} aria-label="진행 단계">
            {STEPS.map((s, i) => (
              <li key={s.status} className={summary.status === 'CANCELLED' ? '' : i < stepIndex ? styles.done : i === stepIndex ? styles.now : ''}>
                {s.label}
              </li>
            ))}
          </ol>

          <dl className={styles.facts}>
            <div>
              <dt>상태</dt>
              <dd>
                <StatusChip status={summary.status} label={summary.statusLabel} />
              </dd>
            </div>
            <div>
              <dt>향 종류</dt>
              <dd>{summary.categoryLabel}</dd>
            </div>
            <div>
              <dt>예산</dt>
              <dd>{formatPrice(summary.budget)}</dd>
            </div>
            <div>
              <dt>희망 완료일</dt>
              <dd>{summary.desiredDate ? formatDate(summary.desiredDate) : '협의'}</dd>
            </div>
          </dl>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>장면 이야기</h2>
              <span>
                {summary.requesterName} · {formatDate(summary.createdAt)}
              </span>
            </div>
            {summary.moods.length > 0 && (
              <div className={styles.moods}>
                {summary.moods.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            )}
            <p className={styles.description}>{detail.description}</p>
          </section>

          {detail.deliveryNote && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>조향사의 전달 메모</h2>
                <span>{detail.deliveredAt ? formatDateTime(detail.deliveredAt) : ''}</span>
              </div>
              <p className={styles.description}>{detail.deliveryNote}</p>
            </section>
          )}

          {detail.review && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>의뢰인 후기</h2>
                <span>
                  향 {'★'.repeat(detail.review.scentRating)} · 조향사 {'★'.repeat(detail.review.perfumerRating)}
                </span>
              </div>
              <p className={styles.description}>{detail.review.content}</p>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>조향사 제안</h2>
              <span>
                {summary.proposalCount}건{!viewer.requester && summary.proposalCount > 0 ? ' · 제안 내용은 의뢰인에게만 보여요' : ''}
              </span>
            </div>
            {detail.proposals.length === 0 && (
              <p className="help">
                {summary.status === 'OPEN' ? '아직 도착한 제안이 없어요. 조향사들에게 알림이 전달되었어요.' : '공개된 제안이 없어요.'}
              </p>
            )}
            {detail.proposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                busy={busy}
                canChoose={viewer.requester && summary.status === 'OPEN' && p.status === 'PROPOSED'}
                onChoose={(method) => {
                  if (!window.confirm(`${p.perfumer.studioName}에게 맡기고 ${formatPrice(p.price)}을 선결제할까요?`)) return;
                  void act(() => commissionApi.accept(commissionId, p.id, method), '선결제가 완료되었어요. 제작이 시작돼요.');
                }}
              />
            ))}
          </section>
        </div>

        <aside className={styles.aside}>
          {detail.perfumer && (
            <div className={`${styles.panel} ${styles.panelDark}`}>
              <p className="eyebrow">YOUR PERFUMER</p>
              <h2>{detail.perfumer.studioName}</h2>
              <p>
                {detail.perfumer.name} 조향사 · 경력 {detail.perfumer.careerYears}년
                <br />
                {detail.agreedPrice ? `${formatPrice(detail.agreedPrice)} 선결제` : ''}
                {detail.paymentMethodLabel ? ` · ${detail.paymentMethodLabel}` : ''}
                {detail.paidAt ? ` · ${formatDate(detail.paidAt)}` : ''}
              </p>
            </div>
          )}

          {viewer.canPropose && (
            <form className={`${styles.panel} ${styles.form}`} onSubmit={submitProposal}>
              <h2>제안 보내기</h2>
              <div className={styles.pair}>
                <label className={styles.field}>
                  제안 금액
                  <input className="input" inputMode="numeric" value={proposal.price} onChange={(e) => setProposal({ ...proposal, price: e.target.value })} />
                </label>
                <label className={styles.field}>
                  작업 기간 (일)
                  <input className="input" inputMode="numeric" value={proposal.workingDays} onChange={(e) => setProposal({ ...proposal, workingDays: e.target.value })} />
                </label>
              </div>
              <label className={styles.field}>
                어떤 향으로 풀어낼까요?
                <textarea className="input" rows={6} maxLength={1000} placeholder="중심 노트, 제형, 용량, 상담 방식 등을 적어 주세요." value={proposal.message} onChange={(e) => setProposal({ ...proposal, message: e.target.value })} />
              </label>
              <button className="btn btn-primary" disabled={busy}>
                제안 보내기
              </button>
            </form>
          )}

          {viewer.assignedPerfumer && summary.status === 'IN_PROGRESS' && (
            <form className={`${styles.panel} ${styles.form}`} onSubmit={submitDelivery}>
              <h2>완성된 향 전달하기</h2>
              <label className={styles.field}>
                전달 메모
                <textarea className="input" rows={5} maxLength={1000} placeholder="구성, 사용법, 향의 변화 등을 적어 주세요." value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <button className="btn btn-primary" disabled={busy}>
                전달 완료로 바꾸기
              </button>
            </form>
          )}

          {viewer.requester && summary.status === 'DELIVERED' && (
            <form className={`${styles.panel} ${styles.form}`} onSubmit={submitReview}>
              <h2>후기 남기기</h2>
              <div className={styles.field}>
                향은 어땠나요?
                <Stars label="향 만족도" value={review.scentRating} onChange={(v) => setReview({ ...review, scentRating: v })} />
              </div>
              <div className={styles.field}>
                조향사와의 작업은 어땠나요?
                <Stars label="조향사 평가" value={review.perfumerRating} onChange={(v) => setReview({ ...review, perfumerRating: v })} />
              </div>
              <label className={styles.field}>
                후기
                <textarea className="input" rows={5} maxLength={1000} value={review.content} onChange={(e) => setReview({ ...review, content: e.target.value })} />
              </label>
              <button className="btn btn-primary" disabled={busy}>
                후기 남기고 완료하기
              </button>
            </form>
          )}

          <div className={styles.panel}>
            {viewer.requester && summary.status === 'OPEN' && (
              <>
                <p>제안을 비교한 뒤 한 분을 골라 선결제하면 제작이 시작돼요. 조향사를 고르기 전까지는 의뢰를 취소할 수 있어요.</p>
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('의뢰를 취소할까요?')) void act(() => commissionApi.cancel(commissionId), '의뢰를 취소했어요.');
                  }}
                >
                  의뢰 취소
                </button>
              </>
            )}
            {viewer.proposed && !viewer.assignedPerfumer && summary.status === 'OPEN' && <p>제안을 보냈어요. 의뢰인이 선택하면 알림으로 알려 드려요.</p>}
            {!viewer.requester && !viewer.perfumer && summary.status === 'OPEN' && (
              <p>제안은 여운이 인증한 조향사만 보낼 수 있어요. 조향사라면 회원가입 때 인증을 신청해 주세요.</p>
            )}
            {summary.status === 'COMPLETED' && <p>후기까지 마친 의뢰예요. 조향사 평가는 다음 의뢰인들의 선택에 반영돼요.</p>}
            {summary.status === 'CANCELLED' && <p>취소된 의뢰예요.</p>}
            <Link to="/custom" className={styles.back}>
              ← 의뢰 게시판으로
            </Link>
          </div>
        </aside>
      </div>
      <CompactFooter />
    </>
  );
}
