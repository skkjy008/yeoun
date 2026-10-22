import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { cartApi, couponApi } from '../../api/endpoints';
import type { Cart, Coupon } from '../../api/types';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { FREE_SHIPPING, SHIPPING_FEE, formatPrice, shippingFor } from '../../lib/format';
import { useShop } from '../../shop/ShopContext';
import OrderIntro from './OrderIntro';
import styles from './Commerce.module.css';

export default function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshCart } = useShop();
  const [cart, setCart] = useState<Cart | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    cartApi
      .get()
      .then((c) => {
        setCart(c);
        setSelected(new Set(c.items.filter((i) => i.available).map((i) => i.id)));
      })
      .catch(() => setCart({ items: [], itemsAmount: 0, shippingFee: 0, freeShippingThreshold: FREE_SHIPPING }));
    couponApi.mine().then(setCoupons).catch(() => setCoupons([]));
  }, []);

  const apply = (next: Cart) => {
    setCart(next);
    setSelected((prev) => new Set([...prev].filter((id) => next.items.some((i) => i.id === id && i.available))));
    void refreshCart();
  };

  const run = async (task: () => Promise<Cart>) => {
    setBusy(true);
    try {
      apply(await task());
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const items = cart?.items ?? [];
  const availableItems = items.filter((i) => i.available);
  const chosen = items.filter((i) => selected.has(i.id));
  const amount = chosen.reduce((sum, i) => sum + i.lineAmount, 0);
  const quantity = chosen.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = shippingFor(amount);
  const bestCoupon = useMemo(
    () =>
      coupons
        .filter((c) => c.usable && amount >= c.minOrderAmount)
        .sort((a, b) => b.discountAmount - a.discountAmount)[0],
    [coupons, amount],
  );
  const discount = bestCoupon ? Math.min(bestCoupon.discountAmount, amount) : 0;
  const allChecked = availableItems.length > 0 && availableItems.every((i) => selected.has(i.id));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const checkout = () => {
    if (chosen.length === 0) {
      toast('결제할 상품을 선택해 주세요.');
      return;
    }
    navigate('/checkout', {
      state: { lines: chosen.map((i) => ({ productId: i.productId, quantity: i.quantity })), fromCart: true },
    });
  };

  return (
    <>
      <OrderIntro
        crumbs={[{ label: '장바구니' }]}
        eyebrow="YOUR SCENT BAG"
        title={cart ? (items.length ? `곁에 두고 싶은 향, ${items.length}가지` : '아직 담긴 향이 없어요') : '장바구니'}
        step={1}
      />

      <section className={`page px ${styles.body}`}>
        <div className={styles.main}>
          <div className={styles.selectBar}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={allChecked}
                disabled={availableItems.length === 0}
                onChange={() => setSelected(allChecked ? new Set() : new Set(availableItems.map((i) => i.id)))}
              />
              전체 선택 ({chosen.length} / {availableItems.length})
            </label>
            <button
              className={styles.textButton}
              disabled={busy || chosen.length === 0}
              onClick={() => run(() => cartApi.remove([...selected]))}
            >
              선택 삭제
            </button>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead} aria-hidden>
              <span>선택 / 상품 정보</span>
              <span>수량</span>
              <span>상품 금액</span>
              <span>삭제</span>
            </div>
            {!cart &&
              [0, 1].map((n) => (
                <div key={n} className={styles.row}>
                  <div className="skeleton" style={{ height: 112 }} />
                </div>
              ))}
            {cart && items.length === 0 && (
              <div className={styles.empty}>
                <p>장바구니가 비어 있어요.</p>
                <p>마음에 남을 향을 천천히 골라 보세요.</p>
                <Link to="/shop/diffuser" className="btn btn-primary">
                  향 둘러보기
                </Link>
              </div>
            )}
            {items.map((item) => (
              <div key={item.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      disabled={!item.available}
                      onChange={() => toggle(item.id)}
                      aria-label={`${item.name} 선택`}
                    />
                  </label>
                  <Link to={`/products/${item.productId}`}>
                    <img className={styles.thumb} src={item.imageUrl} alt="" />
                  </Link>
                  <div className={styles.rowText}>
                    <Link to={`/products/${item.productId}`} className={styles.rowName}>
                      {item.name}
                    </Link>
                    <span className={styles.rowMeta}>
                      {item.category} · {item.volume}
                    </span>
                    <span className={styles.rowMeta}>단가 {formatPrice(item.unitPrice)}</span>
                    {!item.available && (
                      <span className={styles.rowWarn}>
                        {item.soldOut ? '품절된 상품이에요.' : `남은 재고는 ${item.stock}개예요. 수량을 줄여 주세요.`}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.qty}>
                  <button
                    aria-label="수량 줄이기"
                    disabled={busy || item.quantity <= 1}
                    onClick={() => run(() => cartApi.changeQuantity(item.id, item.quantity - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    aria-label="수량 늘리기"
                    disabled={busy || item.quantity >= Math.min(10, item.stock)}
                    onClick={() => run(() => cartApi.changeQuantity(item.id, item.quantity + 1))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className={styles.rowPrice}>{formatPrice(item.lineAmount)}</span>
                <button
                  className={styles.remove}
                  aria-label={`${item.name} 삭제`}
                  disabled={busy}
                  onClick={() => run(() => cartApi.remove([item.id]))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Link to="/" className={styles.back}>
            ← 계속 쇼핑하기
          </Link>
        </div>

        <aside className={styles.aside}>
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>예상 주문 금액</h2>
            <dl className={styles.summaryRows}>
              <div>
                <dt>상품 금액 ({quantity}개)</dt>
                <dd>{formatPrice(amount)}</dd>
              </div>
              <div>
                <dt>할인 / 쿠폰</dt>
                <dd>{discount ? `- ${formatPrice(discount)}` : '0원'}</dd>
              </div>
              <div>
                <dt>배송비</dt>
                <dd>{formatPrice(shipping)}</dd>
              </div>
            </dl>
            <div className={styles.divider} />
            <div className={styles.total}>
              <div className={styles.totalLine}>
                <span className={styles.totalLabel}>합계</span>
                <span className={styles.totalAmount}>{formatPrice(Math.max(0, amount - discount + shipping))}</span>
              </div>
              <p className={styles.totalNote}>
                {bestCoupon
                  ? `주문서에서 '${bestCoupon.name}'을 적용하면 이 금액이 돼요.`
                  : amount > 0 && amount < FREE_SHIPPING
                    ? `${formatPrice(FREE_SHIPPING - amount)} 더 담으면 무료 배송이에요.`
                    : '쿠폰과 적립금은 주문서에서 적용할 수 있어요.'}
              </p>
            </div>
            <div className={styles.actions}>
              <button className="btn btn-primary" onClick={checkout} disabled={chosen.length === 0}>
                결제하기
              </button>
              <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                취소
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className={`page px ${styles.guide}`}>
        <div>
          <h3>배송 안내</h3>
          <p>
            {formatPrice(FREE_SHIPPING)} 이상 주문 시 무료 배송, 그 외에는 배송비 {formatPrice(SHIPPING_FEE)}이 붙어요. 결제 후 1~3일
            안에 출고됩니다.
          </p>
        </div>
        <div>
          <h3>쿠폰과 적립금</h3>
          <p>가입 시 받은 웰컴 쿠폰은 주문서에서 적용할 수 있어요. 배송이 완료되면 상품 금액의 1%가 적립됩니다.</p>
        </div>
        <div>
          <h3>마음에 남을 향을 천천히</h3>
          <p>담아 둔 향은 계속 보관돼요. 고민된다면 상세 페이지의 음악과 이야기를 다시 들어 보세요.</p>
        </div>
      </section>
      <CompactFooter />
    </>
  );
}
