import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderApi } from '../../api/endpoints';
import type { OrderDetail } from '../../api/types';
import { CompactFooter } from '../../components/layout/Footer';
import NotFoundPage from '../NotFoundPage';
import OrderIntro from './OrderIntro';
import OrderReceipt from './OrderReceipt';
import styles from './Commerce.module.css';

export default function OrderCompletePage() {
  const { id } = useParams();
  const location = useLocation();
  const initial = (location.state as { order?: OrderDetail } | null)?.order ?? null;
  const [order, setOrder] = useState<OrderDetail | null>(initial);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initial && String(initial.id) === id) return;
    orderApi
      .detail(Number(id))
      .then(setOrder)
      .catch(() => setError(true));
  }, [id, initial]);

  if (error) return <NotFoundPage />;

  return (
    <>
      <OrderIntro crumbs={[{ label: '주문 완료' }]} eyebrow="THANK YOU" title="향이 곧 당신에게 닿을 거예요" step={3} />
      {order ? (
        <>
          <section className={`page px ${styles.complete}`}>
            <p className={styles.completeNumber}>{order.orderNumber}</p>
            <p className="help">
              결제가 승인되었어요 · 승인 번호 {order.paymentApprovalNo}. 상품 준비가 시작되기 전까지는 마이페이지에서 바로 취소할 수 있어요.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to={`/mypage/orders/${order.id}`} className="btn btn-primary">
                주문 상세 보기
              </Link>
              <Link to="/" className="btn btn-ghost">
                계속 둘러보기
              </Link>
            </div>
          </section>
          <section className="page px" style={{ paddingBottom: 80 }}>
            <OrderReceipt order={order} />
          </section>
        </>
      ) : (
        <section className="page px" style={{ paddingBottom: 80 }}>
          <div className="skeleton" style={{ height: 240 }} />
        </section>
      )}
      <CompactFooter />
    </>
  );
}
