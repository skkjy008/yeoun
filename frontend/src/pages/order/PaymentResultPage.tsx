import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { paymentApi } from '../../api/endpoints';
import { CompactFooter } from '../../components/layout/Footer';
import { resultPath } from '../../lib/payment';
import { useShop } from '../../shop/ShopContext';
import OrderIntro from './OrderIntro';
import styles from './Commerce.module.css';

/** 토스페이먼츠 결제창 successUrl: 서버에 결제 승인을 요청합니다. */
export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshCart } = useShop();
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return; // StrictMode에서 두 번 승인 요청하지 않도록
    requested.current = true;
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));
    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않아요.');
      return;
    }
    paymentApi
      .confirm(paymentKey, orderId, amount)
      .then((result) => {
        void refreshCart();
        navigate(resultPath(result), { replace: true });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '결제를 승인하지 못했어요.'));
  }, [params, navigate, refreshCart]);

  return (
    <>
      <OrderIntro crumbs={[{ label: '결제' }]} eyebrow="PAYMENT" title={error ? '결제를 마치지 못했어요' : '결제를 확인하고 있어요'} step={3} />
      <section className={`page px ${styles.complete}`}>
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <p className="help">승인되지 않은 결제는 자동으로 취소되며, 예약된 재고와 쿠폰도 돌려드려요.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/cart" className="btn btn-primary">
                장바구니로
              </Link>
              <Link to="/mypage/orders" className="btn btn-ghost">
                주문 내역
              </Link>
            </div>
          </>
        ) : (
          <div className="skeleton" style={{ height: 120, width: '100%', maxWidth: 520 }} />
        )}
      </section>
      <CompactFooter />
    </>
  );
}

/** 토스페이먼츠 결제창 failUrl: 사용자가 결제를 취소했거나 인증에 실패했을 때 */
export function PaymentFailPage() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? 'UNKNOWN';
  const message = params.get('message') ?? '결제가 취소되었어요.';
  const orderId = params.get('orderId');
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current || !orderId) return;
    reported.current = true;
    void paymentApi.fail(orderId, code, message).catch(() => undefined);
  }, [orderId, code, message]);

  const isCommission = orderId?.startsWith('CM-');
  const commissionId = isCommission ? orderId?.split('-')[1] : null;

  return (
    <>
      <OrderIntro crumbs={[{ label: '결제' }]} eyebrow="PAYMENT" title="결제가 완료되지 않았어요" step={3} />
      <section className={`page px ${styles.complete}`}>
        <p>{code === 'PAY_PROCESS_CANCELED' ? '결제를 취소했어요.' : message}</p>
        <p className="help">
          {isCommission ? '의뢰는 그대로 제안 받는 중이에요. 다시 조향사를 선택해 결제할 수 있어요.' : '예약했던 재고와 쿠폰·적립금은 돌려드렸어요. 주문서를 다시 작성해 주세요.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          {isCommission ? (
            <Link to={`/custom/${commissionId}`} className="btn btn-primary">
              의뢰로 돌아가기
            </Link>
          ) : (
            <Link to="/cart" className="btn btn-primary">
              장바구니로
            </Link>
          )}
          <Link to="/" className="btn btn-ghost">
            홈으로
          </Link>
        </div>
      </section>
      <CompactFooter />
    </>
  );
}
