import { useEffect, useState } from 'react';
import { couponApi } from '../../api/endpoints';
import type { Coupon } from '../../api/types';
import { formatDate, formatPrice } from '../../lib/format';
import { useMyPage } from './MyPageLayout';
import styles from './MyPage.module.css';

export default function MyCoupons() {
  const { summary } = useMyPage();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  useEffect(() => {
    couponApi.mine().then(setCoupons).catch(() => setCoupons([]));
  }, []);

  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>적립금</h2>
          <span>배송 완료 시 상품 금액의 1% 적립</span>
        </div>
        <div className={styles.pointBox}>
          <span>사용 가능한 적립금</span>
          <strong>{formatPrice(summary?.point ?? 0)}</strong>
        </div>
      </section>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>쿠폰</h2>
          <span>{coupons ? `사용 가능 ${coupons.filter((c) => c.usable).length}장` : ''}</span>
        </div>
        {!coupons && <div className="skeleton" style={{ height: 140 }} />}
        {coupons && coupons.length === 0 && <div className={styles.empty}>보유한 쿠폰이 없어요.</div>}
        <div className={styles.couponList}>
          {coupons?.map((c) => (
            <div key={c.id} className={`${styles.coupon} ${c.usable ? '' : styles.couponUsed}`}>
              <strong>{c.discountRate ? `${c.discountRate}%` : formatPrice(c.discountAmount)}</strong>
              <p>{c.name}</p>
              <span>
                {formatPrice(c.minOrderAmount)} 이상 주문 시{c.maxDiscountAmount ? ` · 최대 ${formatPrice(c.maxDiscountAmount)} 할인` : ''} · {formatDate(c.expiresAt)}까지
                {c.usedAt ? ` · ${formatDate(c.usedAt)} 사용` : !c.usable ? ' · 기간 만료' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
