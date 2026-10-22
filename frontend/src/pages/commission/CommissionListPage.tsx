import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { commissionApi } from '../../api/endpoints';
import type { CommissionStatus, CommissionSummary, PageResponse } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import { formatDate, formatPrice } from '../../lib/format';
import OrderIntro from '../order/OrderIntro';
import styles from './Commission.module.css';

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'OPEN', label: '제안 받는 중' },
  { value: 'IN_PROGRESS', label: '제작 중' },
  { value: 'COMPLETED', label: '후기 완료' },
  { value: 'mine', label: '나의 의뢰' },
];

export const FLOW = [
  { title: '의뢰 쓰기', body: '간직하고 싶은 장면과 예산을 글로 남기면, 인증된 조향사 모두에게 바로 알림이 가요.' },
  { title: '조향사 제안', body: '조향사들이 가격·작업 기간·향의 방향을 담아 제안을 보내요. 천천히 비교해 보세요.' },
  { title: '선택과 선결제', body: '마음에 드는 제안을 고르고 결제하면 제작이 시작돼요. 결제 금액은 완료까지 안전하게 보관돼요.' },
  { title: '받고, 남기기', body: '향을 받은 뒤 향과 조향사에 대한 후기를 따로 남겨 주세요. 다음 의뢰인의 길잡이가 돼요.' },
];

export function StatusChip({ status, label }: { status: CommissionStatus; label: string }) {
  return <span className={`${styles.chip} ${styles[`chip${status}`] ?? ''}`}>{label}</span>;
}

export default function CommissionListPage() {
  const { member, requireMember } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? '';
  const page = Number(params.get('page') ?? 0);
  const [data, setData] = useState<PageResponse<CommissionSummary> | null>(null);

  useEffect(() => {
    setData(null);
    const empty = { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };
    if (tab === 'mine') {
      if (!member) {
        setData(empty);
        return;
      }
      commissionApi
        .mine()
        .then((list) => setData({ ...empty, content: list, totalElements: list.length, totalPages: 1 }))
        .catch(() => setData(empty));
      return;
    }
    commissionApi
      .list((tab || undefined) as CommissionStatus | undefined, page)
      .then(setData)
      .catch(() => setData(empty));
  }, [tab, page, member]);

  const write = () => {
    if (requireMember('커미션 의뢰는 회원만 남길 수 있어요.')) navigate('/custom/new');
  };

  return (
    <>
      <OrderIntro crumbs={[{ label: '커스텀' }]} eyebrow="CUSTOM SCENT COMMISSION" title="간직하고 싶은 장면을, 향으로 의뢰하세요" />
      <section className={`page px ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <p>
            비 오는 날의 서재, 할머니 댁 마당의 무화과나무, 첫눈이 내리던 골목. 말로만 남아 있던 기억을 들려주시면 여운이 인증한 조향사들이
            그 장면을 향으로 옮길 방법을 제안합니다.
          </p>
          <div className={styles.heroActions}>
            <button className="btn btn-primary" onClick={write}>
              향 의뢰하기 <span aria-hidden>→</span>
            </button>
            {member?.role === 'PERFUMER' ? (
              <button className="btn btn-ghost" onClick={() => setParams({ tab: 'OPEN' })}>
                제안 받는 의뢰 보기
              </button>
            ) : (
              <Link to="/signup" className="btn btn-ghost">
                조향사로 함께하기
              </Link>
            )}
          </div>
        </div>
        <img className={styles.heroImage} src="/images/common/atelier.jpg" alt="조향사의 작업대 위에 놓인 향료 병들" />
      </section>

      <div className="page px">
      <ol className={styles.flow}>
        {FLOW.map((step, i) => (
          <li key={step.title}>
            <span className={styles.flowNo}>0{i + 1}</span>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>
      </div>

      <section className="page px">
        <div className={styles.boardHead}>
          <h2>의뢰 게시판</h2>
          <div className={styles.tabs}>
            {FILTERS.filter((f) => f.value !== 'mine' || member).map((f) => (
              <button key={f.value} className={styles.tab} aria-pressed={tab === f.value} onClick={() => setParams(f.value ? { tab: f.value } : {})}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.grid}>
          {!data && [0, 1, 2].map((n) => <div key={n} className="skeleton" style={{ height: 260 }} />)}
          {data && data.content.length === 0 && (
            <p className={styles.empty}>{tab === 'mine' ? '아직 의뢰한 향이 없어요. 첫 의뢰를 남겨 보세요.' : '이 조건의 의뢰가 아직 없어요.'}</p>
          )}
          {data?.content.map((c) => (
            <Link key={c.id} to={`/custom/${c.id}`} className={styles.card} onClick={(e) => {
              if (!member) {
                e.preventDefault();
                requireMember('의뢰 내용은 회원만 자세히 볼 수 있어요.');
              }
            }}>
              <div className={styles.cardTop}>
                <StatusChip status={c.status} label={c.statusLabel} />
                <span>{c.categoryLabel}</span>
              </div>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              {c.moods.length > 0 && (
                <div className={styles.moods}>
                  {c.moods.slice(0, 4).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              )}
              <div className={styles.cardMeta}>
                <span>
                  {c.requesterName} · {formatDate(c.createdAt)}
                  <br />
                  제안 {c.proposalCount}건{c.desiredDate ? ` · ${formatDate(c.desiredDate)}까지` : ''}
                </span>
                <strong>{formatPrice(c.budget)}</strong>
              </div>
            </Link>
          ))}
        </div>
        {data && data.totalPages > 1 && tab !== 'mine' && (
          <div className={styles.pager}>
            {Array.from({ length: data.totalPages }, (_, i) => (
              <button key={i} className={styles.tab} aria-pressed={i === page} onClick={() => setParams({ ...(tab ? { tab } : {}), page: String(i) })}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
      <CompactFooter />
    </>
  );
}
