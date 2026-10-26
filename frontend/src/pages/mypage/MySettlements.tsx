import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settlementApi } from '../../api/endpoints';
import type { SettlementSummary } from '../../api/types';
import { formatDate, formatPrice } from '../../lib/format';
import styles from './MyPage.module.css';

/** 조향사 정산 내역: 구매 확정(또는 제작 중 취소분) → 수수료 공제 → 운영자 지급 */
export default function MySettlements() {
  const [data, setData] = useState<SettlementSummary | null>(null);

  useEffect(() => {
    settlementApi.mine().then(setData).catch(() => setData({ pendingAmount: 0, paidAmount: 0, feeRate: 0.1, items: [] }));
  }, []);

  return (
    <>
      <section className={styles.membership} style={{ gridTemplateColumns: '1fr auto auto' }}>
        <div>
          <p className="eyebrow">PERFUMER SETTLEMENT</p>
          <p className={styles.membershipTitle}>커미션 정산</p>
        </div>
        <div className={styles.membershipStat}>
          <span>정산 대기</span>
          <strong>{formatPrice(data?.pendingAmount ?? 0)}</strong>
        </div>
        <div className={styles.membershipStat}>
          <span>지급 완료</span>
          <strong>{formatPrice(data?.paidAmount ?? 0)}</strong>
        </div>
      </section>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>정산 내역</h2>
          <span>수수료 {Math.round((data?.feeRate ?? 0.1) * 100)}% · 구매 확정 후 운영자 확인을 거쳐 지급돼요</span>
        </div>
        {!data && <div className="skeleton" style={{ height: 160 }} />}
        {data && data.items.length === 0 && (
          <div className={styles.empty}>
            아직 정산할 의뢰가 없어요.
            <Link to="/custom?tab=OPEN" className="btn btn-ghost">
              제안 받는 의뢰 보기
            </Link>
          </div>
        )}
        <div>
          {data?.items.map((s) => (
            <div key={s.id} className={styles.commissionRow}>
              <Link to={`/custom/${s.commissionId}`}>{s.commissionTitle}</Link>
              <strong className={s.status === 'PAID' ? styles.orderStatusCancelled : styles.orderStatus}>
                {s.status === 'PAID' ? '지급 완료' : '정산 대기'}
              </strong>
              <span>
                {s.reason === 'PARTIAL_CANCEL' ? '제작 중 취소분' : '구매 확정'} · 대상 {formatPrice(s.grossAmount)} · 수수료 {formatPrice(s.feeAmount)} ·{' '}
                {formatDate(s.createdAt)}
                {s.paidAt ? ` · ${formatDate(s.paidAt)} 지급` : ''}
              </span>
              <span className={styles.orderTotal}>{formatPrice(s.netAmount)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
