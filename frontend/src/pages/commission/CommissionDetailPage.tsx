import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { commissionApi, paymentApi } from '../../api/endpoints';
import type { CommissionDetail, CommissionProposal, PaymentRequest } from '../../api/types';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { formatDate, formatDateTime, formatPrice } from '../../lib/format';
import { proceedPayment, useTossWidget } from '../../lib/payment';
import NotFoundPage from '../NotFoundPage';
import OrderIntro from '../order/OrderIntro';
import { StatusChip } from './CommissionListPage';
import styles from './Commission.module.css';

const STEPS = [
  { status: 'OPEN', label: '제안 받는 중' },
  { status: 'PAID', label: '선결제 완료' },
  { status: 'IN_PROGRESS', label: '제작 중' },
  { status: 'DELIVERED', label: '전달 완료' },
  { status: 'COMPLETED', label: '구매 확정' },
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
  onChoose: () => void;
}) {
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
          <button className="btn btn-primary" disabled={busy} onClick={onChoose}>
            이 조향사에게 맡기기 · {formatPrice(proposal.price)} 선결제
          </button>
        )}
        <span className="help">{formatDate(proposal.createdAt)}</span>
      </div>
    </article>
  );
}

/** 토스페이먼츠 결제위젯으로 선결제 (키가 있을 때만 나타남) */
function TossPayPanel({ payment, onCancel }: { payment: PaymentRequest; onCancel: () => void }) {
  const toast = useToast();
  const config = useMemo(
    () => ({ provider: payment.provider, clientKey: payment.clientKey, customerKey: payment.customerKey }),
    [payment],
  );
  const toss = useTossWidget(config, payment.amount, 'commission-pay-methods', 'commission-pay-agreement');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    setBusy(true);
    try {
      await proceedPayment(payment, toss.widgets.current);
    } catch (e) {
      await paymentApi.fail(payment.orderKey, (e as { code?: string }).code ?? 'USER_CANCEL', (e as Error).message).catch(() => undefined);
      toast(e instanceof Error ? e.message : '결제를 진행하지 못했어요.');
      onCancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.panel}>
      <h2>선결제</h2>
      <p>
        {payment.orderName} · <strong>{formatPrice(payment.amount)}</strong>
      </p>
      {!toss.ready && !toss.error && <div className="skeleton" style={{ height: 200 }} />}
      {toss.error && <p className="error-text">{toss.error}</p>}
      <div id="commission-pay-methods" />
      <div id="commission-pay-agreement" />
      <button className="btn btn-primary" disabled={!toss.ready || busy} onClick={pay}>
        {formatPrice(payment.amount)} 결제하기
      </button>
      <button className="btn btn-ghost" onClick={onCancel}>
        다른 제안 보기
      </button>
    </div>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [detail, setDetail] = useState<CommissionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PaymentRequest | null>(null);
  const [proposal, setProposal] = useState({ price: '', workingDays: '14', message: '' });
  const [note, setNote] = useState('');
  const [review, setReview] = useState({ scentRating: 5, perfumerRating: 5, content: '' });
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(() => {
    commissionApi
      .detail(Number(id))
      .then((d) => {
        setDetail(d);
        setProposal((p) => ({ ...p, price: p.price || String(d.summary.budget) }));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(load, [load]);

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

  const choose = async (p: CommissionProposal) => {
    if (!window.confirm(`${p.perfumer.studioName}에게 맡기고 ${formatPrice(p.price)}을 선결제할까요?`)) return;
    setBusy(true);
    try {
      const { payment } = await commissionApi.accept(commissionId, p.id, 'CARD');
      if (payment.provider === 'MOCK') {
        await proceedPayment(payment, null);
        toast('선결제가 완료되었어요. 조향사에게 알림을 보냈어요.');
        load();
      } else {
        setPending(payment);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : '결제를 준비하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

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

  const cancel = () => {
    const refund = viewer.cancelRefundAmount;
    const message =
      summary.status === 'OPEN'
        ? '의뢰를 취소할까요?'
        : `지금 취소하면 ${formatPrice(refund ?? 0)}이 환불돼요.${summary.status === 'IN_PROGRESS' ? ' 제작이 시작되어 나머지는 조향사에게 정산돼요.' : ''} 취소할까요?`;
    if (!window.confirm(message)) return;
    void act(() => commissionApi.cancel(commissionId, cancelReason.trim() || undefined), '의뢰를 취소했어요.');
  };

  return (
    <>
      <OrderIntro crumbs={[{ label: '커스텀', to: '/custom' }, { label: summary.title }]} eyebrow="COMMISSION" title={summary.title} />
      <div className={`page px ${styles.body}`}>
        <div className={styles.main}>
          <ol className={styles.progress} aria-label="진행 단계" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
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
              <dt>{detail.agreedPrice ? '결제 금액' : '예산'}</dt>
              <dd>{formatPrice(detail.agreedPrice ?? summary.budget)}</dd>
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
            {detail.referenceImages.length > 0 && (
              <div className={styles.references}>
                {detail.referenceImages.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="의뢰인이 올린 참고 이미지" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
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
                busy={busy || Boolean(pending)}
                canChoose={viewer.requester && summary.status === 'OPEN' && p.status === 'PROPOSED'}
                onChoose={() => void choose(p)}
              />
            ))}
          </section>
        </div>

        <aside className={styles.aside}>
          {pending && <TossPayPanel payment={pending} onCancel={() => setPending(null)} />}

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
              {detail.receiptUrl && (
                <a href={detail.receiptUrl} target="_blank" rel="noreferrer" className={styles.receipt}>
                  영수증 보기 ↗
                </a>
              )}
            </div>
          )}

          {detail.settlement && (
            <div className={styles.panel}>
              <h2>정산</h2>
              <dl className={styles.settleRows}>
                <div>
                  <dt>정산 대상 금액</dt>
                  <dd>{formatPrice(detail.settlement.grossAmount)}</dd>
                </div>
                <div>
                  <dt>수수료</dt>
                  <dd>- {formatPrice(detail.settlement.feeAmount)}</dd>
                </div>
                <div>
                  <dt>지급 금액</dt>
                  <dd>
                    <strong>{formatPrice(detail.settlement.netAmount)}</strong>
                  </dd>
                </div>
              </dl>
              <p>
                {detail.settlement.status === 'PAID'
                  ? `${formatDate(detail.settlement.paidAt ?? '')} 지급 완료`
                  : '정산 대기 중 · 운영자 확인 후 지급돼요.'}
                {detail.settlement.reason === 'PARTIAL_CANCEL' ? ' (제작 중 취소분)' : ''}
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

          {viewer.canStart && (
            <div className={styles.panel}>
              <h2>제작 시작하기</h2>
              <p>
                의뢰인이 선결제했어요. 상담을 마치고 제작을 시작하면 이후 의뢰인 취소 시 결제 금액의 절반만 환불되고, 나머지는 정산돼요.
              </p>
              <button className="btn btn-primary" disabled={busy} onClick={() => void act(() => commissionApi.start(commissionId), '제작을 시작했어요.')}>
                제작 시작
              </button>
            </div>
          )}

          {viewer.canDeliver && (
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

          {viewer.canConfirm && (
            <div className={styles.panel}>
              <h2>향을 받으셨나요?</h2>
              <p>
                구매를 확정하면 조향사에게 정산돼요.
                {detail.autoConfirmAt ? ` ${formatDate(detail.autoConfirmAt)}까지 확정하지 않으면 자동으로 확정돼요.` : ''}
              </p>
              <button className="btn btn-ghost" disabled={busy} onClick={() => void act(() => commissionApi.confirm(commissionId), '구매를 확정했어요.')}>
                후기 없이 구매 확정
              </button>
            </div>
          )}

          {viewer.canReview && (
            <form className={`${styles.panel} ${styles.form}`} onSubmit={submitReview}>
              <h2>{summary.status === 'DELIVERED' ? '후기 남기고 구매 확정' : '후기 남기기'}</h2>
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
                후기 남기기
              </button>
            </form>
          )}

          <div className={styles.panel}>
            {viewer.canCancel && (
              <>
                <p>
                  {summary.status === 'OPEN' && '제안을 비교한 뒤 한 분을 골라 선결제하면 제작이 시작돼요. 조향사를 고르기 전까지는 무료로 취소할 수 있어요.'}
                  {summary.status === 'PAID' &&
                    (viewer.assignedPerfumer
                      ? '제작을 시작하기 전이라면 의뢰를 사양할 수 있어요. 결제 금액은 의뢰인에게 전액 환불돼요.'
                      : '제작이 시작되기 전이에요. 지금 취소하면 전액 환불돼요.')}
                  {summary.status === 'IN_PROGRESS' &&
                    `제작이 진행 중이에요. 지금 취소하면 ${formatPrice(viewer.cancelRefundAmount ?? 0)}만 환불되고, 나머지는 조향사에게 정산돼요.`}
                </p>
                {summary.status !== 'OPEN' && (
                  <input className="input" maxLength={300} placeholder="취소 사유 (선택)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                )}
                <button className="btn btn-ghost" disabled={busy} onClick={cancel}>
                  {viewer.assignedPerfumer ? '의뢰 사양하기' : '의뢰 취소'}
                </button>
              </>
            )}
            {viewer.proposed && !viewer.assignedPerfumer && summary.status === 'OPEN' && <p>제안을 보냈어요. 의뢰인이 선택하면 알림으로 알려 드려요.</p>}
            {!viewer.requester && !viewer.perfumer && summary.status === 'OPEN' && (
              <p>제안은 여운이 인증한 조향사만 보낼 수 있어요. 조향사라면 회원가입 때 인증을 신청해 주세요.</p>
            )}
            {summary.status === 'COMPLETED' && <p>구매가 확정된 의뢰예요. 조향사 평가는 다음 의뢰인들의 선택에 반영돼요.</p>}
            {summary.status === 'CANCELLED' && (
              <p>
                취소된 의뢰예요.{detail.cancelReason ? ` 사유: ${detail.cancelReason}` : ''}
                {detail.refundAmount ? ` · 환불 ${formatPrice(detail.refundAmount)}` : ''}
              </p>
            )}
            <p className="help">환불 기준: 제작 전 100% · 제작 중 50% · 전달 이후 불가 · 정산 수수료 10%</p>
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
