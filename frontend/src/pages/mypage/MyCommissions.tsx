import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commissionApi } from '../../api/endpoints';
import type { CommissionSummary } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { formatDate, formatPrice } from '../../lib/format';
import styles from './MyPage.module.css';

function Rows({ list, empty }: { list: CommissionSummary[] | null; empty: string }) {
  if (!list) return <div className="skeleton" style={{ height: 120 }} />;
  if (list.length === 0) return <div className={styles.empty}>{empty}</div>;
  return (
    <div>
      {list.map((c) => (
        <div key={c.id} className={styles.commissionRow}>
          <Link to={`/custom/${c.id}`}>{c.title}</Link>
          <strong className={styles.orderStatus}>{c.statusLabel}</strong>
          <span>
            {c.categoryLabel} · 예산 {formatPrice(c.budget)} · 제안 {c.proposalCount}건 · {formatDate(c.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MyCommissions() {
  const { member } = useAuth();
  const [mine, setMine] = useState<CommissionSummary[] | null>(null);
  const [proposed, setProposed] = useState<CommissionSummary[] | null>(null);
  const isPerfumer = member?.role === 'PERFUMER';

  useEffect(() => {
    commissionApi.mine().then(setMine).catch(() => setMine([]));
    if (isPerfumer) commissionApi.proposed().then(setProposed).catch(() => setProposed([]));
  }, [isPerfumer]);

  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>내가 의뢰한 향</h2>
          <Link to="/custom/new">새 의뢰 쓰기 ↗</Link>
        </div>
        <Rows list={mine} empty="아직 의뢰한 향이 없어요. 간직하고 싶은 장면을 조향사에게 들려주세요." />
      </section>
      {isPerfumer && (
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <h2>제안하고 맡은 의뢰</h2>
            <Link to="/custom">의뢰 게시판 ↗</Link>
          </div>
          <Rows list={proposed} empty="아직 제안한 의뢰가 없어요." />
        </section>
      )}
    </>
  );
}
