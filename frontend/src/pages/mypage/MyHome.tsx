import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { preferenceApi } from '../../api/endpoints';
import type { OrderStatus, Recommendation } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import ProductCard from '../../components/ProductCard';
import { formatPrice } from '../../lib/format';
import { useMyPage } from './MyPageLayout';
import OrderCard from './OrderCard';
import styles from './MyPage.module.css';

const FLOW: { status: OrderStatus; label: string }[] = [
  { status: 'PAID', label: '결제 완료' },
  { status: 'PREPARING', label: '상품 준비 중' },
  { status: 'SHIPPING', label: '배송 중' },
  { status: 'DELIVERED', label: '배송 완료' },
];

const PERFUMER_STATUS: Record<string, string> = {
  PENDING: '조향사 인증을 검토하고 있어요.',
  APPROVED: '인증된 조향사 · 커미션 의뢰 알림을 받고 있어요.',
  REJECTED: '조향사 인증이 반려되었어요. 알림에서 사유를 확인해 주세요.',
};

export default function MyHome() {
  const { member } = useAuth();
  const { summary } = useMyPage();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    preferenceApi
      .mine(false)
      .then((r) => setRecommendation(r ?? null))
      .catch(() => setRecommendation(null));
  }, []);

  if (!summary || !member) {
    return <div className="skeleton" style={{ height: 520 }} />;
  }

  const { grade } = summary;
  const progress = grade.nextThreshold
    ? Math.max(0, Math.min(100, ((grade.totalSpent - grade.currentThreshold) / (grade.nextThreshold - grade.currentThreshold)) * 100))
    : 100;
  const currentIndex = grade.tiers.findIndex((t) => t.code === grade.grade);

  return (
    <>
      <section className={styles.membership}>
        <div>
          <p className="eyebrow">YOUR MEMBERSHIP</p>
          <p className={styles.membershipTitle}>
            {summary.member.name} 님은 {grade.gradeLabel} 회원입니다
          </p>
        </div>
        <div className={styles.membershipStat}>
          <span>사용 가능 쿠폰</span>
          <Link to="/mypage/coupons">
            <strong>{summary.usableCoupons}장</strong>
          </Link>
        </div>
        <div className={styles.membershipStat}>
          <span>보유 적립금</span>
          <Link to="/mypage/coupons">
            <strong>{formatPrice(summary.point)}</strong>
          </Link>
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>나의 여운, 다음 장면으로</h2>
          <span>
            현재 {grade.gradeLabel}
            {grade.nextGradeLabel ? ` → 다음 ${grade.nextGradeLabel}` : ' · 가장 높은 등급이에요'}
          </span>
        </div>
        <div className={styles.tiers}>
          {grade.tiers.map((tier, i) => (
            <div key={tier.code} className={`${styles.tier} ${i === currentIndex ? styles.tierCurrent : ''}`}>
              <strong>{tier.label}</strong>
              <span>{tier.threshold === 0 ? '가입 시' : `${(tier.threshold / 10000).toLocaleString()}만원 이상`}</span>
            </div>
          ))}
        </div>
        <div className={styles.progress} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressNote}>
          배송 완료 기준 누적 {formatPrice(grade.totalSpent)}
          {grade.nextGradeLabel ? ` · ${grade.nextGradeLabel}까지 ${formatPrice(grade.remaining)} 남았어요.` : ''}
        </p>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>주문과 배송</h2>
          <Link to="/mypage/orders">전체 주문 보기 ↗</Link>
        </div>
        <div className={styles.statusBox}>
          {FLOW.map(({ status, label }) => {
            const count = summary.orderStatusCounts[status] ?? 0;
            return (
              <Link
                key={status}
                to={`/mypage/orders?status=${status}`}
                className={`${styles.status} ${count > 0 ? styles.statusActive : ''}`}
              >
                <strong>{count}</strong>
                {label}
              </Link>
            );
          })}
        </div>
        {summary.recentOrder ? (
          <OrderCard order={summary.recentOrder} />
        ) : (
          <div className={styles.empty}>
            아직 주문한 향이 없어요.
            <Link to="/shop/diffuser" className="btn btn-ghost">
              향 둘러보기
            </Link>
          </div>
        )}
      </section>

      <section className={styles.infoBox}>
        <div className={styles.infoHead}>
          <h2>나의 기본 정보</h2>
          <Link to="/mypage/profile" className="btn btn-ghost">
            회원정보 수정
          </Link>
        </div>
        <dl className={styles.infoGrid}>
          <div>
            <dt>이름</dt>
            <dd>{summary.member.name}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{summary.member.email}</dd>
          </div>
          <div>
            <dt>휴대전화</dt>
            <dd>{summary.member.phone || '-'}</dd>
          </div>
        </dl>
        <p className="help">
          {summary.marketingAgreed ? '새로운 향과 이벤트 소식을 받고 있어요.' : '마케팅 정보 수신에 동의하지 않았어요.'}
          {member.perfumerStatus ? ` · ${PERFUMER_STATUS[member.perfumerStatus]}` : ''}
        </p>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>나의 향 프로필</h2>
          <Link to="/scent-finder">{recommendation ? '다시 찾아보기 ↗' : '나만의 향 찾기 ↗'}</Link>
        </div>
        {recommendation ? (
          <>
            <p className="serif" style={{ fontSize: 18 }}>
              {recommendation.headline}
            </p>
            <div className={styles.grid}>
              {recommendation.products.map((p) => (
                <ProductCard key={p.id} product={p} variant="home" badge="FOR YOU" />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.empty}>여섯 번의 선택으로 나에게 가까운 향을 찾아보세요.</div>
        )}
      </section>
    </>
  );
}
