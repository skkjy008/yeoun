import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { preferenceApi } from '../api/endpoints';
import type { Recommendation } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import ProductCard from '../components/ProductCard';
import { CompactFooter } from '../components/layout/Footer';
import styles from './SimplePages.module.css';

const PERFUMER_STATUS: Record<string, string> = {
  PENDING: '조향사 인증을 검토하고 있어요.',
  APPROVED: '인증된 조향사예요. 커미션 의뢰 알림을 받을 수 있어요.',
  REJECTED: '조향사 인증이 반려되었어요. 알림에서 사유를 확인해 주세요.',
};

export default function MyPage() {
  const { member, refresh } = useAuth();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    void refresh();
    preferenceApi
      .mine(false)
      .then((r) => setRecommendation(r ?? null))
      .catch(() => setRecommendation(null));
  }, [refresh]);

  if (!member) return null;

  return (
    <>
      <section className={`page px ${styles.mypage}`}>
        <div className={styles.profile}>
          <p className="eyebrow">MY YEOUN</p>
          <h1 className="serif">{member.name} 님의 여운</h1>
          <dl>
            <div>
              <dt>이메일</dt>
              <dd>{member.email}</dd>
            </div>
            <div>
              <dt>회원 등급</dt>
              <dd>{member.gradeLabel}</dd>
            </div>
            <div>
              <dt>권한</dt>
              <dd>{member.role === 'ADMIN' ? '관리자' : member.role === 'PERFUMER' ? '조향사' : '회원'}</dd>
            </div>
            {member.perfumerStatus && (
              <div>
                <dt>조향사 인증</dt>
                <dd>{PERFUMER_STATUS[member.perfumerStatus]}</dd>
              </div>
            )}
          </dl>
          <p className="help">주문 내역·장바구니·찜한 향은 다음 단계에서 이곳에 모입니다.</p>
        </div>

        <div className={styles.myScent}>
          <div className={styles.myScentHead}>
            <h2 className="serif">나의 향 프로필</h2>
            <Link to="/scent-finder">{recommendation ? '다시 찾아보기 ↗' : '나만의 향 찾기 ↗'}</Link>
          </div>
          {recommendation ? (
            <>
              <p className={styles.headline}>{recommendation.headline}</p>
              <p className={styles.summary}>{recommendation.summary}</p>
              <div className={styles.myGrid}>
                {recommendation.products.map((p) => (
                  <ProductCard key={p.id} product={p} variant="home" badge="FOR YOU" />
                ))}
              </div>
            </>
          ) : (
            <p className={styles.summary}>아직 나만의 향 찾기에 참여하지 않았어요. 여섯 번의 선택으로 나에게 가까운 향을 찾아보세요.</p>
          )}
        </div>
      </section>
      <CompactFooter />
    </>
  );
}
