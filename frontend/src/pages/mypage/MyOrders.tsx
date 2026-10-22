import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { orderApi } from '../../api/endpoints';
import type { OrderDetail, OrderStatus, OrderSummary, PageResponse } from '../../api/types';
import { useToast } from '../../components/Toast';
import OrderReceipt from '../order/OrderReceipt';
import { useMyPage } from './MyPageLayout';
import OrderCard from './OrderCard';
import styles from './MyPage.module.css';

const FILTERS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'PREPARING', label: '상품 준비 중' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CANCELLED', label: '취소' },
];

export function MyOrders() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as OrderStatus | '';
  const page = Number(params.get('page') ?? 0);
  const [data, setData] = useState<PageResponse<OrderSummary> | null>(null);

  useEffect(() => {
    setData(null);
    orderApi
      .mine(status || undefined, page)
      .then(setData)
      .catch(() => setData({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }));
  }, [status, page]);

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2>주문 / 배송 조회</h2>
        <span>{data ? `${data.totalElements}건` : ''}</span>
      </div>
      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={styles.tab}
            aria-pressed={status === f.value}
            onClick={() => setParams(f.value ? { status: f.value } : {})}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!data && <div className="skeleton" style={{ height: 240 }} />}
      {data && data.content.length === 0 && (
        <div className={styles.empty}>
          해당하는 주문이 없어요.
          <Link to="/" className="btn btn-ghost">
            향 둘러보기
          </Link>
        </div>
      )}
      {data?.content.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {data && data.totalPages > 1 && (
        <div className={styles.tabs}>
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button
              key={i}
              className={styles.tab}
              aria-pressed={i === page}
              onClick={() => setParams({ ...(status ? { status } : {}), page: String(i) })}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function MyOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { reload } = useMyPage();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    orderApi
      .detail(Number(orderId))
      .then(setOrder)
      .catch(() => {
        toast('주문을 찾을 수 없어요.');
        navigate('/mypage/orders', { replace: true });
      });
  }, [orderId, navigate, toast]);

  const cancel = async () => {
    if (!order || !window.confirm('이 주문을 취소할까요? 사용한 쿠폰과 적립금은 돌려드려요.')) return;
    setBusy(true);
    try {
      setOrder(await orderApi.cancel(order.id));
      toast('주문을 취소했어요.');
      void reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '주문을 취소하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  if (!order) return <div className="skeleton" style={{ height: 480 }} />;

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2>주문 상세</h2>
        <Link to="/mypage/orders">← 주문 목록</Link>
      </div>
      <p className="latin" style={{ color: 'var(--color-brown)' }}>
        {order.orderNumber}
      </p>
      <OrderReceipt
        order={order}
        actions={
          order.cancellable ? (
            <button className="btn btn-ghost" onClick={cancel} disabled={busy}>
              주문 취소
            </button>
          ) : undefined
        }
      />
    </section>
  );
}
