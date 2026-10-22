import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { OrderDetail } from '../../api/types';
import { formatDateTime, formatPrice } from '../../lib/format';
import styles from './Commerce.module.css';

/** 주문 완료 · 마이페이지 주문 상세에서 함께 쓰는 주문 내역 */
export default function OrderReceipt({ order, actions }: { order: OrderDetail; actions?: ReactNode }) {
  return (
    <div className={styles.completeBody}>
      <div className={styles.main} style={{ gap: 44 }}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>주문 상품</h2>
            <span>
              {formatDateTime(order.createdAt)} · {order.statusLabel}
            </span>
          </div>
          <div className={styles.lineItems}>
            {order.items.map((item) => (
              <div key={item.productId} className={styles.lineItem}>
                <Link to={`/products/${item.productId}`}>
                  <img src={item.imageUrl} alt="" />
                </Link>
                <div>
                  <Link to={`/products/${item.productId}`} className={styles.lineName}>
                    {item.name}
                  </Link>
                  <p className={styles.lineMeta}>
                    {item.typeLabel} · {item.volume} / {item.quantity}개 · 단가 {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className={styles.linePrice}>{formatPrice(item.lineAmount)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>배송지</h2>
          </div>
          <dl className={styles.infoList}>
            <dt>받는 분</dt>
            <dd>
              {order.recipientName} · {order.recipientPhone}
            </dd>
            <dt>주소</dt>
            <dd>
              ({order.zipCode}) {order.address1} {order.address2}
            </dd>
            <dt>요청사항</dt>
            <dd>{order.deliveryMemo || '없음'}</dd>
            <dt>주문자</dt>
            <dd>
              {order.ordererName} · {order.ordererEmail}
            </dd>
          </dl>
        </section>
      </div>

      <aside className={styles.aside} style={{ position: 'static' }}>
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>결제 정보</h2>
          <dl className={styles.summaryRows}>
            <div>
              <dt>상품 합계</dt>
              <dd>{formatPrice(order.itemsAmount)}</dd>
            </div>
            <div>
              <dt>쿠폰{order.couponName ? ` (${order.couponName})` : ''}</dt>
              <dd>{order.couponDiscount ? `- ${formatPrice(order.couponDiscount)}` : '0원'}</dd>
            </div>
            <div>
              <dt>적립금 사용</dt>
              <dd>{order.pointUsed ? `- ${formatPrice(order.pointUsed)}` : '0원'}</dd>
            </div>
            <div>
              <dt>배송비</dt>
              <dd>{formatPrice(order.shippingFee)}</dd>
            </div>
          </dl>
          <div className={styles.divider} />
          <div className={styles.total}>
            <div className={styles.totalLine}>
              <span className={styles.totalLabel}>{order.status === 'CANCELLED' ? '취소된 금액' : '총 결제 금액'}</span>
              <span className={styles.totalAmount}>{formatPrice(order.totalAmount)}</span>
            </div>
            <p className={styles.totalNote}>
              {order.paymentMethodLabel}
              {order.paymentProvider ? ` · ${order.paymentProvider}` : ''} · 승인 {order.paymentApprovalNo}
              {order.earnedPoint ? ` · 적립 ${formatPrice(order.earnedPoint)}` : ''}
            </p>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </aside>
    </div>
  );
}
